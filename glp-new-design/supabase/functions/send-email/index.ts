// File: main.ts (Deno Deploy / Supabase Edge Function)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
            status: 405,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    let payload: any;
    try {
        payload = await req.json();
    } catch {
        return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    const { userId, email: inputEmail, first_name: inputFirstName, last_name, type, tracking_id, setup_link } = payload;
    console.log("Payload:", payload)

    if (!type) {
        return new Response(JSON.stringify({ success: false, error: "Missing 'type' field" }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    // === Config ===
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")!;
    const MAILER_FROM = "ahs@americahealthsolutions.com";
    const YEAR = new Date().getFullYear();

    if (!SENDGRID_API_KEY) {
        return new Response(JSON.stringify({ success: false, error: "SendGrid API key missing" }), {
            status: 500,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    // === Resolve email & name ===
    let email = inputEmail;
    let first_name = inputFirstName || "there";

    if (userId && (!email || !first_name)) {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(JSON.stringify({ success: false, error: "Supabase not configured" }), {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=email,first_name,last_name`,
            {
                headers: {
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
            }
        );

        if (res.ok) {
            const profileArray = await res.json();
            const profile = profileArray[0];
            if (profile) {
                email = email ?? profile.email;
                first_name = inputFirstName ?? profile.first_name ?? "there";
            }
        }
    }

    if (!email) {
        return new Response(JSON.stringify({ success: false, error: "No email provided or found" }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    // ==================================================================
    // 1. ELIGIBILITY ASSESSMENT SUBMITTED
    // ==================================================================
    if (type === "eligibility") {
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Assessment Received!</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:20px">
  <div style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#1e7b34,#28a745);color:#fff;padding:40px 20px;text-align:center">
      <h1 style="margin:0;font-size:28px">Assessment Received!</h1>
    </div>
    <div style="padding:40px 30px;line-height:1.7;color:#333;text-align:center">
      <p style="font-size:18px">Hi ${first_name},</p>
      <p style="font-size:16px">
        Thank you! Your <strong>Eligibility Assessment</strong> has been successfully submitted.
      </p>
      <div style="background:#e6f7e8;padding:25px;border-radius:10px;margin:30px 0;border-left:6px solid #28a745;font-size:16px">
        We’re reviewing your information now.<br>
        You’ll receive an email from us within the next 24–48 hours with the next steps.
      </div>
      <p style="margin:40px 0">
        <a href="https://quiz.americahealthsolutions.com/dashboard"
           style="background:#28a745;color:#fff;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px">
          Go to Dashboard
        </a>
      </p>
      <p style="color:#666;margin-top:40px">
        Thank you,<br><strong>The GLP-GLOW Team</strong>
      </p>
    </div>
    <a href="https://quiz.americahealthsolutions.com" style="color: #0066cc; text-decoration: underline;text-align:center;display:block;margin-bottom:20px;">unsubscribe here</a>
    <div style="background:#f8f9fa;padding:20px;text-align:center;color:#888;font-size:12px">
      © ${YEAR} America Health Solutions • All rights reserved
    </div>
  </div>
</body>
</html>`;

        const text = `Hi ${first_name},

Thank you! Your Eligibility Assessment has been successfully submitted.

We’re reviewing your information now and will email you within the next 24–48 hours.

Go to Dashboard: https://quiz.americahealthsolutions.com/dashboard

Thank you,
The GLP-GLOW Team`;

        const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${SENDGRID_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email }], subject: "We Received Your Eligibility Assessment" }],
                from: { email: MAILER_FROM, name: "GLP-GLOW" },
                content: [
                    { type: "text/plain", value: text },
                    { type: "text/html", value: html },
                ],
            }),
        });

        if (!sgRes.ok) {
            const err = await sgRes.text();
            console.error("SendGrid error:", err);
            return new Response(JSON.stringify({ success: false, error: "SendGrid failed" }), { status: 502 });
        }

        return new Response(JSON.stringify({ success: true, sent_to: email, type: "eligibility_email_sent" }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    // ==================================================================
    // 2. TRACKING ID EMAIL
    // ==================================================================
    if (type === "TRACKING_ID" && tracking_id) {
        const trackingHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Your Order is On Its Way!</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:20px">
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#1e7b34,#28a745);color:#fff;padding:50px 20px;text-align:center">
      <h1 style="margin:0;font-size:28px">Great News, ${first_name}!</h1>
      <p style="font-size:18px;margin:10px 0 0">Your medication is on its way!</p>
    </div>
    <div style="padding:40px 30px;text-align:center">
      <p style="font-size:16px;color:#333">
        Your package has been shipped and is headed to you with care.
      </p>
      <div style="background:#e6f7e8;padding:20px;border-radius:10px;margin:30px 0;border-left:6px solid #28a745">
        <p style="margin:0;font-size:20px;font-weight:bold;color:#1e7b34">Tracking Number:</p>
        <p style="margin:15px 0 0;font-size:28px;font-family:monospace;letter-spacing:2px;color:#1e7b34">
          ${tracking_id}
        </p>
      </div>
      <a href="https://quiz.americahealthsolutions.com/orders"
         style="background:#007bff;color:#fff;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;margin:20px 0">
        Track Your Order Live
      </a>
      <p style="color:#666;margin-top:40px">
        Questions? Just reply to this email.<br>
        <strong>The GLP-GLOW Team</strong>
      </p>
    </div>
    <div style="background:#f8f9fa;padding:20px;text-align:center;color:#888;font-size:12px">
      © ${YEAR} America Health Solutions • All rights reserved
    </div>
  </div>
</body>
</html>`;

        const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${SENDGRID_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [{ to: [{ email }], subject: "Your GLP-GLOW Order Has Shipped!" }],
                from: { email: MAILER_FROM, name: "GLP-GLOW" },
                content: [
                    { type: "text/plain", value: `Your order has shipped! Tracking: ${tracking_id}` },
                    { type: "text/html", value: trackingHtml },
                ],
            }),
        });

        if (!sgRes.ok) {
            const err = await sgRes.text();
            console.error("SendGrid tracking error:", err);
            return new Response(JSON.stringify({ success: false, error: "Failed to send tracking email" }), { status: 502 });
        }

        return new Response(JSON.stringify({ success: true, sent_to: email, tracking_id, type: "tracking_email_sent" }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    // ==================================================================
    // REJECTION / NOT ELIGIBLE
    if (type === "REJECTION") {
        const rejectHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Update Regarding Your GLP-GLOW Assessment</title>
</head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f9f9f9;margin:0;padding:20px">
  <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#d32f2f,#b71c1c);color:#fff;padding:45px 25px;text-align:center">
      <h1 style="margin:0;font-size:28px">Update on Your Application</h1>
    </div>
    <div style="padding:40px 35px;color:#333;line-height:1.65;text-align:center">
      <p style="font-size:18px;margin-bottom:24px">Dear ${first_name},</p>
      <p style="font-size:16px">
        Thank you for taking the time to complete the GLP-GLOW eligibility assessment 
        and for sharing your health information with us.
      </p>
      <div style="background:#ffebee;padding:28px;border-radius:10px;margin:32px 0;border-left:6px solid #d32f2f;font-size:16px">
        After careful review by our medical team, we regret to inform you that 
        <strong>you do not currently meet the eligibility criteria</strong> 
        for our GLP-GLOW weight loss program at this time.
      </div>
      <p style="font-size:16px">
        We understand this may be disappointing news.<br>
        Your health and safety are our top priority, and our decisions are always based on 
        clinical guidelines and safety considerations.
      </p>
    
      <p style="color:#555;font-size:15px;margin:40px 0 20px">
        Thank you again for considering GLP-GLOW.<br>
        We truly wish you the very best on your health journey.
      </p>
      <p style="color:#666">
        Warm regards,<br>
        <strong>The GLP-GLOW Medical Review Team</strong>
      </p>
    </div>
    <div style="background:#f8f9fa;padding:25px;text-align:center;color:#777;font-size:13px">
      © ${YEAR} America Health Solutions • All rights reserved<br>
      <a href="https://quiz.americahealthsolutions.com" style="color:#0066cc;text-decoration:underline">unsubscribe here</a>
    </div>
  </div>
</body>
</html>`;

        const rejectText = `Dear ${first_name},

Thank you for completing the GLP-GLOW eligibility assessment.

After thorough review by our medical team, we regret to inform you that you do not currently meet the eligibility criteria for our program.

We always prioritize patient safety and follow strict clinical guidelines in our decisions.

We recommend discussing this result with your primary care physician or specialist, who may be able to suggest other appropriate options.

We truly wish you the best in your continued health journey.

Warm regards,
The GLP-GLOW Medical Review Team`;

        const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${SENDGRID_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email }],
                    subject: "Update Regarding Your GLP-GLOW Eligibility Assessment",
                }],
                from: { email: MAILER_FROM, name: "GLP-GLOW Medical Team" },
                content: [
                    { type: "text/plain", value: rejectText },
                    { type: "text/html", value: rejectHtml },
                ],
            }),
        });

        if (!sgRes.ok) {
            const err = await sgRes.text();
            console.error("SendGrid REJECTION error:", err);
            return new Response(JSON.stringify({ success: false, error: "Failed to send rejection email" }), {
                status: 502,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({
            success: true,
            sent_to: email,
            type: "rejection_email_sent"
        }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }
    // 3. NEW: NEW — USER_SETUP (Approval + Account Setup Link)
    // ==================================================================
    if (type === "USER_SETUP") {
        const setupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Congratulations! You're Approved for GLP-GLOW</title>
</head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f4f7fa;margin:0;padding:20px">
  <div style="max-width:620px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.1)">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#00c853,#00a844);color:#fff;padding:50px 30px;text-align:center">
      <h1 style="margin:0;font-size:32px;font-weight:900">You're Approved!</h1>
      <p style="font-size:20px;margin:12px 0 0;opacity:0.95">Welcome to GLP-GLOW Weight Loss Program</p>
    </div>

    <!-- Body -->
    <div style="padding:50px 40px;text-align:center;color:#333">
      <p style="font-size:19px;line-height:1.7">Hi ${first_name},</p>
      <p style="font-size:17px;line-height:1.7">
        Great news — our medical team has <strong>reviewed and approved</strong> your assessment, labs, and documents!
      </p>
      <p style="font-size:17px;line-height:1.7">
        You're now officially cleared to begin your GLP-GLOW weight loss journey.
      </p>

      <div style="background:#e8f5e8;padding:30px;border-radius:12px;margin:35px 0;border-left:8px solid #00c853">
        <h2 style="margin:0 0 16px;font-size:22px;color:#006400">Next Step: Complete Your Account</h2>
        <p style="margin:0;font-size:17px;color:#333">
          Click the button below to set your password and add a payment method.<br>
          Once done, your medication will be processed and shipped within 1–3 business days.
        </p>
      </div>

      <a href="https://quiz.americahealthsolutions.com/dashboard"
         style="display:inline-block;background:#00c853;color:#fff;padding:18px 48px;text-decoration:none;border-radius:12px;font-weight:bold;font-size:18px;margin:30px 0;box-shadow:0 6px 20px rgba(0,200,83,0.3);transition:all 0.3s">
        Complete My Account & Start Treatment
      </a>

      <p style="color:#555;font-size:15px;margin-top:40px;line-height:1.6">
        This link expires in 72 hours for your security.
      </p>

      <hr style="border:none;border-top:1px dashed #ddd;margin:50px 0">

      <p style="color:#666;font-size:16px">
        We’re so excited to support you on your transformation!<br>
        <strong>The GLP-GLOW Medical Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8f9fa;padding:30px;text-align:center;color:#777;font-size:13px">
      © ${YEAR} GLP-GLOW by America Health Solutions • Confidential & Secure<br>
      Need help? Reply to this email or call us at (+1214)-699-7654
    </div>
     <a href="https://quiz.americahealthsolutions.com" style="color: #0066cc; text-decoration: underline;text-align:center;display:block;margin-top:10px;">unsubscribe here</a>
  </div>
</body>
</html>`;

        const setupText = `Hi ${first_name},

CONGRATULATIONS! You have been APPROVED for the GLP-GLOW weight loss program.

To complete your account setup (password + payment), please click this link:

${setup_link || 'https://quiz.americahealthsolutions.com/dashboard'}

This link expires in 72 hours.

Once completed, your medication will be shipped within 1–3 business days.

Welcome to the program!

— The GLP-GLOW Medical Team`;

        const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${SENDGRID_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email }],
                    subject: "You're Approved! Complete Your GLP-GLOW Account Now",
                }],
                from: { email: MAILER_FROM, name: "GLP-GLOW Medical Team" },
                content: [
                    { type: "text/plain", value: setupText },
                    { type: "text/html", value: setupHtml },
                ],
            }),
        });

        if (!sgRes.ok) {
            const err = await sgRes.text();
            console.error("SendGrid USER_SETUP error:", err);
            return new Response(JSON.stringify({ success: false, error: "Failed to send setup email" }), { status: 502 });
        }

        return new Response(JSON.stringify({ success: true, sent_to: email, type: "user_setup_email_sent" }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    // ==================================================================
    // UNKNOWN TYPE
    // ==================================================================
    return new Response(JSON.stringify({ success: false, error: `Unknown type: ${type}` }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
});
