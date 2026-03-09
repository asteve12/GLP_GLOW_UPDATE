import { createClient } from "npm:@supabase/supabase-js@2.33.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

        // Verify the caller is authenticated
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Not authenticated" }), {
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Verify user identity using anon client + their JWT
        const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        });
        const { data: { user }, error: authError } = await anonClient.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Use service role to bypass RLS for all queries
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get URL params
        const url = new URL(req.url);
        const period = url.searchParams.get("period") || "all_time";

        const repId = user.id;

        // 1. Get doctors this rep added (from user_roles)
        const { data: myDoctorsData, error: doctorErr } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("added_by", repId);

        if (doctorErr) {
            console.error("Doctor fetch error:", doctorErr);
        }

        const doctorIds: string[] = (myDoctorsData || []).map((d: any) => d.user_id);

        if (doctorIds.length === 0) {
            return new Response(JSON.stringify({
                myDoctors: 0,
                approvedOrders: 0,
                pendingSubmissions: 0,
                grossRevenue: 0,
                stripeFees: 0,
                netRevenue: 0,
                orders: [],
                chart: []
            }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 2. Helper: period start date
        const getPeriodStart = (p: string): string | null => {
            const now = new Date();
            if (p === "day") { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString(); }
            if (p === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
            if (p === "30_days") { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString(); }
            if (p === "year") { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString(); }
            return null;
        };
        const periodStart = getPeriodStart(period);

        // 3. Count pending submissions assigned to rep's doctors
        let pendingQuery = supabase
            .from("form_submissions")
            .select("*", { count: "exact", head: true })
            .eq("approval_status", "pending")
            .in("assigned_provider_id", doctorIds);
        const { count: pendingCount } = await pendingQuery;

        // 4. Get approved form_submissions for those doctors
        let approvalsQuery = supabase
            .from("form_submissions")
            .select("id, assigned_provider_id, updated_at")
            .eq("approval_status", "approved")
            .in("assigned_provider_id", doctorIds);

        if (periodStart) {
            approvalsQuery = approvalsQuery.gte("updated_at", periodStart);
        }

        const { data: approvedSubs, error: subErr } = await approvalsQuery;
        if (subErr) console.error("Submissions error:", subErr);

        const approvedSubIds: string[] = (approvedSubs || []).map((s: any) => s.id);

        // 5. Fetch orders for those approved submissions (batched)
        let allOrders: any[] = [];
        if (approvedSubIds.length > 0) {
            // Batch in groups of 100
            for (let i = 0; i < approvedSubIds.length; i += 100) {
                const batch = approvedSubIds.slice(i, i + 100);
                const { data: batchOrders, error: orderErr } = await supabase
                    .from("orders")
                    .select("id, drug_name, drug_price, amount, plan_name, created_at, form_submission_id, approving_provider_id")
                    .in("form_submission_id", batch)
                    .order("created_at", { ascending: false });
                if (orderErr) console.error("Orders batch error:", orderErr);
                allOrders = allOrders.concat(batchOrders || []);
            }
        }

        // 6. Compute revenue — drug_price is the real field, fall back to amount
        const STRIPE_RATE = 0.029;
        const STRIPE_FIXED = 0.30;
        const getAmt = (o: any) => parseFloat(o.drug_price ?? o.amount ?? 0) || 0;

        const grossRevenue = allOrders.reduce((acc, o) => acc + getAmt(o), 0);
        const stripeFees = allOrders.reduce((acc, o) => {
            const amt = getAmt(o);
            return acc + (amt > 0 ? amt * STRIPE_RATE + STRIPE_FIXED : 0);
        }, 0);
        const netRevenue = Math.max(0, grossRevenue - stripeFees);

        // 7. Build monthly chart data
        const monthMap: Record<string, { month: string; amount: number; net: number }> = {};
        allOrders.forEach((o: any) => {
            const d = new Date(o.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
            if (!monthMap[key]) monthMap[key] = { month: label, amount: 0, net: 0 };
            const amt = getAmt(o);
            const fee = amt > 0 ? amt * STRIPE_RATE + STRIPE_FIXED : 0;
            monthMap[key].amount += amt;
            monthMap[key].net += Math.max(0, amt - fee);
        });
        const chart = Object.keys(monthMap).sort().map(k => monthMap[k]);

        return new Response(JSON.stringify({
            myDoctors: doctorIds.length,
            approvedOrders: allOrders.length,
            pendingSubmissions: pendingCount || 0,
            grossRevenue,
            stripeFees,
            netRevenue,
            orders: allOrders.slice(0, 20),
            chart: chart.length > 0 ? chart : [{ month: "Period", amount: grossRevenue, net: netRevenue }]
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("get-marketing-stats error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
