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

        // Stripe: Fetch balance transactions (charges) — paginate up to 500
        // We get the last 30 days by default; accept optional `period` param
        const url = new URL(req.url);
        const period = url.searchParams.get("period") || "all_time"; // "30_days" | "year" | "all_time"

        let createdFilter: { gte?: number } = {};
        const now = Math.floor(Date.now() / 1000);
        if (period === "30_days") createdFilter = { gte: now - 30 * 86400 };
        else if (period === "year") createdFilter = { gte: now - 365 * 86400 };

        // Fetch all balance transactions of type "charge" (real money in)
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

            // Safety: cap at 500 transactions
            if (allTransactions.length >= 500) break;
        }

        // Calculate totals (amounts are in cents)
        let grossCents = 0;
        let feesCents = 0;
        let netCents = 0;

        // Also build monthly data for the last 6 months
        const monthlyMap: Record<string, { gross: number; net: number; fees: number }> = {};
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

        // Initialise last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = monthNames[d.getMonth()];
            monthlyMap[key] = { gross: 0, net: 0, fees: 0 };
        }

        for (const txn of allTransactions) {
            grossCents += txn.amount;
            feesCents += txn.fee;
            netCents += txn.net;

            // Monthly breakdown
            const d = new Date(txn.created * 1000);
            const key = monthNames[d.getMonth()];
            if (monthlyMap[key] !== undefined) {
                monthlyMap[key].gross += txn.amount;
                monthlyMap[key].net += txn.net;
                monthlyMap[key].fees += txn.fee;
            }
        }

        // Convert cents → dollars
        const toDollars = (cents: number) => parseFloat((cents / 100).toFixed(2));

        const monthlyChart = Object.entries(monthlyMap).map(([month, vals]) => ({
            month,
            amount: toDollars(vals.gross),
            net: toDollars(vals.net),
            fees: toDollars(vals.fees),
        }));

        return new Response(JSON.stringify({
            gross: toDollars(grossCents),
            fees: toDollars(feesCents),
            net: toDollars(netCents),
            transactionCount: allTransactions.length,
            monthlyChart,
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
