import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY missing');

        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Authenticate user
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('No authorization header');

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error('Unauthorized');

        const { couponCode } = await req.json();

        if (!couponCode?.trim()) {
            return new Response(JSON.stringify({ valid: false, error: 'Coupon code is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const code = couponCode.trim().toUpperCase();
        console.log('Validating coupon:', code, 'for user:', user.id);

        // Find active Promotion Code (this is what users type: SAVE20, WELCOME10, etc.)
        const promoList = await stripe.promotionCodes.list({
            code,
            active: true,
            limit: 1,
        });

        if (promoList.data.length === 0) {
            return new Response(JSON.stringify({ valid: false, error: 'Invalid or expired coupon code' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const promoCode = promoList.data[0];
        const coupon = promoCode.coupon;

        // Extra safety: check expiration
        if (coupon.redeem_by && coupon.redeem_by < Date.now() / 1000) {
            return new Response(JSON.stringify({ valid: false, error: 'This coupon has expired' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Calculate discount preview
        const originalAmount = 2500; // $25.00 in cents
        let discountAmount = 0;

        if (coupon.percent_off) {
            discountAmount = Math.round(originalAmount * coupon.percent_off / 100);
        } else if (coupon.amount_off) {
            discountAmount = coupon.amount_off;
        }

        const finalAmount = Math.max(0, originalAmount - discountAmount);

        return new Response(JSON.stringify({
            valid: true,
            originalAmount,
            discountAmount,
            finalAmount,
            discountType: coupon.percent_off ? 'percentage' : 'fixed',
            discountValue: coupon.percent_off || (coupon.amount_off ? coupon.amount_off / 100 : 0),
            couponCode: code,
            stripeCouponId: coupon.id,
            description: coupon.name || 'Discount applied',
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error:', errorMessage);
        return new Response(JSON.stringify({
            valid: false,
            error: errorMessage || 'Something went wrong',
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
