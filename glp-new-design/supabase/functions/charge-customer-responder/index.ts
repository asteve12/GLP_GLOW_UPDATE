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
        approving_provider_id,
        provider_first_name,
        provider_last_name,
        provider_type,
        delivery_status
    } = payload;

    // Map delivery status to DB valid values
    let final_delivery_status = "pending";
    const status_input = (delivery_status || "").toLowerCase();
    if (status_input.includes("shipped")) final_delivery_status = "shipped";
    else if (status_input.includes("delivered")) final_delivery_status = "delivered";
    else if (status_input.includes("processing")) final_delivery_status = "processing";
    else if (status_input.includes("transit")) final_delivery_status = "in transit";
    else if (status_input === "pending") final_delivery_status = "pending";

    const providerHtml = provider_first_name ? `
      <div style="background:#f8f9fa;padding:25px;border-radius:15px;margin:25px 0;border:1px solid #eee;text-align:left;">
        <h3 style="margin:0 0 15px;font-size:16px;color:#333;text-transform:uppercase;letter-spacing:1px;font-weight:900;">Medical Review Details</h3>
        <p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Approving Practitioner:</strong> ${provider_first_name} ${provider_last_name}</p>
        <p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Provider Type:</strong> ${provider_type || 'Physician'}</p>
      </div>
    ` : '';

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
    } else if (drug.includes('skin') || drug.includes('face-spot') || drug.includes('acne-cleanser') || drug.includes('anti-aging-cream') || catSearch.includes('skin')) {
        display_category = 'Skin Care';
        category_slug = 'skin_care';
    } else if (drug.includes('testosterone') || catSearch.includes('testosterone') || catSearch.includes('hormone')) {
        display_category = 'Hormone Therapy';
        category_slug = 'testosterone';
    } else if (drug.includes('weight-loss') || drug.includes('semaglutide') || drug.includes('tirzepatide') || catSearch.includes('weight')) {
        display_category = 'Weight Loss';
        category_slug = 'weight_loss';
    }

    const product_category = display_category;

    // Determine Duration & Plan Type
    let plan_duration_months = payload.plan_duration_months || 1;
    let plan_label = 'Monthly';

    // Explicit override check
    if (plan_duration_months === 6) plan_label = '6 Month';
    else if (plan_duration_months === 3) plan_label = '3 Month';
    else {
        // Fallback to string parsing if payload didn't specify
        if (drug.includes('6 month')) {
            plan_duration_months = 6;
            plan_label = '6 Month';
        } else if (drug.includes('3 month')) {
            plan_duration_months = 3;
            plan_label = '3 Month';
        }
    }

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
          stripe_subscription_id,
          subscription_status,
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
                recurring: { interval: "month", interval_count: plan_duration_months },
                product_data: { name: `${product_name || current_plan} – ${plan_label}` },
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
                    note: `Reactivated – ${plan_label} plan`,
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
            currentPlans[category_slug] = {
                enddate: new Date(newSub.current_period_end * 1000).toISOString(),
                Nextdelivery: [], // Array of next delivery dates if applicable
                name: product_name || currentPlans[category_slug]?.name || current_plan,
                type: plan_label,
                price: (product_price / 100).toFixed(2)
            };

            let subMap: any = {};
            try {
                const currentVal = profile.stripe_subscription_id || '';
                if (currentVal.startsWith('sub_')) {
                    subMap = { 'weight_loss': currentVal };
                } else if (currentVal) {
                    subMap = JSON.parse(currentVal);
                }
            } catch { }
            subMap[category_slug] = newSub.id;

            let statusMap: any = {};
            try {
                const currentStatus = profile.subscription_status;
                if (currentStatus === true || currentStatus === 'true' || (typeof currentStatus === 'string' && !currentStatus.startsWith('{'))) {
                    statusMap = { 'weight_loss': true };
                } else if (currentStatus) {
                    if (typeof currentStatus === 'object') statusMap = currentStatus;
                    else statusMap = JSON.parse(currentStatus);
                }
            } catch { }
            statusMap[category_slug] = true;

            await supabase
                .from("profiles")
                .update({
                    stripe_subscription_id: JSON.stringify(subMap),
                    subscription_status: JSON.stringify(statusMap),
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
                    .update({
                        approval_status: "approved",
                        stripe_subscription_id: newSub.id
                    })
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
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome Back to uGlowMD!</title>
</head>

<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 15px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,0.05);">

<!-- Header -->
<tr style="background:#000000">
<td align="center" style="padding:7px;border-bottom:1px solid #eeeeee;">
    
<span style="padding:7px 7px;border-radius:8px;display:inline-block;">
<img src="https://glp-glow-update-xwxw.vercel.app/assets/logo-oeJLxYFy.png"
alt="uGlowMD"
style="height:160px;width:auto;display:block;">
</span>

</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px 40px 20px 40px;">

<h2 style="margin-top:0;margin-bottom:20px;font-size:24px;color:#1a1a1a;font-weight:800;">
Welcome Back!
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${first_name},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Your <strong>${product_name || current_plan}</strong> protocol from <strong>uGlowMD</strong> has been reactivated. Since your original coverage period hasn’t ended yet, your next charge isn’t until <strong>${nextBilling}</strong>.
</p>

<div style="background:#f8f9fa;padding:25px;border-radius:15px;margin:25px 0;border:1px solid #eee;text-align:left;">
<h3 style="margin:0 0 15px;font-size:16px;color:#333;text-transform:uppercase;letter-spacing:1px;font-weight:900;">Reactivation Summary</h3>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Next Charge:</strong> ${nextBilling}</p>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Amount:</strong> $${(product_price / 100).toFixed(2)}</p>
</div>

<p style="text-align:center;margin:30px 0;">
<a href="https://quiz.americahealthsolutions.com/dashboard"
style="background:#000000;color:#ffffff;padding:16px 36px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:17px;display:inline-block;">
Go to My Dashboard
</a>
</p>

<p style="font-size:14px;color:#777777;margin-bottom:0;">
Best regards,<br>
<strong>The uGlowMD Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:25px 40px;background:#fafafa;border-top:1px solid #eeeeee;">

<p style="font-size:12px;color:#999999;margin:0;">
© ${new Date().getFullYear()} uGlowMD. All rights reserved.
</p>

<p style="font-size:12px;color:#aaaaaa;margin-top:8px;">
End-to-End Encryption • HIPAA Secure Environment
</p>

</td>
</tr>

</table>

<p style="margin-top:25px;font-size:12px;color:#aaaaaa;text-align:center;">
Secure HIPAA Compliant Communication
</p>

</td>
</tr>
</table>

</body>
</html>`;

            if (SENDGRID_API_KEY) {
                await fetch("https://api.sendgrid.com/v3/mail/send", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${SENDGRID_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        personalizations: [{ to: [{ email }] }],
                        from: { email: MAILER_FROM, name: "uGlowMD" },
                        subject:
                            "Welcome Back! Your uGlowMD Subscription is Reactivated (No Charge Today)",
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
            let oldSubId = stripe_subscription_id;
            try {
                if (oldSubId && !oldSubId.startsWith('sub_')) {
                    const map = JSON.parse(oldSubId);
                    oldSubId = map[category_slug];
                }
            } catch { }

            if (oldSubId) {
                await stripe.subscriptions.update(oldSubId, {
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
                recurring: { interval: "month", interval_count: plan_duration_months },
                product_data: { name: `${product_name} – ${plan_label}` },
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
                    plan_type: plan_label,
                    note: `Dosage change to ${plan_label} plan`,
                },
                description: `Dosage Change: ${product_name} (${product_category})`,
            });

            // Update Profile immediately for UI
            const { data: latestProfile } = await supabase.from("profiles").select("current_plan, stripe_subscription_id, subscription_status").eq("id", userId).single();

            let currentPlans: any = {};
            if (latestProfile?.current_plan) {
                try {
                    currentPlans = typeof latestProfile.current_plan === 'string' ? JSON.parse(latestProfile.current_plan) : latestProfile.current_plan;
                } catch {
                    currentPlans = {};
                }
            }
            currentPlans[category_slug] = {
                enddate: new Date(trialEnd * 1000).toISOString(),
                Nextdelivery: [], // Staggered orders for dosage change can be handled by webhook or further logic
                name: product_name,
                type: plan_label,
                price: ((real_price ?? product_price) / 100).toFixed(2)
            };

            let subMap: any = {};
            try {
                const currentSubId = latestProfile?.stripe_subscription_id;
                if (typeof currentSubId === 'string' && currentSubId.startsWith('{')) {
                    subMap = JSON.parse(currentSubId);
                } else if (typeof currentSubId === 'object' && currentSubId !== null) {
                    subMap = currentSubId;
                } else if (currentSubId) {
                    // Handle legacy string sub ID
                    subMap = { 'weight_loss': currentSubId };
                }
            } catch {
                subMap = {};
            }
            subMap[category_slug] = newSub.id;

            await supabase.from("profiles").update({
                current_plan: JSON.stringify(currentPlans),
                current_sub_end_date: new Date(trialEnd * 1000).toISOString(),
                stripe_subscription_id: JSON.stringify(subMap)
            }).eq("id", userId);

            // Approve form
            if (form_submission_id) {
                await supabase
                    .from("form_submissions")
                    .update({
                        approval_status: "approved",
                        stripe_subscription_id: newSub.id
                    })
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
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dosage Change Approved!</title>
</head>

<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 15px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,0.05);">

<!-- Header -->
<tr style="background:#000000">
<td align="center" style="padding:7px;border-bottom:1px solid #eeeeee;">
    
<span style="padding:7px 7px;border-radius:8px;display:inline-block;">
<img src="https://glp-glow-update-xwxw.vercel.app/assets/logo-oeJLxYFy.png"
alt="uGlowMD"
style="height:160px;width:auto;display:block;">
</span>

</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px 40px 20px 40px;">

<h2 style="margin-top:0;margin-bottom:20px;font-size:24px;color:#1a1a1a;font-weight:800;">
Dosage Request Approved
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${first_name},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Our medical team has reviewed and <strong>approved</strong> your dosage adjustment. We have updated your protocol and your next shipment will reflect these changes.
</p>

<div style="background:#f8f9fa;padding:25px;border-radius:15px;margin:25px 0;border:1px solid #eee;text-align:left;">
<h3 style="margin:0 0 15px;font-size:16px;color:#333;text-transform:uppercase;letter-spacing:1px;font-weight:900;">New Plan Details</h3>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Treatment:</strong> ${product_name}</p>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Schedule:</strong> ${plan_label}</p>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Activation:</strong> ${nextBilling}</p>
</div>

${providerHtml}

<p style="font-size:14px;color:#555555;margin-bottom:25px;">
Your next shipment will include the updated dosage. No additional charge is required today.
</p>

<p style="text-align:center;margin:30px 0;">
<a href="https://quiz.americahealthsolutions.com/dashboard"
style="background:#000000;color:#ffffff;padding:16px 36px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:17px;display:inline-block;">
Go to My Dashboard
</a>
</p>

<p style="font-size:14px;color:#777777;margin-bottom:0;">
Thank you,<br><strong>The uGlowMD Medical Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:25px 40px;background:#fafafa;border-top:1px solid #eeeeee;">

<p style="font-size:12px;color:#999999;margin:0;">
© ${new Date().getFullYear()} uGlowMD. All rights reserved.
</p>

<p style="font-size:12px;color:#aaaaaa;margin-top:8px;">
End-to-End Encryption • HIPAA Secure Environment
</p>

</td>
</tr>

</table>

<p style="margin-top:25px;font-size:12px;color:#aaaaaa;text-align:center;">
Secure HIPAA Compliant Communication
</p>

</td>
</tr>
</table>

</body>
</html>`;

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
                        from: { email: MAILER_FROM, name: "uGlowMD" },
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

            // 1. Charge today's amount (Initial Plan Cost)
            const paymentIntentPrimary = await stripe.paymentIntents.create({
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
                    duration: `${plan_duration_months} months`,
                },
            });

            if (paymentIntentPrimary.status !== "succeeded") {
                return new Response("Initial payment failed", {
                    status: 500,
                    headers: { "Access-Control-Allow-Origin": "*" },
                });
            }

            // 2. Create the recurring price
            const recurringPrice = await stripe.prices.create({
                unit_amount: real_price ?? product_price,
                currency: "usd",
                recurring: {
                    interval: "month",
                    interval_count: plan_duration_months
                },
                product_data: {
                    name: `${product_name} – ${plan_label}`
                },
            });

            // 3. Subscription starts now, but next charge is after plan_duration_months
            const trialEndDate = new Date();
            trialEndDate.setMonth(trialEndDate.getMonth() + plan_duration_months);
            const trialEnd = Math.floor(trialEndDate.getTime() / 1000);

            const subscription = await stripe.subscriptions.create({
                customer: stripe_customer_id,
                default_payment_method: stripe_payment_method_id,
                items: [{ price: recurringPrice.id }],
                collection_method: "charge_automatically",
                trial_end: trialEnd,
                metadata: {
                    user_id: userId,
                    form_submission_id,
                    product_name,
                    product_category,
                    category: category_slug,
                    shipping_address: JSON.stringify(shipping_address),
                    plan_type: plan_label
                },
                description: `${product_name} (${product_category}) - ${plan_label}`,
            });

            if (subscription.status === "incomplete") throw Error("Subscription incomplete (insufficient funds)");

            // 4. Update Database: Create only ONE order regardless of duration
            const dateIso = new Date().toISOString();
            const nextDeliveryDates = [];
            for (let i = 1; i < plan_duration_months; i++) {
                const scheduledDate = new Date();
                scheduledDate.setMonth(scheduledDate.getMonth() + i);
                nextDeliveryDates.push(scheduledDate.toISOString());
            }

            const ordersToCreate = [{
                user_id: userId,
                drug_name: product_name,
                drug_price: product_price / 100,
                shipping_address,
                payment_status: "completed",
                delivery_status: final_delivery_status,
                form_submission_id,
                approving_provider_id: approving_provider_id || null,
                created_at: dateIso,
            }];

            const { data: orders, error: ordersError } = await supabase
                .from("orders")
                .insert(ordersToCreate)
                .select("id");

            if (ordersError) {
                console.error("Order creation failed:", ordersError);
            }

            // 5. Update Profile
            const { data: latestProfile } = await supabase.from("profiles").select("current_plan, stripe_subscription_id, subscription_status").eq("id", userId).single();

            let currentPlans: any = {};
            if (latestProfile?.current_plan) {
                try {
                    currentPlans = typeof latestProfile.current_plan === 'string' ? JSON.parse(latestProfile.current_plan) : latestProfile.current_plan;
                } catch {
                    currentPlans = {};
                }
            }
            currentPlans[category_slug] = {
                enddate: trialEndDate.toISOString(),
                Nextdelivery: nextDeliveryDates,
                name: product_name,
                type: plan_label,
                price: (product_price / 100).toFixed(2)
            };

            let subMapNew: any = {};
            try {
                const currentVal = latestProfile?.stripe_subscription_id || '';
                if (currentVal.startsWith('sub_')) {
                    subMapNew = { 'weight_loss': currentVal };
                } else if (currentVal) {
                    subMapNew = JSON.parse(currentVal);
                }
            } catch { }
            subMapNew[category_slug] = subscription.id;

            let statusMapNew: any = {};
            try {
                const currentStatus = latestProfile?.subscription_status;
                if (currentStatus === true || currentStatus === 'true' || (typeof currentStatus === 'string' && !currentStatus.startsWith('{'))) {
                    statusMapNew = { 'weight_loss': true };
                } else if (currentStatus) {
                    if (typeof currentStatus === 'object') statusMapNew = currentStatus;
                    else statusMapNew = JSON.parse(currentStatus);
                }
            } catch { }
            statusMapNew[category_slug] = true;

            await supabase
                .from("profiles")
                .update({
                    stripe_subscription_id: JSON.stringify(subMapNew),
                    subscription_status: JSON.stringify(statusMapNew),
                    subscribe_status: true,
                    current_plan: JSON.stringify(currentPlans),
                    current_sub_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
                })
                .eq("id", userId);

            // 6. Approve Form
            await supabase
                .from("form_submissions")
                .update({
                    approval_status: "approved",
                    stripe_subscription_id: subscription.id
                })
                .eq("id", form_submission_id);

            // 7. Send Email
            const amount = (product_price / 100).toFixed(2);
            const nextDateLabel = new Date(subscription.current_period_end * 1000).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            });

            const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your uGlowMD ${plan_label} Plan is Active!</title>
