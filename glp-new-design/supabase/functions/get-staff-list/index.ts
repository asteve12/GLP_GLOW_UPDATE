import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Verify the caller is authenticated
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing authorization header");

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) throw new Error("Unauthorized: Invalid session");

        // Verify caller role
        const { data: callerRoleData } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();

        const callerRole = callerRoleData?.role;
        const isAdmin = callerRole === "admin";
        const isMarketingRep = callerRole === "marketing_rep";

        if (!isAdmin && !isMarketingRep) {
            throw new Error(`Unauthorized: role '${callerRole}' cannot access staff list`);
        }

        // Query the staff_with_owners view — service role bypasses RLS
        // This view joins user_roles + profiles so we always get full profile data
        let staffQuery = supabaseAdmin
            .from("staff_with_owners")
            .select("user_id, role, email, first_name, last_name, created_at, owner_id, owner_first_name, owner_last_name")
            .in("role", ["admin", "back_office", "physician", "nurse_practitioner", "physician_assistant", "marketing_rep"]);

        // Marketing reps only see doctors they added
        if (isMarketingRep) {
            staffQuery = staffQuery.eq("owner_id", user.id);
        }

        const { data: staffRows, error: staffError } = await staffQuery;

        if (staffError) {
            // View might not exist — fall back to manual join
            console.warn("[get-staff-list] staff_with_owners view error, using manual join:", staffError.message);

            let rolesQuery = supabaseAdmin
                .from("user_roles")
                .select("user_id, role, added_by")
                .in("role", ["admin", "back_office", "physician", "nurse_practitioner", "physician_assistant", "marketing_rep"]);

            if (isMarketingRep) {
                rolesQuery = rolesQuery.eq("added_by", user.id);
            }

            const { data: roles, error: rolesError } = await rolesQuery;
            if (rolesError) throw rolesError;

            if (!roles || roles.length === 0) {
                return new Response(JSON.stringify({ staff: [] }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            const userIds = roles.map((r: any) => r.user_id);
            const { data: profiles } = await supabaseAdmin
                .from("profiles")
                .select("id, first_name, last_name, email, created_at")
                .in("id", userIds);

            const staff = roles.map((r: any) => {
                const p = (profiles || []).find((p: any) => p.id === r.user_id);
                return {
                    id: r.user_id,
                    role: r.role,
                    added_by: r.added_by || null,
                    first_name: p?.first_name || "",
                    last_name: p?.last_name || "",
                    email: p?.email || "",
                    otp_verified: false,
                    created_at: p?.created_at || null,
                    display_name: p?.first_name && p?.last_name
                        ? `${p.first_name} ${p.last_name}`
                        : p?.email || "Staff Member",
                };
            }).sort((a: any, b: any) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );

            return new Response(JSON.stringify({ staff }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Map view results to the expected shape
        const staff = (staffRows || []).map((row: any) => ({
            id: row.user_id,
            role: row.role,
            added_by: row.owner_id || null,
            first_name: row.first_name || "",
            last_name: row.last_name || "",
            email: row.email || "",
            otp_verified: false, // view doesn't expose this directly
            created_at: row.created_at || null,
            display_name: row.first_name && row.last_name
                ? `${row.first_name} ${row.last_name}`
                : row.email || "Staff Member",
        })).sort((a: any, b: any) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );

        console.log(`[get-staff-list] Returning ${staff.length} staff members via view`);

        return new Response(JSON.stringify({ staff }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("[get-staff-list] Error:", error?.message || error);
        return new Response(JSON.stringify({ error: error.message || "Unknown error", staff: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
