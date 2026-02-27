import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const openaiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openaiKey) {
            throw new Error("OPENAI_API_KEY is not set");
        }

        const { intakeData } = await req.json();

        // Build a structured summary from the intake answers
        const medicalSummary = Object.entries(intakeData)
            .filter(([key]) => !key.includes('_file') && !key.includes('_details') && !key.includes('pcp_'))
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join("\n");

        const prompt = `
            You are a clinical eligibility engine for an erectile dysfunction (ED) telemedicine program.
            The program prescribes PDE5 inhibitors (Sildenafil, Tadalafil, Vardenafil).
            
            Review the following patient intake data and determine if the patient is "possibly eligible" 
            or "requires thorough manual review / likely ineligible".

            ABSOLUTE CONTRAINDICATIONS (auto-decline if present):
            - Takes nitrate medications (nitroglycerin, isosorbide) → Dangerous hypotension with PDE5 inhibitors
            - uses recreational nitrates ("poppers") → Same risk
            - Takes riociguat → Contraindicated
            - Has unstable or worsening heart disease
            - Had a heart attack or stroke within the past 6 months
            - Was told to avoid sexual activity due to heart risk
            - Has uncontrolled blood pressure
            - Has a history of priapism (erection >4 hours) AND the new medication could cause this again
            - Has severe penile pain

            RELATIVE CONCERNS (flag for manual review but may still qualify):
            - Takes alpha-blockers (risk of hypotension; dose adjustment may be needed)
            - Takes strong CYP3A4 inhibitors (dose adjustment needed)
            - Takes 2 or more blood pressure medications
            - Has uncontrolled mental health condition

            TYPICALLY ELIGIBLE (if no absolute contraindications):
            - ED lasting any duration
            - Controlled cardiovascular conditions
            - Diabetes (any type, if stable)
            - Kidney or liver conditions unless severe

            Patient Intake Data:
            ${medicalSummary}

            Return a JSON object with:
            - "approved": boolean (true = possibly eligible, false = ineligible or needs manual review)
            - "reason": string (brief clinical reason, 1-2 sentences)
        `;

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${openaiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a medical eligibility reviewer for an ED telemedicine platform. Respond only in JSON." },
                    { role: "user", content: prompt },
                ],
                response_format: { type: "json_object" },
                temperature: 0.1,
            }),
        });

        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`OpenAI error: ${err}`);
        }

        const aiData = await resp.json();
        const evaluation = JSON.parse(aiData.choices[0].message.content);

        return new Response(
            JSON.stringify(evaluation),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error in check-sexual-health-eligibility:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
