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

        const { paymentMethodId } = await req.json();

        if (!paymentMethodId) {
            throw new Error("Payment method ID is required");
        }

        console.log("Testing payment method:", paymentMethodId);

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

        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });

        // Set as default payment method
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        // Create a test charge of $0.50
        const testAmount = 50; // 50 cents
        const paymentIntent = await stripe.paymentIntents.create({
            amount: testAmount,
            currency: "usd",
            customer: customerId,
            payment_method: paymentMethodId,
            confirm: true,
            return_url: "https://quiz.americahealthsolutions.com/dashboard",
            description: "Payment method verification charge",
            metadata: {
                supabase_user_id: user.id,
                is_test_charge: "true",
            },
        });

        console.log("Test charge created:", paymentIntent.id);

        // Immediately refund the charge
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntent.id,
            reason: "requested_by_customer",
        });

        console.log("Refund created:", refund.id);

        // Update profile with refunded amount
        const { data: currentProfile } = await supabase
            .from("profiles")
            .select("test_charge_refunded")
            .eq("id", user.id)
            .single();

        const newRefundedTotal = (currentProfile?.test_charge_refunded || 0) + testAmount;

        await supabase
            .from("profiles")
            .update({
                stripe_payment_method_id: paymentMethodId,
                test_charge_refunded: newRefundedTotal,
            })
            .eq("id", user.id);

        return new Response(
            JSON.stringify({
                success: true,
                testAmount,
                refundAmount: testAmount,
                totalRefunded: newRefundedTotal,
                message: "Payment method verified successfully. Test charge has been refunded.",
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (error: any) {
        console.error("Error testing payment method:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
