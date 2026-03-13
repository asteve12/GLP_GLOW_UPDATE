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

  const { userId, email: inputEmail, first_name: inputFirstName, last_name, type, tracking_id, setup_link, category } = payload;
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
  const MAILER_FROM_NAME = "uGlowMD";
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
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Assessment Received!</title>
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
Assessment Received!
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${first_name},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Thank you! Your <strong>Eligibility Assessment</strong> has been successfully submitted. We’re reviewing your information now. You’ll receive an email from us within the next 24–48 hours with the next steps.
</p>

<p style="text-align:center;margin:30px 0;">
<a href="https://quiz.americahealthsolutions.com/dashboard"
style="background:#000000;color:#ffffff;padding:14px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
Go to Dashboard
</a>
</p>

<p style="font-size:14px;color:#555555;margin-bottom:25px;">
If you have any questions, feel free to contact our medical team by replying to this email.
</p>

<p style="font-size:14px;color:#777777;margin-bottom:0;">
Thank you,<br><strong>The uGlowMD Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:25px 40px;background:#fafafa;border-top:1px solid #eeeeee;">

<p style="font-size:12px;color:#999999;margin:0;">
© ${YEAR} uGlowMD. All rights reserved.
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

    const text = `Hi ${first_name},

Thank you! Your Eligibility Assessment has been successfully submitted.

We’re reviewing your information now and will email you within the next 24–48 hours.

Go to Dashboard: https://quiz.americahealthsolutions.com/dashboard

Thank you,
The uGlowMD Team`;

    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }], subject: "We Received Your Eligibility Assessment" }],
        from: { email: MAILER_FROM, name: MAILER_FROM_NAME },
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
  // 1b. SKINCARE ASSESSMENT SUBMITTED (FREE)
  // ==================================================================
  if (type === "skincare_eligibility") {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Skincare Assessment Received!</title>
</head>

<body style="margin:0;padding:0;background_color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;">

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
Skin Health Review Started!
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${first_name},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Thank you for choosing us! We've received your <strong>Skincare Assessment</strong>. Your initial consultation is 100% free of charge. Our medical team is now reviewing your skin history and photos. You'll receive a personalized treatment plan via email within the next 24–48 hours.
</p>

<p style="text-align:center;margin:30px 0;">
<a href="https://quiz.americahealthsolutions.com/dashboard"
style="background:#000000;color:#ffffff;padding:14px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
View My Progress
</a>
</p>

<p style="font-size:14px;color:#555555;margin-bottom:25px;">
Stay tuned for your personalized plan. If you need immediate assistance, please reply to this message.
</p>

<p style="font-size:14px;color:#777777;margin-bottom:0;">
Best regards,<br><strong>The uGlowMD Skincare Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:25px 40px;background:#fafafa;border-top:1px solid #eeeeee;">

<p style="font-size:12px;color:#999999;margin:0;">
© ${YEAR} All rights reserved.
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

    const text = `Hi ${first_name},

Thank you! Your Skincare Assessment has been successfully submitted.

Your initial consultation is free. Our medical team is reviewing your information now and will email you within the next 24–48 hours.

Go to Dashboard: https://quiz.americahealthsolutions.com/dashboard

Thank you,
The uGlowMD Skincare Team`;

    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }], subject: "We Received Your Skincare Assessment" }],
        from: { email: MAILER_FROM, name: MAILER_FROM_NAME },
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });

    if (!sgRes.ok) {
      const err = await sgRes.text();
      console.error("SendGrid skincare error:", err);
      return new Response(JSON.stringify({ success: false, error: "SendGrid failed" }), { status: 502 });
    }

    return new Response(JSON.stringify({ success: true, sent_to: email, type: "skincare_email_sent" }), {
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
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Order is On Its Way!</title>
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
Great News, ${first_name}!
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Your medication is on its way! Your package has been shipped and is headed to you with care.
</p>

<!-- Tracking Box -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:30px;">
<tr>
<td align="center" style="background:#f7f7f7;border:2px dashed #dcdcdc;border-radius:8px;padding:20px;">
    
<span style="font-size:14px;color:#555555;display:block;margin-bottom:5px;font-weight:600;">TRACKING NUMBER</span>
<span style="font-size:24px;font-weight:800;letter-spacing:2px;color:#111111;">
${tracking_id}
</span>

</td>
</tr>
</table>

<p style="text-align:center;margin:30px 0;">
<a href="https://quiz.americahealthsolutions.com/orders"
style="background:#000000;color:#ffffff;padding:14px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
Track Your Order Live
</a>
</p>

<p style="font-size:14px;color:#555555;margin-bottom:25px;">
Questions? Just reply to this email. We're here to help you every step of the way.
</p>

<p style="font-size:14px;color:#777777;margin-bottom:0;">
Best,<br><strong>The uGlowMD Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:25px 40px;background:#fafafa;border-top:1px solid #eeeeee;">

<p style="font-size:12px;color:#999999;margin:0;">
© ${YEAR} All rights reserved.
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

    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }], subject: "Your Order Has Shipped!" }],
        from: { email: MAILER_FROM, name: MAILER_FROM_NAME },
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
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Update Regarding Your Assessment</title>
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
Update on Your Application
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Dear ${first_name},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Thank you for taking the time to complete the eligibility assessment and for sharing your health information with us. After careful review by our medical team, we regret to inform you that <strong>you do not currently meet the eligibility criteria</strong> for our program at this time.
</p>

