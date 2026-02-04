import Stripe from "npm:stripe@15.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.33.0";

// --- SendGrid helper ---
async function sendEmailSendGrid(apiKey: string, fromEmail: string, toEmail: string, subject: string, plainText: string, html: string) {
    const payload = {
        personalizations: [
            {
                to: [
                    {
                        email: toEmail
                    }
                ]
            }
        ],
        from: {
            email: fromEmail,
            name: "GLP-GLOW"
        },
        subject,
        content: [
            {
                type: "text/plain",
                value: plainText
            },
            {
                type: "text/html",
                value: html
            }
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

// Never lets SendGrid get empty plain text
function safePlain(text: string, name: string): string {
    if (text && text.trim().length > 0) return text.trim();
    return `Hi ${name.split(" ")[0] || "there"}, this is an important update from GLP-GLOW.`;
}

Deno.serve(async (req) => {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", {
            status: 405
        });
    }

    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const MAILER_FROM = Deno.env.get("MAILER_FROM") || "ahs@americahealthsolutions.com";

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing required environment variables");
        return new Response("Server configuration error", {
            status: 500
        });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16"
    });
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const bodyUint8 = new Uint8Array(await req.arrayBuffer());
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        console.warn("Missing stripe-signature header");
        return new Response("Missing signature", {
            status: 400
        });
    }

    // --- Handlers ---

    async function handlePaymentFailed(event: any) {
        const invoice = event.data.object;
        const userId = invoice?.parent?.subscription_details?.metadata?.user_id || invoice?.subscription_details?.metadata?.user_id;
        if (!userId) return;

        const invoiceId = invoice.id;
        const amountInCents = invoice.amount_due;
        const currency = invoice.currency;
        const lineItem = invoice.lines.data[0];
        if (!lineItem) throw new Error("No line items");

        const periodStart = new Date(lineItem.period.start * 1000).toISOString();
        const periodEnd = new Date(lineItem.period.end * 1000).toISOString();
        const status = false;
        const productName = lineItem.metadata?.product_name || 'Unknown Product';

        try {
            const { error } = await supabase.from('billing_history').insert({
                user_id: userId,
                invoice_id: invoiceId,
                amount: amountInCents / 100,
                currency: currency,
                description: `Failed subscription for ${productName}`,
                billing_date: new Date(invoice.created * 1000).toISOString(),
                status: status,
                recurring: true,
                start: periodStart,
                end: periodEnd
            });
            if (error) throw error;
            console.log('Failed payment processed and billing history record created successfully');
        } catch (error) {
            console.error('Error creating billing history for failed payment:', error);
            throw error;
        }
    }

    async function handleSubscriptionCreate(event: any) {
        const invoice = event.data.object;
        const userId = invoice?.parent?.subscription_details?.metadata?.user_id || invoice?.subscription_details?.metadata?.user_id;
        if (!userId) return;

        const invoiceId = invoice.id;
        const amountInCents = invoice.amount_due;
        const currency = invoice.currency;
        const lineItem = invoice.lines.data[0];
        if (!lineItem) throw new Error("No line items");

        const periodStart = new Date(lineItem.period.start * 1000).toISOString();
        const periodEnd = new Date(lineItem.period.end * 1000).toISOString();
        const status = invoice.status;
        const productName = lineItem.metadata?.product_name || 'Unknown Product';

        try {
            const { error } = await supabase.from('billing_history').insert({
                user_id: userId,
                invoice_id: invoiceId,
                amount: amountInCents / 100,
                currency: currency,
                description: `Subscription for ${productName}`,
                billing_date: new Date(invoice.created * 1000).toISOString(),
                status: status === 'paid',
                recurring: true,
                start: periodStart,
                end: periodEnd
            });
            if (error) throw error;

            const { error: profileError } = await supabase.from('profiles').update({
                current_sub_end_date: periodEnd
            }).eq('id', userId);
            if (profileError) throw profileError;

            console.log('New subscription invoice processed successfully');
        } catch (error) {
            console.error('Error processing subscription invoice:', error);
            throw error;
        }
    }

    async function handleChargeEvent(event: any) {
        const charge = event.data.object;
        const amountInCents = charge.amount;
        const currency = charge.currency?.toLowerCase();
        const status = charge.status;
        const userId = charge.metadata?.user_id;

        if (!userId) {
            console.warn("Charge event missing user_id:", charge.id);
            return;
        }

        const lastFour = charge.payment_method_details?.card?.last4 || "XXXX";
        const cardBrand = (charge.payment_method_details?.card?.network || "card").toUpperCase();
        const chargeDate = new Date(charge.created * 1000).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });

        try {
            const { data: profile } = await supabase
                .from("profiles")
                .select("first_name, last_name, email, current_plan")
                .eq("id", userId)
                .single();

            if (!profile?.email) return;
            const { first_name, last_name, email, current_plan } = profile;

            // Dosage Change Fee or Eligibility Fee
            if ((amountInCents === 500 || amountInCents === 2500) && currency === "usd") {
                const isDosageFee = amountInCents === 500;
                const description = isDosageFee ? "Dosage change request fee" : "Eligibility verification charge";

                await supabase.from("billing_history").insert({
                    user_id: userId,
                    invoice_id: charge.payment_intent || charge.id,
                    amount: amountInCents / 100,
                    currency: "usd",
                    description: description,
                    billing_date: new Date(charge.created * 1000).toISOString(),
                    status: status === "succeeded",
                    recurring: false,
                    start: new Date(charge.created * 1000).toISOString(),
                    end: null,
                });

                await supabase.from("profiles").update({
                    current_payment_type: charge.payment_method_details?.card?.type,
                    last_four_digits_of_card: lastFour,
                    card_name: cardBrand,
                }).eq("id", userId);

                if (status === "succeeded") {
                    const subject = isDosageFee ? "$5 Dosage Change Fee – GLP-GLOW" : "Receipt – GLP-GLOW Eligibility Payment";
                    const html = isDosageFee ? `
            <html><body><h1>Payment Successful!</h1><p>Hi ${first_name}, your $5 dosage change request fee has been processed.</p></body></html>
           ` : `
            <html><body><h1>Payment Successful!</h1><p>Dear ${first_name} ${last_name}, your $25 eligibility verification fee has been charged.</p></body></html>
           `;
                    if (SENDGRID_API_KEY) {
                        await sendEmailSendGrid(SENDGRID_API_KEY, MAILER_FROM, email, subject, safePlain(`Your payment of $${amountInCents / 100} was successful.`, first_name), html);
                    }
                } else if (status === "failed") {
                    const subject = isDosageFee ? "We couldn't process your $5 dosage change fee" : "GLP-GLOW: Quick Update Needed for Your Eligibility";
                    const html = `<html><body><h1>Payment Failed</h1><p>Hi ${first_name}, we were unable to process your payment. Please update your card.</p></body></html>`;
                    if (SENDGRID_API_KEY) {
                        await sendEmailSendGrid(SENDGRID_API_KEY, MAILER_FROM, email, subject, safePlain(`Your payment of $${amountInCents / 100} failed.`, first_name), html);
                    }
                }
            }

            // Subscription Renewal Failure
            if (status === "failed" && amountInCents > 2500) {
                await supabase.from("billing_history").insert({
                    user_id: userId,
                    invoice_id: charge.payment_intent || charge.id,
                    amount: amountInCents / 100,
                    currency: "usd",
                    description: `Failed renewal – ${current_plan || "Monthly Plan"}`,
                    billing_date: new Date(charge.created * 1000).toISOString(),
                    status: false,
                    recurring: true,
                });

                await supabase.from("profiles").update({
                    payment_failed: true,
                    last_payment_failure: new Date().toISOString()
                }).eq("id", userId);

                const html = `<html><body><h1>Payment Failed</h1><p>Hey ${first_name}, we were not able to charge you for your subscription renewal.</p></body></html>`;
                if (SENDGRID_API_KEY) {
                    await sendEmailSendGrid(SENDGRID_API_KEY, MAILER_FROM, email, "Action Required: Payment Failed", safePlain(`Your subscription renewal failed.`, first_name), html);
                }
            }
        } catch (error) {
            console.error("Error in handleChargeEvent:", error);
        }
    }

    // --- Main Logic ---

    let event;
    try {
        event = await stripe.webhooks.constructEventAsync(bodyUint8, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
        console.warn("Stripe webhook signature verification failed:", err?.message);
        return new Response(`Webhook Error: ${err?.message}`, { status: 400 });
    }

    try {
        console.log("Processing event:", event.type);

        if (event.type === "charge.succeeded" || event.type === "charge.failed") {
            await handleChargeEvent(event);
        } else if (event.type === "invoice.payment_succeeded") {
            const invoice = event.data.object;
            if (invoice.billing_reason === "subscription_create") {
                await handleSubscriptionCreate(event);
            } else {
                // Renewal logic
                const subscriptionId = invoice.subscription;
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const userId = subscription.metadata?.user_id;
                if (userId) {
                    const { data: lastOrder } = await supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single();
                    await supabase.from("orders").insert({
                        user_id: userId,
                        drug_name: subscription.metadata?.previous_plan || "Monthly Subscription",
                        drug_price: invoice.amount_paid / 100,
                        shipping_address: lastOrder?.shipping_address || "Same as previous",
                        form_submission_id: lastOrder?.form_submission_id,
                        payment_status: "completed",
                        delivery_status: "pending",
                        is_renewal: true
                    });
                    await handleSubscriptionCreate(event);
                    // Send renewal email
                    const { data: profile } = await supabase.from("profiles").select("email, first_name").eq("id", userId).single();
                    if (profile?.email && SENDGRID_API_KEY) {
                        await sendEmailSendGrid(SENDGRID_API_KEY, MAILER_FROM, profile.email, "Your GLP-GLOW Subscription Has Been Renewed", safePlain("Your subscription was renewed.", profile.first_name), "<html><body><h1>Subscription Renewed</h1></body></html>");
                    }
                }
            }
        } else if (event.type === "invoice.payment_failed") {
            await handlePaymentFailed(event);
        } else if (event.type === "customer.subscription.deleted") {
            const subscription = event.data.object;
            const userId = subscription.metadata?.user_id;
            if (userId) {
                await supabase.from("profiles").update({ subscribe_status: false }).eq("id", userId);
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (err: any) {
        console.error("Handler error:", err);
        return new Response(`Handler error: ${err?.message}`, { status: 500 });
    }
});
