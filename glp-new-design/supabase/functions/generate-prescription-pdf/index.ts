import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MedRow {
    label: string;
    qty?: string;
    selected?: boolean;
    alternative_sig?: string;
    refills?: string;
}

interface PrescriptionData {
    provider_name?: string;
    date?: string;
    patient_name?: string;
    patient_dob?: string;
    patient_address?: string;
    patient_phone?: string;
    patient_email?: string;
    drug_allergies?: string;
    semaglutideRows?: MedRow[];
    semaglutide_alternative_sig?: string;
    semaglutide_refills?: string;
    tirzepatideRows?: MedRow[];
    tirzepatide_alternative_sig?: string;
    tirzepatide_refills?: string;
    diag_e11_8?: boolean;
    diag_e66_9?: boolean;
    diag_e66_3?: boolean;
    nec_vitb12_deficiency?: boolean;
    nec_no_adequate_food?: boolean;
    nec_appetite_suppressant?: boolean;
    nec_adverse_medication?: boolean;
    dispense_as_written_signature?: string;
    electronic_signature?: string;
    signature_date?: string;
}

const handler = async (req: Request): Promise<Response> => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log("Starting prescription PDF generation...");

        // Verify authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            console.error("No authorization header");
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verify user is admin or provider
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth error:", authError);
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Check user role
        const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);

        const allowedRoles = ["admin", "physician", "nurse_practitioner", "physician_assistant", "back_office"];
        const hasAccess = roles?.some((r: any) => allowedRoles.includes(r.role));

        if (!hasAccess) {
            console.error("User does not have permission");
            return new Response(JSON.stringify({ error: "Access denied" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const data: PrescriptionData = await req.json();
        console.log("Received prescription data:", JSON.stringify(data, null, 2));

        // Create PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // Letter size
        const { width, height } = page.getSize();

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let y = height - 50;
        const leftMargin = 50;
        const lineHeight = 16;

        // Helper function to draw text
        const drawText = (text: string, x: number, yPos: number, options: { font?: any; size?: number; color?: any } = {}) => {
            page.drawText(text, {
                x,
                y: yPos,
                font: options.font || font,
                size: options.size || 10,
                color: options.color || rgb(0, 0, 0),
            });
        };

        // Helper function to draw checkbox - aligned with text baseline
        const drawCheckbox = (x: number, yPos: number, checked: boolean) => {
            page.drawRectangle({
                x,
                y: yPos - 2,
                width: 10,
                height: 10,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });
            if (checked) {
                // Use "X" instead of checkmark as WinAnsi encoding doesn't support Unicode checkmarks
                drawText("X", x + 2, yPos, { font: boldFont, size: 8 });
            }
        };

        // Title
        drawText("GLP-GLOW", width / 2 - 40, y, { font: boldFont, size: 24 });
        y -= 35;

        // Provider and Date
        drawText("Provider Name:", leftMargin, y, { font: boldFont, size: 10 });
        drawText(data.provider_name || "", leftMargin + 90, y);
        drawText("Date:", width / 2 + 50, y, { font: boldFont, size: 10 });
        drawText(data.date || "", width / 2 + 80, y);
        y -= 25;

        // Divider line
        page.drawLine({
            start: { x: leftMargin, y },
            end: { x: width - leftMargin, y },
            thickness: 1,
            color: rgb(0, 0, 0),
        });
        y -= 20;

        // Patient Information Box
        drawText("PATIENT INFORMATION", leftMargin, y, { font: boldFont, size: 12 });
        y -= lineHeight;

        // Draw box around patient info
        const boxStartY = y + 10;

        drawText("Patient Name:", leftMargin + 5, y, { font: boldFont, size: 9 });
        drawText(data.patient_name || "", leftMargin + 85, y, { size: 9 });
        y -= lineHeight;

        drawText("DOB:", leftMargin + 5, y, { font: boldFont, size: 9 });
        drawText(data.patient_dob || "", leftMargin + 35, y, { size: 9 });
        y -= lineHeight;

        drawText("Address:", leftMargin + 5, y, { font: boldFont, size: 9 });
        drawText(data.patient_address || "", leftMargin + 55, y, { size: 9 });
        y -= lineHeight;

        drawText("Phone:", leftMargin + 5, y, { font: boldFont, size: 9 });
        drawText(data.patient_phone || "", leftMargin + 45, y, { size: 9 });
        drawText("Email:", width / 2, y, { font: boldFont, size: 9 });
        drawText(data.patient_email || "", width / 2 + 40, y, { size: 9 });
        y -= lineHeight;

        drawText("Drug Allergies:", leftMargin + 5, y, { font: boldFont, size: 9 });
        drawText(data.drug_allergies || "None", leftMargin + 85, y, { size: 9 });
        y -= 10;

        // Draw patient info box
        page.drawRectangle({
            x: leftMargin,
            y: y,
            width: width - (leftMargin * 2),
            height: boxStartY - y,
            borderColor: rgb(0, 0, 0),
            borderWidth: 2,
        });
        y -= 25;

        // Semaglutide Section
        if (data.semaglutideRows && data.semaglutideRows.length > 0) {
            // Section header with background
            page.drawRectangle({
                x: leftMargin,
                y: y - 5,
                width: width - (leftMargin * 2),
                height: 18,
                color: rgb(0.9, 0.9, 0.9),
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });
            drawText("Semaglutide 2.5 mg/mL | Cyanocobalamin 0.5mg/mL", leftMargin + 5, y, { font: boldFont, size: 10 });
            y -= 25;

            for (const row of data.semaglutideRows) {
                drawCheckbox(leftMargin, y, true);
                drawText(row.label, leftMargin + 18, y, { size: 8 });
                if (row.qty) {
                    drawText(row.qty, width - leftMargin - 60, y, { font: boldFont, size: 8 });
                }
                y -= lineHeight;

                // Alternative Sig line (default)
                drawText("Alternative Sig: ____________________", leftMargin + 18, y, { size: 8 });
                y -= lineHeight;
                // Refills line (default)
                drawText("Refills: ____________________", leftMargin + 18, y, { size: 8 });
                y -= lineHeight;
            }
            y -= 10;
        }

        // Tirzepatide Section
        if (data.tirzepatideRows && data.tirzepatideRows.length > 0) {
            // Section header with background
            page.drawRectangle({
                x: leftMargin,
                y: y - 5,
                width: width - (leftMargin * 2),
                height: 18,
                color: rgb(0.9, 0.9, 0.9),
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });
            drawText("Tirzepatide 30 mg/mL | Cyanocobalamin 0.5mg/mL", leftMargin + 5, y, { font: boldFont, size: 10 });
            y -= 25;

            for (const row of data.tirzepatideRows) {
                drawCheckbox(leftMargin, y, true);
                drawText(row.label, leftMargin + 18, y, { size: 8 });
                if (row.qty) {
                    drawText(row.qty, width - leftMargin - 60, y, { font: boldFont, size: 8 });
                }
                y -= lineHeight;

                // Alternative Sig line (default)
                drawText("Alternative Sig: ____________________", leftMargin + 18, y, { size: 8 });
                y -= lineHeight;
                // Refills line (default)
                drawText("Refills: ____________________", leftMargin + 18, y, { size: 8 });
                y -= lineHeight;
            }
            y -= 10;
        }

        // Diagnosis Section
        page.drawLine({
            start: { x: leftMargin, y: y + 5 },
            end: { x: width - leftMargin, y: y + 5 },
            thickness: 2,
            color: rgb(0, 0, 0),
        });
        y -= 15;

        drawText("Diagnosis:", leftMargin, y, { font: boldFont, size: 10 });
        y -= lineHeight;

        drawCheckbox(leftMargin, y, data.diag_e11_8 || false);
        drawText("E11.8 Type 2 Diabetes Mellitus", leftMargin + 18, y, { size: 9 });
        y -= lineHeight;

        drawCheckbox(leftMargin, y, data.diag_e66_9 || false);
        drawText("E66.9 Obesity", leftMargin + 18, y, { size: 9 });
        y -= lineHeight;

        drawCheckbox(leftMargin, y, data.diag_e66_3 || false);
        drawText("E66.3 Overweight", leftMargin + 18, y, { size: 9 });
        y -= 20;

        // Medical Necessity
        drawText("MUST include at least one for medical necessity:", leftMargin, y, { font: boldFont, size: 10 });
        y -= lineHeight;

        drawCheckbox(leftMargin, y, data.nec_vitb12_deficiency || false);
        drawText("Vit B12 Deficiency", leftMargin + 18, y, { size: 9 });
        y -= lineHeight;

        drawCheckbox(leftMargin, y, data.nec_no_adequate_food || false);
        drawText("Lack of Adequate Food", leftMargin + 18, y, { size: 9 });
        y -= lineHeight;

        drawCheckbox(leftMargin, y, data.nec_appetite_suppressant || false);
        drawText("Adverse Effect of Appetite Suppressant", leftMargin + 18, y, { size: 9 });
        y -= lineHeight;

        drawCheckbox(leftMargin, y, data.nec_adverse_medication || false);
        drawText("Adverse Effect of Medication", leftMargin + 18, y, { size: 9 });
        y -= 25;

        // Required Note Box
        const noteText = "The sterile compound medications above are made at the request of the signed prescribing practitioner below due to a patient-specific medical need and the preparation producing a clinically significant therapeutic response compared to a commercially available product.";

        page.drawRectangle({
            x: leftMargin,
            y: y - 35,
            width: width - (leftMargin * 2),
            height: 45,
            color: rgb(1, 0.98, 0.88),
            borderColor: rgb(0, 0, 0),
            borderWidth: 2,
        });

        // Word wrap the note text
        const words = noteText.split(" ");
        let line = "";
        let noteY = y - 5;
        for (const word of words) {
            const testLine = line + word + " ";
            if (testLine.length > 100) {
                drawText(line.trim(), leftMargin + 5, noteY, { font: boldFont, size: 8 });
                line = word + " ";
                noteY -= 10;
            } else {
                line = testLine;
            }
        }
        if (line) {
            drawText(line.trim(), leftMargin + 5, noteY, { font: boldFont, size: 8 });
        }
        y -= 60;

        // Dispense As Written – Prescriber Electronic Signature Section
        const dawY = y - 10;

        // Draw the DAW signature in a script-like style
        const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
        if (data.dispense_as_written_signature) {
            drawText(data.dispense_as_written_signature, leftMargin + 5, dawY - 5, { font: italicFont, size: 16 });
        }

        // Draw a line under the signature
        page.drawLine({
            start: { x: leftMargin + 5, y: dawY - 10 },
            end: { x: leftMargin + 250, y: dawY - 10 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Title text with capitalize case
        drawText("Dispense As Written – Prescriber Electronic Signature", leftMargin + 5, dawY - 25, { font: boldFont, size: 10 });

        // Signature date
        const sigDateText = data.signature_date
            ? `Electronically signed on: ${data.signature_date}`
            : `Electronically signed on: ${new Date().toISOString().split('T')[0]}`;
        drawText(sigDateText, leftMargin + 5, dawY - 40, { size: 9 });

        // Generate PDF bytes
        const pdfBytes = await pdfDoc.save();
        console.log("PDF generated, size:", pdfBytes.length, "bytes");

        // Upload to Supabase Storage
        const fileName = `prescription_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`;
        const filePath = `prescriptions/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("provider_reports")
            .upload(filePath, pdfBytes, {
                contentType: "application/pdf",
                upsert: false,
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            throw new Error(`Failed to upload PDF: ${uploadError.message}`);
        }

        console.log("PDF uploaded successfully:", filePath);

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("provider_reports")
            .getPublicUrl(filePath);

        // Since the bucket is private, create a signed URL
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from("provider_reports")
            .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

        if (signedUrlError) {
            console.error("Signed URL error:", signedUrlError);
            throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
        }

        console.log("Signed URL created:", signedUrlData.signedUrl);

        return new Response(
            JSON.stringify({
                success: true,
                url: signedUrlData.signedUrl,
                path: filePath
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error: any) {
        console.error("Error generating prescription PDF:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Failed to generate prescription PDF" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
};

serve(handler);
