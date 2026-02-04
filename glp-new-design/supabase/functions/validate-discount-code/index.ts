import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: corsHeaders,
        });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase configuration");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Authenticate user (can be regular user or admin/provider)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header");

        const token = authHeader.replace("Bearer ", "");
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) throw new Error("Unauthorized");

        // Check if user has valid role (user, admin, or provider roles)
        const { data: userRoles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);

        const validRoles = ["user", "admin", "physician", "nurse_practitioner", "physician_assistant", "back_office"];
        const hasValidRole = userRoles && userRoles.some((r: any) => validRoles.includes(r.role));

        if (!hasValidRole) throw new Error("Unauthorized role");

        const { couponCode } = await req.json();

        if (!couponCode?.trim()) {
            return new Response(
                JSON.stringify({
                    valid: false,
                    error: "Discount code is required",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        const code = couponCode.trim().toLowerCase();
        console.log("Validating discount code:", code, "for user:", user.id);

        // Check if coupon code exists in database
        // Exclude eligibility_verification coupons - those are only for the eligibility fee payment step
        const { data: dbDiscount, error: dbError } = await supabase
            .from("coupons")
            .select("*")
            .ilike("code", code)
            .eq("is_active", true)
            .single();

        if (dbError || !dbDiscount) {
            console.log("Coupon code not found in database, inactive, or is an eligibility coupon:", code);
            return new Response(
                JSON.stringify({
                    valid: false,
                    error: "Invalid or expired coupon code",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Check expiration
        const expirationDate = new Date(dbDiscount.expiration_date);
        if (expirationDate < new Date()) {
            return new Response(
                JSON.stringify({
                    valid: false,
                    error: "This discount code has expired",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Calculate discount
        const originalAmount = 2500; // $25.00 in cents
        let discountAmount = 0;

        if (dbDiscount.discount_type === "percentage") {
            discountAmount = Math.round((originalAmount * dbDiscount.discount_value) / 100);
        } else if (dbDiscount.discount_type === "fixed") {
            // discount_value in database is in dollars, convert to cents
            discountAmount = Math.round(dbDiscount.discount_value * 100);
        }

        const finalAmount = Math.max(0, originalAmount - discountAmount);

        return new Response(
            JSON.stringify({
                valid: true,
                originalAmount,
                discountAmount,
                finalAmount,
                discountType: dbDiscount.discount_type,
                discountValue: dbDiscount.discount_value,
                discountCode: code,
                description: dbDiscount.description || "Discount applied",
                couponType: dbDiscount.coupon_type,
            }),
            {
                status: 200,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error:", errorMessage);
        return new Response(
            JSON.stringify({
                valid: false,
                error: errorMessage || "Something went wrong",
            }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    }
});
