import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey) {
            throw new Error("Missing environment variables");
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
        });

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Get the authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("No authorization header");
        }

        // Verify the user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        console.log("Creating setup intent for user:", user.id);

        // Get user profile to find or create Stripe customer
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("stripe_customer_id, email, first_name, last_name")
            .eq("id", user.id)
            .single();

        if (profileError) {
            throw new Error("Profile not found");
        }

        let customerId = profile.stripe_customer_id;

        // Create customer if doesn't exist
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: profile.email,
                name: `${profile.first_name} ${profile.last_name}`,
                metadata: {
                    supabase_user_id: user.id,
                },
            });
            customerId = customer.id;

            await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
        }

        // Create a SetupIntent for payment method collection
        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                supabase_user_id: user.id,
            },
        });

        console.log("Setup intent created:", setupIntent.id);

        return new Response(
            JSON.stringify({
                clientSecret: setupIntent.client_secret,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (error: any) {
        console.error("Error creating setup intent:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
