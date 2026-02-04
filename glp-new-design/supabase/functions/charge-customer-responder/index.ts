import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

Deno.serve(async (req) => {
    // CORS Handling
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers":
                    "Content-Type, Authorization, apikey, x-client-info",
                "Access-Control-Max-Age": "86400",
            },
        });
    }

    if (req.method !== "POST") {
        return new Response("Method Not Allowed", {
            status: 405,
            headers: { "Access-Control-Allow-Origin": "*" },
        });
    }

    // Environment Variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const MAILER_FROM = "ahs@americahealthsolutions.com";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    let payload;
    try {
        payload = await req.json();
    } catch {
        return new Response("Invalid JSON", {
            status: 400,
            headers: { "Access-Control-Allow-Origin": "*" },
        });
    }

    const {
        userId,
        product_name,
        product_price,
        product_category: initial_category,
        real_price,
        shipping_address,
        form_submission_id,
        request_type,
    } = payload;

    // Robust Category Determination
    let display_category = 'Weight Loss';
    let category_slug = 'weight_loss';
    const drug = (product_name || '').toLowerCase();
    const catSearch = (initial_category || '').toLowerCase();

    if (drug.includes('hair-restoration') || drug.includes('finasteride') || drug.includes('minoxidil') || catSearch.includes('hair')) {
        display_category = 'Hair Restoration';
        category_slug = 'hair_restoration';
    } else if (drug.includes('sexual-health') || drug.includes('sildenafil') || drug.includes('tadalafil') || drug.includes('oxytocin') || catSearch.includes('sexual')) {
        display_category = 'Sexual Health';
        category_slug = 'sexual_health';
    } else if (drug.includes('longevity') || drug.includes('nad') || drug.includes('glutathione') || catSearch.includes('longevity')) {
        display_category = 'Longevity';
        category_slug = 'longevity';
    } else if (drug.includes('weight-loss') || drug.includes('semaglutide') || drug.includes('tirzepatide') || catSearch.includes('weight')) {
        display_category = 'Weight Loss';
        category_slug = 'weight_loss';
    }

    const product_category = display_category;

    // —————————————————————————————————————
    // 1. REACTIVATE SUBSCRIPTION (after full cancel)
    // —————————————————————————————————————
    if (
        request_type?.toString().toLowerCase().trim() === "activate subscription"
    ) {
        try {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select(
                    `
          first_name,
          last_name,
          email,
          stripe_customer_id,
          current_sub_end_date,
          current_plan
        `
                )
                .eq("id", userId)
                .single();

            if (profileError || !profile?.stripe_customer_id || !profile.email) {
                return new Response("User or Stripe customer not found", {
                    status: 400,
                    headers: { "Access-Control-Allow-Origin": "*" },
                });
            }

            const {
                first_name,
                last_name,
                email,
                stripe_customer_id,
                current_sub_end_date,
                current_plan,
            } = profile;

            const originalPaidThrough = current_sub_end_date
                ? new Date(current_sub_end_date).getTime() / 1000
                : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

            const trialEnd = Math.max(
                originalPaidThrough,
                Math.floor(Date.now() / 1000) + 86400
            );

            const price = await stripe.prices.create({
                unit_amount: product_price,
                currency: "usd",
                recurring: { interval: "month" },
                product_data: { name: `${product_name || current_plan} – Monthly` },
            });

            const newSub = await stripe.subscriptions.create({
                customer: stripe_customer_id,
                items: [{ price: price.id }],
                trial_end: trialEnd,
                proration_behavior: "none",
                collection_method: "charge_automatically",
                metadata: {
                    user_id: userId,
                    form_submission_id,
                    product_name,
                    product_category,
                    category: category_slug,
                    reactivation: "true",
                    shipping_address: JSON.stringify(shipping_address),
                    note: "Reactivated after full cancel – trial until original period end",
                },
                description: `Reactivation: ${product_name} (${product_category})`,
            });

            // Handle current_plan as JSON
            let currentPlans: any = {};
            if (current_plan) {
                try {
                    currentPlans = typeof current_plan === 'string' ? JSON.parse(current_plan) : current_plan;
                } catch {
                    currentPlans = {};
                }
            }
            currentPlans[category_slug] = product_name || currentPlans[category_slug];

            await supabase
                .from("profiles")
                .update({
                    stripe_subscription_id: newSub.id,
                    subscription_status: "trialing",
                    subscribe_status: true,
                    current_plan: JSON.stringify(currentPlans),
                    current_sub_end_date: new Date(
                        newSub.current_period_end * 1000
                    ).toISOString(),
                })
                .eq("id", userId);

            if (form_submission_id) {
                await supabase
                    .from("form_submissions")
                    .update({ approval_status: "approved" })
                    .eq("id", form_submission_id);
            }

            const nextBilling = new Date(trialEnd * 1000).toLocaleDateString(
                "en-US",
                {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                }
            );

            const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Welcome Back to GLP-GLOW!</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:20px">
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#1e7b34,#28a745);color:#fff;padding:40px 20px;text-align:center">
      <h1 style="margin:0;font-size:28px">Welcome Back!</h1>
    </div>
    <div style="padding:30px;line-height:1.7;color:#333">
      <p>Dear ${first_name} ${last_name},</p>
      <p>We're thrilled to have you back! Your GLP-GLOW subscription has been <strong>reactivated</strong>.</p>
      <div style="background:#e6f7e8;padding:20px;border-radius:8px;margin:25px 0;border-left:5px solid #28a745;font-size:16px">
        <strong>You will NOT be charged today.</strong><br>
        Your next billing date is <strong>${nextBilling}</strong> — exactly when your original paid period ends.
      </div>
      <p style="text-align:center;margin:40px 0">
        <a href="https://quiz.americahealthsolutions.com/dashboard" 
           style="background:#28a745;color:#fff;padding:16px 36px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:17px">
          Go to My Dashboard
        </a>
      </p>
      <p>Thank you for choosing GLP-GLOW again!<br><strong>The GLP-GLOW Team</strong></p>
    </div>
    <div style="background:#f4f4f4;padding:20px;text-align:center;font-size:12px;color:#666">
      <p>© ${new Date().getFullYear()} GLP-GLOW • americahealthsolutions.com</p>
    </div>
  </div>
</body></html>`;

            if (SENDGRID_API_KEY) {
                await fetch("https://api.sendgrid.com/v3/mail/send", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${SENDGRID_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        personalizations: [{ to: [{ email }] }],
                        from: { email: MAILER_FROM, name: "GLP-GLOW" },
                        subject:
                            "Welcome Back! Your Subscription is Reactivated (No Charge Today)",
                        content: [{ type: "text/html", value: html }],
                    }),
                });
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message:
                        "Subscription reactivated – no charge until original period ends",
                    next_billing_date: nextBilling,
                }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        } catch (err: any) {
            console.error("Reactivation failed:", err);
            return new Response(
                JSON.stringify({ error: err.message || "Failed to reactivate" }),
                {
                    status: 500,
                    headers: { "Access-Control-Allow-Origin": "*" },
                }
            );
        }
    }

    // —————————————————————————————————————
    // 2. DOSAGE CHANGE → Cancel old, start new with trial until current period end
    // —————————————————————————————————————
    else if (request_type?.toLowerCase().includes("dosage change")) {
        try {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select(
                    `
          first_name,
          last_name,
          email,
          stripe_customer_id,
          stripe_subscription_id,
          current_sub_end_date,
          current_plan
        `
                )
                .eq("id", userId)
                .single();

            if (profileError || !profile?.stripe_customer_id || !profile.email) {
                return new Response("Profile or Stripe customer missing", {
                    status: 400,
                    headers: { "Access-Control-Allow-Origin": "*" },
                });
            }

            const {
                first_name,
                last_name,
                email,
                stripe_customer_id,
                stripe_subscription_id,
                current_sub_end_date,
                current_plan,
            } = profile;

            // Cancel existing subscription at period end
            if (stripe_subscription_id) {
                await stripe.subscriptions.update(stripe_subscription_id, {
                    cancel_at_period_end: true,
                    proration_behavior: "none",
                });
                console.log("Old subscription scheduled to cancel at period end");
            }

            // Trial ends when current paid period ends
            const originalPaidThrough = current_sub_end_date
                ? new Date(current_sub_end_date).getTime() / 1000
                : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
            const trialEnd = Math.max(
                originalPaidThrough,
                Math.floor(Date.now() / 1000) + 86400
            );

            // Create new price for the updated dosage
            const newPrice = await stripe.prices.create({
                unit_amount: real_price ?? product_price,
                currency: "usd",
                recurring: { interval: "month" },
                product_data: { name: `${product_name} – Monthly` },
            });

            // Create new subscription with trial
            const newSub = await stripe.subscriptions.create({
                customer: stripe_customer_id,
                items: [{ price: newPrice.id }],
                trial_end: trialEnd,
                proration_behavior: "none",
                collection_method: "charge_automatically",
                metadata: {
                    user_id: userId,
                    form_submission_id,
                    product_name,
                    product_category,
                    category: category_slug,
                    dosage_change: "true",
                    previous_plan: typeof current_plan === 'string' ? current_plan : JSON.stringify(current_plan),
                    shipping_address: JSON.stringify(shipping_address),
                    note: "Dosage change – no charge until original period end",
                },
                description: `Dosage Change: ${product_name} (${product_category})`,
            });

            // Approve form
            if (form_submission_id) {
                await supabase
                    .from("form_submissions")
                    .update({ approval_status: "approved" })
                    .eq("id", form_submission_id);
            }

            // Email
            const nextBilling = new Date(trialEnd * 1000).toLocaleDateString(
                "en-US",
                {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                }
            );

            const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Dosage Change Approved – GLP-GLOW</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:20px">
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#1e7b34,#28a745);color:#fff;padding:40px 20px;text-align:center">
      <h1 style="margin:0;font-size:28px">Dosage Change Approved!</h1>
    </div>
    <div style="padding:30px;line-height:1.7;color:#333">
      <p>Dear ${first_name} ${last_name},</p>
      <p>Your request to update your medication dosage has been <strong>approved</strong> by our medical team.</p>
      <div style="background:#e6f7e8;padding:20px;border-radius:8px;margin:25px 0;border-left:5px solid #28a745;font-size:16px">
        <strong>No charge today.</strong><br>
        Your new plan (${product_name}) starts automatically on <strong>${nextBilling}</strong> when your current paid period ends.
      </div>
      <p>Your next shipment will include the updated dosage.</p>
      <p style="text-align:center;margin:40px 0">
        <a href="https://quiz.americahealthsolutions.com/dashboard" 
           style="background:#28a745;color:#fff;padding:16px 36px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:17px">
          Go to My Dashboard
        </a>
      </p>
      <p>Thank you,<br><strong>The GLP-GLOW Medical Team</strong></p>
    </div>
    <div style="background:#f4f4f4;padding:20px;text-align:center;font-size:12px;color:#666">
      <p>© ${new Date().getFullYear()} GLP-GLOW • americahealthsolutions.com</p>
    </div>
  </div>
</body></html>`;

            console.log("verifying email", email)

            if (SENDGRID_API_KEY) {
                await fetch("https://api.sendgrid.com/v3/mail/send", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${SENDGRID_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        personalizations: [{ to: [{ email }] }],
                        from: { email: MAILER_FROM, name: "GLP-GLOW" },
                        subject: `Dosage Change Approved – Next Charge: ${nextBilling}`,
                        content: [{ type: "text/html", value: html }],
                    }),
                });
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message:
                        "Dosage change approved – no charge until current period ends",
                    next_billing_date: nextBilling,
                    new_plan: product_name,
                }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        } catch (err: any) {
            console.error("Dosage change failed:", err);
            return new Response(
                JSON.stringify({ error: err.message || "Dosage change failed" }),
                {
                    status: 500,
                    headers: { "Access-Control-Allow-Origin": "*" },
                }
            );
        }
    }

    // —————————————————————————————————————
    // 3. DEFAULT: New regular subscription (first-time)
    // —————————————————————————————————————
    else {
        if (
            !userId ||
            !product_name ||
            product_price === undefined ||
            !form_submission_id
        ) {
            return new Response("Missing required fields", {
                status: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
            });
        }

        try {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select(
                    "first_name, last_name, email, stripe_customer_id, stripe_payment_method_id"
                )
                .eq("id", userId)
                .single();

            if (
                profileError ||
                !profile?.email ||
                !profile.stripe_customer_id ||
                !profile.stripe_payment_method_id
            ) {
                return new Response("Profile or payment method missing", {
                    status: 400,
                    headers: { "Access-Control-Allow-Origin": "*" },
                });
            }

            const {
                first_name,
                last_name,
                email,
                stripe_customer_id,
                stripe_payment_method_id,
            } = profile;

            // Charge first month if needed
            if (product_price < real_price) {
                const paymentIntent1 = await stripe.paymentIntents.create({
                    amount: product_price,
                    currency: "usd",
                    customer: stripe_customer_id,
                    payment_method: stripe_payment_method_id,
                    confirm: true,
                    off_session: true,
                    description: `Initial: ${product_name} (${product_category})`,
                    metadata: {
                        user_id: userId,
                        form_submission_id,
                        product_name,
                        product_category,
                        category: category_slug,
                    },
                });
                if (paymentIntent1.status !== "succeeded") {
                    return new Response("Payment failed", {
                        status: 500,
                        headers: {
                            "Access-Control-Allow-Origin": "*",
                        },
                    });
                }
            }
            let subscription;

            if (product_price < real_price) {
                console.log("exceute product_price < real_price")
                // 2. Always create monthly REAL PRICE
                const price = await stripe.prices.create({
                    unit_amount: real_price,
                    currency: "usd",
                    recurring: { interval: "month" },
                    product_data: { name: `${product_name} – Monthly` },
                });
                const now = new Date();
                const trialEndDate = new Date(now);
                trialEndDate.setMonth(trialEndDate.getMonth() + 1);
                trialEndDate.setHours(12, 0, 0, 0); // optional: consistent time

                const trialEnd = Math.floor(trialEndDate.getTime() / 1000);

                // 3. Create subscription WITHOUT charging today
                subscription = await stripe.subscriptions.create({
                    customer: stripe_customer_id,
                    default_payment_method: stripe_payment_method_id,
                    items: [{ price: price.id }],
                    collection_method: "charge_automatically",

                    // 👇 the magic line that prevents double billing
                    trial_end: trialEnd,

                    metadata: {
                        user_id: userId,
                        form_submission_id,
                        product_name,
                        product_category,
                        category: category_slug,
                        shipping_address: JSON.stringify(shipping_address),
                    },
                    description: `${product_name} (${product_category})`,
                });
            } else {
                // 3. Create price + subscription
                const price = await stripe.prices.create({
                    unit_amount: real_price ?? product_price,
                    currency: "usd",
                    recurring: {
                        interval: "month",
                    },
                    product_data: {
                        name: `${product_name} – Monthly`,
                    },
                });
                subscription = await stripe.subscriptions.create({
                    customer: stripe_customer_id,
                    default_payment_method: stripe_payment_method_id,
                    items: [
                        {
                            price: price.id,
                        },
                    ],
                    collection_method: "charge_automatically",
                    metadata: {
                        user_id: userId,
                        form_submission_id,
                        product_name,
                        product_category,
                        category: category_slug,
                        shipping_address: JSON.stringify(shipping_address),
                    },
                    description: `${product_name} (${product_category})`,
                });
            }

            if (subscription.status === "incomplete") throw Error("insufficient funds")

            console.log("active", subscription)

            // Handle current_plan as JSON
            let currentPlans: any = {};
            // Fetch latest profile for plans
            const { data: latestProfile } = await supabase.from("profiles").select("current_plan").eq("id", userId).single();
            if (latestProfile?.current_plan) {
                try {
                    currentPlans = typeof latestProfile.current_plan === 'string' ? JSON.parse(latestProfile.current_plan) : latestProfile.current_plan;
                } catch {
                    currentPlans = {};
                }
            }
            currentPlans[category_slug] = product_name;

            // Update profile
            await supabase
                .from("profiles")
                .update({
                    stripe_subscription_id: subscription.id,
                    subscription_status: "active",
                    subscribe_status: true,
                    current_plan: JSON.stringify(currentPlans),
                    current_sub_end_date: new Date(
                        subscription.current_period_end * 1000
                    ).toISOString(),
                })
                .eq("id", userId);

            // Create order
            const { data: order } = await supabase
                .from("orders")
                .insert({
                    user_id: userId,
                    drug_name: product_name,
                    drug_price: product_price / 100,
                    shipping_address,
                    payment_status: "completed",
                    delivery_status: "in transit",
                    form_submission_id,
                })
                .select("id")
                .single();

            // Approve form
            await supabase
                .from("form_submissions")
                .update({ approval_status: "approved" })
                .eq("id", form_submission_id);

            // Send welcome email
            const amount = (product_price / 100).toFixed(2);
            const nextDate = new Date(
                subscription.current_period_end * 1000
            ).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            });

            const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Welcome to GLP-GLOW!</title></head>