</head>

<body style="margin:0;padding:0;background-color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 15px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,0.05);">

<!-- Header -->
<tr style="background:#000000">
<td align="center" style="padding:7px;border-bottom:1px solid #eeeeee;">
    
<span style="padding:7px 7px;border-radius:8px;display:inline-block;">
<img src="https://glp-glow-update-xwxw.vercel.app/assets/logo-oeJLxYFy.png"
alt="uGlowMD"
style="height:160px;width:auto;display:block;">
</span>

</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px 40px 20px 40px;">

<h2 style="margin-top:0;margin-bottom:20px;font-size:24px;color:#1a1a1a;font-weight:800;">
Success! Welcome to uGlowMD.
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${first_name},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Your <strong>${plan_label}</strong> protocol for <strong>${product_name}</strong> is now <strong>active</strong>. Your first supply will ship in 3–5 business days. Subsequent medication is covered under your ${plan_duration_months}-month plan.
</p>

<div style="background:#f8f9fa;padding:25px;border-radius:15px;margin:25px 0;border:1px solid #eee;text-align:left;">
<h3 style="margin:0 0 15px;font-size:16px;color:#333;text-transform:uppercase;letter-spacing:1px;font-weight:900;">Order Summary</h3>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Total Charged:</strong> $${amount}</p>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Next Delivery:</strong> ${nextDateLabel}</p>
</div>

