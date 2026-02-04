// functions/stripe-coupons/index.ts
// Supabase Edge Function – Manage Stripe Promotion Codes
// Works 100% with GET, POST, PATCH – no more "Unexpected end of JSON input"
import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2024-06-20"
});

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS"
};

// Safely parse JSON body – never throws
async function parseJson(req: Request) {
    try {
        if (req.headers.get("content-type")?.includes("application/json")) {
            const text = await req.text();
            return text.trim() === "" ? null : JSON.parse(text);
        }
        return null;
    } catch {
        return null;
    }
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: corsHeaders
        });
    }

    try {
        const method = req.method;

        // GET / → List all active promo codes
        if (method === "GET") {
            const promos = await stripe.promotionCodes.list({
                limit: 100,
                expand: [
                    "data.coupon"
                ]
            });

            const now = Math.floor(Date.now() / 1000);
            const discounts = promos.data.map((pc) => {
                const coupon = pc.coupon;
                const isActive = pc.active && (!pc.expires_at || pc.expires_at > now);
                return {
                    id: pc.id,
                    code: pc.code.toUpperCase(),
                    description: coupon.metadata?.description || coupon.name || "Special Offer",
                    discount: coupon.percent_off ? `${coupon.percent_off}% off` : coupon.amount_off ? `$${(coupon.amount_off / 100).toFixed(2)} off` : "Custom discount",
                    activeToday: isActive,
                    expires_at: pc.expires_at ? new Date(pc.expires_at * 1000).toISOString() : null,
                    message: isActive ? "ACTIVE" : "INACTIVE OR EXPIRED"
                };
            });

            return new Response(JSON.stringify({
                discounts
            }), {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json"
                }
            });
        }

        // POST / → Create one or more promo codes
        if (method === "POST") {
            const body = await parseJson(req);
            if (!body) {
                return new Response(JSON.stringify({
                    error: "Invalid or missing JSON body"
                }), {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json"
                    }
                });
            }

            const items = Array.isArray(body) ? body : [body];
            const results = [];

            for (const item of items) {
                const { code, description, discount_type, discount_value, expiration_date, active = true } = item;
                if (!code || !discount_type || discount_value === undefined) {
                    results.push({
                        code: code || null,
                        status: "error",
                        error: "Missing required fields: code, discount_type, discount_value"
                    });
                    continue;
                }

                const expires_at = expiration_date ? Math.floor(new Date(`${expiration_date}T23:59:59.999Z`).getTime() / 1000) : undefined;

                // Create Coupon
                const coupon = await stripe.coupons.create({
                    ...discount_type === "percentage" ? {
                        percent_off: discount_value
                    } : {
                        amount_off: discount_value,
                        currency: "usd"
                    },
                    duration: "forever",
                    name: description || `${discount_value}${discount_type === "percentage" ? "%" : "$"} off`,
                    metadata: {
                        description: description || ""
                    }
                });

                // Create Promotion Code
                const promo = await stripe.promotionCodes.create({
                    coupon: coupon.id,
                    code: code.toString().trim().toUpperCase(),
                    active,
                    expires_at,
                    max_redemptions: 10_000
                });

                results.push({
                    id: promo.id,
                    code: promo.code,
                    description,
                    discount: discount_type === "percentage" ? `${discount_value}% off` : `$${(discount_value / 100).toFixed(2)} off`,
                    expires_at: expiration_date || null,
                    active: promo.active,
                    status: "created"
                });
            }

            return new Response(JSON.stringify({
                success: true,
                created: results
            }), {
                status: 201,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json"
                }
            });
        }

        // PATCH / → Enable or disable a promo code
        if (method === "PATCH") {
            const body = await parseJson(req);
            if (!body || typeof body !== "object" || !body.code || typeof body.active !== "boolean") {
                return new Response(JSON.stringify({
                    error: "Invalid payload. Send: { \"code\": \"SAVE10\", \"active\": true }"
                }), {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json"
                    }
                });
            }

            const { code, active } = body;
            const promos = await stripe.promotionCodes.list({
                code: code.toString().toUpperCase(),
                limit: 1
            });

            if (promos.data.length === 0) {
                return new Response(JSON.stringify({
                    error: "Promo code not found"
                }), {
                    status: 404,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json"
                    }
                });
            }

            const updated = await stripe.promotionCodes.update(promos.data[0].id, {
                active
            });

            return new Response(JSON.stringify({
                success: true,
                code: updated.code,
                active: updated.active,
                message: updated.active ? "Promo code enabled" : "Promo code disabled"
            }), {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json"
                }
            });
        }

        // 405 Method Not Allowed
        return new Response(JSON.stringify({
            error: "Method not allowed"
        }), {
            status: 405,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });

    } catch (error: any) {
        console.error("Edge Function Error:", error);
        return new Response(JSON.stringify({
            error: error.message || "Internal server error",
            type: error.type || "Unknown"
        }), {
            status: error.statusCode || 500,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });
    }
});
