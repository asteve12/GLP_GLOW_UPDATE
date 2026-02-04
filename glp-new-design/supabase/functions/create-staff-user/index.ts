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
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            },
        );

        // Verify the requesting user is an admin
        const authHeader = req.headers.get("Authorization")!;
        const token = authHeader.replace("Bearer ", "");
        const {
            data: { user },
            error: userError,
        } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        const { data: roles } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .single();

        if (!roles) {
            throw new Error("Unauthorized: Admin access required");
        }

        const { email, password, firstName, lastName, phone, dob, address, role, providerData, deaFile } = await req.json();

        // Check if email already exists in the profiles table (covers all users)
        const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
            .from("profiles")
            .select("id, email")
            .ilike("email", email)
            .maybeSingle();

        if (profileCheckError) {
            console.error("Error checking existing email:", profileCheckError);
            throw new Error("Failed to verify email availability");
        }

        let userId: string;

        if (existingProfile) {
            userId = existingProfile.id;
            console.log(`User ${email} exists in profiles. Checking role ${role}.`);

            const { data: existingRole } = await supabaseAdmin
                .from("user_roles")
                .select("id")
                .eq("user_id", userId)
                .eq("role", role)
                .maybeSingle();

            if (existingRole) {
                console.log(`User already has the '${role}' role. Proceeding to sync profile.`);
            }
        } else {
            console.log(`Creating new auth user for ${email}...`);
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    first_name: firstName,
                    last_name: lastName,
                },
            });

            if (authError) {
                console.error("Auth creation failed:", authError);
                if (authError.message.includes("already exists") || authError.status === 422) {
                    throw new Error("A user with this email already exists in the system (Auth). If they don't have a profile, please contact an administrator.");
                }
                throw authError;
            }
            if (!authData.user) throw new Error("Critical: Auth user creation returned success but no user object.");

            userId = authData.user.id;
        }

        // 3. Ensure profile exists and has current info (UPSERT to avoid race conditions)
        console.log(`Ensuring profile exists for ${userId}...`);
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: userId,
                email: email,
                first_name: firstName,
                last_name: lastName,
                phone_number: phone,
                date_of_birth: dob,
                legal_address: address,
            });

        if (profileError) {
            console.error("Profile upsert failed:", profileError);
            throw new Error(`Failed to initialize profile: ${profileError.message}`);
        }

        // 4. Assign the role (check first to prevent unique constraint errors)
        const { data: checkRole } = await supabaseAdmin
            .from("user_roles")
            .select("id")
            .eq("user_id", userId)
            .eq("role", role)
            .maybeSingle();

        if (!checkRole) {
            console.log(`Assigning role ${role} to ${userId}...`);
            const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
                user_id: userId,
                role: role,
            });

            if (roleError) {
                console.error("Role assignment failed:", roleError);
                throw new Error(`Failed to assign role: ${roleError.message}`);
            }
        } else {
            console.log(`Role ${role} already exists for ${userId}. Skipping assignment.`);
        }

        // If provider data exists, create provider profile
        if (providerData) {
            let deaUrl = null;

            // Handle DEA file upload if provided
            if (deaFile) {
                const { fileData, fileExt } = deaFile;
                const filePath = `${userId}/dea-cert.${fileExt}`;

                // Decode base64 file data
                const binaryString = atob(fileData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                const { error: uploadError } = await supabaseAdmin.storage.from("provider_reports").upload(filePath, bytes, {
                    upsert: true,
                    contentType: `application/${fileExt}`,
                });

                if (uploadError) throw uploadError;

                const { data: urlData } = await supabaseAdmin.storage
                    .from("provider_reports")
                    .createSignedUrl(filePath, 31536000);

                deaUrl = urlData?.signedUrl;
            }

            const { error: providerError } = await supabaseAdmin.from("provider_profiles").insert({
                user_id: userId,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone_number: phone,
                license_number: providerData.licenseNumber,
                license_type: providerData.licenseType,
                npi_number: providerData.npiNumber,
                dea_number: providerData.deaNumber,
                dea_url: deaUrl,
            });

            if (providerError) throw providerError;

            // If supervising physician data exists
            if (providerData.supervisingPhysician) {
                const { data: providerProfile } = await supabaseAdmin
                    .from("provider_profiles")
                    .select("id")
                    .eq("user_id", userId)
                    .single();

                if (providerProfile) {
                    const { error: supervisingError } = await supabaseAdmin.from("supervising_physicians").insert({
                        provider_id: providerProfile.id,
                        supervising_physician_name: providerData.supervisingPhysician.name,
                        license_number: providerData.supervisingPhysician.licenseNumber,
                        npi_number: providerData.supervisingPhysician.npiNumber,
                        dea_number: providerData.supervisingPhysician.deaNumber,
                    });

                    if (supervisingError) throw supervisingError;
                }
            }
        }

        return new Response(JSON.stringify({ success: true, userId: userId }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Critical error in create-staff-user:", error);

        // Extract meaningful error message
        let errorMessage = "An unknown error occurred";
        if (error.message) {
            errorMessage = error.message;
        } else if (typeof error === "string") {
            errorMessage = error;
        } else {
            try {
                errorMessage = JSON.stringify(error);
            } catch {
                errorMessage = "An error occurred (failed to stringify error)";
            }
        }

        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
