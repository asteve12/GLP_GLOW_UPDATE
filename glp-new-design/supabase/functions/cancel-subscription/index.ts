import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: corsHeaders
        });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({
            error: 'Method not allowed'
        }), {
            status: 405,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });
    }

    try {
        // --- Environment ---
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing required environment variables');
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16'
        });

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // --- Parse Payload ---
        const { userId } = await req.json();
        if (!userId) {
            return new Response(JSON.stringify({
                error: 'userId is required'
            }), {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }

        console.log('Cancelling subscription for user:', userId);

        // --- Fetch Profile ---
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('stripe_subscription_id')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            throw new Error('User profile not found');
        }

        const { stripe_subscription_id } = profile;

        if (!stripe_subscription_id) {
            return new Response(JSON.stringify({
                error: 'No active subscription found'
            }), {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }

        // --- Cancel in Stripe (at period end) ---
        const canceledSub = await stripe.subscriptions.cancel(stripe_subscription_id, {
            cancellation_details: {
                comment: 'User requested cancellation'
            }
        });

        const accessEndDate = new Date(canceledSub.current_period_end * 1000).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // --- Update Supabase ---
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                subscribe_status: false,
            })
            .eq('id', userId);

        if (updateError) {
            throw updateError;
        }

        // --- Success ---
        return new Response(JSON.stringify({
            success: true,
            message: 'Subscription canceled',
            accessEnds: accessEndDate,
            subscriptionId: stripe_subscription_id
        }), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Cancel error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Internal server error'
        }), {
            status: 500,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });
    }
});
