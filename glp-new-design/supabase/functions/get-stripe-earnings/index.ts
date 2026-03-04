import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

        // Authenticate caller as admin via Supabase
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Accept period param
        const url = new URL(req.url);
        const period = url.searchParams.get("period") || "all_time";

        const now = Math.floor(Date.now() / 1000);
        let createdFilter: { gte?: number } = {};

        if (period === "day") createdFilter = { gte: now - 86400 };          // last 24h
        else if (period === "week") createdFilter = { gte: now - 7 * 86400 };      // last 7 days
        else if (period === "30_days") createdFilter = { gte: now - 30 * 86400 };     // last 30 days
        else if (period === "year") createdFilter = { gte: now - 365 * 86400 };    // last 365 days
        // "all_time" → no filter

        // Fetch all matching balance transactions of type "charge"
        let allTransactions: Stripe.BalanceTransaction[] = [];
        let hasMore = true;
        let startingAfter: string | undefined = undefined;

        while (hasMore) {
            const params: Stripe.BalanceTransactionListParams = {
                type: "charge",
                limit: 100,
                ...(Object.keys(createdFilter).length > 0 && { created: createdFilter }),
                ...(startingAfter && { starting_after: startingAfter }),
            };

            const txns = await stripe.balanceTransactions.list(params);
            allTransactions = [...allTransactions, ...txns.data];
            hasMore = txns.has_more;
            if (txns.data.length > 0) {
                startingAfter = txns.data[txns.data.length - 1].id;
            } else {
                hasMore = false;
            }

            // Safety cap
            if (allTransactions.length >= 500) break;
        }

        // Calculate totals (amounts are in cents)
        let grossCents = 0;
        let feesCents = 0;
        let netCents = 0;
        const toDollars = (cents: number) => parseFloat((cents / 100).toFixed(2));

        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

        // --- Build chart data based on period ---
        let chartData: Array<Record<string, string | number>> = [];

        if (period === "day") {
            // Hourly breakdown for the last 24 hours
            const hourlyMap: Record<string, { gross: number; net: number; fees: number }> = {};
            for (let h = 23; h >= 0; h--) {
                const d = new Date();
                d.setHours(d.getHours() - h, 0, 0, 0);
                const label = d.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
                hourlyMap[label] = { gross: 0, net: 0, fees: 0 };
            }

            for (const txn of allTransactions) {
                grossCents += txn.amount;
                feesCents += txn.fee;
                netCents += txn.net;

                const d = new Date(txn.created * 1000);
                d.setMinutes(0, 0, 0);
                const label = d.toLocaleTimeString('en-US', { hour: '2-digit', hour12: true });
                if (hourlyMap[label] !== undefined) {
                    hourlyMap[label].gross += txn.amount;
                    hourlyMap[label].net += txn.net;
                    hourlyMap[label].fees += txn.fee;
                }
            }

            chartData = Object.entries(hourlyMap).map(([hour, vals]) => ({
                hour,
                month: hour, // alias so existing chart still works
                amount: toDollars(vals.gross),
                net: toDollars(vals.net),
                fees: toDollars(vals.fees),
            }));

        } else if (period === "week") {
            // Daily breakdown for last 7 days
            const dayMap: Record<string, { gross: number; net: number; fees: number }> = {};
            const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const label = `${dayLabels[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
                dayMap[label] = { gross: 0, net: 0, fees: 0 };
            }

            for (const txn of allTransactions) {
                grossCents += txn.amount;
                feesCents += txn.fee;
                netCents += txn.net;

                const d = new Date(txn.created * 1000);
                const label = `${dayLabels[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
                if (dayMap[label] !== undefined) {
                    dayMap[label].gross += txn.amount;
                    dayMap[label].net += txn.net;
                    dayMap[label].fees += txn.fee;
                }
            }

            chartData = Object.entries(dayMap).map(([date, vals]) => ({
                date,
                month: date,
                amount: toDollars(vals.gross),
                net: toDollars(vals.net),
                fees: toDollars(vals.fees),
            }));

        } else if (period === "30_days") {
            // Daily breakdown for last 30 days (grouped by date label)
            const dayMap: Record<string, { gross: number; net: number; fees: number }> = {};
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;
                dayMap[label] = { gross: 0, net: 0, fees: 0 };
            }

            for (const txn of allTransactions) {
                grossCents += txn.amount;
                feesCents += txn.fee;
                netCents += txn.net;

                const d = new Date(txn.created * 1000);
                const label = `${monthNames[d.getMonth()]} ${d.getDate()}`;
                if (dayMap[label] !== undefined) {
                    dayMap[label].gross += txn.amount;
                    dayMap[label].net += txn.net;
                    dayMap[label].fees += txn.fee;
                }
            }

            chartData = Object.entries(dayMap).map(([date, vals]) => ({
                date,
                month: date,
                amount: toDollars(vals.gross),
                net: toDollars(vals.net),
                fees: toDollars(vals.fees),
            }));

        } else {
            // year & all_time → monthly breakdown
            const monthlyMap: Record<string, { gross: number; net: number; fees: number }> = {};
            const months = period === "year" ? 12 : 6;
            for (let i = months - 1; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const key = monthNames[d.getMonth()];
                monthlyMap[key] = { gross: 0, net: 0, fees: 0 };
            }

            for (const txn of allTransactions) {
                grossCents += txn.amount;
                feesCents += txn.fee;
                netCents += txn.net;

                const d = new Date(txn.created * 1000);
                const key = monthNames[d.getMonth()];
                if (monthlyMap[key] !== undefined) {
                    monthlyMap[key].gross += txn.amount;
                    monthlyMap[key].net += txn.net;
                    monthlyMap[key].fees += txn.fee;
                }
            }

            chartData = Object.entries(monthlyMap).map(([month, vals]) => ({
                month,
                amount: toDollars(vals.gross),
                net: toDollars(vals.net),
                fees: toDollars(vals.fees),
            }));
        }

        return new Response(JSON.stringify({
            gross: toDollars(grossCents),
            fees: toDollars(feesCents),
            net: toDollars(netCents),
            transactionCount: allTransactions.length,
            monthlyChart: chartData,  // kept as "monthlyChart" for backwards compat
            chart: chartData,
            period,
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("get-stripe-earnings error:", err);
        return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