<body style="font-family:Arial;background:#f9f9f9;margin:0;padding:20px">
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#1e7b34,#28a745);color:#fff;padding:40px 20px;text-align:center">
      <h1 style="margin:0;font-size:28px">Welcome to GLP-GLOW!</h1>
    </div>
    <div style="padding:30px;line-height:1.7;color:#333">
      <p>Dear ${first_name} ${last_name},</p>
      <p>Congratulations! Your <strong>${product_name}</strong> subscription is now <strong>active</strong>.</p>
      <div style="background:#e6f7e8;padding:20px;border-radius:8px;margin:25px 0;border-left:5px solid #28a745">
        Your medication will ship in 3–5 business days.
      </div>
      <div style="background:#f8f9fa;padding:20px;border-radius:8px">
        <p><strong>Plan:</strong> ${product_name}</p>
        <p><strong>Charged Today:</strong> $${amount}</p>
        <p><strong>Next Billing:</strong> ${nextDate}</p>
        <p><strong>Order ID:</strong> ${order?.id || "See dashboard"}</p>
      </div>
      <p style="text-align:center;margin:30px 0">
        <a href="https://quiz.americahealthsolutions.com/dashboard" style="background:#28a745;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold">Go to Dashboard</a>
      </p>
      <p><strong>The GLP-GLOW Team</strong></p>
      <a href="https://quiz.americahealthsolutions.com" style="color: #0066cc; text-decoration: underline;text-align:center">unsubscribe here</a>.
    </div>
  </div>
</body></html>`;

            console.log("checking email", email)

            if (SENDGRID_API_KEY) {
                await fetch("https://api.sendgrid.com/v3/mail/send", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${SENDGRID_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        personalizations: [{ to: [{ email }] }],
                        from: { email: MAILER_FROM, name: "GLP-GLOW" },
                        subject: "Your GLP-GLOW Subscription is Active!",
                        content: [{ type: "text/html", value: html }],
                    }),
                });
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Subscription activated!",
                    subscription_id: subscription.id,
                    order_id: order?.id,
                }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                }
            );
        } catch (error: any) {
            console.error("New subscription failed:", error);
            return new Response(
                JSON.stringify({ error: error.message || "Server error" }),
                {
                    status: 500,
                    headers: { "Access-Control-Allow-Origin": "*" },
                }
            );
        }
    }
});
