// renew-subscription.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// ── CLIENTS ───────────────────────────────────────────────────────────
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16"
});

const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: corsHeaders
        });
    }

    try {
        const { user_id, stripe_subscription_id } = await req.json();

        if (!user_id || !stripe_subscription_id) {
            throw new Error("Missing user_id or stripe_subscription_id");
        }

        console.log("Renewing subscription for user:", user_id, "sub:", stripe_subscription_id);

        // ── 1. FETCH PROFILE FROM SUPABASE ───────────────────────────────
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("stripe_customer_id, stripe_payment_method_id, email, first_name, last_name")
            .eq("id", user_id)
            .single();

        if (profileError || !profile) throw new Error("Profile not found");
        if (!profile.stripe_customer_id || !profile.stripe_payment_method_id) {
            throw new Error("No saved payment method");
        }

        const { stripe_customer_id, stripe_payment_method_id, email: customer_email } = profile;

        // ── 2. REACTIVATE CANCELED SUBSCRIPTION ──────────────────────────
        const subscription = await stripe.subscriptions.update(stripe_subscription_id, {
            cancel_at_period_end: false,
            proration_behavior: 'none',
            collection_method: "charge_automatically",
            default_payment_method: stripe_payment_method_id,
            expand: [
                "latest_invoice.payment_intent"
            ]
        });

        // ── 3. AUTO-CHARGE IF INVOICE IS OPEN ────────────────────────────
        const invoice = subscription.latest_invoice;
        let invoicePaid = false;

        if (invoice?.status === "open") {
            try {
                const paid = await stripe.invoices.pay(invoice.id, {
                    payment_method: stripe_payment_method_id
                });
                invoicePaid = paid.status === "paid";
                console.log("Renewal invoice paid:", paid.id);
            } catch (err) {
                console.warn("Failed to pay renewal invoice:", err.message);
                // Continue — Stripe will retry
            }
        }

        // ── 4. UPDATE SUPABASE PROFILE ───────────────────────────────────
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                subscribe_status: true,
                current_plan: subscription.items.data[0]?.price?.metadata?.product_name || "Reactivated Plan",
                updated_at: new Date().toISOString()
            })
            .eq("id", user_id);

        if (updateError) throw new Error(`Profile update failed: ${updateError.message}`);

        // ── 5. SEND RENEWAL EMAIL (optional) ─────────────────────────────
        const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
        const MAILER_FROM = Deno.env.get("MAILER_FROM");

        if (SENDGRID_API_KEY && MAILER_FROM && customer_email) {
            const fullName = `${profile.first_name} ${profile.last_name}`.trim() || "Customer";
            const price = (subscription.items.data[0]?.price?.unit_amount || 0) / 100;
            const nextBilling = new Date(subscription.current_period_end * 1000).toLocaleDateString();

            const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your uGlowMD Plan is Active!</title>
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
Success! Your Plan is Active.
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${fullName},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Your subscription has been successfully <strong>reactivated</strong>. Your next billing date is ${nextBilling}. Thank you for choosing uGlowMD!
</p>

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
© ${new Date().getFullYear()} All rights reserved.
</p>

<p style="font-size:12px;color:#aaaaaa;margin-top:8px;">
End-to-End Encryption • HIPAA Secure Environment
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;

            const plainText = `Hi ${fullName},\n\nYour subscription has been reactivated. Next charge: $${price.toFixed(2)} on ${nextBilling}.\n\nThank you,\nuGlowMD Team`;

            const sendPromise = fetch("https://api.sendgrid.com/v3/mail/send", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${SENDGRID_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    personalizations: [
                        {
                            to: [
                                {
                                    email: customer_email
                                }
                            ]
                        }
                    ],
                    from: {
                        email: MAILER_FROM,
                        name: "uGlowMD"
                    },
                    subject: "Your Subscription is Back On! – uGlowMD",
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
                })
            }).then((r) => r.ok ? true : r.text().then((t) => {
                throw new Error(t);
            }));

            // @ts-ignore – Edge runtime
            if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
                // @ts-ignore
                EdgeRuntime.waitUntil(sendPromise);
            }
        }

        // ── SUCCESS RESPONSE ─────────────────────────────────────────────
        return new Response(JSON.stringify({
            success: true,
            subscription: subscription.id,
            status: subscription.status,
            invoice_paid: invoicePaid,
            message: "Subscription renewed and charged (if applicable)"
        }), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });
    } catch (err: any) {
        console.error("Renew subscription failed:", err);
        return new Response(JSON.stringify({
            error: err.message || "Unknown error"
        }), {
            status: 400,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });
    }
});
