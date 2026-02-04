import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13?target=deno&no-check";

const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16"
});

const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_ANON_KEY") || ""
);

serve(async (req) => {
    try {
        // === 1. Authenticate user (optional) ===
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({
                error: "Unauthorized"
            }), {
                status: 401,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        if (authError || !user) {
            return new Response(JSON.stringify({
                error: "Invalid token"
            }), {
                status: 401,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        // === 2. Parse request ===
        const { price_id, apply_coupon } = await req.json();
        if (!price_id) {
            return new Response(JSON.stringify({
                error: "price_id required"
            }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        // === 3. Create Checkout Session ===
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: [
                "card"
            ],
            line_items: [
                {
                    price: price_id,
                    quantity: 1
                }
            ],
            discounts: apply_coupon ? [
                {
                    coupon: "100OFF"
                }
            ] : [],
            payment_intent_data: {
                setup_future_usage: "off_session"
            },
            payment_method_collection: "required",
            customer_creation: "always",
            success_url: `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/cancel`,
            metadata: {
                supabase_user_id: user.id
            }
        });

        // === 4. Return Checkout URL ===
        return new Response(JSON.stringify({
            url: session.url,
            session_id: session.id
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error: any) {
        console.error("Error:", error);
        return new Response(JSON.stringify({
            error: error.message || "Internal error"
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
});