<p style="font-size:14px;color:#555555;margin-bottom:25px;">
Your health and safety are our top priority, and our decisions are always based on clinical guidelines and safety considerations. We truly wish you the very best on your health journey.
</p>

<p style="font-size:14px;color:#777777;margin-bottom:0;">
Warm regards,<br>
<strong>The uGlowMD Medical Review Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:25px 40px;background:#fafafa;border-top:1px solid #eeeeee;">

<p style="font-size:12px;color:#999999;margin:0;">
© ${YEAR} All rights reserved.
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

    const rejectText = `Dear ${first_name},

Thank you for completing the eligibility assessment.

After thorough review by our medical team, we regret to inform you that you do not currently meet the eligibility criteria for our program.

We always prioritize patient safety and follow strict clinical guidelines in our decisions.

We recommend discussing this result with your primary care physician or specialist, who may be able to suggest other appropriate options.

We truly wish you the best in your continued health journey.

Warm regards,
The uGlowMD Medical Review Team`;

    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: "Update Regarding Your Eligibility Assessment",
        }],
        from: { email: MAILER_FROM, name: MAILER_FROM_NAME },
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
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Congratulations! You're Approved</title>
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
You're Approved!
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${first_name},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Great news — our medical team has <strong>reviewed and approved</strong> your assessment, labs, and documents! You're now officially cleared to begin your journey with our ${category || 'Weight Loss'} Program.
</p>

<p style="text-align:center;margin:30px 0;">
<a href="${setup_link || 'https://quiz.americahealthsolutions.com/dashboard'}"
style="background:#000000;color:#ffffff;padding:18px 48px;text-decoration:none;border-radius:12px;font-weight:bold;font-size:18px;display:inline-block;">
Complete My Account & Start Treatment
</a>
</p>

<p style="font-size:14px;color:#555555;margin-bottom:25px;">
Click the button above to set your password and add a payment method. Once done, your medication will be processed and shipped within 1–3 business days. This link expires in 72 hours for your security.
</p>

<p style="font-size:14px;color:#777777;margin-bottom:0;">
We’re so excited to support you on your transformation!<br>
<strong>The uGlowMD Medical Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:25px 40px;background:#fafafa;border-top:1px solid #eeeeee;">

