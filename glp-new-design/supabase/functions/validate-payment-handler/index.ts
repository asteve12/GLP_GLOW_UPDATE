import Stripe from "npm:stripe@15.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.33.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, stripe-signature"
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const MAILER_FROM = Deno.env.get("MAILER_FROM") || "ahs@americahealthsolutions.com";

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing required environment variables");
        return new Response("Server configuration error", { status: 500 });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const bodyUint8 = new Uint8Array(await req.arrayBuffer());
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return new Response("Missing stripe-signature header", { status: 400 });
    }

    // --- Helper Functions ---
    function safePlain(text: string, name: string): string {
        if (text && text.trim().length > 0) return text.trim();
        return `Hi ${name.split(" ")[0] || "there"}, this is an important update from uGlowMD.`;
    }

    async function sendEmailSendGrid(apiKey: string, fromEmail: string, toEmail: string, subject: string, plainText: string, html: string) {
        const payload = {
            personalizations: [{ to: [{ email: toEmail }] }],
            from: { email: fromEmail, name: "uGlowMD" },
            subject,
            content: [
                { type: "text/plain", value: plainText },
                { type: "text/html", value: html }
            ]
        };
        const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            throw new Error(`SendGrid send failed: ${resp.status} ${text}`);
        }
        return true;
    }

    async function handlePaymentFailed(event: any) {
        const invoice = event.data.object;
        const customerEmail = invoice.customer_email;
        const userId = invoice.subscription_details?.metadata?.user_id || invoice.metadata?.user_id;

        // Find user by email if ID is missing (backup)
        let finalUserId = userId;
        if (!finalUserId && customerEmail) {
            const { data } = await supabase.from('profiles').select('id').eq('email', customerEmail).single();
            finalUserId = data?.id;
        }

        if (!finalUserId) return;

        const periodStart = new Date(invoice.lines.data[0]?.period?.start * 1000).toISOString();
        const periodEnd = new Date(invoice.lines.data[0]?.period?.end * 1000).toISOString();
        const productName = invoice.lines.data[0]?.metadata?.product_name || 'Unknown Product';

        try {
            await supabase.from('billing_history').insert({
                user_id: finalUserId,
                invoice_id: invoice.id,
                amount: invoice.amount_due / 100,
                currency: invoice.currency,
                description: `Failed subscription for ${productName}`,
                billing_date: new Date(invoice.created * 1000).toISOString(),
                status: false,
                recurring: true,
                start: periodStart,
                end: periodEnd
            });

            await supabase.from('profiles').update({
                payment_failed: true,
                last_payment_failure: new Date().toISOString()
            }).eq('id', finalUserId);
        } catch (error) {
            console.error('Error handling payment failure:', error);
        }
    }

    async function handleSubscriptionEvent(event: any, isInitial: boolean) {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        // Fetch full subscription to get metadata
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.user_id;

        if (!userId) {
            console.error("No user_id found in subscription metadata", subscriptionId);
            return;
        }

        const periodStart = new Date(invoice.lines.data[0]?.period?.start * 1000).toISOString();
        const periodEnd = new Date(invoice.lines.data[0]?.period?.end * 1000).toISOString();
        const productName = subscription.metadata?.product_name || invoice.lines.data[0]?.metadata?.product_name || 'uGlowMD Program';
        const categorySlug = subscription.metadata?.category || 'weight_loss';
        const planType = subscription.metadata?.plan_type || 'Monthly';
        const formSubmissionId = subscription.metadata?.form_submission_id;

        // 1. Log Billing History
        await supabase.from('billing_history').insert({
            user_id: userId,
            invoice_id: invoice.id,
            amount: invoice.amount_due / 100,
            currency: invoice.currency,
            description: `${isInitial ? 'Initial' : 'Renewal'} Subscription for ${productName}`,
            billing_date: new Date(invoice.created * 1000).toISOString(),
            status: invoice.status === 'paid',
            recurring: true,
            start: periodStart,
            end: periodEnd
        });

        // 2. Handle Orders for multi-month plans
        const planDurationMonths = planType.includes('6') ? 6 : (planType.includes('3') ? 3 : 1);
        const nextDeliveryDates = [];
        const ordersToCreate = [];

        const shippingAddressStr = subscription.metadata?.shipping_address || '{}';
        let shippingAddress = {};
        try { shippingAddress = JSON.parse(shippingAddressStr); } catch { }

        for (let i = 0; i < planDurationMonths; i++) {
            const scheduledDate = new Date();
            scheduledDate.setMonth(scheduledDate.getMonth() + i);
            const dateIso = scheduledDate.toISOString();

            if (i > 0) nextDeliveryDates.push(dateIso);

            ordersToCreate.push({
                user_id: userId,
                form_submission_id: formSubmissionId,
                drug_name: planDurationMonths > 1 ? `${productName} (Month ${i + 1} of ${planDurationMonths})` : productName,
                drug_price: (invoice.amount_paid / planDurationMonths) / 100,
                shipping_address: shippingAddress,
                payment_status: 'completed',
                delivery_status: i === 0 ? 'in transit' : 'pending',
                is_renewal: !isInitial,
                created_at: dateIso
            });
        }

        // Look up the approving provider from the form submission
        let approving_provider_id: string | null = null;
        if (formSubmissionId) {
            const { data: submissionData } = await supabase
                .from('form_submissions')
                .select('assigned_provider_id')
                .eq('id', formSubmissionId)
                .maybeSingle();
            approving_provider_id = submissionData?.assigned_provider_id || null;
        }

        if (ordersToCreate.length > 0) {
            // Attach approving_provider_id to every order row
            const ordersWithProvider = ordersToCreate.map((o: any) => ({
                ...o,
                approving_provider_id,
            }));
            await supabase.from('orders').insert(ordersWithProvider);
        }


        // 3. Update Profile with NEW COMPLEX STRUCTURE
        const { data: profile } = await supabase.from('profiles').select('current_plan').eq('id', userId).single();
        let currentPlans: any = {};
        try {
            currentPlans = typeof profile?.current_plan === 'string' ? JSON.parse(profile.current_plan) : (profile?.current_plan || {});
            // Fix double stringification if present
            if (typeof currentPlans === 'string') currentPlans = JSON.parse(currentPlans);
        } catch { }

        // THE IMPROVED STRUCTURE
        currentPlans[categorySlug] = {
            enddate: periodEnd,
            Nextdelivery: nextDeliveryDates,
            name: productName,
            type: planType
        };

        await supabase.from('profiles').update({
            current_plan: JSON.stringify(currentPlans),
            current_sub_end_date: periodEnd,
            subscribe_status: true,
            subscription_status: subscription.status
        }).eq('id', userId);

        // 4. Send Email
        const { data: userData } = await supabase.from('profiles').select('email, first_name, last_name').eq('id', userId).single();
        if (userData?.email) {
            const year = new Date().getFullYear();
            const emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Subscription ${isInitial ? 'Activated' : 'Renewed'}!</title>
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
Subscription ${isInitial ? 'Activated' : 'Renewed'}!
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${userData.first_name},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Your <strong>${productName}</strong> program is active. Your next billing date is ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}. Thank you for choosing uGlowMD!
</p>

<p style="text-align:center;margin:30px 0;">
<a href="https://quiz.americahealthsolutions.com/dashboard"
style="background:#000000;color:#ffffff;padding:14px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
Go to Dashboard
</a>
</p>

<p style="font-size:14px;color:#555555;margin-bottom:25px;">
You can manage your subscription and view your progress anytime from your dashboard.
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
© ${year} uGlowMD. All rights reserved.
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

            await sendEmailSendGrid(
                SENDGRID_API_KEY,
                MAILER_FROM,
                userData.email,
                `uGlowMD: Subscription ${isInitial ? 'Activation' : 'Renewal'} Success`,
                safePlain(`Your ${productName} subscription has been ${isInitial ? 'activated' : 'renewed'}.`, userData.first_name),
                emailHtml
            );
        }
    }

    async function handleChargeEvent(event: any) {
        const charge = event.data.object;
        const amountInCents = charge.amount;
        const status = charge.status;
        const userId = charge.metadata?.user_id;

        if (!userId) return;

        try {
            const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
            if (!profile) return;

            // Log Billing History
            await supabase.from("billing_history").insert({
                user_id: userId,
                invoice_id: charge.payment_intent || charge.id,
                amount: amountInCents / 100,
                currency: charge.currency,
                description: charge.description || "General Payment",
                billing_date: new Date(charge.created * 1000).toISOString(),
                status: status === "succeeded",
                recurring: false,
                start: new Date(charge.created * 1000).toISOString(),
                end: null
            });

            if (status === "succeeded") {
                const lastFour = charge.payment_method_details?.card?.last4 || "XXXX";
                const cardBrand = (charge.payment_method_details?.card?.network || "card").toUpperCase();

                const updatePayload: any = {
                    last_four_digits_of_card: lastFour,
                    card_name: cardBrand,
                    current_payment_type: charge.payment_method_details?.card?.type
                };

                // Check for eligibility fee payment
                if (charge.metadata?.type === 'eligibility_verification') {
                    updatePayload.eligibility_fee_paid = true;

                    // Send Email
                    const category = charge.metadata?.product_category || "General Consultation";
                    const firstName = profile.first_name || "Valued Member";
                    const email = profile.email;

                    if (email) {
                        const amount = (charge.amount / 100).toFixed(2);
                        const year = new Date().getFullYear();
                        const emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Consultation Fee Received</title>
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
Consultation Fee Received
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${firstName},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Your eligibility verification payment for the <strong>${category}</strong> program has been successfully processed.
</p>

<!-- Payment Box -->
<div style="background:#f8f9fa;padding:25px;border-radius:15px;margin:25px 0;border:1px solid #eee;text-align:center;">
<span style="font-size:14px;color:#555555;display:block;margin-bottom:5px;font-weight:600;">AMOUNT PAID</span>
<span style="font-size:24px;font-weight:800;color:#111111;">
$${amount}
</span>
<span style="font-size:12px;color:#666;display:block;margin-top:5px;">${cardBrand} •••• ${lastFour}</span>
</div>

<p style="font-size:14px;color:#555555;margin-bottom:25px;">
Our clinical team has been notified and is currently reviewing your assessment details. You will receive an update regarding your clinical approval shortly.
</p>

<p style="text-align:center;margin:30px 0;">
<a href="https://quiz.americahealthsolutions.com/dashboard"
style="background:#000000;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
Go to Dashboard
</a>
</p>

<p style="font-size:14px;color:#777777;margin-bottom:0;">
Thank you for choosing uGlowMD!<br>
<strong>The uGlowMD Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:25px 40px;background:#fafafa;border-top:1px solid #eeeeee;">

<p style="font-size:12px;color:#999999;margin:0;">
© ${year} uGlowMD. All rights reserved.
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

                        await sendEmailSendGrid(
                            SENDGRID_API_KEY,
                            MAILER_FROM,
                            email,
                            `uGlowMD: Consultation Fee Received - ${category}`,
                            safePlain(`Your payment of $${amount} for ${category} has been received.`, firstName),
                            emailHtml
                        ).catch(err => console.error("Error sending eligibility email:", err));
                    }
                }

                await supabase.from("profiles").update(updatePayload).eq("id", userId);
            }
        } catch (e) {
            console.error("handleChargeEvent error:", e);
        }
    }

    // --- Main Event Construction ---
    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(bodyUint8, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
        console.warn("Stripe webhook verification failed:", err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // --- Event Routing ---
    const background = (async () => {
        try {
            console.log("Processing event:", event.type);

            if (event.type === "invoice.payment_succeeded") {
                const invoice = event.data.object;

                // Idempotency check using custom table
                if (invoice.id) {
                    const { error } = await supabase.from("stripe_webhook_events").insert({ id: invoice.id });
                    if (error) {
                        console.log("Invoice already processed:", invoice.id);
                        return;
                    }
                }

                const isInitial = invoice.billing_reason === "subscription_create";
                await handleSubscriptionEvent(event, isInitial);
            }
            else if (event.type === "invoice.payment_failed") {
                await handlePaymentFailed(event);
            }
            else if (event.type === "charge.succeeded" || event.type === "charge.failed") {
                await handleChargeEvent(event);
            }
            else if (event.type === "customer.subscription.deleted") {
                const sub = event.data.object;
                const userId = sub.metadata?.user_id;
                if (userId) {
                    await supabase.from("profiles").update({
                        subscribe_status: false,
                        subscription_status: 'canceled'
                    }).eq("id", userId);
                }
            }
        } catch (e) {
            console.error("Background processing exception:", e);
        }
    })();

    // Keep function alive in Deno/Edge runtime
    if (typeof globalThis.EdgeRuntime?.waitUntil === "function") {
        globalThis.EdgeRuntime.waitUntil(background);
    } else {
        background.catch(e => console.error("Background task failed:", e));
    }

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
});
