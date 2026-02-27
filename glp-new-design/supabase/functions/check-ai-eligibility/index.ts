import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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

        const { intakeData, bmi, age, sex } = await req.json();

        // Construct summary for AI
        const medicalHistory = Object.entries(intakeData)
            .filter(([key]) => !key.includes('_file') && !key.includes('_details') && !key.includes('pcp_') && key !== 'pcp_labs')
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");

        const prompt = `
            You are a clinical eligibility engine for a weight loss program (GLP-1 medications like Semaglutide/Tirzepatide).
            Review the following patient data and decide if they are "possibly eligible" or if they "require thorough manual review".
            
            Criteria for "Possibly Eligible":
            - BMI >= 30, OR
            - BMI >= 27 WITH weight-related comorbidities (High blood pressure, Diabetes, High cholesterol, etc).
            - No severe contraindications (Pancreatitis history, Medullary Thyroid Carcinoma history, Severe Type 1 Diabetes, etc).
            
            Patient Data:
            - Age: ${age}
            - Sex: ${sex}
            - BMI: ${bmi}
            - Medical History:
            ${medicalHistory}
            
            Return a JSON object with:
            - "approved": boolean (true if possibly eligible, false if not or needs review)
            - "reason": string (short internal reason)
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
                    { role: "system", content: "You are a medical eligibility reviewer. Respond only in JSON." },
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
        console.error("Error in check-ai-eligibility:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
