import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Verify the requesting user is an admin
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "No authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !requestingUser) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Check if requesting user is admin
        const { data: adminRole } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", requestingUser.id)
            .eq("role", "admin")
            .single();

        if (!adminRole) {
            return new Response(JSON.stringify({ error: "Unauthorized - admin access required" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { user_id } = await req.json();

        if (!user_id) {
            return new Response(JSON.stringify({ error: "user_id is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log("Deleting staff user:", user_id);

        // Step 1: Get provider profile IDs for this user
        const { data: providerProfiles } = await supabaseAdmin
            .from("provider_profiles")
            .select("id")
            .eq("user_id", user_id);

        // Step 2: Delete supervising physicians linked to provider profiles
        if (providerProfiles && providerProfiles.length > 0) {
            const providerIds = providerProfiles.map(p => p.id);

            const { error: supervisingError } = await supabaseAdmin
                .from("supervising_physicians")
                .delete()
                .in("provider_id", providerIds);

            if (supervisingError) {
                console.error("Error deleting supervising physicians:", supervisingError);
            }
        }

        // Step 3: Delete provider profiles
        const { error: providerError } = await supabaseAdmin
            .from("provider_profiles")
            .delete()
            .eq("user_id", user_id);

        if (providerError) {
            console.error("Error deleting provider profiles:", providerError);
        }

        // Step 4: Delete user roles
        const { error: rolesError } = await supabaseAdmin
            .from("user_roles")
            .delete()
            .eq("user_id", user_id);

        if (rolesError) {
            console.error("Error deleting user roles:", rolesError);
        }

        // Step 5: Delete profile
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", user_id);

        if (profileError) {
            console.error("Error deleting profile:", profileError);
        }

        // Step 6: Delete auth user
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (authDeleteError) {
            console.error("Error deleting auth user:", authDeleteError);
            return new Response(JSON.stringify({ error: authDeleteError.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log("Successfully deleted staff user:", user_id);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: unknown) {
        console.error("Error in delete-staff-user:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
