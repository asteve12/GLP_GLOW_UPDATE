import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json"
};

// FedEx token and tracking endpoints (sandbox vs production)
const SANDBOX = Deno.env.get("FEDEX_SANDBOX") === "true";

const FEDEX_CLIENT_ID = Deno.env.get("FEDEX_CLIENT_ID");
const FEDEX_CLIENT_SECRET = Deno.env.get("FEDEX_CLIENT_SECRET");

const FEDEX_OAUTH_TOKEN_URL = SANDBOX
    ? "https://apis-sandbox.fedex.com/oauth/token"
    : "https://apis.fedex.com/oauth/token";

const FEDEX_TRACKING_URL = SANDBOX
    ? "https://apis-sandbox.fedex.com/track/v1/trackingnumbers"
    : "https://apis.fedex.com/track/v1/trackingnumbers";

// ---- Helper: obtain FedEx access token (client_credentials) ----
async function fetchFedexAccessToken(): Promise<string> {
    if (!FEDEX_CLIENT_ID || !FEDEX_CLIENT_SECRET) {
        throw new Error("FedEx client credentials are not configured in environment variables.");
    }

    const body = new URLSearchParams();
    body.append("grant_type", "client_credentials");

    const resp = await fetch(FEDEX_OAUTH_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
                "Basic " + btoa(`${FEDEX_CLIENT_ID}:${FEDEX_CLIENT_SECRET}`)
        },
        body: body.toString()
    });

    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Failed to fetch FedEx access token: ${resp.status} ${txt}`);
    }

    const data = await resp.json();
    if (!data?.access_token) throw new Error("FedEx token response missing access_token");
    return data.access_token;
}

// ---- Helper: call FedEx Tracking API ----
async function trackWithFedex(accessToken: string, trackingNumber: string) {
    const payload = {
        trackingInfo: [
            {
                trackingNumberInfo: {
                    trackingNumber
                }
            }
        ],
        includeDetailedScans: true
    };

    const resp = await fetch(FEDEX_TRACKING_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const text = await resp.text();
    let parsed;
    try {
        parsed = text ? JSON.parse(text) : null;
    } catch (err) {
        parsed = { raw: text };
    }

    if (!resp.ok) {
        throw new Error(
            `FedEx tracking request failed: ${resp.status} ${resp.statusText} - ${JSON.stringify(parsed)}`
        );
    }

    return parsed;
}

// ---- Edge function handler ----
serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
    }

    try {
        const url = new URL(req.url);
        let trackingNumber = url.searchParams.get("trackingNumber");

        if (req.method === "POST") {
            try {
                const body = await req.json();
                if (!trackingNumber && body?.trackingNumber) trackingNumber = String(body.trackingNumber);
            } catch (err) {
                // ignore JSON parse errors for GET-like requests
            }
        }

        if (!trackingNumber) {
            return new Response(JSON.stringify({ error: "trackingNumber is required (query or JSON body)" }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        // Fetch access token and call FedEx
        const accessToken = await fetchFedexAccessToken();
        const trackingResult = await trackWithFedex(accessToken, trackingNumber);

        return new Response(JSON.stringify({ success: true, trackingNumber, trackingResult }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (err: any) {
        console.error("FedEx track error:", err);
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ success: false, error: message }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
});
