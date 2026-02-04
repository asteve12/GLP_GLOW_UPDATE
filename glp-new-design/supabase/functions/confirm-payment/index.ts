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
        if (!stripeKey) {
            throw new Error("STRIPE_SECRET_KEY is not set");
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: "2023-10-16",
        });

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { paymentIntentId, setupIntentId } = await req.json();

        // Get the authenticated user from the request
        const authHeader = req.headers.get("Authorization")!;
        const token = authHeader.replace("Bearer ", "");
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
            throw new Error("User not authenticated");
        }

        console.log("Confirming payment/setup for user:", user.id);

        let paymentMethodId = null;

        // Handle SetupIntent (for 100% off coupons)
        if (setupIntentId) {
            const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

            if (setupIntent.status !== "succeeded") {
                return new Response(
                    JSON.stringify({
                        success: false,
                        message: "Setup not yet completed",
                        status: setupIntent.status,
                    }),
                    {
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    },
                );
            }

            // Verify the setup belongs to this user
            if (setupIntent.metadata.user_id !== user.id) {
                throw new Error("Setup does not belong to this user");
            }

            paymentMethodId = setupIntent.payment_method as string;

            // Update the user's profile with payment method
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    eligibility_fee_paid: true,
                    stripe_payment_method_id: paymentMethodId,
                })
                .eq("id", user.id);

            if (updateError) throw updateError;

            console.log("Setup confirmed and profile updated for user:", user.id);
        }
        // Handle PaymentIntent (for regular payments)
        else if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent.status !== "succeeded") {
                return new Response(
                    JSON.stringify({
                        success: false,
                        message: "Payment not yet completed",
                        status: paymentIntent.status,
                    }),
                    {
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    },
                );
            }

            // Verify the payment belongs to this user
            if (paymentIntent.metadata.user_id !== user.id) {
                throw new Error("Payment does not belong to this user");
            }

            paymentMethodId = paymentIntent.payment_method as string;

            // Update the user's profile to mark eligibility fee as paid
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    eligibility_fee_paid: true,
                    stripe_payment_intent_id: paymentIntentId,
                    stripe_payment_method_id: paymentMethodId,
                })
                .eq("id", user.id);

            if (updateError) throw updateError;

            console.log("Payment confirmed and profile updated for user:", user.id);
        } else {
            throw new Error("Either paymentIntentId or setupIntentId is required");
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Payment confirmed successfully",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (error) {
        console.error("Error in confirm-payment:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return new Response(
            JSON.stringify({
                error: errorMessage,
            }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
