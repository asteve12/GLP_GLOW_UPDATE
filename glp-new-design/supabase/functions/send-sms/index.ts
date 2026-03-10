import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: CORS_HEADERS
        });
    }

    // 2. Only allow POST
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    try {
        const { phone, message } = await req.json();

        if (!phone || !message) {
            return new Response(JSON.stringify({ error: "Phone and message are required" }), {
                status: 400,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
        const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
        const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
            console.error("Missing Twilio credentials in environment variables");
            return new Response(JSON.stringify({ error: "SMS service misconfigured (Missing credentials)" }), {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        console.log(`[SMS] Sending to: ${phone} | Message: ${message}`);

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${btoa(TWILIO_ACCOUNT_SID + ":" + TWILIO_AUTH_TOKEN)}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ From: TWILIO_PHONE_NUMBER, To: phone, Body: message }),
        });

        const twilioData = await res.json();

        if (!res.ok) {
            console.error("Twilio API error:", twilioData);
            return new Response(JSON.stringify({
                error: "Failed to send SMS via provider",
                details: twilioData.message
            }), {
                status: res.status,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({
            success: true,
            sent_to: phone,
            sid: twilioData.sid,
            message: "SMS sent successfully"
        }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("SMS processing error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }
});
