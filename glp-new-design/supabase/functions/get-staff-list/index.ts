import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Use service role key — bypasses RLS completely
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Verify the caller is an authenticated user with an admin/staff role
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing authorization header");

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) throw new Error("Unauthorized");

        // Verify they have at least some admin-level role
        const { data: callerRole } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .in("role", ["admin", "sub_admin", "physician", "nurse_practitioner", "physician_assistant", "back_office", "provider"])
            .maybeSingle();

        if (!callerRole) throw new Error("Unauthorized: Insufficient role");

        // Fetch all staff roles (excludes regular patients)
        const { data: roles, error: rolesError } = await supabaseAdmin
            .from("user_roles")
            .select("user_id, role")
            .in("role", ["sub_admin", "back_office", "physician", "nurse_practitioner", "physician_assistant", "provider"]);

        if (rolesError) throw rolesError;
        if (!roles || roles.length === 0) {
            return new Response(JSON.stringify({ staff: [] }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const userIds = roles.map((r) => r.user_id);

        // Fetch profiles — service role bypasses RLS so all rows are visible
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from("profiles")
            .select("id, first_name, last_name, email")
            .in("id", userIds);

        if (profilesError) throw profilesError;

        // Merge roles + profiles
        const staff = roles.map((r) => {
            const p = (profiles || []).find((p) => p.id === r.user_id);
            return {
                id: r.user_id,
                role: r.role,
                first_name: p?.first_name || "",
                last_name: p?.last_name || "",
                email: p?.email || "",
                display_name:
                    p?.first_name && p?.last_name
                        ? `${p.first_name} ${p.last_name}`
                        : p?.first_name || p?.last_name || p?.email || "Staff Member",
            };
        });

        console.log(`[get-staff-list] Returning ${staff.length} staff members`);

        return new Response(JSON.stringify({ staff }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("[get-staff-list] Error:", error);
        return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
