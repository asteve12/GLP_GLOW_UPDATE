import { createClient } from "npm:@supabase/supabase-js@2.33.0";
import fetch from "npm:node-fetch@3.3.2";
import PDFDocument from "npm:pdfkit@0.13.0";
import { Buffer } from "npm:buffer@6.0.3";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "3600",
    "Content-Type": "application/json",
};

const BUCKET_NAME = Deno.env.get("NOTES_BUCKET") ?? "provider-notes";
const BUCKET_PUBLIC =
    (Deno.env.get("NOTES_BUCKET_PUBLIC") ?? "false").toLowerCase() === "true";

async function generateProviderNote(prompt: string, openaiKey: string) {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            max_tokens: 1200,
            temperature: 0.2,
        }),
    });
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`OpenAI error ${resp.status}: ${txt}`);
    }
    const j: any = await resp.json();
    return j.choices?.[0]?.message?.content ?? "";
}

function pdfFromPayloadAndNote(payload: any, providerText: string): Promise<Uint8Array> {
    // Extract provider notes
    const providerNotes =
        (payload?.notes ?? "").toString().trim() || "None provided";
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margin: 50,
            bufferPages: true,
        });
        const chunks: any[] = [];
        doc.on("data", (c) => chunks.push(c));
        doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
        doc.on("error", reject);
        const bold = "Helvetica-Bold";
        const regular = "Helvetica";
        const color = "#000000";
        const answers = payload?.answers ?? {};
        const labs = payload?.labs ?? {};
        const lipid = labs.lipid ?? {};
        const a1c = labs.a1c ?? {};
        const userId = payload?.userId ?? "Unknown";
        const generatedDate = new Date().toISOString().split("T")[0];
        const usableWidth =
            doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const get = (key: string, fallback: string | null = "Not provided") => {
            const v = answers[key];
            if (Array.isArray(v))
                return (
                    v
                        .filter(
                            (x) =>
                                x &&
                                !x.includes("None of the above") &&
                                !x.includes("I prefer not to answer")
                        )
                        .join(", ") || fallback
                );
            return v === null || v === undefined || v === "" ? fallback : String(v);
        };
        const height = () => {
            const ft = get("Height (feet)", null) || get("Height (Feet)", null);
            const inc = get("Height (inches)", null) || get("Height (Inches)", null);
            return ft && inc ? `${ft}'${inc}"` : "Not provided";
        };
        // HEADER
        doc.font(bold).fontSize(18).fillColor(color).text("PROVIDER NOTES REPORT", {
            align: "center",
        });
        doc
            .font(regular)
            .fontSize(12)
            .text(`User ID: ${userId} | Generated: ${generatedDate}`, {
                align: "center",
            });
        doc.moveDown(1.5);
        // PATIENT DEMOGRAPHICS
        doc.font(bold).fontSize(14).text("PATIENT DEMOGRAPHICS");
        doc.font(regular).fontSize(11);
        const demo = [
            `First Name: ${get("First Name")}`,
            `Last Name: ${get("Last Name")}`,
            `Email: ${get("Email")}`,
            `Sex: ${get("Sex")}`,
            `Date Of Birth: ${get("Date of Birth") || get("Date Of Birth")}`,
            `State: ${get("State")}`,
            `Height: ${height()}`,
            `Weight (Lbs): ${get("Weight (lbs)") || get("Weight (Lbs)")}`,
            `BMI: ${get("BMI")}`,
        ];
        demo.forEach((l) =>
            doc.text(l, {
                width: usableWidth,
            })
        );
        doc.moveDown();
        // HPI
        doc.font(bold).fontSize(14).text("HPI");
        doc.font(regular).fontSize(11);
        const hpi = [
            `Health Goals: ${get("Health Goals")}`,
            `Custom Goal: ${get("Custom Goal")}`,
            `Selected Medication: ${get("Selected Medication")}`,
            `Seen Primary Care Physician: ${get("Seen Primary Care Physician")}`,
            `Diabetes Status: ${get("Diabetes Status")}`,
            `Heart Conditions: ${get("Heart Conditions")}`,
            `Gastrointestinal Conditions: ${get("Gastrointestinal Conditions")}`,
            `Cancer History: ${get("Cancer History")}`,
            `Mental Health Conditions: ${get("Mental Health Conditions")}`,
            `Weight Impact on Quality of Life: ${get(
                "Weight Impact on Quality of Life"
            )}`,
            `Allergies: ${get("Allergies")}`,
            `Current Medications: ${get("Current Medications")}`,
            `Past Weight Loss Methods: ${get("Past Weight Loss Methods")}`,
        ];
        hpi.forEach((l) =>
            doc.text(l, {
                width: usableWidth,
            })
        );
        doc.moveDown();
        // LABORATORY RESULTS
        doc.font(bold).fontSize(14).text("LABORATORY RESULTS");
        doc.moveDown(0.5);
        const tableTop = doc.y;
        const leftMargin = 50;
        const rowH = 22;
        doc.font(bold).fontSize(11);
        doc.text("Test", leftMargin, tableTop, {
            width: 190,
        });
        doc.text("Value", leftMargin + 200, tableTop, {
            width: usableWidth - 200,
        });
        doc
            .moveTo(leftMargin, tableTop + 15)
            .lineTo(doc.page.width - leftMargin, tableTop + 15)
            .lineWidth(0.8)
            .strokeColor(color)
            .stroke();
        doc.font(regular).fontSize(10);
        let y = tableTop + rowH;
        const addRow = (test: string, value: any) => {
            doc.text(test, leftMargin, y, {
                width: 190,
            });
            if (typeof value === "string" && value.startsWith("http")) {
                // THIS IS THE MAGIC FIX: insert zero-width spaces so PDFKit can break the URL
                const breakableUrl = value.replace(/([/?&=#])/g, "$1\u200B");

                doc.fontSize(9.5).text(breakableUrl, leftMargin + 200, y + 2, {
                    width: usableWidth - 200,
                    lineBreak: true,
                    link: value, // makes it clickable
                    underline: true,
                });
            } else {
                doc
                    .fillColor("#000000")
                    .fontSize(10)
                    .text(String(value ?? "—"), leftMargin + 200, y + 2, {
                        width: usableWidth - 200,
                    });
            }
            y += rowH;
        };
        addRow("Total Cholesterol (mg/dL)", lipid.total ?? "—");
        addRow("LDL (mg/dL)", lipid.ldl ?? "—");
        addRow("HDL (mg/dL)", lipid.hdl ?? "—");
        addRow("Triglycerides (mg/dL)", lipid.triglycerides ?? "—");
        addRow("A1c (%)", a1c.value ?? "—");

        doc.y = y + 30;
        // CLEAN TEXT HELPER
        const clean = (txt: string) =>
            txt.replace(/\*\*/g, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
        // EXTRACT SECTIONS
        const assessmentMatch = providerText.match(
            /Assessment:([\s\S]*?)(?=Treatment Plan:|Diagnosis:|Provider Summary:|$)/i
        );
        const treatmentMatch = providerText.match(
            /Treatment Plan:([\s\S]*?)(?=Provider Summary:|$)/i
        );
        const diagnosisMatch =
            providerText.match(/DIAGNOSIS\s*([\s\S]*?)(?=RECOMMENDATIONS|$)/i) ||
            providerText.match(/Diagnosis[:\s]*([A-Z0-9\.\s-]+)/i);
        const assessment = assessmentMatch
            ? clean(assessmentMatch[1])
            : "No assessment provided.";
        const treatment = treatmentMatch
            ? treatmentMatch[1].trim()
            : "No treatment plan provided.";
        const diagnosis = diagnosisMatch
            ? clean(diagnosisMatch[1] || diagnosisMatch[0])
            : null;
        // CLINICAL ASSESSMENT
        doc.x = 50;
        doc.font(bold).fontSize(14).text("CLINICAL ASSESSMENT");
        doc.font(regular).fontSize(11).text(assessment, {
            width: usableWidth,
            lineGap: 4,
        });
        doc.moveDown();
        // DIAGNOSIS
        if (diagnosis) {
            doc.x = 50;
            doc.font(bold).fontSize(14).text("DIAGNOSIS");
            doc.font(regular).fontSize(11).text(diagnosis, {
                width: usableWidth,
            });
            doc.moveDown();
        }
        // RECOMMENDATIONS
        doc.x = 50;
        doc.font(bold).fontSize(14).text("RECOMMENDATIONS");
        doc.font(regular).fontSize(11);
        const lines = treatment
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
        lines.forEach((line) => {
            const cleanLine = line.replace(/\*\*/g, "").trim();
            if (/^(•|-|\d+\.)/.test(cleanLine)) {
                const bulletText = cleanLine.replace(/^(•|-|\d+\.\s*)/, "").trim();
                doc.text(`• ${bulletText}`, {
                    width: usableWidth,
                    indent: 20,
                });
            } else {
                doc.text(cleanLine, {
                    width: usableWidth,
                });
            }
        });
        doc.moveDown(2);
        // NOTES / COMMENTS SECTION
        doc.font(bold).fontSize(14).text("NOTES / COMMENTS");
        doc.font(regular).fontSize(11);
        if (providerNotes && providerNotes !== "None provided") {
            doc.text(providerNotes, {
                width: usableWidth,
                lineGap: 5,
            });
        } else {
            doc.text("None provided", {
                width: usableWidth,
                color: "#666666",
                italics: true,
            });
        }
        doc.moveDown(4);
        // ELECTRONIC SIGNATURE
        doc.moveDown(4);
        const signatureText = `Electronically signed by: ${payload?.provider?.first_name
            } ${payload?.provider?.last_name}, ${payload?.provider.type
            } — ${new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })}`;
        const textWidth = doc.widthOfString(signatureText);
        doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#006400") // Dark green
            .text(signatureText, (doc.page.width - textWidth) / 2, doc.y + 40);
        // PAGE NUMBERS
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            doc
                .font(regular)
                .fontSize(10)
                .fillColor("#666")
                .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 50, {
                    align: "center",
                    width: usableWidth,
                });
        }
        doc.end();
    });
}
// EDGE HANDLER
Deno.serve(async (req) => {
    if (req.method === "OPTIONS")
        return new Response(null, {
            status: 204,
            headers: CORS_HEADERS,
        });
    if (req.method !== "POST")
        return new Response(
            JSON.stringify({
                error: "Method Not Allowed",
            }),
            {
                status: 405,
                headers: CORS_HEADERS,
            }
        );
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY =
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(
            JSON.stringify({
                error: "Server misconfigured: Environment variables missing",
            }),
            {
                status: 500,
                headers: CORS_HEADERS,
            }
        );
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
        console.error("No authorization header");
        return new Response(JSON.stringify({ error: "Unauthorized: Missing Authorization header" }), {
            status: 401,
            headers: CORS_HEADERS,
        });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        global: {
            headers: {
                "x-edges-runtime": "deno",
            },
        },
    });

    // Verify user is valid
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        console.error("Auth error:", authError);
        return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
            status: 401,
            headers: CORS_HEADERS,
        });
    }

    // Check user roles - allowing admin and clinical staff
    const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

    const allowedRoles = ["admin", "physician", "nurse_practitioner", "physician_assistant", "clinical_staff", "back_office"];
    const hasAccess = roles?.some((r: any) => allowedRoles.includes(r.role));

    if (!hasAccess) {
        console.error("User does not have permission:", user.id);
        return new Response(JSON.stringify({ error: "Forbidden: Insufficient permissions" }), {
            status: 403,
            headers: CORS_HEADERS,
        });
    }

    let payload: any;
    try {
        payload = await req.json();
        console.log("Payload received for user", user.id);
    } catch {
        return new Response(
            JSON.stringify({
                error: "Invalid JSON",
            }),
            {
                status: 400,
                headers: CORS_HEADERS,
            }
        );
    }
    const userId = payload?.userId;
    if (!userId)
        return new Response(
            JSON.stringify({
                error: "Missing userId (submission ID) in payload",
            }),
            {
                status: 400,
                headers: CORS_HEADERS,
            }
        );

    const labs = payload?.labs ?? {};
    const lipid = labs.lipid ?? {};
    const a1c = labs.a1c ?? {};

    let labSection = "";
    if (lipid.total !== undefined)
        labSection += `Total Cholesterol: ${lipid.total}\nLDL: ${lipid.ldl}\nHDL: ${lipid.hdl
            }\nTriglycerides: ${lipid.triglycerides}\n${lipid.report_url ? `Report URL: ${lipid.report_url}\n` : ""
            }\n\n`;
    if (a1c.value !== undefined)
        labSection += `A1c: ${a1c.value}\n${a1c.report_url ? `Report URL: ${a1c.report_url}\n` : ""
            }`;

    const prompt = `
You are a licensed medical provider. Produce a concise note with:
- Assessment
- Treatment Plan (Eligible/Ineligible with reasons)
- Provider Summary (2-3 lines)

Use only these sections. Do not include internal instructions.

Questionnaire JSON:
<<<
${JSON.stringify(payload, null, 2)}
>>>

${labSection ? `Labs:\n${labSection}` : ""}
`;

    let providerText: string;
    try {
        providerText = await generateProviderNote(prompt, OPENAI_API_KEY);
    } catch (e: any) {
        console.error("AI failed:", e);
        return new Response(
            JSON.stringify({
                error: "AI generation failed",
            }),
            {
                status: 502,
                headers: CORS_HEADERS,
            }
        );
    }
    let pdfBytes: Uint8Array;
    try {
        pdfBytes = await pdfFromPayloadAndNote(payload, providerText);
    } catch (e: any) {
        console.error("PDF failed:", e);
        return new Response(
            JSON.stringify({
                error: "PDF generation failed",
            }),
            {
                status: 500,
                headers: CORS_HEADERS,
            }
        );
    }
    const timestamp = Date.now();
    const safeFolder = `user_${String(userId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const fileName = `${safeFolder}/provider_note_${userId}_${timestamp}.pdf`;
    const bucket = BUCKET_NAME;
    const upload = await supabase.storage
        .from(bucket)
        .upload(fileName, pdfBytes, {
            contentType: "application/pdf",
            upsert: false,
        });
    if (upload.error) {
        console.error("Upload error:", upload.error.message);
        return new Response(
            JSON.stringify({
                error: "Storage upload failed",
            }),
            {
                status: 500,
                headers: CORS_HEADERS,
            }
        );
    }
    let fileUrl: string | null = null;
    if (BUCKET_PUBLIC) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        fileUrl = data?.publicUrl ?? null;
    } else {
        const { data } = await supabase.storage
            .from(bucket)
            .createSignedUrl(fileName, 60 * 60 * 24 * 7);
        fileUrl = data?.signedUrl ?? null;
    }
    const updatePayload = {
        provider_note_report: fileUrl ?? `storage://${bucket}/${fileName}`,
    };
    const upd = await supabase
        .from("form_submissions")
        .update(updatePayload)
        .eq("id", userId)
        .select()
        .maybeSingle();
    if (upd.error) {
        console.error("DB error:", upd.error.message);
        return new Response(
            JSON.stringify({
                error: "DB update failed",
            }),
            {
                status: 500,
                headers: CORS_HEADERS,
            }
        );
    }
    return new Response(
        JSON.stringify({
            success: true,
            url: updatePayload.provider_note_report,
            path: fileName,
        }),
        {
            status: 200,
            headers: CORS_HEADERS,
        }
    );
});