${providerHtml}

<p style="text-align:center;margin:30px 0;">
<a href="https://quiz.americahealthsolutions.com/dashboard"
style="background:#000000;color:#ffffff;padding:14px 40px;text-decoration:none;border-radius:12px;font-weight:bold;font-size:18px;display:inline-block;">
Go to Dashboard
</a>
</p>

<p style="font-size:14px;color:#777777;margin-bottom:0;">
Best regards,<br>
<strong>The uGlowMD Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:25px 40px;background:#fafafa;border-top:1px solid #eeeeee;">

<p style="font-size:12px;color:#999999;margin:0;">
© ${new Date().getFullYear()} uGlowMD. All rights reserved.
</p>

<p style="font-size:12px;color:#aaaaaa;margin-top:8px;">
End-to-End Encryption • HIPAA Secure Environment
</p>

</td>
</tr>

</table>

<p style="margin-top:25px;font-size:12px;color:#aaaaaa;text-align:center;">
Secure HIPAA Compliant Communication
</p>

</td>
</tr>
</table>

</body>
</html>`;

            if (SENDGRID_API_KEY) {
                await fetch("https://api.sendgrid.com/v3/mail/send", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${SENDGRID_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        personalizations: [{ to: [{ email }] }],
                        from: { email: MAILER_FROM, name: "uGlowMD" },
                        subject: `Your ${plan_label} uGlowMD Subscription is Active!`,
                        content: [{ type: "text/html", value: html }],
                    }),
                });
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message: `Subscription activated for ${plan_label} plan!`,
                    subscription_id: subscription.id,
                    orders_created: ordersToCreate.length,
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
            console.error("Subscription process failed:", error);
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
