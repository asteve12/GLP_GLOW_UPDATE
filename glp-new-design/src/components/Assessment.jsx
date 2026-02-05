import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Navbar from './Navbar';
import Footer from './Footer';
import { gsap } from 'gsap';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Assets
import weightLossImg from '../assets/weight-loss.png';
import hairLossImg from '../assets/hair-loss.png';
import mensHealthImg from '../assets/mens-health.png';
import longevityImg from '../assets/longevity.png';
import smilingImg from '../assets/happy_people.png';
import alabamaMapImg from '../assets/us_map_alabama.png';
import ongoingSupportImg from '../assets/ongoing_support.png';
import smilingDoctorImg from '../assets/smiling_doctor.png';
import happyPatientImg from '../assets/happy_patient.webp';

import { categoryQuestions as baseCategoryQuestions, intakeQuestions } from '../data/questions';

const categoryQuestions = {
    ...baseCategoryQuestions,
    'weight-loss': { ...baseCategoryQuestions['weight-loss'], stat: { ...baseCategoryQuestions['weight-loss'].stat, image: happyPatientImg } },
    'hair-restoration': { ...baseCategoryQuestions['hair-restoration'], stat: { ...baseCategoryQuestions['hair-restoration'].stat, image: smilingImg } },
    'sexual-health': { ...baseCategoryQuestions['sexual-health'], stat: { ...baseCategoryQuestions['sexual-health'].stat, image: smilingImg } },
    'longevity': { ...baseCategoryQuestions['longevity'], stat: { ...baseCategoryQuestions['longevity'].stat, image: smilingImg } },
};

const stateFullNames = {
    'AZ': 'Arizona',
    'CO': 'Colorado',
    'DC': 'Washington D.C.',
    'FL': 'Florida (No Sterile Compounds)',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'MD': 'Maryland',
    'MO': 'Missouri',
    'NE': 'Nebraska',
    'NY': 'New York',
    'NC': 'North Carolina',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'WA': 'Washington',
    'WI': 'Wisconsin'
};

const CheckoutForm = ({ onComplete, amount, couponCode, categoryId }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { session } = useAuth();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements || !session) return;

        setProcessing(true);
        setError(null);

        try {
            // 1. Submit the form
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setError(submitError.message);
                setProcessing(false);
                return;
            }

            // 2. Create the PaymentIntent on the server
            const { data, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
                method: 'POST',
                body: {
                    couponCode: couponCode || null,
                    amount: amount,
                    type: 'eligibility_verification',
                    categoryId: categoryId
                },
                headers: {
                    'x-customer-authorization': `Bearer ${session.access_token}`,
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                }
            });

            if (intentError || !data?.clientSecret) {
                throw new Error(data?.error || intentError?.message || 'Failed to initialize payment.');
            }

            // 3. Confirm the payment
            const { paymentIntent, error: confirmError } = await stripe.confirmPayment({
                elements,
                clientSecret: data.clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/dashboard?payment=success`,
                },
                redirect: 'if_required'
            });

            if (confirmError) {
                setError(confirmError.message);
            } else {
                // If we get here and there's a paymentIntent, it means the payment succeeded without a redirect
                // Capture the payment method ID and update profile
                const pmId = typeof paymentIntent.payment_method === 'string'
                    ? paymentIntent.payment_method
                    : paymentIntent.payment_method?.id;

                if (paymentIntent && pmId) {
                    console.log('Captured payment method:', pmId);
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({ stripe_payment_method_id: pmId })
                        .eq('id', session.user.id);

                    if (profileError) {
                        console.error('Profile update failed during checkout:', profileError.message);
                    } else {
                        console.log('Profile updated with payment method.');
                    }
                }
                onComplete();
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (!stripe || !elements) {
        return (
            <div className="p-12 bg-white/5 border border-white/10 rounded-[32px] animate-pulse flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Securing Connection...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="payment-element-container bg-white/5 border border-white/10 p-6 rounded-[24px] focus-within:border-accent-green transition-all">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        theme: 'night',
                        variables: {
                            colorPrimary: '#bfff00',
                            colorBackground: 'transparent',
                            colorText: '#ffffff',
                            colorDanger: '#df1b41',
                            fontFamily: 'Outfit, sans-serif',
                            spacingUnit: '4px',
                            borderRadius: '16px',
                        },
                        rules: {
                            '.Input': {
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            },
                        }
                    }}
                />
            </div>
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center italic">
                    {error}
                </div>
            )}
            <button
                type="submit"
                disabled={!stripe || processing}
                className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all relative overflow-hidden group ${processing
                    ? 'bg-white/5 text-white/20 cursor-wait'
                    : 'bg-white text-black hover:bg-accent-green hover:shadow-[0_0_60px_rgba(191,255,0,0.5)] transform hover:scale-[1.02]'
                    }`}
            >
                <span className="relative z-10">
                    {processing ? 'Processing Securely...' : `Process Activation • $${(amount / 100).toFixed(2)}`}
                </span>
            </button>
        </form>
    );
};