<p style="font-size:12px;color:#999999;margin:0;">
© ${YEAR} All rights reserved.
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

    const setupText = `Hi ${first_name},

CONGRATULATIONS! You have been APPROVED for the ${category || 'weight loss'} program.

To complete your account setup (password + payment), please click this link:

${setup_link || 'https://quiz.americahealthsolutions.com/dashboard'}

This link expires in 72 hours.

Once completed, your medication will be shipped within 1–3 business days.

Welcome to the program!

— The uGlowMD Medical Team`;

    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: "You're Approved! Complete Your Account Now",
        }],
        from: { email: MAILER_FROM, name: MAILER_FROM_NAME },
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
  // DOSAGE / MEDICATION CHANGE APPROVED
  // ==================================================================
  if (type === "dosage_change_approved") {
    const { drug_name, dosage, change_type } = payload;
    const changeLabel = change_type || "Dosage Adjustment";
    const drugLabel = drug_name || "your medication";
    const dosageLabel = dosage || "";

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${changeLabel} Approved!</title>
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
${changeLabel} Approved!
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${first_name},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Great news! Our medical team has reviewed and <strong>approved</strong> your ${changeLabel.toLowerCase()} request for <strong>${drugLabel}</strong>. Your protocol has been updated and your next shipment will reflect these changes.
</p>

<div style="background:#f8f9fa;padding:25px;border-radius:15px;margin:25px 0;border:1px solid #eee;text-align:left;">
<h3 style="margin:0 0 15px;font-size:16px;color:#333;text-transform:uppercase;letter-spacing:1px;font-weight:900;">Update Summary</h3>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Change Type:</strong> ${changeLabel}</p>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Treatment:</strong> ${drugLabel}</p>
${dosageLabel ? `<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">New Dosage:</strong> ${dosageLabel}</p>` : ''}
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Status:</strong> <span style="color:#22C55E;font-weight:bold;">Approved & Active</span></p>
</div>

<p style="text-align:center;margin:30px 0;">
<a href="https://quiz.americahealthsolutions.com/dashboard"
style="background:#000000;color:#ffffff;padding:14px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
View My Dashboard
</a>
</p>

<p style="font-size:14px;color:#555555;margin-bottom:25px;">
Your next shipment will include the updated protocol. No additional action is required on your part. If you have any questions, please reply to this email.
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
© ${YEAR} uGlowMD. All rights reserved.
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

    const text = `Hi ${first_name},

Your ${changeLabel} request for ${drugLabel} has been APPROVED by our medical team.

Update Details:
- Treatment: ${drugLabel}
${dosageLabel ? `- New Dosage: ${dosageLabel}` : ''}
- Status: Approved & Active

Your protocol has been updated and your next shipment will reflect these changes.

Go to Dashboard: https://quiz.americahealthsolutions.com/dashboard

Thank you,
The uGlowMD Medical Team`;

    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }], subject: `Your ${changeLabel} Approved!` }],
        from: { email: MAILER_FROM, name: MAILER_FROM_NAME },
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });

    if (!sgRes.ok) {
      const err = await sgRes.text();
      console.error("SendGrid dosage_change_approved error:", err);
      return new Response(JSON.stringify({ success: false, error: "SendGrid failed" }), { status: 502 });
    }

    return new Response(JSON.stringify({ success: true, sent_to: email, type: "dosage_change_approved_email_sent" }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ==================================================================
  // 3. DOSAGE CHANGE PAYMENT RECEIVED
  // ==================================================================
  if (type === "dosage_payment_received") {
    const { amount } = payload;
    const amountLabel = amount || "5.00";

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Charge Approved - Dosage Change Request</title>
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
Charge Approved
</h2>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
Hi ${first_name},
</p>

<p style="font-size:16px;color:#4a4a4a;margin-bottom:25px;">
The <strong>$${amountLabel} charge</strong> for your dosage change request has been <strong>approved</strong>. Your request has been sent to our medical team for clinical review.
</p>

<div style="background:#f8f9fa;padding:25px;border-radius:15px;margin:25px 0;border:1px solid #eee;text-align:left;">
<h3 style="margin:0 0 15px;font-size:16px;color:#333;text-transform:uppercase;letter-spacing:1px;font-weight:900;">Order Details</h3>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Service:</strong> Dosage Change Clinical Review</p>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Amount Paid:</strong> $${amountLabel}</p>
<p style="margin:8px 0;font-size:14px;color:#555;"><strong style="color:#333;">Status:</strong> <span style="color:#22C55E;font-weight:bold;">Processing</span></p>
</div>

<p style="font-size:14px;color:#4a4a4a;margin-bottom:25px;">
Typical clinical reviews are completed within 24-48 business hours. You will receive another notification once your request has been reviewed by a provider.
</p>

<p style="text-align:center;margin:30px 0;">
<a href="https://quiz.americahealthsolutions.com/dashboard"
style="background:#000000;color:#ffffff;padding:14px 30px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
View My Dashboard
</a>
</p>

<p style="font-size:14px;color:#777777;margin-bottom:0;">
Thank you,<br><strong>The uGlowMD Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td align="center" style="padding:25px 40px;background:#fafafa;border-top:1px solid #eeeeee;">
<p style="font-size:12px;color:#999999;margin:0;">
© ${YEAR} uGlowMD. All rights reserved.
</p>
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;

    const text = `Hi ${first_name},

The $${amountLabel} charge for your dosage change request has been APPROVED. Our medical team is now reviewing your information.

Clinical reviews are typically completed within 24-48 business hours. We'll notify you as soon as there's an update.

Thank you,
The uGlowMD Team`;

    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }], subject: "Charge Approved: Dosage Change Request" }],
        from: { email: MAILER_FROM, name: MAILER_FROM_NAME },
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });

    if (!sgRes.ok) {
      const err = await sgRes.text();
      console.error("SendGrid dosage_payment_received error:", err);
      return new Response(JSON.stringify({ success: false, error: "SendGrid failed" }), { status: 502 });
    }

    return new Response(JSON.stringify({ success: true, sent_to: email, type: "dosage_payment_received_email_sent" }), {
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
