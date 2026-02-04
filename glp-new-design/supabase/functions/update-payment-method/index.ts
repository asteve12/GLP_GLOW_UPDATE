// update-payment-method.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// --- CLIENTS ---
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16"
});

const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: corsHeaders
        });
    }

    try {
        const { user_id, stripe_customer_id, stripe_payment_method_id, stripe_subscription_id, charge_now = false } = await req.json();

        // --- VALIDATE CORE FIELDS ---
        if (!user_id || !stripe_customer_id || !stripe_payment_method_id) {
            throw new Error("Missing required: user_id, stripe_customer_id, stripe_payment_method_id");
        }

        console.log("Updating payment method for user:", user_id);

        // --- 1. ALWAYS: Set as default on Stripe Customer ---
        await stripe.customers.update(stripe_customer_id, {
            invoice_settings: {
                default_payment_method: stripe_payment_method_id
            }
        });

        let subscription = null;
        let invoicePaid = false;

        // Fetch profile to check subscribe_status
        interface Profile {
            subscribe_status: boolean | null;
        }
        const { data: profile, error: fetchError } = await supabase
            .from("profiles")
            .select("subscribe_status")
            .eq("id", user_id)
            .single();

        if (fetchError) {
            console.warn("Could not fetch profile subscribe_status", fetchError);
        }

        // --- 2. IF SUBSCRIPTION EXISTS: Update it ---
        if (stripe_subscription_id && profile?.subscribe_status !== false && profile?.subscribe_status !== null) {
            console.log("Subscription found. Updating:", stripe_subscription_id);
            subscription = await stripe.subscriptions.update(stripe_subscription_id, {
                default_payment_method: stripe_payment_method_id,
                collection_method: "charge_automatically",
                expand: [
                    "latest_invoice"
                ]
            });

            // --- 3. OPTIONAL: Pay open invoice NOW ---
            const invoice: any = subscription.latest_invoice;
            if (charge_now && invoice?.status === "open") {
                try {
                    const paid = await stripe.invoices.pay(invoice.id, {
                        payment_method: stripe_payment_method_id
                    });
                    invoicePaid = paid.status === "paid";
                    console.log("Charged immediately:", paid.id);
                } catch (err: any) {
                    console.warn("Immediate charge failed:", err.message);
                    // Don't fail — Stripe will retry later
                }
            }
        } else {
            console.log("No active subscription to update. Only updating customer default payment method.");
        }

        const paymentMethod = await stripe.paymentMethods.retrieve(stripe_payment_method_id);
        const card_name = (paymentMethod.card?.brand || "Card").replace(/\b\w/g, (l) => l.toUpperCase()); // "visa" → "Visa"
        const last_four_digits_of_card = paymentMethod.card?.last4 || "0000";

        // --- 4. UPDATE SUPABASE `profiles` TABLE ---
        const { error: profileError } = await supabase.from("profiles").update({
            stripe_payment_method_id,
            stripe_subscription_id: stripe_subscription_id || null,
            card_name,
            last_four_digits_of_card
        }).eq("id", user_id);

        if (profileError) {
            console.error("Supabase update failed:", profileError);
            throw new Error(`Profile update failed: ${profileError.message}`);
        }

        const responseData = {
            success: true,
            user_id,
            stripe_customer_id,
            stripe_payment_method_id,
            stripe_subscription_id: stripe_subscription_id || null,
            subscription_updated: !!stripe_subscription_id,
            invoice_paid: invoicePaid,
            message: stripe_subscription_id
                ? (invoicePaid ? "Payment method + subscription updated and charged now" : "Payment method + subscription updated")
                : "Payment method saved (no subscription yet)"
        };

        console.log("Update completed:", responseData);

        // --- SUCCESS RESPONSE ---
        return new Response(JSON.stringify(responseData), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });

    } catch (err: any) {
        console.error("Update payment method failed:", err);
        return new Response(JSON.stringify({
            error: err.message || "Unknown error"
        }), {
            status: 400,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });
    }
});