const Assessment = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();
    const { signUp, signIn, user } = useAuth();
    const [step, setStep] = useState(0);
    const [selectedImprovements, setSelectedImprovements] = useState([]);
    const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'signin'
    const [authData, setAuthData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
    });
    const [medicalStep, setMedicalStep] = useState(0);
    const [intakeData, setIntakeData] = useState({});
    const [summaryData, setSummaryData] = useState({});
    const [eligibilityData, setEligibilityData] = useState({
        sex: 'male',
        dob: '',
        state: '',
        phone: '',
        consent: false,
        pcpVisitLast6Months: '',
        labResults: []
    });
    const [idData, setIdData] = useState({ type: '', number: '', file: null });
    const [shippingData, setShippingData] = useState({ address: '', city: '', state: '', zip: '', phone: '' });
    const [paymentData, setPaymentData] = useState({ cardNumber: '', expiry: '', cvc: '', coupon: '' });
    const [showStripe, setShowStripe] = useState(false);
    const [stateSearch, setStateSearch] = useState('');
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [uploading, setUploading] = useState(null); // Track which file is being uploaded
    const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
    const [showVerificationSent, setShowVerificationSent] = useState(false);
    const [triedToContinue, setTriedToContinue] = useState(false);

    // Persistence Logic
    const STORAGE_KEY = `glp_assessment_v1_${categoryId}`;

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.step) setStep(data.step);
                if (data.selectedImprovements) setSelectedImprovements(data.selectedImprovements);
                if (data.medicalStep) setMedicalStep(data.medicalStep);
                if (data.intakeData) setIntakeData(data.intakeData);
                if (data.eligibilityData) setEligibilityData(data.eligibilityData);
                if (data.idData) setIdData(data.idData);
                if (data.shippingData) setShippingData(data.shippingData);
            } catch (e) {
                console.error("Error loading saved progress", e);
            }
        }
    }, [categoryId]);

    useEffect(() => {
        if (step > 0 && step < 13) {
            const dataToSave = {
                step,
                selectedImprovements,
                medicalStep,
                intakeData,
                eligibilityData,
                idData,
                shippingData
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        }
    }, [step, selectedImprovements, medicalStep, intakeData, eligibilityData, idData, shippingData, STORAGE_KEY]);

    const handleClearProgress = () => {
        if (window.confirm("Are you sure you want to stop? All your progress and answers will be permanently lost.")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload(); // Hard reset
        }
    };

    const handleFileUpload = async (file, folder, onComplete) => {
        if (!file) return;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        setUploading(folder);
        try {
            const { data, error } = await supabase.storage
                .from('assessment-uploads')
                .upload(filePath, file);

            if (error) throw error;

            const { data: signedData, error: signedError } = await supabase.storage
                .from('assessment-uploads')
                .createSignedUrl(filePath, 31536000); // 1 year in seconds

            if (signedError) throw signedError;

            onComplete(signedData.signedUrl);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading file. Please try again.');
        } finally {
            setUploading(null);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);

        // Premium transition
        gsap.fromTo(".assessment-step",
            { opacity: 0, y: 30, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power4.out" }
        );
    }, [step, medicalStep]);

    useEffect(() => {
        const checkExisting = async () => {
            if (!user || !categoryId) return;
            const { data, error } = await supabase
                .from('form_submissions')
                .select('id')
                .eq('user_id', user.id)
                .eq('selected_drug', categoryId)
                .single();

            if (data) {
                setHasExistingSubmission(true);
            } else if (step === 13) {
                // If they are on the success step but no submission exists (e.g. deleted),
                // reset to the beginning so they can retake it.
                setStep(0);
                localStorage.removeItem(STORAGE_KEY);
            }
        };
        checkExisting();
    }, [user, categoryId, step, navigate, STORAGE_KEY]);

    // Auto-fill shipping phone from eligibility phone if available
    useEffect(() => {
        if (step === 11 && !shippingData.phone && eligibilityData.phone) {
            setShippingData(prev => ({ ...prev, phone: eligibilityData.phone }));
        }
    }, [step, eligibilityData.phone]);

    const handleSubmitAssessment = async () => {
        if (hasExistingSubmission) {
            alert('You have already submitted an assessment for this category.');
            return;
        }
        setSubmitLoading(true);
        try {
            // Helper to parse height "5'10"" into feet and inches
            const parseHeight = (h) => {
                if (!h) return { feet: 0, inches: 0 };
                const match = h.match(/(\d+)'\s*(\d*)/);
                if (match) {
                    return {
                        feet: parseInt(match[1]) || 0,
                        inches: parseInt(match[2]) || 0
                    };
                }
                const val = parseInt(h);
                if (!isNaN(val)) return { feet: Math.floor(val / 12), inches: val % 12 };
                return { feet: 0, inches: 0 };
            };

            const h = parseHeight(intakeData.height);
            const weightVal = parseFloat(intakeData.weight) || 0;
            const heightInInches = (h.feet * 12) + h.inches;
            const bmiVal = heightInInches > 0 ? (weightVal / (heightInInches * heightInInches)) * 703 : 0;

            const firstName = user?.user_metadata?.first_name || authData.firstName || '';
            const lastName = user?.user_metadata?.last_name || authData.lastName || '';
            const fullName = user?.user_metadata?.full_name || `${firstName} ${lastName}`.trim();

            // Prepare submission data mapping
            const submissionData = {
                user_id: user?.id,
                goals: Array.isArray(selectedImprovements) ? selectedImprovements : [],
                custom_goal: intakeData.other_goal_details || "",

                // Biometrics
                height_feet: h.feet,
                height_inches: h.inches,
                weight: weightVal,
                bmi: parseFloat(bmiVal.toFixed(1)),

                // Basics
                sex: eligibilityData.sex,
                birthday: eligibilityData.dob,
                state: eligibilityData.state,
                seen_pcp: eligibilityData.pcpVisitLast6Months,
                email: user?.email || authData.email,

                // Medical Conditions (Weight Loss Mapping)
                heart_conditions: Array.isArray(intakeData.heart) ? intakeData.heart : (intakeData.heart ? [intakeData.heart] : []),
                atrial_fib_change: intakeData.afib_follow || null,
                hormone_conditions: Array.isArray(intakeData.hormone) ? intakeData.hormone : (intakeData.hormone ? [intakeData.hormone] : []),
                cancer_history: intakeData.cancer === 'Yes' ? [`Yes: ${intakeData.cancer_details || ''}`] : (intakeData.cancer ? [intakeData.cancer] : []),
                diabetes_status: intakeData.diabetes || null,
                gi_conditions: Array.isArray(intakeData.gi) ? intakeData.gi : (intakeData.gi ? [intakeData.gi] : []),
                mental_health_conditions: Array.isArray(intakeData.mental) ? intakeData.mental : (intakeData.mental ? [intakeData.mental] : []),
                anxiety_severity: intakeData.anxiety_sev || null,
                additional_conditions: Array.isArray(intakeData.additional) ? intakeData.additional : (intakeData.additional ? [intakeData.additional] : []),

                // Lifestyle & Impact
                weight_impact_qol: intakeData.qol_rate || null,
                weight_impact_details: Array.isArray(intakeData.qol_details) ? intakeData.qol_details : (intakeData.qol_details ? [intakeData.qol_details] : []),

                // Medications & Allergies
                allergies: intakeData.allergies || null,
                current_medications: Array.isArray(intakeData.current_meds) ? intakeData.current_meds : (intakeData.current_meds ? [intakeData.current_meds] : []),
                other_medications: intakeData.supplements || null,
                past_weight_loss_methods: Array.isArray(intakeData.past_methods) ? intakeData.past_methods : (intakeData.past_methods ? [intakeData.past_methods] : []),
                past_prescription_meds: Array.isArray(intakeData.past_rx) ? intakeData.past_rx : (intakeData.past_rx ? [intakeData.past_rx] : []),

                // Identity & Diversity
                race_ethnicity: intakeData.ethnicity ? [intakeData.ethnicity] : [],
                other_health_goals: Array.isArray(intakeData.other_goals) ? intakeData.other_goals : (intakeData.other_goals ? [intakeData.other_goals] : []),
                has_additional_info: intakeData.additional_info || "No",
                additional_health_info: intakeData.additional_info_details || null,

                // Identification
                identification_type: idData.type,
                identification_number: idData.number,
                identification_url: idData.file_url,

                // Shipping
                shipping_first_name: firstName,
                shipping_last_name: lastName,
                shipping_street: shippingData.address,
                shipping_city: shippingData.city,
                shipping_state: shippingData.state,
                shipping_zip: shippingData.zip,
                shipping_phone: shippingData.phone,
                shipping_email: user?.email || authData.email,

                // Metadata
                approval_status: 'pending',
                submitted_at: new Date().toISOString(),
                selected_drug: categoryId,
                lab_results_url: Array.isArray(eligibilityData.labResults) ? eligibilityData.labResults : (eligibilityData.labResults ? [eligibilityData.labResults] : []),
                coupon_code: paymentData.coupon || null,

                // Dosage Preferences
                dosage_preference: intakeData.medication_interest === 'Other / Not Sure' ? `Other: ${intakeData.other_medication_details || ''}` : (intakeData.medication_interest || null),
                glp1_prescription_url: intakeData.current_meds_file ? [intakeData.current_meds_file] : [],

                // POLYMORPHIC CATCH-ALL:
                // Ensures specialized data for Hair, Sexual Health, and Longevity 
                // is NEVER lost even if it doesn't have a dedicated column above.
                medical_responses: intakeData
            };

            // 1. Submit the form data
            const { error: submitError } = await supabase
                .from('form_submissions')
                .insert([submissionData]);

            if (submitError) throw submitError;

            // 2. Explicitly update the profile table to ensure email and names are stored
            // This acts as a secondary sync in case triggers are missing
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    email: user?.email || authData.email,
                    gender: eligibilityData.sex,
                    date_of_birth: eligibilityData.dob,
                    phone_number: shippingData.phone || eligibilityData.phone,
                    legal_address: `${shippingData.address}, ${shippingData.city}, ${shippingData.state} ${shippingData.zip}`
                })
                .eq('id', user?.id);

            if (profileError) {
                console.warn("Note: Profile update separate from submission failed, but submission succeeded:", profileError.message);
                // We don't throw here to avoid blocking the success screen if it's just an RLS/schema issue on profiles
            }

            console.log("Assessment submitted successfully!");

            // Send confirmation email if discount is 100% off
            const isFree = (() => {
                const base = 2500; // in cents
                const disc = paymentData.appliedDiscount;
                if (!disc) return false;
                if (disc.discountType === 'percentage') {
                    return Math.round(base * (1 - disc.discountValue / 100)) === 0;
                } else {
                    return Math.max(0, base - (disc.discountValue * 100)) === 0;
                }
            })();

            if (isFree) {
                await supabase.functions.invoke('send-email', {
                    body: {
                        userId: user?.id,
                        email: user?.email || authData.email,
                        first_name: firstName,
                        last_name: lastName,
                        type: 'eligibility'
                    }
                });
            }

            localStorage.removeItem(STORAGE_KEY); // Clear progress on success
            setStep(13); // Go to success step
        } catch (error) {
            console.error('Error submitting assessment:', error);
            alert('Failed to submit assessment. Please try again.');
        } finally {
            setSubmitLoading(false);
        }
    };


    // If user is already logged in, we can potentially skip auth step if we trigger it
    useEffect(() => {
        if (user && step === 6) {
            setStep(7);
        }
    }, [user, step]);

    const handleAuthSubmit = async () => {
        setAuthLoading(true);
        setAuthError(null);
        try {
            if (authMode === 'signup') {
                const { error } = await signUp({
                    email: authData.email,
                    password: authData.password,
                    options: {
                        data: {
                            full_name: `${authData.firstName} ${authData.lastName}`,
                            first_name: authData.firstName,
                            last_name: authData.lastName,
                            email: authData.email
                        },
                        emailRedirectTo: `${window.location.origin}/dashboard`
                    }
                });
                if (error) throw error;
                setShowVerificationSent(true);
                return;
            } else {
                const { error } = await signIn({
                    email: authData.email,
                    password: authData.password
                });
                if (error) throw error;
            }
            setStep(4);
        } catch (err) {
            setAuthError(err.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const categoryData = categoryQuestions[categoryId] || categoryQuestions['weight-loss'];
    const medicalQuestions = intakeQuestions[categoryId] || intakeQuestions['weight-loss'];

    // Moved GSAP effect to top-level effects to prevent hook ordering issues


    if (hasExistingSubmission) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-accent-green/10 rounded-full flex items-center justify-center mb-6 border border-accent-green/20">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bfff00" strokeWidth="2">
                        <path d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Already <span className="text-accent-green">Submitted</span></h2>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest max-w-xs mb-8">
                    You have an active record for this category. Please check your dashboard for updates.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/')} className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Go Home</button>
                    <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-accent-green text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Dashboard</button>
                </div>
            </div>
        );
    }

    const toggleImprovement = (id) => {
        setSelectedImprovements(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleContinue = () => {
        if (selectedImprovements.length > 0) {
            setStep(1); // Move to the new stat step
        }
    };

    const renderStep0 = () => (
        <div className="assessment-step max-w-5xl mx-auto py-20 px-6">
            <div className="text-center mb-16">
                <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                    {categoryData.title} • Module 01
                </div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-6 italic">
                    {categoryData.question[0]} <br />
                    <span className="text-accent-green text-opacity-80">{categoryData.question[1]}</span>
                </h1>
                <p className="text-white/40 font-medium uppercase tracking-[0.3em] text-[10px]">
                    Select all that apply
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                {categoryData.improvements.map((opt) => {
                    const isSelected = selectedImprovements.includes(opt.id);
                    return (
                        <div
                            key={opt.id}
                            onClick={() => toggleImprovement(opt.id)}
                            className={`group relative p-8 rounded-[40px] cursor-pointer transition-all duration-700 border-2 overflow-hidden ${isSelected
                                ? 'border-accent-green bg-accent-green/5 shadow-[0_0_50px_rgba(191,255,0,0.1)]'
                                : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                                }`}
                        >
                            <div className="relative z-10">
                                <h3 className={`text-2xl font-black uppercase tracking-tighter italic mb-3 transition-colors duration-500 ${isSelected ? 'text-accent-green' : 'text-white'}`}>
                                    {opt.name}
                                </h3>
                                <p className="text-white/40 text-sm font-medium leading-relaxed">
                                    {opt.desc}
                                </p>
                            </div>

                            {/* Selection indicator */}
                            <div className={`absolute top-8 right-8 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-accent-green border-accent-green scale-110' : 'border-white/10 opacity-30 group-hover:opacity-100'
                                }`}>
                                {isSelected && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </div>

                            {/* Subtle Background Glow */}
                            <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isSelected ? 'opacity-10' : 'opacity-0'}`}>
                                <div className="absolute inset-0 bg-accent-green blur-[80px]"></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                <Link
                    to="/"
                    className="w-full md:w-auto px-12 py-8 bg-white/5 border border-white/10 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-white/30 flex justify-center items-center"
                >
                    Back
                </Link>
                <button
                    onClick={handleContinue}
                    disabled={selectedImprovements.length === 0}
                    className={`w-full md:w-auto px-20 py-8 rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 relative overflow-hidden group ${selectedImprovements.length > 0
                        ? 'bg-white text-black hover:bg-accent-green hover:scale-105 hover:shadow-[0_0_60px_rgba(191,255,0,0.4)]'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                >
                    <span className="relative z-10 flex items-center gap-4">
                        Continue Assessment
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-2 transition-transform">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </span>
                </button>
            </div>
        </div>
    );

    const renderStatStep = () => (
        <div className="assessment-step max-w-6xl mx-auto py-20 px-6 flex flex-col md:flex-row items-center gap-16">
            {/* Left Image Section */}
            <div className="w-full md:w-[450px] aspect-[4/5] rounded-[40px] overflow-hidden relative shadow-2xl group flex-shrink-0">
                <img
                    src={categoryData.stat.image}
                    alt="Statistical validation"
                    className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-accent-green/40 to-transparent mix-blend-overlay"></div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            </div>

            {/* Right Content Section */}
            <div className="flex-1 text-left">
                <h2 className="text-white font-black leading-[0.85] mb-12 tracking-tighter">
                    <span className="text-8xl md:text-[160px] block mb-4 italic">{categoryData.stat.pct}</span>
                    <span className="text-4xl md:text-7xl uppercase block opacity-90">{categoryData.stat.text}</span>
                    <span className="text-4xl md:text-7xl uppercase inline-block bg-accent-green text-black px-4 mt-2 italic">{categoryData.stat.highlight}</span>
                </h2>

                <div className="flex flex-col md:flex-row items-center gap-6">
                    <button
                        onClick={() => setStep(0)}
                        className="w-full md:w-auto px-12 py-8 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-white/30"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => setStep(2)} // Continue to the review step
                        className="w-full md:w-auto px-24 py-8 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:bg-accent-green hover:shadow-[0_0_50px_rgba(191,255,0,0.5)] transform hover:scale-[1.02]"
                    >
                        Continue
                    </button>
                </div>
                <p className="text-white/20 text-xs font-medium tracking-wide uppercase italic text-left mt-10">
                    {categoryData.stat.disclaimer}
                </p>
            </div>
        </div>
    );

    const renderReviewStep = () => (
        <div className="assessment-step max-w-6xl mx-auto py-20 px-6">
            <div className="text-center mb-16">
                <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                    Member Journeys
                </div>
                <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-6">
                    Tremendous <span className="text-accent-green">Results.</span>
                </h2>
                <p className="text-white/40 font-medium uppercase tracking-[0.3em] text-[10px]">
                    Real people achieving clinical breakthroughs with our {categoryId.replace('-', ' ')} Medication .
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                {categoryData.stat.reviews.map((rev, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/5 p-10 rounded-[40px] hover:border-accent-green/30 transition-all duration-700 group relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="inline-block bg-accent-green text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                                {rev.result}
                            </div>
                            <p className="text-2xl font-serif italic text-white/90 leading-tight mb-8">
                                "{rev.text}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-accent-green/20 border border-accent-green/30 flex items-center justify-center font-black text-accent-green text-xs">
                                    {rev.name.charAt(0)}
                                </div>
                                <span className="text-white/40 font-black uppercase tracking-widest text-[10px]">{rev.name}</span>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-accent-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                <button
                    onClick={() => setStep(1)}
                    className="w-full md:w-auto px-12 py-8 bg-white/5 border border-white/10 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-white/30"
                >
                    Back
                </button>
                <button
                    onClick={() => user ? setStep(4) : setStep(3)}
                    className="w-full md:w-auto px-20 py-8 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:bg-accent-green hover:shadow-[0_0_60px_rgba(191,255,0,0.5)] transform hover:scale-105"
                >
                    Finalize My Plan
                </button>
            </div>
        </div>
    );

    const renderAuthStep = () => {
        if (showVerificationSent) {
            return (
                <div className="assessment-step max-w-2xl mx-auto py-20 px-6 animate-in fade-in duration-700">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 rounded-full bg-accent-green/10 border border-accent-green/20 flex items-center justify-center mx-auto mb-8">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-accent-green animate-pulse">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-4">
                            Check Your <span className="text-accent-green">Email.</span>
                        </h2>
                        <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-[10px] max-w-md mx-auto">
                            Clinical verification link transmitted to: <br />
                            <span className="text-white font-black">{authData.email}</span>
                        </p>
                    </div>

                    <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 md:p-12 backdrop-blur-xl text-center">
                        <div className="space-y-6 mb-10 text-left">
                            <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-accent-green font-black">01.</span>
                                <p className="text-xs text-white/60 font-medium">Open the email from GLP-GLOW and click the verification link.</p>
                            </div>
                            <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-accent-green font-black">02.</span>
                                <p className="text-xs text-white/60 font-medium">Verify your ownership to unlock the medical intake portal.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => window.open(`https://${authData.email.split('@')[1]}`, '_blank')}
                                className="w-full py-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 hover:bg-accent-green hover:shadow-[0_0_40px_rgba(191,255,0,0.3)]"
                            >
                                Open Mailbox
                            </button>
                            <button
                                onClick={() => setShowVerificationSent(false)}
                                className="w-full py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 hover:border-white/30"
                            >
                                Back to Sign Up
                            </button>
                        </div>

                        <p className="mt-8 text-[9px] font-black uppercase tracking-[0.3em] text-white/20 italic">
                            Waiting for secure confirmation...
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="assessment-step max-w-2xl mx-auto py-20 px-6">
                <div className="text-center mb-12">
                    <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                        Secure Clinical Portal
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-4">
                        {authMode === 'signup' ? 'Create' : 'Access'} <br />
                        <span className="text-accent-green">Your Account.</span>
                    </h2>
                    <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-[10px]">
                        To view your customized {categoryId.replace('-', ' ')} protocol.
                    </p>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 md:p-12 backdrop-blur-xl">
                    {authError && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest text-center">
                            {authError}
                        </div>
                    )}
                    <div className="space-y-6">
                        {authMode === 'signup' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">First Name</label>
                                    <input
                                        type="text"
                                        placeholder="John"
                                        value={authData.firstName}
                                        onChange={(e) => setAuthData({ ...authData, firstName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">Last Name</label>
                                    <input
                                        type="text"
                                        placeholder="Doe"
                                        value={authData.lastName}
                                        onChange={(e) => setAuthData({ ...authData, lastName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                                    />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">Email Address</label>
                            <input
                                type="email"
                                placeholder="name@email.com"
                                value={authData.email}
                                onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={authData.password}
                                onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                            />
                        </div>

                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 hover:border-white/30"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleAuthSubmit}
                                disabled={authLoading}
                                className="flex-[2] py-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 hover:bg-accent-green hover:shadow-[0_0_40px_rgba(191,255,0,0.3)] disabled:opacity-50"
                            >
                                {authLoading ? 'Verifying...' : (authMode === 'signup' ? 'Continue' : 'Enter Medical Portal')}
                            </button>
                        </div>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">OR</span>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>

                        {/* Social Logins */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={async () => {
                                    try {
                                        const { error } = await signUp({ provider: 'google' });
                                        if (error) throw error;
                                    } catch (err) {
                                        setAuthError(err.message);
                                    }
                                }}
                                className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 hover:border-white/30 transition-all py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                            <button className="flex items-center justify-center gap-3 bg-white text-black hover:bg-accent-green transition-all py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed cursor-not-allowed opacity-50" disabled title="Coming Soon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2.001-.156-3.314 1.091-4.21 1.091zM15.503 2.496c.844-1.026 1.404-2.455 1.248-3.87-1.221.052-2.704.818-3.58 1.844-.78.896-1.456 2.364-1.272 3.741 1.35.104 2.755-.701 3.604-1.715z" />
                                </svg>
                                Apple
                            </button>
                        </div>

                        <div className="pt-8 text-center border-t border-white/5">
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed">
                                {authMode === 'signup' ? 'Already a member?' : 'New to GLP-GLOW?'} <br />
                                <button
                                    onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                                    className="text-accent-green mt-2 hover:underline"
                                >
                                    {authMode === 'signup' ? 'Sign In Here' : 'Create Clinical Account'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <button onClick={() => setStep(2)} className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors">
                        ← Back to results
                    </button>
                </div>
            </div>
        );
    };

    const renderEligibilityStep = () => (
        <div className="assessment-step max-w-2xl mx-auto py-20 px-6">
            <div className="text-center mb-12">
                <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                    Eligibility Check
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-4 leading-tight">
                    Let's make sure you're <br />
                    <span className="text-accent-green">eligible for treatment.</span>
                </h2>
                <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-[10px]">
                    It's just like intake forms at the doctor.
                </p>

            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 md:p-12 backdrop-blur-xl">
                <div className="space-y-8">
                    {/* Sex Selection */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4 text-center">Sex assigned at birth</label>
                        <div className="grid grid-cols-2 gap-4">
                            {['male', 'female'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setEligibilityData({ ...eligibilityData, sex: s })}
                                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${eligibilityData.sex === s
                                        ? 'bg-white text-black border-white'
                                        : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
                                        } border`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        {triedToContinue && !eligibilityData.sex && (
                            <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest italic animate-pulse">Please select your sex</p>
                        )}
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">Date of Birth</label>
                        <input
                            type="date"
                            className={`w-full bg-white/5 border ${triedToContinue && !eligibilityData.dob ? 'border-red-500/50' : 'border-white/10'} rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold`}
                            value={eligibilityData.dob}
                            onChange={(e) => setEligibilityData({ ...eligibilityData, dob: e.target.value })}
                        />
                        {triedToContinue && !eligibilityData.dob && (
                            <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest italic animate-pulse">Date of birth is required</p>
                        )}
                    </div>

                    {/* State & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">State</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search state..."
                                    className={`w-full bg-white/5 border ${triedToContinue && !eligibilityData.state ? 'border-red-500/50' : 'border-white/10'} rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold placeholder:text-white/20`}
                                    value={showStateDropdown ? stateSearch : (eligibilityData.state ? stateFullNames[eligibilityData.state] : stateSearch)}
                                    onChange={(e) => {
                                        setStateSearch(e.target.value);
                                        setShowStateDropdown(true);
                                    }}
                                    onFocus={() => {
                                        if (eligibilityData.state) setStateSearch('');
                                        setShowStateDropdown(true);
                                    }}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>

                                {showStateDropdown && (
                                    <div className="absolute z-50 left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-black border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl no-scrollbar">
                                        {Object.entries(stateFullNames)
                                            .filter(([code, name]) =>
                                                name.toLowerCase().includes(stateSearch.toLowerCase()) ||
                                                code.toLowerCase().includes(stateSearch.toLowerCase())
                                            )
                                            .map(([code, name]) => (
                                                <div
                                                    key={code}
                                                    onClick={() => {
                                                        setEligibilityData({ ...eligibilityData, state: code });
                                                        setStateSearch('');
                                                        setShowStateDropdown(false);
                                                    }}
                                                    className="px-8 py-4 hover:bg-accent-green hover:text-black cursor-pointer text-[10px] font-black uppercase tracking-widest transition-colors flex justify-between items-center"
                                                >
                                                    <span>{name}</span>
                                                    <span className="opacity-40">{code}</span>
                                                </div>
                                            ))
                                        }
                                        {Object.entries(stateFullNames).filter(([code, name]) =>
                                            name.toLowerCase().includes(stateSearch.toLowerCase()) ||
                                            code.toLowerCase().includes(stateSearch.toLowerCase())
                                        ).length === 0 && (
                                                <div className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/20 italic text-center">
                                                    No matches found
                                                </div>
                                            )}
                                    </div>
                                )}
                            </div>
                            {triedToContinue && !eligibilityData.state && (
                                <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest italic animate-pulse">State selection is required</p>
                            )}

                            {/* Overlay to close dropdown */}
                            {showStateDropdown && (
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowStateDropdown(false)}
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">Phone Number</label>
                            <input
                                type="tel"
                                placeholder="(XXX) XXX-XXXX"
                                className={`w-full bg-white/5 border ${triedToContinue && !eligibilityData.phone ? 'border-red-500/50' : 'border-white/10'} rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold`}
                                value={eligibilityData.phone}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, '');
                                    let formattedValue = '';
                                    if (rawValue.length > 0) {
                                        formattedValue = '(' + rawValue.substring(0, 3);
                                        if (rawValue.length > 3) {
                                            formattedValue += ') ' + rawValue.substring(3, 6);
                                        }
                                        if (rawValue.length > 6) {
                                            formattedValue += '-' + rawValue.substring(6, 10);
                                        }
                                    } else {
                                        formattedValue = rawValue;
                                    }
                                    setEligibilityData({ ...eligibilityData, phone: formattedValue });
                                }}
                            />
                            {triedToContinue && !eligibilityData.phone && (
                                <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest italic animate-pulse">Phone number is required</p>
                            )}
                        </div>
                    </div>

                    {/* PCP Visit */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Have you seen your primary care provider in the past 12 months?</label>
                        <div className="grid grid-cols-2 gap-4">
                            {['Yes', 'No'].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setEligibilityData({ ...eligibilityData, pcpVisitLast6Months: v })}
                                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${eligibilityData.pcpVisitLast6Months === v
                                        ? 'bg-accent-green text-black border-accent-green'
                                        : (triedToContinue && !eligibilityData.pcpVisitLast6Months ? 'bg-white/5 text-white/40 border-red-500/50' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30')
                                        } border`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                        {triedToContinue && !eligibilityData.pcpVisitLast6Months && (
                            <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest italic animate-pulse">Please select an option</p>
                        )}

                        {eligibilityData.pcpVisitLast6Months && (
                            <div className="mt-6 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 leading-relaxed italic">
                                    {eligibilityData.pcpVisitLast6Months === 'Yes'
                                        ? 'Since you have selected "Yes", please upload the lab results that include your "Lipid" and "A1c" values:'
                                        : 'Since you have selected "No", you could possibly be ordered/recommended to do a Lab Test (Lipid, A1c).'}
                                </p>
                                {eligibilityData.pcpVisitLast6Months === 'Yes' && (
                                    <div className="mt-6">
                                        {/* Multi-file list */}
                                        {Array.isArray(eligibilityData.labResults) && eligibilityData.labResults.length > 0 && (
                                            <div className="space-y-3 mb-6">
                                                {eligibilityData.labResults.map((url, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group/file">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-accent-green/10 rounded-lg flex items-center justify-center text-accent-green">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Lab Document {idx + 1}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <a href={url} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-accent-green hover:underline">View</a>
                                                            <button
                                                                onClick={() => {
                                                                    const newResults = [...eligibilityData.labResults];
                                                                    newResults.splice(idx, 1);
                                                                    setEligibilityData({ ...eligibilityData, labResults: newResults });
                                                                }}
                                                                className="text-[10px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-colors"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <input
                                            type="file"
                                            id="lab-upload"
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileUpload(e.target.files[0], 'lab-results', (url) => {
                                                const current = Array.isArray(eligibilityData.labResults) ? eligibilityData.labResults : (eligibilityData.labResults ? [eligibilityData.labResults] : []);
                                                setEligibilityData({ ...eligibilityData, labResults: [...current, url] });
                                            })}
                                        />
                                        <button
                                            onClick={() => document.getElementById('lab-upload').click()}
                                            disabled={uploading === 'lab-results'}
                                            className={`w-full flex items-center justify-center gap-4 px-8 py-6 bg-white/5 border-2 border-dashed ${triedToContinue && (!eligibilityData.labResults || eligibilityData.labResults.length === 0) ? 'border-red-500/50' : 'border-white/10'} rounded-2xl hover:border-accent-green transition-all group`}
                                        >
                                            {uploading === 'lab-results' ? (
                                                <div className="w-5 h-5 border-2 border-accent-green border-t-transparent animate-spin rounded-full"></div>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-green">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="17 8 12 3 7 8"></polyline>
                                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                                </svg>
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white">
                                                {eligibilityData.labResults?.length > 0 ? 'Upload Another Lab Result' : 'Upload Lab Results'}
                                            </span>
                                        </button>
                                        {triedToContinue && (!eligibilityData.labResults || eligibilityData.labResults.length === 0) && (
                                            <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest italic animate-pulse">At least one lab result is REQUIRED</p>
                                        )}
                                        {eligibilityData.labResults?.length > 0 && (
                                            <p className="mt-4 text-[8px] font-black uppercase tracking-widest text-accent-green opacity-60 ml-4 italic text-center">✓ {eligibilityData.labResults.length} Files verified and encrypted</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Consent Text */}
                    <div className={`p-6 bg-white/[0.02] border ${triedToContinue && !eligibilityData.consent ? 'border-red-500/50' : 'border-white/5'} rounded-3xl`}>
                        <label className="flex gap-4 cursor-pointer group">
                            <div className="relative flex-shrink-0 mt-1">
                                <input
                                    type="checkbox"
                                    className="peer hidden"
                                    checked={eligibilityData.consent}
                                    onChange={(e) => setEligibilityData({ ...eligibilityData, consent: e.target.checked })}
                                />
                                <div className="w-6 h-6 border-2 border-white/10 rounded peer-checked:bg-accent-green peer-checked:border-accent-green transition-all"></div>
                                <svg className="absolute top-1 left-1 w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <span className="text-[10px] text-white/40 font-bold uppercase leading-relaxed tracking-wide group-hover:text-white/60 transition-colors">
                                I agree to receive text messages from GLP-GLOW with important updates, including prescription reminders, order updates, exclusive offers and information about new products. Message and data rates may apply. Message frequency varies. Reply STOP to opt-out.
                            </span>
                        </label>
                        {triedToContinue && !eligibilityData.consent && (
                            <p className="text-red-500 text-[9px] mt-2 ml-10 font-black uppercase tracking-widest italic animate-pulse">Consent is required</p>
                        )}
                    </div>

                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={() => setStep(4)}
                            className="flex-1 py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 hover:border-white/30"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => {
                                setTriedToContinue(true);
                                const isPcpLabRequired = eligibilityData.pcpVisitLast6Months === 'Yes';
                                const hasLabResults = Array.isArray(eligibilityData.labResults) && eligibilityData.labResults.length > 0;

                                if (
                                    eligibilityData.sex &&
                                    eligibilityData.dob &&
                                    eligibilityData.state &&
                                    eligibilityData.phone &&
                                    eligibilityData.pcpVisitLast6Months &&
                                    (!isPcpLabRequired || (isPcpLabRequired && hasLabResults)) &&
                                    eligibilityData.consent
                                ) {
                                    setStep(6);
                                }
                            }}
                            className={`flex-[2] py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 bg-white text-black hover:bg-accent-green hover:shadow-[0_0_40px_rgba(191,255,0,0.3)]`}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center text-[9px] font-black uppercase tracking-[0.3em] text-white/10 italic">
                clinical screening protocol v2.4 • secure encryption enabled
            </div>
        </div>
    );
    const renderStateAvailabilityStep = () => {
        const stateName = stateFullNames[eligibilityData.state] || 'your state';
        return (
            <div className="assessment-step max-w-5xl mx-auto py-20 px-6">
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
                    {/* Left Side: Map Representation */}
                    <div className="w-full md:w-1/2 aspect-square relative bg-white/[0.02] border border-white/5 rounded-[60px] flex items-center justify-center overflow-hidden group">
                        <div className="absolute inset-0 bg-accent-green/5 blur-[100px] group-hover:bg-accent-green/10 transition-all duration-1000"></div>

                        {/* Premium Map Image */}
                        <img
                            src={alabamaMapImg}
                            alt={`Map showing coverage in ${stateName}`}
                            className="w-[90%] h-[90%] object-contain relative z-10 transition-transform duration-1000 group-hover:scale-105"
                        />

                        <div className="absolute bottom-10 left-10 right-10 p-6 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-3 rounded-full bg-accent-green animate-pulse"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Coverage confirmed: {stateName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Content */}
                    <div className="w-full md:w-1/2 text-left">
                        <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                            Logistics Locked
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-8 leading-[0.9]">
                            GLP-GLOW IS <br />
                            AVAILABLE IN <br />
                            <span className="text-accent-green">{stateName.toUpperCase()}</span>
                        </h2>

                        <div className="space-y-6 mb-12">
                            <div className="flex gap-4">
                                <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0 text-accent-green">✓</div>
                                <p className="text-white/60 text-sm font-medium leading-relaxed">Our clinicians are licensed and able to ship to your state.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0 text-accent-green">✓</div>
                                <p className="text-white/60 text-sm font-medium leading-relaxed">Medication ships to <span className="text-white">{stateName}</span> addresses within 48 hours of approval.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(5)}
                                className="px-10 py-8 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-white/30"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(7)}
                                className="flex-1 px-10 py-8 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:bg-accent-green hover:shadow-[0_0_60px_rgba(191,255,0,0.5)] transform hover:scale-105"
                            >
                                Finalize Medical Review
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDoctorIntroStep = () => (
        <div className="assessment-step max-w-6xl mx-auto py-20 px-6">
            <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
                {/* Left Side: Content */}
                <div className="w-full md:w-1/2">
                    <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-10">
                        Medical Consultation Prep
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-8 leading-[0.9]">
                        Answer a few <br />
                        questions about <br />
                        <span className="text-accent-green text-opacity-80">your health.</span>
                    </h2>

                    <div className="mb-12">
                        <div className="text-xs font-black uppercase tracking-[0.3em] text-white/20 mb-4 italic">Doctor</div>
                        <p className="text-white/60 text-lg font-medium leading-relaxed max-w-md">
                            Our board-certified doctors use the information in the following questions to tailor your treatment.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(6)}
                                className="px-12 py-8 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-white/30"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(8)}
                                className="flex-1 px-12 py-8 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:bg-accent-green hover:shadow-[0_0_60px_rgba(191,255,0,0.4)] transform hover:scale-105"
                            >
                                Continue to Medical Intake
                            </button>
                        </div>

                        <div className="flex items-center gap-4 opacity-40">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-green">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-widest leading-loose">
                                Your answers are private and HIPAA protected.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Doctor Profile */}
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-square rounded-[60px] overflow-hidden relative border border-white/10 shadow-2xl">
                        <img
                            src={smilingDoctorImg}
                            alt="Dr. Anya Sharma"
                            className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>

                        {/* Doctor ID Card */}
                        <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] transform group-hover:-translate-y-2 transition-transform duration-700">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-px bg-accent-green"></div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white mb-1">Dr. Anya Sharma</h3>
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-green">Chief Clinical Advisor</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -top-6 -right-6 w-32 h-32 border border-accent-green/20 rounded-full animate-pulse"></div>
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 border border-white/5 rounded-full"></div>
                </div>
            </div>
        </div>
    );

    const renderBMIAndDrugStep = () => (
        <div className="assessment-step max-w-2xl mx-auto py-20 px-6">
            <div className="text-center mb-12">
                <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                    Biometrics & Selection
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-4 leading-tight">
                    Establish your <br />
                    <span className="text-accent-green">clinical baseline.</span>
                </h2>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 md:p-12 backdrop-blur-xl space-y-10">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">Height (Ft/In)</label>
                        <input
                            type="text"
                            placeholder="5'10&quot;"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                            value={intakeData.height || ''}
                            onChange={(e) => setIntakeData({ ...intakeData, height: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">Weight (Lbs)</label>
                        <input
                            type="number"
                            placeholder="185"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                            value={intakeData.weight || ''}
                            onChange={(e) => setIntakeData({ ...intakeData, weight: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Medication Interest</label>
                    <div className="grid grid-cols-1 gap-3">
                        {(() => {
                            const optionsMap = {
                                'weight-loss': ['Semaglutide Injection', 'Tirzepatide Injection', 'Semaglutide Drops', 'Tirzepatide Drops'],
                                'hair-restoration': ['Finasteride Tablets', 'Finasteride / Minoxidil (2-in-1)', 'Finasteride / Minox / Tret (3-in-1)', 'Max Growth (5-in-1)'],
                                'sexual-health': ['Sildenafil / Tadalafil Troche', 'Sildenafil / Tadalafil Tablets', 'Oxytocin Troche', 'Oxytocin Nasal Spray'],
                                'longevity': ['NAD+ Nasal Spray', 'NAD+ Injection', 'Glutathione Injection']
                            };
                            const options = optionsMap[categoryId] || [];
                            return [...options, 'Other / Not Sure'].map(drug => (
                                <button
                                    key={drug}
                                    onClick={() => setIntakeData({ ...intakeData, medication_interest: drug })}
                                    className={`w-full py-5 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${intakeData.medication_interest === drug ? 'bg-accent-green border-accent-green text-black' : 'bg-white/5 border-white/10 text-white hover:border-accent-green'}`}
                                >
                                    {drug}
                                </button>
                            ));
                        })()}
                    </div>

                    {intakeData.medication_interest === 'Other / Not Sure' && (
                        <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">Please specify / Describe your goals</label>
                            <textarea
                                placeholder="Tell us more about what you're looking for..."
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold resize-none"
                                value={intakeData.other_medication_details || ''}
                                onChange={(e) => setIntakeData({ ...intakeData, other_medication_details: e.target.value })}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => user ? setStep(2) : setStep(3)}
                        className="w-full py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-white/30"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => setStep(5)}
                        disabled={!intakeData.medication_interest || (intakeData.medication_interest === 'Other / Not Sure' && !intakeData.other_medication_details)}
                        className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 ${intakeData.medication_interest && (intakeData.medication_interest !== 'Other / Not Sure' || intakeData.other_medication_details) ? 'bg-white text-black hover:bg-accent-green hover:shadow-[0_0_50px_rgba(191,255,0,0.3)]' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );

    const renderDynamicIntakeStep = () => {
        const question = medicalQuestions[medicalStep];
        const progress = Math.round(((medicalStep + 1) / medicalQuestions.length) * 100);

        const handleNext = () => {
            // Validation for compulsory uploads
            const isGlp1Selected = Array.isArray(intakeData.current_meds) && intakeData.current_meds.some(opt => opt.includes('GLP-1 agonist'));
            if (question.id === 'current_meds' && isGlp1Selected && !intakeData[`${question.id}_file`]) {
                return; // Block manual calls if validation fails
            }

            let nextStep = medicalStep + 1;
            while (nextStep < medicalQuestions.length) {
                const nextQ = medicalQuestions[nextStep];
                if (!nextQ.condition || nextQ.condition(intakeData)) break;
                nextStep++;
            }

            if (nextStep < medicalQuestions.length) {
                setMedicalStep(nextStep);
            } else {
                setStep(9);
            }
        };

        const handlePrevious = () => {
            let prevStep = medicalStep - 1;
            while (prevStep >= 0) {
                const prevQ = medicalQuestions[prevStep];
                if (!prevQ.condition || prevQ.condition(intakeData)) break;
                prevStep--;
            }
            if (prevStep >= 0) setMedicalStep(prevStep);
        };

        return (
            <div className="assessment-step max-w-3xl mx-auto py-20 px-6">


                <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 md:p-16 backdrop-blur-xl">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-6">{question.title}</h3>
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic mb-12 leading-tight">
                        {question.question}
                    </h2>
                    {question.type === 'multiselect' && (
                        <p className="text-[10px] font-medium italic text-white/30 -mt-8 mb-8">
                            Select all that apply
                        </p>
                    )}

                    <div className="space-y-4">
                        {question.type === 'info' ? (
                            <div className="space-y-6">
                                <p className="text-white/60 text-lg font-medium leading-relaxed italic">
                                    {question.content}
                                </p>
                            </div>
                        ) : question.type === 'multiselect' || question.type === 'choice' ? (
                            <div className="grid grid-cols-1 gap-3">
                                {question.options.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => {
                                            const current = intakeData[question.id] || [];
                                            if (question.type === 'choice') {
                                                setIntakeData({ ...intakeData, [question.id]: opt });
                                            } else {
                                                setIntakeData({ ...intakeData, [question.id]: current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt] });
                                            }
                                        }}
                                        className={`w-full py-6 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${(question.type === 'choice' ? intakeData[question.id] === opt : intakeData[question.id]?.includes(opt))
                                            ? 'bg-accent-green border-accent-green text-black'
                                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                placeholder={question.placeholder}
                                className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl py-8 px-10 text-white focus:outline-none focus:border-accent-green transition-all font-bold resize-none underline-none"
                                value={intakeData[question.id] || ''}
                                onChange={(e) => setIntakeData({ ...intakeData, [question.id]: e.target.value })}
                            />
                        )}

                        {question.info && (
                            <div className="mt-8 p-6 bg-accent-green/10 border border-accent-green/20 rounded-2xl">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-green mb-2">Why we ask</h4>
                                <p className="text-[11px] font-bold text-white/60 leading-relaxed italic">
                                    {question.info}
                                </p>
                            </div>
                        )}

                        {question.upload && intakeData[question.id] && (
                            <div className="mt-8">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">
                                    {question.id === 'current_meds' && Array.isArray(intakeData.current_meds) && intakeData.current_meds.some(opt => opt.includes('GLP-1 agonist'))
                                        ? 'Upload RX / Proof (Compulsory)'
                                        : 'Upload RX / Proof (Optional)'}
                                </label>

                                {intakeData[`${question.id}_file`] ? (
                                    <div className="p-6 bg-white/5 border border-white/10 rounded-[30px] flex items-center justify-between group/upload transition-all hover:border-accent-green/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center text-accent-green">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white">Document Uploaded</p>
                                                <a href={intakeData[`${question.id}_file`]} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-accent-green hover:underline">View File</a>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newData = { ...intakeData };
                                                delete newData[`${question.id}_file`];
                                                setIntakeData(newData);
                                            }}
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/upload:opacity-100"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="file"
                                            id={`upload-${question.id}`}
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileUpload(e.target.files[0], 'prescriptions', (url) => {
                                                setIntakeData({ ...intakeData, [`${question.id}_file`]: url });
                                            })}
                                        />
                                        <button
                                            onClick={() => document.getElementById(`upload-${question.id}`).click()}
                                            disabled={uploading === 'prescriptions'}
                                            className="w-full flex items-center justify-center gap-4 py-8 bg-white/5 border-2 border-dashed border-white/10 rounded-[30px] hover:border-accent-green transition-all group"
                                        >
                                            {uploading === 'prescriptions' ? (
                                                <div className="w-6 h-6 border-2 border-accent-green border-t-transparent animate-spin rounded-full"></div>
                                            ) : (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-green">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="17 8 12 3 7 8"></polyline>
                                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                                </svg>
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">
                                                Choose prescription file
                                            </span>
                                        </button>
                                    </>
                                )}

                                {intakeData[`${question.id}_file`] && (
                                    <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-accent-green text-center opacity-60">Success: Prescription linked to medical profile</p>
                                )}
                            </div>
                        )}

                        {question.details && (() => {
                            const val = intakeData[question.id];
                            if (!val) return false;
                            if (Array.isArray(val)) return val.includes('Other');
                            return val === 'Yes' || val === 'I have a specific treatment in mind';
                        })() && (
                                <div className="mt-8">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">Provide Details</label>
                                    <textarea
                                        placeholder="Enter details here..."
                                        className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl py-6 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold resize-none"
                                        value={intakeData[`${question.id}_details`] || ''}
                                        onChange={(e) => setIntakeData({ ...intakeData, [`${question.id}_details`]: e.target.value })}
                                    />
                                </div>
                            )}
                    </div>

                    <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-4">
                        <button
                            onClick={() => {
                                if (medicalStep > 0) {
                                    handlePrevious();
                                } else {
                                    setStep(7); // Go back to Doctor Intro
                                }
                            }}
                            className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-6 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:border-white/30 transition-all group"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-100 transition-opacity">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Backward
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={
                                (!intakeData[question.id] && question.type !== 'text' && question.type !== 'info') ||
                                (question.id === 'current_meds' && Array.isArray(intakeData.current_meds) && intakeData.current_meds.some(opt => opt.includes('GLP-1 agonist')) && !intakeData[`${question.id}_file`])
                            }
                            className={`w-full md:w-auto flex items-center justify-center gap-3 px-10 py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all group ${((!intakeData[question.id] && question.type !== 'text' && question.type !== 'info') ||
                                (question.id === 'current_meds' && Array.isArray(intakeData.current_meds) && intakeData.current_meds.some(opt => opt.includes('GLP-1 agonist')) && !intakeData[`${question.id}_file`]))
                                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                : 'bg-white text-black hover:bg-accent-green hover:shadow-[0_0_40px_rgba(191,255,0,0.3)]'
                                }`}
                        >
                            {medicalStep === medicalQuestions.length - 1 ? 'Finish Intake' : 'Forward'}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-100 transition-opacity">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderIdentificationStep = () => (
        <div className="assessment-step max-w-2xl mx-auto py-20 px-6">
            <div className="text-center mb-12">
                <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                    Step 24: Identification
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-4 leading-tight">
                    Verify your <span className="text-accent-green">Identity.</span>
                </h2>
                <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-[10px]">
                    Required for prescription medication fulfillment.
                </p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-12 backdrop-blur-xl space-y-8">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4">ID Type</label>
                    <div className="grid grid-cols-2 gap-4">
                        {["Driver's License", "Passport"].map(type => (
                            <button
                                key={type}
                                onClick={() => {
                                    if (idData.type !== type) {
                                        setIdData({ ...idData, type, file_url: '' });
                                    }
                                }}
                                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${idData.type === type ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">ID Number</label>
                    <input
                        type="text"
                        placeholder="Enter ID number..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                        value={idData.number}
                        onChange={(e) => setIdData({ ...idData, number: e.target.value })}
                    />
                </div>

                <div className="pt-4">
                    <input
                        type="file"
                        id="id-upload"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'id-verification', (url) => {
                            setIdData({ ...idData, file_url: url });
                        })}
                    />
                    {idData.file_url ? (
                        <div className="p-6 bg-white/5 border border-white/10 rounded-[30px] flex items-center justify-between group/upload transition-all hover:border-accent-green/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-accent-green/10 rounded-2xl flex items-center justify-center text-accent-green">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white">ID Front Uploaded</p>
                                    <a href={idData.file_url} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-accent-green hover:underline">View Document</a>
                                </div>
                            </div>
                            <button
                                onClick={() => setIdData({ ...idData, file_url: '' })}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/upload:opacity-100"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => document.getElementById('id-upload').click()}
                            disabled={uploading === 'id-verification'}
                            className="w-full py-8 border-2 border-dashed border-white/10 rounded-[30px] flex flex-col items-center justify-center gap-4 hover:border-accent-green transition-all group"
                        >
                            {uploading === 'id-verification' ? (
                                <div className="w-8 h-8 border-2 border-accent-green border-t-transparent animate-spin rounded-full"></div>
                            ) : (
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-green">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white">
                                Upload Front of ID
                            </span>
                        </button>
                    )}
                    {idData.file_url && (
                        <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-accent-green text-center opacity-60 italic">Identity document securely processed</p>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <button
                        onClick={() => setStep(9)}
                        className="w-full md:flex-1 py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-white/30"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => setStep(11)}
                        disabled={!idData.type || !idData.number || !idData.file_url}
                        className={`w-full md:flex-[2] py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all ${idData.type && idData.number && idData.file_url ? 'bg-white text-black hover:bg-accent-green' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                        Continue to Shipping
                    </button>
                </div>
            </div>
        </div>
    );

    const renderShippingStep = () => (
        <div className="assessment-step max-w-2xl mx-auto py-20 px-6">
            <div className="text-center mb-12">
                <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                    Step 25: Delivery
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-4 leading-tight">
                    Where should we <span className="text-accent-green">ship?</span>
                </h2>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-12 backdrop-blur-xl space-y-6">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">Street Address</label>
                    <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                        value={shippingData.address}
                        onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">City</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                            value={shippingData.city}
                            onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">State</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={shippingData.state ? stateFullNames[shippingData.state] : "Search..."}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold placeholder:text-white/20"
                                value={stateSearch}
                                onChange={(e) => {
                                    setStateSearch(e.target.value);
                                    setShowStateDropdown(true);
                                }}
                                onFocus={() => setShowStateDropdown(true)}
                            />
                            {showStateDropdown && (
                                <div className="absolute z-50 left-0 right-0 mt-2 max-h-40 overflow-y-auto bg-black border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl no-scrollbar">
                                    {Object.entries(stateFullNames)
                                        .filter(([code, name]) =>
                                            name.toLowerCase().includes(stateSearch.toLowerCase()) ||
                                            code.toLowerCase().includes(stateSearch.toLowerCase())
                                        )
                                        .map(([code, name]) => (
                                            <div
                                                key={code}
                                                onClick={() => {
                                                    setShippingData({ ...shippingData, state: code });
                                                    setStateSearch('');
                                                    setShowStateDropdown(false);
                                                }}
                                                className="px-6 py-3 hover:bg-accent-green hover:text-black cursor-pointer text-[10px] font-black uppercase tracking-widest transition-colors flex justify-between"
                                            >
                                                <span>{name}</span>
                                                <span className="opacity-40">{code}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">Zip Code</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                            value={shippingData.zip}
                            onChange={(e) => setShippingData({ ...shippingData, zip: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 ml-4">Phone Number</label>
                        <input
                            type="tel"
                            placeholder="(XXX) XXX-XXXX"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                            value={shippingData.phone}
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/\D/g, '');
                                let formattedValue = '';
                                if (rawValue.length > 0) {
                                    formattedValue = '(' + rawValue.substring(0, 3);
                                    if (rawValue.length > 3) formattedValue += ') ' + rawValue.substring(3, 6);
                                    if (rawValue.length > 6) formattedValue += '-' + rawValue.substring(6, 10);
                                }
                                setShippingData({ ...shippingData, phone: formattedValue });
                            }}
                        />
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <button
                        onClick={() => setStep(10)}
                        className="w-full md:flex-1 py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-white/30"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => setStep(12)}
                        disabled={!shippingData.address || !shippingData.city || !shippingData.zip || !shippingData.state || !shippingData.phone}
                        className={`w-full md:flex-[2] py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all ${shippingData.address && shippingData.city && shippingData.zip && shippingData.state && shippingData.phone ? 'bg-white text-black hover:bg-accent-green' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                        Continue to Payment
                    </button>
                </div>
            </div>
        </div>
    );

    const renderPaymentStep = () => (
        <div className="assessment-step max-w-2xl mx-auto py-20 px-6">
            <div className="text-center mb-12">
                <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                    Secure Checkout
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic mb-4 leading-tight">
                    Complete Your <span className="text-accent-green">Payment.</span>
                </h2>
                <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-[10px]">
                    Clinical assessment fee for professional provider review.
                </p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-12 backdrop-blur-xl space-y-10">
                <div className="flex justify-between items-start pb-8 border-b border-white/5">
                    <div>
                        <h3 className="text-white text-xl font-black uppercase tracking-tighter italic mb-2">Eligibility Verification Fee</h3>
                        <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest leading-relaxed max-w-xs">
                            A healthcare provider will review and verify your eligibility for the program.
                        </p>
                    </div>
                    <span className="text-accent-green text-3xl font-black italic">
                        {paymentData.appliedDiscount ? (
                            <>
                                <span className="line-through text-white/20 text-xl mr-2">$25.00</span>
                                ${(() => {
                                    const base = 25.00;
                                    const disc = paymentData.appliedDiscount;
                                    let final = base;
                                    if (disc.discountType === 'percentage') {
                                        final = base * (1 - disc.discountValue / 100);
                                    } else {
                                        final = Math.max(0, base - disc.discountValue);
                                    }
                                    return final.toFixed(2);
                                })()}
                            </>
                        ) : '$25.00'}
                    </span>
                </div>

                <div className="space-y-6">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 ml-4 italic">Payment Details</label>
                    {(() => {
                        const baseCents = 2500;
                        const disc = paymentData.appliedDiscount;
                        let finalAmountInCents = baseCents;
                        if (disc) {
                            if (disc.discountType === 'percentage') {
                                finalAmountInCents = Math.round(baseCents * (1 - disc.discountValue / 100));
                            } else {
                                finalAmountInCents = Math.max(0, baseCents - (disc.discountValue * 100));
                            }
                        }

                        if (finalAmountInCents === 0) {
                            return (
                                <button
                                    onClick={() => handleSubmitAssessment()}
                                    className="w-full py-6 bg-accent-green text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-white transition-all shadow-[0_0_50px_rgba(191,255,0,0.2)]"
                                >
                                    Complete Activation →
                                </button>
                            );
                        }

                        return (
                            <Elements stripe={stripePromise} options={{
                                mode: 'payment',
                                amount: finalAmountInCents,
                                currency: 'usd',
                                setup_future_usage: 'off_session'
                            }}>
                                <CheckoutForm
                                    onComplete={() => handleSubmitAssessment()}
                                    amount={finalAmountInCents}
                                    couponCode={paymentData.coupon}
                                    categoryId={categoryId}
                                />
                            </Elements>
                        );
                    })()}
                </div>

                <div className="pt-8 border-t border-white/5">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 ml-4 italic">Have an eligibility coupon code?</label>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Enter coupon code"
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-accent-green transition-all font-bold"
                            value={paymentData.coupon || ''}
                            onChange={(e) => setPaymentData({ ...paymentData, coupon: e.target.value })}
                        />
                        <button
                            onClick={async () => {
                                if (!paymentData.coupon) return;
                                try {
                                    const { data, error } = await supabase.functions.invoke('validate-discount-code', {
                                        body: { couponCode: paymentData.coupon }
                                    });

                                    if (error || !data.valid) {
                                        alert(data?.error || data?.message || 'Invalid coupon code.');
                                    } else {
                                        alert(`Success! ${data.discountType === 'percentage' ? data.discountValue + '%' : '$' + data.discountValue} discount applied.`);
                                        // Update state with valid discount
                                        setPaymentData(prev => ({ ...prev, appliedDiscount: data }));
                                    }
                                } catch (err) {
                                    console.error('Discount validation error:', err);
                                    alert('Could not validate coupon at this time.');
                                }
                            }}
                            className="px-8 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-accent-green transition-all"
                        >
                            Apply
                        </button>
                    </div>
                </div>

                <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-white/20 px-8">
                    Secure 256-bit SSL encrypted payment. By clicking "Process Activation", you agree to our clinical terms of service.
                </p>

                <div className="pt-4 text-center border-t border-white/5">
                    <button
                        onClick={() => setStep(11)}
                        className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors"
                    >
                        ← Back to Shipping
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSuccessStep = () => (
        <div className="assessment-step max-w-2xl mx-auto py-20 px-6 text-center">
            <div className="w-24 h-24 bg-accent-green/10 border border-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-10">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent-green">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-6 leading-tight">
                Assessment <br />
                <span className="text-accent-green">Complete.</span>
            </h2>
            <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-[10px] mb-12 max-w-md mx-auto leading-relaxed">
                Your medical profile has been encrypted and submitted to our clinical board. A licensed provider will review your case within 24 hours.
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                    onClick={() => navigate('/')}
                    className="px-12 py-8 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all duration-500"
                >
                    Home Page
                </button>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-12 py-8 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-accent-green hover:shadow-[0_0_50px_rgba(191,255,0,0.3)] transition-all duration-500"
                >
                    Enter Dashboard
                </button>
            </div>
        </div>
    );

    const renderReviewSummary = () => {
        // Helper function to format answer values
        const formatAnswer = (value) => {
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            if (typeof value === 'boolean') {
                return value ? 'Yes' : 'No';
            }
            return value || 'Not provided';
        };

        return (
            <div className="assessment-step max-w-5xl mx-auto py-20 px-6">
                <div className="text-center mb-16">
                    <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                        Final Review
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-6">
                        Review Your <span className="text-accent-green">Profile.</span>
                    </h2>
                    <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-[10px]">
                        Verify your information before clinical board submission.
                    </p>
                </div>

                {/* Personal Information Section */}
                <div className="mb-8 bg-white/[0.03] border border-white/5 rounded-[40px] p-8 md:p-12">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-accent-green mb-8 pb-4 border-b border-white/5">
                        Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Date of Birth</p>
                            <p className="text-white font-bold">{eligibilityData.dob || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Sex</p>
                            <p className="text-white font-bold capitalize">{eligibilityData.sex || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">State</p>
                            <p className="text-white font-bold">{stateFullNames[eligibilityData.state] || eligibilityData.state || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Phone Number</p>
                            <p className="text-white font-bold">{eligibilityData.phone || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Height</p>
                            <p className="text-white font-bold">{intakeData.height || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Weight</p>
                            <p className="text-white font-bold">{intakeData.weight ? `${intakeData.weight} lbs` : 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Medication Interest</p>
                            <p className="text-white font-bold">
                                {intakeData.medication_interest === 'Other / Not Sure'
                                    ? `Other: ${intakeData.other_medication_details || 'No details'}`
                                    : (intakeData.medication_interest || 'Not provided')}
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Primary Care Visit (Last 12 Months)</p>
                            <p className="text-white font-bold">{eligibilityData.pcpVisitLast6Months || 'Not provided'}</p>
                        </div>
                        {Array.isArray(eligibilityData.labResults) && eligibilityData.labResults.length > 0 && (
                            <div className="md:col-span-2 space-y-4">
                                {eligibilityData.labResults.map((url, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-accent-green/20 rounded-lg flex items-center justify-center text-accent-green">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white">Lab Results {idx + 1}</p>
                                        </div>
                                        <a href={url} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-accent-green hover:underline">View Upload</a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Goals Section */}
                {selectedImprovements.length > 0 && (
                    <div className="mb-8 bg-white/[0.03] border border-white/5 rounded-[40px] p-8 md:p-12">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-accent-green mb-8 pb-4 border-b border-white/5">
                            Your Goals - {categoryId.toUpperCase()} Program
                        </h3>
                        <div className="space-y-4">
                            {selectedImprovements.map(impId => {
                                const improvement = categoryData.improvements.find(imp => imp.id === impId);
                                return improvement ? (
                                    <div key={impId} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <p className="text-white font-bold mb-1">{improvement.name}</p>
                                        <p className="text-white/60 text-sm">{improvement.desc}</p>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}

                {/* Medical Intake Responses Section */}
                {Object.keys(intakeData).length > 0 && (
                    <div className="mb-8 bg-white/[0.03] border border-white/5 rounded-[40px] p-8 md:p-12">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-accent-green mb-8 pb-4 border-b border-white/5">
                            Medical Intake Responses
                        </h3>
                        <div className="space-y-6">
                            {medicalQuestions
                                .filter(q => q.type !== 'info' && intakeData[q.id])
                                .map((question, idx) => (
                                    <div key={question.id} className="pb-6 border-b border-white/5 last:border-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-3">
                                            {question.title}
                                        </p>
                                        <p className="text-white/80 text-sm mb-2 italic">{question.question}</p>
                                        <div className="mt-3 p-4 bg-white/[0.02] rounded-xl">
                                            <p className="text-white font-bold">
                                                {formatAnswer(intakeData[question.id])}
                                            </p>
                                        </div>
                                        {/* Show prescription file if it exists */}
                                        {intakeData[`${question.id}_file`] && (
                                            <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 italic">Attached: Medical Document</span>
                                                <a href={intakeData[`${question.id}_file`]} target="_blank" rel="noreferrer" className="text-[8px] font-black uppercase tracking-widest text-accent-green hover:underline">Preview</a>
                                            </div>
                                        )}
                                        {/* Show details if they exist */}
                                        {intakeData[`${question.id}_details`] && (
                                            <div className="mt-3 p-4 bg-accent-green/5 border border-accent-green/10 rounded-xl">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-accent-green mb-2">Additional Details</p>
                                                <p className="text-white/80 text-sm">{intakeData[`${question.id}_details`]}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Identification Section */}
                {(idData.type || idData.number) && (
                    <div className="mb-8 bg-white/[0.03] border border-white/5 rounded-[40px] p-8 md:p-12">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-accent-green mb-8 pb-4 border-b border-white/5">
                            Identification
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">ID Type</p>
                                <p className="text-white font-bold">{idData.type || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">ID Number</p>
                                <p className="text-white font-bold">{idData.number ? '••••••' + idData.number.slice(-4) : 'Not provided'}</p>
                            </div>
                        </div>
                        {idData.file_url && (
                            <div className="mt-6 bg-accent-green/5 border border-accent-green/10 p-4 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-accent-green/20 rounded-lg flex items-center justify-center text-accent-green">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white">Identity Document Verified</p>
                                </div>
                                <a href={idData.file_url} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-accent-green hover:underline">Review Document</a>
                            </div>
                        )}
                    </div>
                )}

                {/* Shipping Information Section */}
                {(shippingData.address || shippingData.city) && (
                    <div className="mb-8 bg-white/[0.03] border border-white/5 rounded-[40px] p-8 md:p-12">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-accent-green mb-8 pb-4 border-b border-white/5">
                            Shipping Address
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Street Address</p>
                                <p className="text-white font-bold">{shippingData.address || 'Not provided'}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">City</p>
                                    <p className="text-white font-bold">{shippingData.city || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">State</p>
                                    <p className="text-white font-bold">{stateFullNames[shippingData.state] || shippingData.state || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Zip Code</p>
                                    <p className="text-white font-bold">{shippingData.zip || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Certification and Actions */}
                <div className="p-8 bg-accent-green/10 border border-accent-green/20 rounded-[40px] text-center">
                    <p className="text-xs font-bold text-accent-green uppercase tracking-widest mb-8">I certify that all medical information provided is accurate and truthful.</p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => setStep(8)}
                            disabled={submitLoading}
                            className="px-12 py-8 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:border-white/30 transition-all disabled:opacity-50"
                        >
                            Back to Intake
                        </button>
                        <button
                            onClick={() => setStep(10)}
                            disabled={submitLoading}
                            className="flex-1 px-12 py-8 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-accent-green hover:shadow-[0_0_60px_rgba(191,255,0,0.5)] transition-all disabled:opacity-50"
                        >
                            {submitLoading ? 'Submitting...' : 'Confirm & Continue'}
                        </button>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="mt-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors"
                    >
                        Generate Assessment PDF
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-accent-green selection:text-black">
            {/* Minimal Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 px-8 py-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link to="/" className="text-2xl font-black uppercase tracking-tighter italic hover:text-accent-green transition-colors">
                        GLP-GLOW
                    </Link>

                    {step > 0 && step < 13 && (
                        <button
                            onClick={handleClearProgress}
                            className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 transition-all border border-white/5 hover:border-red-500/30 px-4 py-2 rounded-full pointer-events-auto"
                        >
                            Stop & Clear Progress
                        </button>
                    )}
                </div>
            </header>

            <main className="pt-32 pb-20 min-h-[calc(100vh-100px)]">
                <div className="w-full">
                    {step === 0 && renderStep0()}
                    {step === 1 && renderStatStep()}
                    {step === 2 && renderReviewStep()}
                    {step === 3 && renderAuthStep()}
                    {step === 4 && renderBMIAndDrugStep()}
                    {step === 5 && renderEligibilityStep()}
                    {step === 6 && renderStateAvailabilityStep()}
                    {step === 7 && renderDoctorIntroStep()}
                    {step === 8 && renderDynamicIntakeStep()}
                    {step === 9 && renderReviewSummary()}
                    {step === 10 && renderIdentificationStep()}
                    {step === 11 && renderShippingStep()}
                    {step === 12 && renderPaymentStep()}
                    {step === 13 && renderSuccessStep()}
                </div>
            </main>

            {/* Mobile Clear Button */}
            {step > 0 && step < 13 && (
                <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
                    <button
                        onClick={handleClearProgress}
                        className="w-full bg-black/80 backdrop-blur-xl border border-white/5 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 transition-all"
                    >
                        Reset Progress & Exit
                    </button>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .assessment-step {
                    perspective: 1000px;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    cursor: pointer;
                }
                ::placeholder {
                    color: rgba(255, 255, 255, 0.5) !important;
                    opacity: 1;
                }
                :-ms-input-placeholder {
                    color: rgba(255, 255, 255, 0.5) !important;
                }
                ::-ms-input-placeholder {
                    color: rgba(255, 255, 255, 0.5) !important;
                }
            `}} />
        </div>
    );
};

export default Assessment;
