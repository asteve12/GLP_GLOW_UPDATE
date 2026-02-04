import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2024-06-20"
});

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405, headers: corsHeaders
        });
    }

    try {
        const { drug, promo_code } = await req.json();
        if (!drug || !promo_code) {
            return new Response(JSON.stringify({ error: "Missing drug or promo_code" }), {
                status: 400, headers: corsHeaders
            });
        }

        const drugLower = drug.toLowerCase().trim();

        // Validate promo code → get coupon ID
        const promo = await stripe.promotionCodes.retrieve(promo_code, { expand: ["coupon"] });
        if (!promo.active || !promo.coupon?.valid) {
            return new Response(JSON.stringify({ error: "Invalid or inactive promo code" }), {
                status: 400, headers: corsHeaders
            });
        }

        const couponId = promo.coupon.id;

        // 🔥 Fetch & filter subscriptions without deep expand
        let hasMore = true;
        let startingAfter;
        const matchingSubs = [];

        while (hasMore) {
            const subs = await stripe.subscriptions.list({
                status: "active",
                limit: 100,
                starting_after: startingAfter
            });

            for (const sub of subs.data) {
                let containsDrug = false;

                // Check each item
                for (const item of sub.items.data) {
                    const priceId = item.price.id;

                    // Fetch price (1 level expand)
                    const price = await stripe.prices.retrieve(priceId, {
                        expand: ["product"]
                    });

                    const productName = price.product?.name?.toLowerCase() || "";

                    if (productName.includes(drugLower)) {
                        containsDrug = true;
                        break;
                    }
                }

                if (containsDrug) {
                    matchingSubs.push(sub.id);
                }
            }

            hasMore = subs.has_more;
            startingAfter = subs.data.at(-1)?.id;
        }

        // 🔥 Apply coupon to matching subscriptions
        let updated = 0;
        const failed = [];

        for (const subId of matchingSubs) {
            try {
                await stripe.subscriptions.update(subId, {
                    discounts: [{ coupon: couponId }],
                    proration_behavior: "none"
                });
                updated++;
            } catch (err) {
                failed.push({ subId, error: err.message });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            drug: drugLower,
            coupon_id: couponId,
            matching_subscriptions: matchingSubs.length,
            updated_subscriptions: updated,
            failed_updates: failed
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (err: any) {
        console.error("Function error:", err);
        return new Response(JSON.stringify({
            error: err.message
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
});
