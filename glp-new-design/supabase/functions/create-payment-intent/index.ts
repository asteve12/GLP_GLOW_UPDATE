import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-customer-authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: corsHeaders,
        });
    }

    try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) {
            throw new Error("STRIPE_SECRET_KEY is not set");
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: "2023-10-16",
        });

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase configuration");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get the authenticated user from the request
        // Fallback to x-customer-authorization to bypass gateway JWT validation bugs
        const authHeader = req.headers.get("Authorization");
        const customAuthHeader = req.headers.get("x-customer-authorization");

        const token = authHeader?.replace("Bearer ", "") || customAuthHeader?.replace("Bearer ", "");

        if (!token) {
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "User not authenticated" }),
                {
                    status: 401,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        console.log("Creating payment intent for user:", user.id);

        // Parse request body
        const {
            couponCode,
            discountedAmount,
            amount: requestAmount,
            type: requestType,
            categoryId,
            metadata: extraMetadata = {}
        } = await req.json().catch(() => ({}));

        // Product Category Mapping
        const categoryMap: Record<string, string> = {
            'weight-loss': 'Weight Loss',
            'hair-restoration': 'Hair Restoration',
            'sexual-health': 'Sexual Health',
            'longevity': 'Longevity'
        };

        const productCategory = categoryId ? (categoryMap[categoryId] || categoryId) : 'General Consultation';
        const displayCategory = productCategory.charAt(0).toUpperCase() + productCategory.slice(1);

        // Get or create Stripe customer with resilience for missing DB columns
        let customerId: string | null = null;
        let userEmail: string | null = null;

        try {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("stripe_customer_id, email")
                .eq("id", user.id)
                .single();

            if (profileError) {
                // If column doesn't exist (42703), we'll handle it by searching Stripe
                if (profileError.code !== "42703") {
                    throw profileError;
                }
                console.log("Profiles table is missing stripe_customer_id column. Using email search fallback.");
                userEmail = user.email || null;
            } else {
                customerId = profile.stripe_customer_id;
                userEmail = profile.email || user.email || null;
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            userEmail = user.email || null;
        }

        // If we don't have a customer ID from the DB, search/create in Stripe
        if (!customerId && userEmail) {
            console.log("Searching Stripe for customer with email:", userEmail);
            const customers = await stripe.customers.list({
                email: userEmail,
                limit: 1,
            });

            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
                console.log("Found existing Stripe customer by email:", customerId);
            } else {
                console.log("No existing customer found. Creating new Stripe customer.");
                const customer = await stripe.customers.create({
                    email: userEmail,
                    metadata: {
                        supabase_user_id: user.id,
                    },
                });
                customerId = customer.id;
                console.log("Created new Stripe customer:", customerId);
            }

            // Attempt to update profile with customer ID (swallow error if column missing)
            if (customerId) {
                const { error: updateError } = await supabase
                    .from("profiles")
                    .update({
                        stripe_customer_id: customerId,
                    })
                    .eq("id", user.id);

                if (updateError && updateError.code !== "42703") {
                    console.error("Failed to update profile with customer ID:", updateError.message);
                }
            }
        }

        if (!customerId) {
            throw new Error("Could not resolve Stripe customer identity.");
        }

        // Base amount - use provided amount or default to $25 (2500 cents) for eligibility verification
        const originalAmount = requestAmount || 2500;
        let amount = originalAmount;
        const paymentType = requestType || "eligibility_verification";
        let couponDetails = null;
        let appliedCouponCode = null;

        // If coupon code provided, validate it from Supabase coupons table
        if (couponCode) {
            try {
                const code = couponCode.trim().toLowerCase();
                console.log("Looking up coupon code in Supabase:", code);

                // Query the coupons table for the coupon code (case-insensitive using ilike)
                const { data: couponData, error: couponError } = await supabase
                    .from("coupons")
                    .select("*")
                    .ilike("code", code)
                    .eq("is_active", true)
                    .maybeSingle();

                if (couponError) {
                    console.error("Error fetching coupon from Supabase:", couponError.message);
                } else if (!couponData) {
                    console.log("Coupon code not found in Supabase:", code);
                } else {
                    // Check if coupon is expired
                    const expirationDate = new Date(couponData.expiration_date);
                    const now = new Date();

                    if (expirationDate < now) {
                        console.log("Coupon code is expired:", code, "Expiration:", couponData.expiration_date);
                    } else {
                        // Apply discount based on discount_type
                        let discountAmount = 0;

                        if (couponData.discount_type === "percentage") {
                            discountAmount = Math.round((originalAmount * couponData.discount_value) / 100);
                            console.log(`Applying ${couponData.discount_value}% discount: ${discountAmount} cents off`);
                        } else if (couponData.discount_type === "fixed") {
                            // Convert fixed amount to cents (assuming discount_value is in dollars)
                            discountAmount = Math.round(couponData.discount_value * 100);
                            console.log(`Applying fixed discount: ${discountAmount} cents off`);
                        }

                        amount = Math.max(0, originalAmount - discountAmount);
                        appliedCouponCode = code;

                        couponDetails = {
                            id: couponData.id,
                            code: code,
                            discount_type: couponData.discount_type,
                            discount_value: couponData.discount_value,
                            percent_off: couponData.discount_type === "percentage" ? couponData.discount_value : null,
                            amount_off: couponData.discount_type === "fixed" ? couponData.discount_value * 100 : null,
                            description: couponData.description,
                        };

                        console.log("Applied Supabase coupon:", code, "Original:", originalAmount, "cents, Final:", amount, "cents");
                    }
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.error("Error processing coupon:", errorMessage);
                // Continue without applying discount
            }
        }

        // If amount is less than Stripe's minimum ($0.50), use SetupIntent instead
        if (amount < 50) {
            console.log("Amount below minimum ($0.50), creating SetupIntent instead. Amount:", amount, "cents");

            const setupIntent = await stripe.setupIntents.create({
                customer: customerId,
                payment_method_types: ["card"],
                metadata: {
                    user_id: user.id,
                    type: paymentType,
                    product_id: "prod_TMtZzL2vS9ieNE",
                    product_category: displayCategory,
                    categoryId: categoryId || "none",
                    original_amount: String(requestAmount || 2500),
                    final_amount: String(amount),
                    coupon_code: appliedCouponCode || "none",
                    ...extraMetadata
                },
                description: `Setup for ${displayCategory} - ${paymentType}`,
            });

            console.log("SetupIntent created successfully:", setupIntent.id, "- No charge will be made");

            return new Response(
                JSON.stringify({
                    clientSecret: setupIntent.client_secret,
                    intentType: "setup",
                    amount,
                    originalAmount: requestAmount || 2500,
                    couponApplied: !!couponDetails,
                    couponDetails: couponDetails
                        ? {
                            id: couponDetails.id,
                            percent_off: couponDetails.percent_off,
                            amount_off: couponDetails.amount_off,
                        }
                        : null,
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Create payment intent for regular payments
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            customer: customerId,
            automatic_payment_methods: {
                enabled: true,
            },
            setup_future_usage: "off_session",
            metadata: {
                user_id: user.id,
                type: paymentType,
                product_id: "prod_TMtZzL2vS9ieNE",
                product_category: displayCategory,
                categoryId: categoryId || "none",
                original_amount: String(requestAmount || 2500),
                coupon_code: appliedCouponCode || "none",
                ...extraMetadata
            },
            description: `${displayCategory} - ${paymentType}`,
        });

        console.log("Payment intent created:", paymentIntent.id);

        return new Response(
            JSON.stringify({
                clientSecret: paymentIntent.client_secret,
                intentType: "payment",
                amount,
                originalAmount: requestAmount || 2500,
                couponApplied: !!couponDetails,
                couponDetails: couponDetails
                    ? {
                        id: couponDetails.id,
                        percent_off: couponDetails.percent_off,
                        amount_off: couponDetails.amount_off,
                    }
                    : null,
            }),
            {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    } catch (error) {
        console.error("Error in create-payment-intent:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

        return new Response(
            JSON.stringify({
                error: errorMessage,
            }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    }
});
