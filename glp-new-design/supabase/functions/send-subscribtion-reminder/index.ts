// send-glp-glow-renewal-reminder.ts
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
<head><meta charset="UTF-8"><title>Quick Check-In Before Renewal</title></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,system-ui,Arial,sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#1e7b34,#28a745);color:#fff;padding:50px 20px;text-align:center">
      <h1 style="margin:0;font-size:32px;font-weight:bold">GLP-GLOW</h1>
      <p style="margin:12px 0 0;font-size:19px;opacity:0.95">Your journey matters to us</p>
    </div>
    <div style="padding:45px 40px;line-height:1.8;color:#333">
      <h2 style="font-size:24px;color:#1e7b34;margin:0 0 20px">Hi ${firstName},</h2>
      <p style="font-size:16px">Your medication renews in <strong>3 days</strong> — we don’t want any gaps in your progress!</p>
      <div style="background:#e6f7e8;padding:25px;border-radius:12px;margin:30px 0;border-left:6px solid #28a745">
        <p style="margin:0;font-size:17px">Can you spare <strong>60 seconds</strong> to answer 3 quick questions?<br>It helps us make your next month even better.</p>
      </div>
      <div style="text-align:center;margin:40px 0">
        <a href="${QUESTIONNAIRE_URL}"
           style="background:#28a745;color:#fff;padding:16px 40px;text-decoration:none;border-radius:12px;font-weight:bold;font-size:18px;display:inline-block;box-shadow:0 6px 20px rgba(40,167,69,0.3)">
          Answer 3 Quick Questions → 60 Seconds
        </a>
      </div>
      <p style="font-size:15px;color:#555;line-height:1.8">
        <strong>We’ll ask:</strong><br><br>
        • How is your weight loss going?<br>
        • Starting weight vs. current weight<br>
        • Happy with your medication & dosage?<br>
        <span style="color:#28a745;font-weight:bold">→ If no, we’ll help you request a change</span>
      </p>
      <p style="margin:40px 0 0;font-size:16px;color:#28a745;font-weight:bold">
        Thank you for trusting us with your journey!<br>— The GLP-GLOW Team
      </p>
    </div>
    <div style="background:#f8f9fa;padding:30px;text-align:center;color:#777;font-size:13px">
      <p style="margin:0">
        © ${new Date().getFullYear()} America Health Solutions • GLP-GLOW<br>
        <a href="${DASHBOARD_URL}" style="color:#28a745;text-decoration:underline">Go to Dashboard</a> • 
        <a href="{{{asm_group_unsubscribe_url}}}" style="color:#777">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
            const text = `Hi ${firstName},

Your GLP-GLOW renewal is in 3 days!

Take 60 seconds to answer 3 quick questions:
${QUESTIONNAIRE_URL}

This helps us support you better and avoid any gaps in treatment.

Thank you,
The GLP-GLOW Team

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
                            subject: `${firstName}, your GLP-GLOW renewal is in 3 days — quick check-in?`
                        }
                    ],
                    from: {
                        email: MAILER_FROM,
                        name: "GLP-GLOW"
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
