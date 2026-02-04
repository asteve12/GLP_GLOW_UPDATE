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
        const { userId, subscriptionId, formSubmissionId, category } = await req.json();
        let stripe_subscription_id = subscriptionId;

        // Handle if subscriptionId is a JSON map from the client
        if (stripe_subscription_id && typeof stripe_subscription_id === 'string' && stripe_subscription_id.startsWith('{')) {
            try {
                const subMap = JSON.parse(stripe_subscription_id);
                // If category is provided, use it. Otherwise, we'll try to guess later or it will fail.
                if (category && subMap[category]) {
                    stripe_subscription_id = subMap[category];
                } else {
                    // If no category, we still have the map. We'll try to resolve it from the profile if userId is present.
                    stripe_subscription_id = null;
                }
            } catch (e) {
                console.error('Error parsing subscriptionId map from payload:', e);
            }
        }

        if (!stripe_subscription_id) {
            if (!userId) {
                return new Response(JSON.stringify({
                    error: 'userId or valid subscriptionId is required'
                }), {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                });
            }

            console.log('Fetching subscription ID from profile for user:', userId);
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('stripe_subscription_id, subscription_status')
                .eq('id', userId)
                .single();

            if (profileError || !profile) {
                throw new Error('User profile not found');
            }
            let profileSubId = profile.stripe_subscription_id;

            // Handle if profile has map
            if (profileSubId && profileSubId.startsWith('{')) {
                try {
                    const subMap = JSON.parse(profileSubId);
                    // If category is provided, pick from map
                    if (category && subMap[category]) {
                        stripe_subscription_id = subMap[category];
                    } else if (Object.keys(subMap).length === 1) {
                        // If only one sub exists, use it as fallback
                        stripe_subscription_id = Object.values(subMap)[0] as string;
                    } else {
                        throw new Error('Specific category or subscriptionId required for multi-subscription users');
                    }
                } catch (e) {
                    throw new Error(e instanceof Error ? e.message : 'Error resolving subscription ID from map');
                }
            } else {
                stripe_subscription_id = profileSubId;
            }
        }

        if (!stripe_subscription_id) {
            return new Response(JSON.stringify({
                error: 'No subscription ID provided and no active subscription found in profile'
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

        // 2. Update granular profile status
        const { data: latestProfile } = await supabase.from('profiles').select('stripe_subscription_id, subscription_status').eq('id', userId).single();

        let statusMap: Record<string, boolean> = {};
        if (latestProfile?.subscription_status) {
            try {
                statusMap = typeof latestProfile.subscription_status === 'string' && !latestProfile.subscription_status.startsWith('{')
                    ? { 'weight_loss': true }
                    : JSON.parse(latestProfile.subscription_status);
            } catch { }
        }

        let subMap: Record<string, string> = {};
        if (latestProfile?.stripe_subscription_id) {
            try {
                subMap = typeof latestProfile.stripe_subscription_id === 'string' && !latestProfile.stripe_subscription_id.startsWith('{')
                    ? { 'weight_loss': latestProfile.stripe_subscription_id }
                    : JSON.parse(latestProfile.stripe_subscription_id);
            } catch { }
        }

        // Find category for this sub ID
        let categoryKey = Object.keys(subMap).find(key => subMap[key] === stripe_subscription_id);

        // Fallback: If not found, check if it's the legacy single string or try default 'weight_loss' for legacy users
        if (!categoryKey) {
            const isLegacyString = typeof latestProfile?.stripe_subscription_id === 'string' && !latestProfile.stripe_subscription_id.startsWith('{');
            if (isLegacyString && latestProfile.stripe_subscription_id === stripe_subscription_id) {
                categoryKey = 'weight_loss';
            }
        }

        if (categoryKey) {
            statusMap[categoryKey] = false;
            console.log(`Updated status for ${categoryKey} to false`);
        } else {
            console.log(`Warning: Could not match sub ID ${stripe_subscription_id} to a category.`);
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                subscribe_status: Object.values(statusMap).some(v => v === true), // Global is true if ANY are true
                subscription_status: JSON.stringify(statusMap)
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
