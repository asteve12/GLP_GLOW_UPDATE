// send-uglowmd-renewal-reminder.ts
// Daily cron: sends renewal reminder 3 days before subscription ends
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const MAILER_FROM = "ahs@americahealthsolutions.com"; // ← Verified in SendGrid
const QUESTIONNAIRE_URL = "https://quiz.americahealthsolutions.com/questionnaire";
const DASHBOARD_URL = "https://quiz.americahealthsolutions.com/dashboard";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SENDGRID_API_KEY) {
    throw new Error("Missing required environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async () => {
    try {
        // 3 days from today — full day range in UTC
        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);
        const threeDaysFromNow = new Date(now);
        threeDaysFromNow.setUTCDate(now.getUTCDate() + 3);
        const startOfDay = threeDaysFromNow.toISOString();

        const endOfDay = new Date(threeDaysFromNow);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const endOfDayStr = endOfDay.toISOString();

        console.log(`Checking renewals ending on: ${startOfDay.split("T")[0]}`);

        const { data: billingRows, error: billingError } = await supabase
            .from("billing_history")
            .select("user_id")
            .gte("end", startOfDay)
            .lte("end", endOfDayStr);

        if (billingError) throw billingError;

        if (!billingRows?.length) {
            console.log("No renewals in 3 days — exiting.");
            return new Response("No emails to send", {
                status: 200
            });
        }

        const userIds = [...new Set(billingRows.map((r) => r.user_id))];

        const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, email, first_name")
            .in("id", userIds)
            .not("email", "is", null);

        if (profileError) throw profileError;

        if (!profiles?.length) {
            console.log("No valid profiles found.");
            return new Response("No users to email", {
                status: 200
            });
        }

        console.log(`Sending renewal reminder to ${profiles.length} users`);

        const sendPromises = profiles.map(async (profile) => {
            const firstName = profile.first_name?.trim() || "there";
            const email = profile.email;
            const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Renewal Reminder</title>
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
Renewal Check-In
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${firstName},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Your medication renews in <strong>3 days</strong> — we don’t want any gaps in your progress! Can you spare <strong>60 seconds</strong> to answer 3 quick questions? It helps us make your next month even better.
</p>

<p style="text-align:center;margin:30px 0;">
<a href="${QUESTIONNAIRE_URL}"
style="background:#000000;color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:12px;font-weight:bold;font-size:18px;display:inline-block;">
Answer 3 Quick Questions → 60 Seconds
</a>
</p>

<p style="font-size:14px;color:#555555;margin-bottom:25px;">
We'll check in on your progress, current weight, and if you're happy with your dosage. If not, we'll help you request a change right away.
</p>

<p style="font-size:14px;color:#777777;margin-bottom:0;">
Thank you for trusting us with your journey!<br>
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
            const text = `Hi ${firstName},

Your uGlowMD renewal is in 3 days!

Take 60 seconds to answer 3 quick questions:
${QUESTIONNAIRE_URL}

This helps us support you better and avoid any gaps in treatment.

Thank you,
The uGlowMD Team

Dashboard: ${DASHBOARD_URL}`;
            const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
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
                                    email: email
                                }
                            ],
                            subject: `${firstName}, your uGlowMD renewal is in 3 days — quick check-in?`
                        }
                    ],
                    from: {
                        email: MAILER_FROM,
                        name: "uGlowMD"
                    },
                    content: [
                        {
                            type: "text/plain",
                            value: text
                        },
                        {
                            type: "text/html",
                            value: html
                        }
                    ]
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`SendGrid rejected email to ${email}:`, response.status, errorText);
                throw new Error(`SendGrid ${response.status}: ${errorText}`);
            }
            console.log(`Email sent to ${email}`);
        });

        const results = await Promise.allSettled(sendPromises);
        const sent = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;
        console.log(`Renewal emails → Sent: ${sent}, Failed: ${failed}`);

        return new Response(JSON.stringify({
            success: true,
            sent,
            failed
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (error: any) {
        console.error("Function failed:", error);
        return new Response(JSON.stringify({
            error: error.message || "Unknown error"
        }), {
            status: 500
        });
    }
});
