import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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
import logo from '../assets/logo.png';
import weightlossQuoteImg from '../assets/weightloss-quote-img.png';
import quoteTargetImg from '../assets/quote-target.png';
import quoteFatCutImg from '../assets/quote-image-fat-cut-weight-loss.png';
import sexualHealthFirstQuoteImg from '../assets/sexual_health_first_quote.png';
import sexualHealthQuote2Img from '../assets/sexual_health_quote_2.png';
import hairLossFirstQuoteImg from '../assets/hair-loss-first-quote.png';
import hairLossSecondQuoteImg from '../assets/hair_loss_second_quote.png';

const categoryQuestions = {
    ...baseCategoryQuestions,
    'weight-loss': { ...baseCategoryQuestions['weight-loss'], stat: { ...baseCategoryQuestions['weight-loss'].stat, image: happyPatientImg } },
    'hair-restoration': { ...baseCategoryQuestions['hair-restoration'], stat: { ...baseCategoryQuestions['hair-restoration'].stat, image: smilingImg } },
    'sexual-health': { ...baseCategoryQuestions['sexual-health'], stat: { ...baseCategoryQuestions['sexual-health'].stat, image: smilingImg } },
    'longevity': { ...baseCategoryQuestions['longevity'], stat: { ...baseCategoryQuestions['longevity'].stat, image: smilingImg } },
};

const stateFullNames = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'Washington D.C.',
    'FL': 'Florida (No Sterile Compounds)', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky',
    'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan',
    'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
    'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon',
    'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota',
    'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia',
    'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

const CheckoutForm = ({ onComplete, amount, couponCode, categoryId, tempUserId, email }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { session } = useAuth();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        // Ensure we at least have a temporary user ID or active session to fulfill the checkout
        if (!session && !tempUserId) {
            setError("Identity missing. Please start over to authenticate your checkout.");
            return;
        }

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
                    categoryId: categoryId,
                    userId: session?.user?.id || tempUserId,
                    email: session?.user?.email || email
                },
                headers: {
                    ...(session ? { 'x-customer-authorization': `Bearer ${session.access_token}` } : {}),
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

                    const userIdToUpdate = session?.user?.id || tempUserId;

                    if (userIdToUpdate) {
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .update({ stripe_payment_method_id: pmId })
                            .eq('id', userIdToUpdate);

                        if (profileError) {
                            console.error('Profile update failed during checkout:', profileError.message);
                        } else {
                            console.log('Profile updated with payment method.');
                        }
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
            <div className="p-12 bg-black/5 border border-white/10 rounded-[32px] animate-pulse flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-2 border-accent-black border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Securing Connection...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="payment-element-container bg-black/5 border border-white/10 p-6 rounded-[24px] focus-within:border-yellow-400 transition-all w-[90%] md:w-full mx-auto">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        theme: 'night',
                        variables: {
                            colorPrimary: '#FFDE59',
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
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
                    {error}
                </div>
            )}
            <button
                type="submit"
                disabled={!stripe || processing}
                className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all relative overflow-hidden group ${processing
                    ? 'bg-black/5 text-gray-300 cursor-wait'
                    : 'bg-white text-black hover:bg-yellow-400 hover:shadow-[0_0_60px_rgba(255,222,89,0.5)] transform hover:scale-[1.02]'
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
    const { signUp, signIn, signOut, user, verifyOtp, updateUser } = useAuth();
    const [step, setStep] = useState(0);
    const [showQuote, setShowQuote] = useState(true);
    const [showBMI, setShowBMI] = useState(false);
    const [showQuote2, setShowQuote2] = useState(false);
    const [showSexualHealthQuote, setShowSexualHealthQuote] = useState(true);
    const [showSexualHealthGoals, setShowSexualHealthGoals] = useState(false);
    const [showSexualHealthQuote2, setShowSexualHealthQuote2] = useState(false);
    const [selectedSexualHealthGoals, setSelectedSexualHealthGoals] = useState([]);
    const [showHairQuote, setShowHairQuote] = useState(true);
    const [showHairGoals, setShowHairGoals] = useState(false);
    const [showHairQuote2, setShowHairQuote2] = useState(false);
    const [selectedHairGoals, setSelectedHairGoals] = useState([]);
    const [bmiHeightFeet, setBmiHeightFeet] = useState('');
    const [bmiHeightInches, setBmiHeightInches] = useState('0');
    const [bmiWeight, setBmiWeight] = useState('');
    const [selectedImprovements, setSelectedImprovements] = useState([]);
    const [otherGoalText, setOtherGoalText] = useState('');
    const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'signin'
    const [authData, setAuthData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        countryCode: '+1',
        phoneNumber: ''
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedRisks, setAcceptedRisks] = useState(false);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [medicalStep, setMedicalStep] = useState(0);
    const [intakeData, setIntakeData] = useState({});
    const [summaryData, setSummaryData] = useState({});
    const [eligibilityData, setEligibilityData] = useState({
        sex: 'male',
        genderOther: '',
        dob: '',
        dobMonth: '',
        dobDay: '',
        dobYear: '',
        state: '',
        phone: '',
        consent: false,
        pcpVisitLast6Months: '',
        labResults: []
    });
    const [idData, setIdData] = useState({ type: '', number: '', file: null });
    const [shippingData, setShippingData] = useState({ firstName: '', lastName: '', address: '', apt: '', city: '', state: '', zip: '', phone: '', email: '' });
    const [paymentData, setPaymentData] = useState({ cardNumber: '', expiry: '', cvc: '', coupon: '' });
    const [showStripe, setShowStripe] = useState(false);
    const [stateSearch, setStateSearch] = useState('');
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const [pcpStateSearch, setPcpStateSearch] = useState('');
    const [showPcpStateDropdown, setShowPcpStateDropdown] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [uploading, setUploading] = useState(null); // Track which file is being uploaded
    const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
    const [showVerificationSent, setShowVerificationSent] = useState(false);
    const [tempUserId, setTempUserId] = useState(null);
    const [piiData, setPiiData] = useState({ pcpFirstName: '', pcpLastName: '', pcpState: '', pcpNpi: '', pastDosage: '', noPcp: false });
    const [labFulfillment, setLabFulfillment] = useState(null); // 'order' or 'optout'
    const [aiReviewing, setAiReviewing] = useState(false);
    const [aiApproved, setAiApproved] = useState(null);
    const [npiResults, setNpiResults] = useState([]);
    const [npiLoading, setNpiLoading] = useState(false);
    const [intakeError, setIntakeError] = useState('');
    const [pcpNotFound, setPcpNotFound] = useState(false);
    const [pendingFile, setPendingFile] = useState(null); // { file, type, previewUrl, questionId (optional) }
    const [triedToContinue, setTriedToContinue] = useState(false);

    const handleFileSelection = (file, type, questionId = null) => {
        if (!file) return;

        // Revoke old URL if it exists
        if (pendingFile?.previewUrl) {
            URL.revokeObjectURL(pendingFile.previewUrl);
        }

        let previewUrl = null;
        if (file.type.startsWith('image/')) {
            previewUrl = URL.createObjectURL(file);
        }

        setPendingFile({ file, type, questionId, previewUrl });
    };

    const handleMultipleFileSelection = (files, type, questionId = null) => {
        if (!files || files.length === 0) return;

        const fileList = Array.from(files);
        const newPendingFiles = fileList.map(file => {
            let previewUrl = null;
            if (file.type.startsWith('image/')) {
                previewUrl = URL.createObjectURL(file);
            }
            return { file, type, questionId, previewUrl };
        });

        // For multiple files, we'll store them in a temporary state or process them one by one
        // For now, let's just use the first one as 'pending' for the simple UI, 
        // but the 'file' type handler will handle multiple uploads.
        setPendingFile(newPendingFiles[0]);
    };

    const handleNPISearch = async (firstName, lastName, state) => {
        if (!firstName || !lastName || !state) {
            toast.error("Please fill in first name, last name, and state");
            return;
        }
        setNpiLoading(true);
        try {
            const buildUrl = (f, l, s) => `https://npiregistry.cms.hhs.gov/api/?version=2.1&first_name=${encodeURIComponent(f)}&last_name=${encodeURIComponent(l)}&state=${encodeURIComponent(s)}`;

            const performFetch = async (targetUrl) => {
                const proxies = [
                    `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
                    `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`
                ];

                for (const proxyUrl of proxies) {
                    try {
                        const res = await fetch(proxyUrl);
                        if (!res.ok) continue;
                        const rawData = await res.json();
                        // Handle AllOrigins {contents: "..."} wrapper vs raw JSON from other proxies
                        return rawData.contents ? JSON.parse(rawData.contents) : rawData;
                    } catch (e) {
                        console.warn(`Proxy failed: ${proxyUrl}`, e);
                        continue;
                    }
                }
                throw new Error("CORS Proxy Failure");
            };

            // Initial Attempt
            let data = await performFetch(buildUrl(firstName, lastName, state));

            // Smart Fallback: Swap First/Last names if 0 results found
            if (!data.results || data.results.length === 0) {
                try {
                    const fallbackData = await performFetch(buildUrl(lastName, firstName, state));
                    if (fallbackData.results && fallbackData.results.length > 0) {
                        data = fallbackData;
                        toast.info("Showing results for swapped names — we found a match!");
                    }
                } catch (fallbackErr) {
                    console.warn("Fallback search failed", fallbackErr);
                }
            }

            if (data.results && data.results.length > 0) {
                setNpiResults(data.results);
                setPcpNotFound(false);
            } else {
                setNpiResults([]);
                setPcpNotFound(true);
                toast.error("No results found. Please check spelling or verify name order.");
            }
        } catch (error) {
            console.error("NPI search error:", error);
            toast.error("Search failed. Our system encountered a connection issue. Please enter NPI manually if known.");
        } finally {
            setNpiLoading(false);
        }
    };

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

    const callAIReview = async () => {
        setAiReviewing(true);
        try {
            const age = eligibilityData.dobYear ? new Date().getFullYear() - parseInt(eligibilityData.dobYear) : 'Unknown';

            // Critical check: ensure we use the current computedBMI
            // Priority: computedBMI (calculator) -> calculated from intakeData (form)
            let currentBmi = computedBMI;

            if (!currentBmi) {
                const weight = parseFloat(intakeData.weight || intakeData.weight_intake || intakeData.weight_longevity || bmiWeight);
                const heightStr = intakeData.height || intakeData.height_intake || intakeData.height_longevity;

                if (weight > 0) {
                    let totalInches = 0;
                    if (heightStr) {
                        const h = parseHeight(heightStr);
                        totalInches = h.feet * 12 + h.inches;
                    } else if (bmiHeightFeet) {
                        totalInches = (parseInt(bmiHeightFeet) || 0) * 12 + (parseInt(bmiHeightInches) || 0);
                    }

                    if (totalInches > 0) {
                        currentBmi = ((weight * 703) / (totalInches * totalInches)).toFixed(1);
                    }
                }
            }

            const { data, error } = await supabase.functions.invoke('check-ai-eligibility', {
                body: {
                    intakeData,
                    bmi: currentBmi,
                    age,
                    sex: eligibilityData.sex || intakeData.assigned_sex_intake
                }
            });

            if (error) throw error;
            setAiApproved(data.approved);
        } catch (error) {
            console.error('AI Review Error:', error);
            // Fallback to simple logic if AI fails
            const bmiValue = parseFloat(computedBMI || 0);
            setAiApproved(bmiValue >= 27);
        } finally {
            setAiReviewing(false);
        }
    };

    const callSexualHealthAIReview = async () => {
        setAiReviewing(true);
        try {
            const { data, error } = await supabase.functions.invoke('check-sexual-health-eligibility', {
                body: { intakeData }
            });
            if (error) throw error;
            setAiApproved(data.approved);
        } catch (error) {
            console.error('Sexual Health AI Review Error:', error);
            // Fallback: approve unless we can detect an obvious contraindication client-side
            const hasContraindication =
                intakeData.nitrate_medications === 'Yes' ||
                intakeData.recreational_nitrates === 'Yes' ||
                intakeData.riociguat === 'Yes' ||
                intakeData.heart_disease === 'Yes – unstable or worsening' ||
                intakeData.heart_attack_stroke === 'Yes – within the past 6 months' ||
                intakeData.sexual_activity_restricted === 'Yes' ||
                intakeData.blood_pressure === 'Yes – uncontrolled';
            setAiApproved(!hasContraindication);
        } finally {
            setAiReviewing(false);
        }
    };

    const getHairRestorationScore = () => {
        let score = 0;
        const risks = [];

        // General & Hair History
        const duration = intakeData.hair_loss_duration;
        if (duration === '6–12 months') score += 1;
        if (duration === '1–3 years') score += 2;
        if (duration === 'More than 3 years') score += 3;

        const progression = intakeData.hair_loss_progression;
        if (progression === 'Gradual') score += 1;
        if (progression === 'Rapid') score += 2;

        const miniaturization = intakeData.miniaturization;
        if (miniaturization === 'Mild') score += 1;
        if (miniaturization === 'Moderate') score += 2;
        if (miniaturization === 'Severe') score += 3;

        // Contraindications
        const isFemale = eligibilityData.sex === 'female' || intakeData.assigned_sex_intake === 'female';
        if (isFemale) {
            if (intakeData.female_reproduction === 'Yes – cannot use finasteride') {
                risks.push('Pregnancy/Breastfeeding - Absolute Contraindication');
            }
            if (intakeData.female_contraception === 'No – finasteride cannot be prescribed') {
                risks.push('No reliable contraception');
            }
        }

        if (intakeData.liver_disease === 'Severe') risks.push('Severe Liver Disease');
        if (intakeData.kidney_disease === 'Severe') risks.push('Severe Kidney Disease');
        if (intakeData.cv_disease === 'Unstable / worsening') risks.push('Unstable Cardiovascular Disease');
        if (intakeData.prostate_hormone_disease === 'Active / untreated') risks.push('Active Prostate/Hormone Condition');
        if (intakeData.mental_health_status === 'Yes, not well controlled') risks.push('Uncontrolled mental health');

        return { score, risks, approved: risks.length === 0 };
    };

    const callHairRestorationAIReview = async () => {
        setAiReviewing(true);
        try {
            // Simulate AI review with local scoring logic
            const { approved } = getHairRestorationScore();
            setAiApproved(approved);
        } catch (error) {
            console.error('Hair Restoration AI Review Error:', error);
            setAiApproved(true); // Fallback to approve
        } finally {
            setAiReviewing(false);
        }
    };

    // Persistence Logic
    const STORAGE_KEY = `glp_assessment_v1_${categoryId}`;

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.step) {
                    let nextStep = data.step;
                    if (nextStep === 6 || nextStep === 7) nextStep = 8;
                    // Forward users stuck on the now-deleted Review step (9) directly to Payment (12)
                    if (nextStep === 9) nextStep = 12;
                    setStep(nextStep);
                }
                if (data.selectedImprovements) setSelectedImprovements(data.selectedImprovements);
                if (data.medicalStep) setMedicalStep(data.medicalStep);
                if (data.intakeData) setIntakeData(data.intakeData);
                if (data.eligibilityData) setEligibilityData(data.eligibilityData);
                if (data.idData) setIdData(data.idData);
                if (data.shippingData) setShippingData(data.shippingData);
                if (data.tempUserId) setTempUserId(data.tempUserId);
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
                shippingData,
                tempUserId
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        }
    }, [step, selectedImprovements, medicalStep, intakeData, eligibilityData, idData, shippingData, tempUserId, STORAGE_KEY]);

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
        console.log('Upload starting for folder:', folder, 'User:', user?.id, 'TempUser:', tempUserId);
        try {
            const { data, error } = await supabase.storage
                .from('assessment-uploads')
                .upload(filePath, file);

            console.log('Upload attempt for:', filePath);
            if (error) {
                console.error('Supabase upload error object:', error);
                throw error;
            }
            console.log('Upload success data:', data);

            const { data: signedData, error: signedError } = await supabase.storage
                .from('assessment-uploads')
                .createSignedUrl(filePath, 31536000); // 1 year in seconds

            if (signedError) throw signedError;

            onComplete(signedData.signedUrl);
        } catch (error) {
            console.error('Upload error details:', error);
            const errorMessage = error.message || error.error_description || 'Unknown error';
            alert(`Error uploading file: ${errorMessage}. Please check your connection or file type.`);
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
    }, [step, medicalStep, showQuote]);

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
            } else if (step === 15) {
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

            // Prepared polymorphic field resolution
            const resolvedHeight = intakeData.height || intakeData.height_intake || intakeData.height_longevity;
            const h = parseHeight(resolvedHeight);

            const resolvedWeight = intakeData.weight || intakeData.weight_intake || intakeData.weight_longevity;
            const weightVal = parseFloat(resolvedWeight) || 0;

            const heightInInches = (h.feet * 12) + h.inches;
            const bmiVal = heightInInches > 0 ? (weightVal / (heightInInches * heightInInches)) * 703 : 0;

            const firstName = user?.user_metadata?.first_name || authData.firstName || '';
            const lastName = user?.user_metadata?.last_name || authData.lastName || '';

            // Prepare submission data mapping
            const submissionData = {
                user_id: user?.id || tempUserId,
                goals: selectedImprovements,
                custom_goal: intakeData.other_goal_details,

                // Biometrics
                height_feet: h.feet > 0 ? h.feet : (parseInt(bmiHeightFeet) || null),
                height_inches: h.inches > 0 ? h.inches : (parseInt(bmiHeightInches) || null),
                weight: weightVal > 0 ? weightVal : (parseFloat(bmiWeight) || null),
                bmi: (computedBMI ? parseFloat(computedBMI) : (parseFloat(bmiVal.toFixed(1)) || null)),

                // Basics
                sex: eligibilityData.sex || intakeData.assigned_sex_intake || intakeData.sex,
                birthday: eligibilityData.dob || intakeData.dob,
                state: eligibilityData.state || shippingData.state || intakeData.state,
                seen_pcp: intakeData.pcp_labs || eligibilityData.pcpVisitLast6Months || intakeData.has_pcp_long,
                email: user?.email || authData.email || shippingData.email,

                // PCP & Prescription details (including piiData)
                pcp_first_name: intakeData.pcp_first_name || piiData.pcpFirstName,
                pcp_last_name: intakeData.pcp_last_name || piiData.pcpLastName,
                pcp_state: piiData.pcpState,
                pcp_npi: intakeData.pcp_npi || piiData.pcpNpi,
                pcp_details: intakeData.pcp_details,
                no_pcp: piiData.noPcp,
                lab_fulfillment: labFulfillment || intakeData.lab_fulfillment,
                past_dosage: piiData.pastDosage,

                // Medical Conditions
                heart_conditions: intakeData.heart_conditions || intakeData.heart || intakeData.heart_condition_dx_sh,
                atrial_fib_change: intakeData.afib_follow,
                hormone_conditions: intakeData.hormone_conditions || intakeData.hormone,
                cancer_history: intakeData.cancer_history || intakeData.cancer || intakeData.personal_cancer_hx,
                cancer_details: intakeData.cancer_details || intakeData.personal_cancer_hx_details,
                diabetes_status: intakeData.diabetes || (intakeData.med_diagnostics_sh?.includes('BP/Diabetes/Cholesterol') ? 'Diabetes (from SH)' : null),
                gi_conditions: intakeData.gi_conditions || intakeData.gi,
                mental_health_conditions: intakeData.mental_health || intakeData.mental || intakeData.mental_health_list_sh,
                anxiety_severity: intakeData.anxiety_sev,
                additional_conditions: intakeData.additional_conditions || intakeData.additional,

                // Lifestyle & Impact
                weight_impact_qol: intakeData.weight_impact || intakeData.qol_rate,
                weight_impact_details: intakeData.qol_details || intakeData.weight_impact,

                // Medications & Allergies
                allergies: intakeData.allergies || intakeData.allergies_sh_sh || intakeData.allergies_list_long,
                current_medications: intakeData.current_meds || intakeData.cardio_meds_list_sh,
                other_medications: intakeData.other_meds || intakeData.supplements || intakeData.meds_list_long,
                past_weight_loss_methods: intakeData.past_weightloss_methods || intakeData.past_methods,
                past_prescription_meds: intakeData.past_rx_weightloss || intakeData.past_rx,

                // Identity & Diversity
                race_ethnicity: intakeData.ethnicity,
                other_health_goals: intakeData.other_health_goals || intakeData.other_goals,
                has_additional_info: intakeData.additional_health_info || "No",
                additional_health_info: intakeData.additional_health_info_details || intakeData.symptom_detail_sh || intakeData.anything_else_long,

                // Identification
                identification_type: idData.type,
                identification_number: idData.number,
                identification_url: idData.file_url,

                // Shipping
                shipping_first_name: shippingData.firstName || firstName,
                shipping_last_name: shippingData.lastName || lastName,
                shipping_address: shippingData.address,
                shipping_apt: shippingData.apt,
                shipping_city: shippingData.city,
                shipping_state: shippingData.state,
                shipping_zip: shippingData.zip,
                shipping_phone: shippingData.phone || eligibilityData.phone,
                shipping_email: shippingData.email || user?.email || authData.email,

                // Metadata & Files
                approval_status: 'pending',
                submitted_at: new Date().toISOString(),
                selected_drug: categoryId,
                lab_results_url: [
                    ...((Array.isArray(eligibilityData.labResults) ? eligibilityData.labResults : (eligibilityData.labResults ? [eligibilityData.labResults] : []))),
                    ...((Array.isArray(intakeData.lab_results_url) ? intakeData.lab_results_url : (intakeData.lab_results_url ? [intakeData.lab_results_url] : [])))
                ],
                past_rx_file_url: intakeData.past_rx_weightloss_file || intakeData.past_rx_file || null,
                glp1_prescription_url: intakeData.current_meds_file ? [intakeData.current_meds_file] : [],
                coupon_code: paymentData.coupon,

                // Dosage Preferences
                dosage_preference: intakeData.medication_interest === 'Other / Not Sure' ? `Other: ${intakeData.other_medication_details || ''}` : intakeData.medication_interest,

                // COMPLETE RAW DATA SNAPSHOT:
                medical_responses: {
                    ...intakeData,
                    ...piiData,
                    eligibility: eligibilityData,
                    shipping: shippingData,
                    identification: idData
                }
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
                .eq('id', user?.id || tempUserId);

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
            setStep(15); // Go to success step
        } catch (error) {
            console.error('Error submitting assessment:', error);
            alert('Failed to submit assessment. Please try again.');
        } finally {
            setSubmitLoading(false);
        }
    };




    const handleAuthSubmit = async () => {
        setAuthLoading(true);
        setAuthError(null);

        // Validation for signup
        if (authMode === 'signup') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(authData.email)) {
                toast.error('Please enter a valid email address.');
                setAuthLoading(false);
                return;
            }

            let formattedPhone = `${authData.countryCode.trim()}${authData.phoneNumber.replace(/\D/g, '')}`;
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = `+${formattedPhone}`;
            }

            const totalDigits = formattedPhone.replace(/\D/g, '').length;
            if (totalDigits < 7 || totalDigits > 15) {
                toast.error('Please enter a valid phone number.');
                setAuthLoading(false);
                return;
            }

            if (!authData.firstName.trim() || !authData.lastName.trim()) {
                toast.error('Please enter your first and last name.');
                setAuthLoading(false);
                return;
            }

            try {
                // Check if email already exists in profiles
                const { data: existingUser, error: checkError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', authData.email)
                    .maybeSingle();

                if (checkError) {
                    console.warn('Email check error:', checkError);
                }

                if (existingUser) {
                    toast.error('This email is already registered. Please sign in instead.');
                    setAuthLoading(false);
                    return;
                }

                const { data: signUpData, error: signUpError } = await signUp({
                    email: authData.email,
                    password: authData.password,
                    options: {
                        data: {
                            full_name: `${authData.firstName} ${authData.lastName}`,
                            first_name: authData.firstName,
                            last_name: authData.lastName,
                            email: authData.email,
                            phone_number: formattedPhone
                        },
                        emailRedirectTo: `${window.location.origin}/dashboard`
                    }
                });
                if (signUpError) throw signUpError;

                if (signUpData?.user) {
                    setTempUserId(signUpData.user.id);
                }

                // Create/Update Profile record immediately
                if (signUpData?.user) {
                    try {
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: signUpData.user.id,
                                email: authData.email,
                                first_name: authData.firstName,
                                last_name: authData.lastName,
                                phone_number: formattedPhone,
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'id' });

                        if (profileError) {
                            console.warn('Initial profile sync warning:', profileError.message);
                        }
                    } catch (err) {
                        console.warn('Profile upsert failed:', err);
                    }
                }

                toast.success('Information submitted. Please continue.');
                if (categoryId === 'weight-loss') {
                    setMedicalStep(0);
                    setStep(8);
                } else if (categoryId === 'sexual-health' || categoryId === 'hair-restoration') {
                    setMedicalStep(0);
                    setStep(8); // Go straight to Medical Intake (Eligibility is skipped)
                } else {
                    setStep(4);
                }
                return;
            } catch (err) {
                toast.error(err.message);
            } finally {
                setAuthLoading(false);
            }
        } else {
            // Minimal validation for signin
            if (!authData.email || !authData.password) {
                toast.error('Please enter your email and password.');
                setAuthLoading(false);
                return;
            }

            try {
                const { error } = await signIn({
                    email: authData.email,
                    password: authData.password
                });
                if (error) throw error;
                if (categoryId === 'weight-loss') {
                    setMedicalStep(0);
                    setStep(8);
                } else if (categoryId === 'sexual-health' || categoryId === 'hair-restoration') {
                    setMedicalStep(0);
                    setStep(8); // Go straight to Medical Intake (Eligibility is skipped)
                } else {
                    setStep(4);
                }
            } catch (err) {
                toast.error(err.message);
            } finally {
                setAuthLoading(false);
            }
        }
    };

    const handleVerifyOtp = async () => {
        setVerifying(true);
        setAuthError(null);

        let formattedPhone = `${authData.countryCode.trim()}${authData.phoneNumber.replace(/\D/g, '')}`;
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+${formattedPhone}`;
        }

        try {
            const { error } = await verifyOtp({
                phone: formattedPhone,
                token: otp,
                type: 'sms'
            });

            if (error) throw error;

            setShowOtpInput(false);
            setShowVerificationSent(true);
            toast.success('Phone number verified successfully!');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setVerifying(false);
        }
    };

    const categoryData = categoryQuestions[categoryId] || categoryQuestions['weight-loss'];
    const medicalQuestions = intakeQuestions[categoryId] || intakeQuestions['weight-loss'];

    // Moved GSAP effect to top-level effects to prevent hook ordering issues


    if (hasExistingSubmission) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center text-[#1a1a1a]">
                <div className="w-20 h-20 bg-black/10 rounded-full flex items-center justify-center mb-6 border border-black/20">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2">
                        <path d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Already <span className="text-black">Submitted</span></h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest max-w-xs mb-8">
                    You have an active record for this category. Please check your dashboard for updates.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/')} className="px-8 py-4 bg-black/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Go Home</button>
                    <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-accent-black text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Dashboard</button>
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

    const toggleSexualHealthGoal = (id) => {
        setSelectedSexualHealthGoals(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const toggleHairGoal = (id) => {
        setSelectedHairGoals(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleContinue = () => {
        if (selectedImprovements.length > 0) {
            if (user) {
                if (categoryId === 'weight-loss') {
                    setMedicalStep(0);
                    setStep(5); // Logged-in weight-loss users go to Eligibility step
                } else if (categoryId === 'sexual-health' || categoryId === 'hair-restoration') {
                    setMedicalStep(0);
                    setStep(8); // Go straight to Medical Intake (Eligibility skipped)
                } else {
                    setStep(4); // Other categories go to BMI/Drug step
                }
            } else {
                setStep(3); // Go to Registration (Auth Step)
            }
        }
    };

    // Compute BMI from imperial inputs
    const computedBMI = (() => {
        const totalInches = (parseInt(bmiHeightFeet) || 0) * 12 + (parseInt(bmiHeightInches) || 0);
        const lbs = parseFloat(bmiWeight) || 0;
        if (totalInches <= 0 || lbs <= 0) return null;
        const bmi = ((lbs * 703) / (totalInches * totalInches)).toFixed(1);
        return bmi;
    })();

    // Update intakeData with BMI whenever it changes to ensure it's captured in the form snapshot
    useEffect(() => {
        if (computedBMI) {
            setIntakeData(prev => ({ ...prev, bmi: computedBMI, weight: bmiWeight, height: `${bmiHeightFeet}'${bmiHeightInches}"` }));
        }
    }, [computedBMI, bmiWeight, bmiHeightFeet, bmiHeightInches]);

    const getBMICategory = (bmi) => {
        const v = parseFloat(bmi);
        if (v < 18.5) return { label: 'Underweight', color: '#3B82F6', bg: '#EFF6FF', eligible: false };
        if (v < 25) return { label: 'Healthy Weight', color: '#22C55E', bg: '#F0FDF4', eligible: false };
        if (v < 30) return { label: 'Overweight', color: '#F59E0B', bg: '#FFFBEB', eligible: true };
        if (v < 35) return { label: 'Obese Class I', color: '#EF4444', bg: '#FEF2F2', eligible: true };
        if (v < 40) return { label: 'Obese Class II', color: '#DC2626', bg: '#FEF2F2', eligible: true };
        return { label: 'Obese Class III', color: '#991B1B', bg: '#FEF2F2', eligible: true };
    };

    const bmiCategory = computedBMI ? getBMICategory(computedBMI) : null;

    const renderBMICalculatorStep = () => (
        <div className="max-w-4xl mx-auto py-20 px-6 bg-white" style={{ opacity: 1 }}>
            {/* Header */}
            <div className="text-center mb-14">

                <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-[#1a1a1a] mb-4">
                    Your BMI<br /><span style={{ color: '#1a1a1a' }}>Calculator</span>
                </h2>
                <p className="text-gray-500 text-sm font-medium max-w-md mx-auto">
                    GLP-1 medications are clinically indicated for BMI ≥ 27 with a health condition, or BMI ≥ 30. Let's see where you stand.
                </p>
            </div>

            {/* Calculator Card */}
            <div className="bg-white border-2 border-black/8 rounded-[40px] p-10 shadow-sm mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Height */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-black/50 mb-3">Height</label>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <select
                                    value={bmiHeightFeet}
                                    onChange={e => setBmiHeightFeet(e.target.value)}
                                    className="w-full px-4 py-4 rounded-2xl border-2 border-black/10 bg-gray-50 text-[#1a1a1a] font-black text-sm focus:outline-none focus:border-black transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">ft</option>
                                    {[4, 5, 6, 7].map(f => <option key={f} value={f}>{f} ft</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <select
                                    value={bmiHeightInches}
                                    onChange={e => setBmiHeightInches(e.target.value)}
                                    className="w-full px-4 py-4 rounded-2xl border-2 border-black/10 bg-gray-50 text-[#1a1a1a] font-black text-sm focus:outline-none focus:border-black transition-all appearance-none cursor-pointer"
                                >
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => <option key={i} value={i}>{i} in</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Weight */}
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-black/50 mb-3">Weight (lbs)</label>
                        <input
                            type="number"
                            min="50" max="700"
                            placeholder="e.g. 185"
                            value={bmiWeight}
                            onChange={e => setBmiWeight(e.target.value)}
                            className="w-full px-4 py-4 rounded-2xl border-2 border-black/10 bg-gray-50 text-[#1a1a1a] font-black text-sm focus:outline-none focus:border-black transition-all"
                        />
                    </div>
                </div>

                {/* BMI Result */}
                {computedBMI && bmiCategory && (
                    <div
                        className="rounded-[24px] p-8 transition-all duration-500 flex flex-col md:flex-row items-center gap-8"
                        style={{ backgroundColor: bmiCategory.bg, border: `2px solid ${bmiCategory.color}20` }}
                    >
                        {/* BMI Number */}
                        <div className="text-center md:text-left flex-shrink-0">
                            <div className="text-7xl font-black leading-none" style={{ color: bmiCategory.color }}>{computedBMI}</div>
                            <div className="text-[11px] font-black uppercase tracking-[0.3em] mt-1" style={{ color: bmiCategory.color }}>BMI Score</div>
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-20 bg-black/10"></div>

                        {/* Category Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="text-2xl font-black uppercase tracking-tight mb-2" style={{ color: bmiCategory.color }}>
                                {bmiCategory.label}
                            </div>
                            <p className="text-sm text-gray-600 font-medium mb-4 leading-relaxed">
                                {bmiCategory.eligible
                                    ? '✓ Based on your BMI, you may qualify for GLP-1 weight loss medication through our clinical program.'
                                    : 'Your current BMI is below the clinical threshold for GLP-1 medications. You may still qualify with certain health conditions.'}
                            </p>
                            {/* BMI Scale Bar */}
                            <div className="relative h-2 rounded-full bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-600 overflow-hidden">
                                <div
                                    className="absolute top-0 w-3 h-3 rounded-full border-2 border-white shadow-md -mt-0.5 transition-all duration-700"
                                    style={{
                                        backgroundColor: bmiCategory.color,
                                        left: `${Math.min(Math.max(((parseFloat(computedBMI) - 15) / 25) * 100, 2), 96)}%`
                                    }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-gray-400 mt-1">
                                <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40+</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!computedBMI && (
                    <div className="rounded-[24px] p-8 bg-gray-50 border-2 border-dashed border-black/10 text-center">
                        <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Enter your height & weight to see your BMI</p>
                    </div>
                )}
            </div>

            {/* BMI Reference Table */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                {[
                    { range: '< 18.5', label: 'Underweight', color: '#3B82F6' },
                    { range: '18.5–24.9', label: 'Healthy', color: '#22C55E' },
                    { range: '25–29.9', label: 'Overweight', color: '#F59E0B' },
                    { range: '≥ 30', label: 'Obese', color: '#EF4444' },
                ].map((cat) => (
                    <div key={cat.label} className="rounded-2xl p-4 text-center" style={{ backgroundColor: cat.color + '12', border: `1px solid ${cat.color}30` }}>
                        <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: cat.color }}>{cat.label}</div>
                        <div className="text-[11px] font-bold text-gray-500">{cat.range}</div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                <button
                    onClick={() => { setShowBMI(false); setShowQuote(true); }}
                    className="w-full md:w-auto px-10 py-6 bg-black/5 border border-black/10 text-[#1a1a1a] rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/30"
                >
                    Back
                </button>
                <button
                    onClick={() => { setShowBMI(false); setShowQuote2(true); }}
                    disabled={!computedBMI}
                    className={`w-full md:w-auto px-16 py-6 rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 ${!computedBMI
                        ? 'bg-black/10 text-black/20 cursor-not-allowed'
                        : 'bg-black text-white hover:scale-105'
                        }`}
                    onMouseEnter={e => {
                        if (computedBMI) {
                            e.currentTarget.style.backgroundColor = '#FFDE59';
                            e.currentTarget.style.color = '#1a1a1a';
                        }
                    }}
                    onMouseLeave={e => {
                        if (computedBMI) {
                            e.currentTarget.style.backgroundColor = '#000000';
                            e.currentTarget.style.color = '#ffffff';
                        } else {
                            e.currentTarget.style.backgroundColor = '';
                            e.currentTarget.style.color = '';
                        }
                    }}
                >
                    Continue to Assessment
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>
        </div>
    );

    const renderQuote2Step = () => (
        <div className="max-w-7xl mx-auto py-20 px-6 bg-white" style={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row items-center gap-16">
                {/* Image side (left on desktop) */}
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                        <img
                            src={quoteTargetImg}
                            alt="GLP-1 Clinical Research"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        {/* APA Reference fine print */}
                        <div className="absolute bottom-6 left-6 right-6 z-10">
                            <p className="text-[8px] text-white/60 font-medium leading-relaxed">
                                Reference (APA): Wilbon, S. S., &amp; Kolonin, M. G. (2023). GLP‑1 receptor agonists — effects beyond obesity and diabetes. <em>Cells, 13</em>(1), 65. https://doi.org/10.3390/cells13010065
                            </p>
                        </div>
                    </div>
                </div>

                {/* Text side (right on desktop) */}
                <div className="w-full md:w-1/2 text-left flex flex-col gap-10 bg-white">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white self-start">
                        Clinical Research
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-black/40 mb-4">Scientific Consensus</p>
                        <h2 style={{ color: '#1a1a1a' }} className="text-2xl md:text-3xl font-black tracking-tight leading-[1.25]">
                            "GLP‑1 receptor agonists have been transformative in treating metabolic diseases, enabling significant weight loss and improved glucose control, and preclinical and clinical studies have also revealed beneficial effects on cardiovascular diseases, neurodegeneration, kidney disease, and cancer, highlighting a broad range of positive health impacts beyond obesity and diabetes."
                        </h2>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => { setShowQuote2(false); setShowBMI(true); }}
                            className="w-full md:w-auto px-10 py-6 bg-black/5 border border-black/10 text-[#1a1a1a] rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/30"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setShowQuote2(false)}
                            className="w-full md:w-auto px-16 py-6 bg-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:scale-105 flex items-center justify-center gap-3"
                            style={{ color: '#ffffff' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
                        >
                            Start My Assessment
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderQuoteStep = () => (
        <div className="max-w-7xl mx-auto py-20 px-6 bg-white" style={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row items-center gap-16">
                {/* Left Side: Quote Image with Fine Print */}
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                        <img
                            src={weightlossQuoteImg}
                            alt="Weight Loss Transformation"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        {/* APA Reference fine print at bottom of image */}
                        <div className="absolute bottom-6 left-6 right-6 z-10">
                            <p className="text-[8px] text-white/60 font-medium leading-relaxed">
                                Reference (APA): Ard, J., Lee, C. J., Gudzune, K., Addison, B., Lingvay, I., et al. (2025). Weight reduction over time in tirzepatide‑treated participants by early weight loss response: Post hoc analysis in SURMOUNT‑1. <em>Diabetes, Obesity and Metabolism, 27</em>(9), 5064–5071. https://pmc.ncbi.nlm.nih.gov/articles/PMC12326891/
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Quote and CTA — explicit white bg so nothing bleeds through */}
                <div className="w-full md:w-1/2 text-left flex flex-col gap-10 bg-white">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white self-start">
                        Clinical Efficacy
                    </div>
                    <h2 style={{ color: '#1a1a1a' }} className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.05]">
                        <span className="block">"Experience up to</span>
                        <span className="block">
                            <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>35%</span>
                            {' '}body weight
                        </span>
                        <span className="block">reduction through</span>
                        <span className="block">medication and healthy</span>
                        <span className="block">lifestyle habits."</span>
                    </h2>
                    <button
                        onClick={() => { setShowQuote(false); setShowBMI(true); }}
                        className="w-full md:w-auto px-16 py-8 bg-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 transform hover:scale-105 flex items-center justify-center gap-4"
                        style={{ color: '#ffffff' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
                    >
                        Start Assessment
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSexualHealthQuoteStep = () => (
        <div className="max-w-7xl mx-auto py-10 px-6 bg-white assessment-step" style={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row items-center gap-16">
                {/* Left Side: Quote Image with Fine Print */}
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                        <img
                            src={sexualHealthFirstQuoteImg}
                            alt="Sexual Health Treatment"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        {/* APA Reference fine print at bottom of image */}
                        <div className="absolute bottom-6 left-6 right-6 z-10">
                            <p className="text-[8px] text-white/60 font-medium leading-relaxed">
                                Reference (APA): Goldstein, I., Lue, T. F., Padma-Nathan, H., Rosen, R. C., Steers, W. D., & Wicker, P. A. (1998). Oral sildenafil in the treatment of erectile dysfunction. The New England Journal of Medicine, 338(20), 1397–1404. https://doi.org/10.1056/NEJM199805143382001
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Quote and CTA */}
                <div className="w-full md:w-1/2 text-left flex flex-col gap-10 bg-white">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white self-start">
                        Clinical Efficacy
                    </div>
                    <h2 style={{ color: '#1a1a1a' }} className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.05]">
                        <span className="block">"Men taking prescription treatment for erectile dysfunction report</span>
                        <span className="block">
                            <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>significant improvements</span>
                            {' '}in their ability to
                        </span>
                        <span className="block">achieve and maintain erections, leading to</span>
                        <span className="block">greater sexual satisfaction and</span>
                        <span className="block">improved confidence."</span>
                    </h2>
                    <button
                        onClick={() => { setShowSexualHealthQuote(false); setShowSexualHealthGoals(true); }}
                        className="w-full md:w-auto px-16 py-8 bg-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 transform hover:scale-105 flex items-center justify-center gap-4"
                        style={{ color: '#ffffff' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
                    >
                        Continue Assessment
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderSexualHealthGoalsStep = () => (
        <div className="assessment-step max-w-5xl mx-auto py-20 px-6">
            <div className="text-center mb-16">
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                    Step 3 – Sexual Health <br />
                    <span className="text-[#1a1a1a]">Goal Check</span>
                </h1>
                <p className="text-gray-600 font-medium uppercase tracking-[0.3em] text-[10px] mb-8">
                    What are your goals for treatment?
                </p>
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="space-y-4">
                    {[
                        { id: 'firmness', label: 'Improve firmness and reliability of erections' },
                        { id: 'confidence', label: 'Increase sexual confidence' },
                        { id: 'intimacy', label: 'Improve intimacy with my partner' },
                        { id: 'spontaneous', label: 'Restore spontaneous sexual activity' },
                        { id: 'anxiety', label: 'Reduce performance anxiety' },
                        { id: 'satisfaction', label: 'Improve overall sexual satisfaction' }
                    ].map((goal) => (
                        <div
                            key={goal.id}
                            onClick={() => toggleSexualHealthGoal(goal.id)}
                            className={`group relative p-6 rounded-[20px] cursor-pointer transition-all duration-700 border-2 overflow-hidden ${selectedSexualHealthGoals.includes(goal.id)
                                ? 'border-black bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)]'
                                : 'border-black/10 bg-white hover:border-black/20'
                                }`}
                        >
                            <div className="relative z-10 flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${selectedSexualHealthGoals.includes(goal.id) ? 'bg-black border-black' : 'border-black/30'
                                    }`}>
                                    {selectedSexualHealthGoals.includes(goal.id) && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </div>
                                <span className="text-lg font-medium text-black">{goal.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-16">
                <button
                    onClick={() => { setShowSexualHealthGoals(false); setShowSexualHealthQuote2(true); }}
                    disabled={selectedSexualHealthGoals.length === 0}
                    className={`w-full md:w-auto px-20 py-8 rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 relative overflow-hidden group flex items-center justify-center gap-4 ${selectedSexualHealthGoals.length > 0
                        ? 'bg-black text-white hover:scale-105 shadow-sm cursor-pointer'
                        : 'bg-black/5 text-black/20 cursor-not-allowed'
                        }`}
                    style={selectedSexualHealthGoals.length > 0 ? { color: '#ffffff' } : {}}
                    onMouseEnter={e => {
                        if (selectedSexualHealthGoals.length > 0) {
                            e.currentTarget.style.backgroundColor = '#FFDE59';
                            e.currentTarget.style.color = '#1a1a1a';
                        }
                    }}
                    onMouseLeave={e => {
                        if (selectedSexualHealthGoals.length > 0) {
                            e.currentTarget.style.backgroundColor = '#000000';
                            e.currentTarget.style.color = '#ffffff';
                        }
                    }}
                >
                    <span className="relative z-10 flex items-center gap-4">
                        Continue
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-2 transition-transform">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </span>
                </button>
            </div>
        </div>
    );

    const renderSexualHealthQuote2Step = () => (
        <div className="max-w-7xl mx-auto py-10 px-6 bg-white assessment-step" style={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row items-center gap-16">
                {/* Left Side: Quote Image with Fine Print */}
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                        <img
                            src={sexualHealthQuote2Img}
                            alt="Sexual Health Treatment Results"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        {/* APA Reference fine print at bottom of image */}
                        <div className="absolute bottom-6 left-6 right-6 z-10">
                            <p className="text-[8px] text-white/60 font-medium leading-relaxed">
                                Reference (APA): Rosen, R. C., Fisher, W. A., Eardley, I., Niederberger, C., Nadel, A., & Sand, M. (2004). The multinational Men’s Attitudes to Life Events and Sexuality (MALES) study: Prevalence of erectile dysfunction and related health concerns. The Journal of Urology, 171(6 Pt 1), 2340–2345. https://doi.org/10.1097/01.ju.0000127743.14796.29
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Quote and CTA */}
                <div className="w-full md:w-1/2 text-left flex flex-col gap-10 bg-white">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white self-start">
                        Quality of Life
                    </div>
                    <h2 style={{ color: '#1a1a1a' }} className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.05]">
                        <span className="block">"Treatment of erectile dysfunction has been shown not only to improve erectile function, but also to enhance</span>
                        <span className="block">
                            <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>overall sexual satisfaction</span>
                            {' '}and
                        </span>
                        <span className="block">quality of life for patients</span>
                        <span className="block">and their partners."</span>
                    </h2>
                    <button
                        onClick={() => {
                            setShowSexualHealthQuote2(false);
                            setStep(3); // Always go to Create Account / Sign In step
                        }}
                        className="w-full md:w-auto px-16 py-8 bg-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 transform hover:scale-105 flex items-center justify-center gap-4"
                        style={{ color: '#ffffff' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
                    >
                        Start Medical Assessment
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );

    // ─── Hair Restoration Intro Flow ───────────────────────────────────────────

    const renderHairQuoteStep = () => (
        <div className="max-w-7xl mx-auto py-10 px-6 bg-white assessment-step" style={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row items-center gap-16">
                {/* Left: Image */}
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                        <img
                            src={hairLossFirstQuoteImg}
                            alt="Hair Loss Treatment"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6 z-10">
                            <p className="text-[8px] text-white/60 font-medium leading-relaxed">
                                Reference (APA): Rogers, N. E., & Avram, M. R. (2008). Medical treatments for male and female pattern hair loss. Journal of the American Academy of Dermatology, 59(4), 547–566. https://doi.org/10.1016/j.jaad.2008.04.024
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Quote + CTA */}
                <div className="w-full md:w-1/2 text-left flex flex-col gap-10 bg-white">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white self-start">
                        Clinical Efficacy
                    </div>
                    <h2 style={{ color: '#1a1a1a' }} className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.05]">
                        <span className="block">"Oral therapies targeting multiple pathways of hair loss have been shown to</span>
                        <span className="block">
                            <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>improve hair follicle function,</span>
                            {' '}increase scalp hair density,
                        </span>
                        <span className="block">and stimulate new hair growth,</span>
                        <span className="block">providing meaningful results for patients</span>
                        <span className="block">seeking to restore fuller, healthier hair."</span>
                    </h2>
                    <button
                        onClick={() => { setShowHairQuote(false); setShowHairGoals(true); }}
                        className="w-full md:w-auto px-16 py-8 bg-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 transform hover:scale-105 flex items-center justify-center gap-4"
                        style={{ color: '#ffffff' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
                    >
                        Continue Assessment
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderHairGoalsStep = () => (
        <div className="assessment-step max-w-5xl mx-auto py-20 px-6">
            <div className="text-center mb-16">
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                    Step 3 – Hair Loss <br />
                    <span className="text-[#1a1a1a]">Goals</span>
                </h1>
                <p className="text-gray-600 font-medium uppercase tracking-[0.3em] text-[10px] mb-8">
                    What are your goals for treatment?
                </p>
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="space-y-4">
                    {[
                        { id: 'shedding', label: 'Reduce hair shedding' },
                        { id: 'density', label: 'Increase hair density' },
                        { id: 'regrowth', label: 'Regain hairline or crown coverage' },
                        { id: 'scalp', label: 'Improve overall scalp health' },
                        { id: 'confidence', label: 'Boost self-confidence / appearance' },
                        { id: 'prevention', label: 'Prevent future hair loss progression' },
                    ].map((goal) => (
                        <div
                            key={goal.id}
                            onClick={() => toggleHairGoal(goal.id)}
                            className={`group relative p-6 rounded-[20px] cursor-pointer transition-all duration-700 border-2 overflow-hidden ${selectedHairGoals.includes(goal.id)
                                ? 'border-black bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)]'
                                : 'border-black/10 bg-white hover:border-black/20'
                                }`}
                        >
                            <div className="relative z-10 flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${selectedHairGoals.includes(goal.id) ? 'bg-black border-black' : 'border-black/30'}`}>
                                    {selectedHairGoals.includes(goal.id) && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </div>
                                <span className="text-lg font-medium text-black">{goal.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-16">
                <button
                    onClick={() => { setShowHairGoals(false); setShowHairQuote2(true); }}
                    disabled={selectedHairGoals.length === 0}
                    className={`w-full md:w-auto px-20 py-8 rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 relative overflow-hidden group flex items-center justify-center gap-4 ${selectedHairGoals.length > 0
                        ? 'bg-black text-white hover:scale-105 shadow-sm cursor-pointer'
                        : 'bg-black/5 text-black/20 cursor-not-allowed'
                        }`}
                    style={selectedHairGoals.length > 0 ? { color: '#ffffff' } : {}}
                    onMouseEnter={e => { if (selectedHairGoals.length > 0) { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; } }}
                    onMouseLeave={e => { if (selectedHairGoals.length > 0) { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; } }}
                >
                    <span className="relative z-10 flex items-center gap-4">
                        Continue
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-2 transition-transform">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </span>
                </button>
            </div>
        </div>
    );

    const renderHairQuote2Step = () => (
        <div className="max-w-7xl mx-auto py-10 px-6 bg-white assessment-step" style={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row items-center gap-16">
                {/* Left: Image */}
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                        <img
                            src={hairLossSecondQuoteImg}
                            alt="Hair Restoration Results"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6 z-10">
                            <p className="text-[8px] text-white/60 font-medium leading-relaxed">
                                Reference (APA): Rogers, N. E., & Avram, M. R. (2008). Medical treatments for male and female pattern hair loss. Journal of the American Academy of Dermatology, 59(4), 547–566. https://doi.org/10.1016/j.jaad.2008.04.024
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Quote + CTA */}
                <div className="w-full md:w-1/2 text-left flex flex-col gap-10 bg-white">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white self-start">
                        Quality of Life
                    </div>
                    <h2 style={{ color: '#1a1a1a' }} className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.05]">
                        <span className="block">"Treatment of hair loss has been shown not only to improve hair growth, but also to enhance</span>
                        <span className="block">
                            <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>overall satisfaction</span>
                            {' '}and
                        </span>
                        <span className="block">quality of life for patients</span>
                        <span className="block">and their partners."</span>
                    </h2>
                    <button
                        onClick={() => {
                            setShowHairQuote2(false);
                            setStep(3); // Always go to Create Account / Sign In step
                        }}
                        className="w-full md:w-auto px-16 py-8 bg-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 transform hover:scale-105 flex items-center justify-center gap-4"
                        style={{ color: '#ffffff' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
                    >
                        Start Medical Assessment
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStep0 = () => (
        <div className="assessment-step max-w-5xl mx-auto py-20 px-6">
            <div className="text-center mb-16">
                <h1 className="text-2xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                    {categoryData.question[0]} <br />
                    <span className="text-[#1a1a1a]">{categoryData.question[1]}</span>
                </h1>
                <p className="text-gray-600 font-medium uppercase tracking-[0.3em] text-[10px]">
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
                                ? 'border-black bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)]'
                                : 'border-black/10 bg-white hover:border-black/20'
                                }`}
                        >
                            <div className="relative z-10">
                                <h3 className={`text-2xl font-medium tracking-tighter mb-3 transition-colors duration-500 text-black assessment-option-arial pr-12`}>
                                    {opt.name}
                                </h3>
                                <p className="text-gray-600 text-sm font-medium leading-relaxed pr-12">
                                    {opt.desc}
                                </p>
                            </div>

                            {/* Selection indicator */}
                            <div className={`absolute top-8 right-8 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-accent-black border-accent-black scale-110' : 'border-black/10 opacity-30 group-hover:opacity-100'
                                }`}>
                                {isSelected && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedImprovements.includes('other-goal') && (
                <div className="mb-16 animate-fadeIn">
                    <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-black/50 mb-6">Tell us more about your goal</label>
                    <textarea
                        value={otherGoalText}
                        onChange={(e) => setOtherGoalText(e.target.value)}
                        placeholder="Please describe your specific goal here..."
                        className="w-full p-8 rounded-[32px] bg-black/5 border-2 border-black/10 focus:border-black focus:bg-white text-lg font-medium outline-none transition-all duration-500 min-h-[200px] resize-none"
                    />
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                <Link
                    to="/"
                    className="w-full md:w-auto px-12 py-8 bg-black/5 border border-black/10 text-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-black/30 flex justify-center items-center"
                >
                    Back
                </Link>
                <button
                    onClick={handleContinue}
                    disabled={selectedImprovements.length === 0}
                    className={`w-full md:w-auto px-20 py-8 rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 relative overflow-hidden group flex items-center justify-center gap-4 ${selectedImprovements.length > 0
                        ? 'bg-black text-white hover:scale-105 shadow-sm cursor-pointer'
                        : 'bg-black/5 text-black/20 cursor-not-allowed'
                        }`}
                    style={selectedImprovements.length > 0 ? { color: '#ffffff' } : {}}
                    onMouseEnter={e => {
                        if (selectedImprovements.length > 0) {
                            e.currentTarget.style.backgroundColor = '#FFDE59';
                            e.currentTarget.style.color = '#1a1a1a';
                        }
                    }}
                    onMouseLeave={e => {
                        if (selectedImprovements.length > 0) {
                            e.currentTarget.style.backgroundColor = '#000000';
                            e.currentTarget.style.color = '#ffffff';
                        }
                    }}
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
        <div className="assessment-step max-w-7xl mx-auto py-20 px-6 flex flex-col md:flex-row items-center gap-16">
            {/* Left Image Section */}
            <div className="w-full md:w-[675px] aspect-[4/5] rounded-[40px] overflow-hidden relative shadow-2xl group flex-shrink-0">
                <img
                    src={categoryData.stat.image}
                    alt="Statistical validation"
                    className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-accent-black/40 to-transparent mix-blend-overlay"></div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            </div>

            {/* Right Content Section */}
            <div className="flex-1 text-left">
                <h2 className="text-black font-black leading-[0.85] mb-12 tracking-tighter">
                    <span className="text-6xl md:text-[100px] block mb-4">{categoryData.stat.pct}</span>
                    <span className="text-2xl md:text-5xl uppercase block opacity-90">{categoryData.stat.text}</span>
                    <span className="text-2xl md:text-5xl uppercase inline-block bg-accent-black text-black px-4 mt-2">{categoryData.stat.highlight}</span>
                </h2>

                <div className="flex flex-col md:flex-row items-center gap-6">
                    <button
                        onClick={() => setStep(0)}
                        className="w-full md:w-auto px-12 py-8 bg-black/5 border border-black/10 text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-black/30"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => setStep(2)} // Continue to the review step
                        className="w-full md:w-auto px-24 py-8 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:bg-accent-black hover:text-black hover:shadow-[0_0_50px_rgba(19,91,236,0.5)] transform hover:scale-[1.02]"
                    >
                        Continue
                    </button>
                </div>
                <p className="text-gray-400 text-xs font-medium tracking-wide uppercase text-left mt-10">
                    {categoryData.stat.disclaimer}
                </p>
            </div>
        </div>
    );

    const renderReviewStep = () => (
        <div className="assessment-step max-w-6xl mx-auto py-20 px-6">
            <div className="text-center mb-16">
                <div className="inline-block py-2 px-6 bg-accent-black border border-accent-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-black mb-8">
                    Member Journeys
                </div>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6">
                    Tremendous <span className="text-accent-black">Results.</span>
                </h2>
                <p className="text-gray-500 font-medium uppercase tracking-[0.3em] text-[10px]">
                    Real people achieving clinical breakthroughs with our {categoryId.replace('-', ' ')} Medication.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                {categoryData.stat.reviews.map((rev, i) => (
                    <div key={i} className="bg-gray-50 border border-black/5 p-10 rounded-[40px] hover:border-accent-black/30 transition-all duration-700 group relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="inline-block bg-accent-black text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                                {rev.result}
                            </div>
                            <p className="text-2xl font-serif text-black opacity-90 leading-tight mb-8">
                                "{rev.text}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-accent-black/20 border border-accent-black/30 flex items-center justify-center font-black text-accent-black text-xs">
                                    {rev.name.charAt(0)}
                                </div>
                                <span className="text-gray-600 font-black uppercase tracking-widest text-[10px]">{rev.name}</span>
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-accent-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                <button
                    onClick={() => setStep(1)}
                    className="w-full md:w-auto px-12 py-8 bg-black/5 border border-black/10 text-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-black/30"
                >
                    Back
                </button>
                <button
                    onClick={() => user ? setStep(4) : setStep(3)}
                    className="w-full md:w-auto px-20 py-8 bg-black text-white rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:bg-accent-black hover:text-black hover:shadow-[0_0_60px_rgba(19,91,236,0.5)] transform hover:scale-105"
                >
                    Finalize My Plan
                </button>
            </div>
        </div>
    );

    const renderAuthStep = () => {
        // If already logged in, show a "Welcome back" continue screen
        if (user) {
            const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there';
            return (
                <div className="assessment-step max-w-2xl mx-auto py-20 px-6 animate-in fade-in duration-700 bg-white">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: '#FFDE5915', border: '2px solid #FFDE5940' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-8">
                            Welcome Back
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4" style={{ color: '#1a1a1a' }}>
                            Hi, <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>{firstName}.</span>
                        </h2>
                        <p className="font-medium uppercase tracking-[0.2em] text-[10px] max-w-md mx-auto leading-relaxed" style={{ color: '#1a1a1a80' }}>
                            You're already signed in. Continue to your medical assessment below.
                        </p>
                    </div>

                    <div className="rounded-[40px] p-8 md:p-12 space-y-6" style={{ backgroundColor: '#f9f9f7', border: '1px solid #1a1a1a10' }}>
                        <div className="flex items-center gap-4 p-5 bg-white rounded-2xl" style={{ border: '1px solid #1a1a1a08' }}>
                            <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center shrink-0">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 16.7 19.79 19.79 0 0 1 1.62 8.07 2 2 0 0 1 3.59 6h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#1a1a1a50' }}>Signed in as</p>
                                <p className="text-sm font-black" style={{ color: '#1a1a1a' }}>{user.email}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setMedicalStep(0);
                                setStep(8);
                            }}
                            className="w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500"
                            style={{ backgroundColor: '#000', color: '#fff' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; }}
                        >
                            Continue to Assessment →
                        </button>

                        <button
                            onClick={() => { setAuthMode('signup'); }}
                            className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500"
                            style={{ backgroundColor: 'transparent', color: '#1a1a1a50' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#1a1a1a'}
                            onMouseLeave={e => e.currentTarget.style.color = '#1a1a1a50'}
                        >
                            Not you? Sign in with a different account
                        </button>
                    </div>
                </div>
            );
        }

        if (showOtpInput) {

            return (
                <div className="assessment-step max-w-2xl mx-auto py-20 px-6 animate-in fade-in duration-700 bg-white">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: '#FFDE5915', border: '2px solid #FFDE5940' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                        </div>
                        <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-6">
                            Identity Verification
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-4" style={{ color: '#1a1a1a' }}>
                            Verify Your <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>Phone.</span>
                        </h2>
                        <p className="font-medium uppercase tracking-[0.2em] text-[10px] max-w-md mx-auto leading-relaxed" style={{ color: '#1a1a1a99' }}>
                            A security code has been transmitted to{' '}
                            <span className="font-black" style={{ color: '#1a1a1a' }}>{authData.phoneNumber}</span>
                        </p>
                    </div>

                    <div className="rounded-[40px] p-8 md:p-12 text-center" style={{ backgroundColor: '#f9f9f7', border: '1px solid #1a1a1a10' }}>
                        <div className="space-y-6 mb-10">
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="0 0 0 0 0 0"
                                className="w-full rounded-2xl py-6 text-center text-4xl font-black tracking-[0.5em] outline-none transition-all"
                                style={{ backgroundColor: '#fff', border: '2px solid #1a1a1a20', color: '#1a1a1a' }}
                                onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                onBlur={e => e.target.style.borderColor = '#1a1a1a20'}
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleVerifyOtp}
                                disabled={verifying || otp.length < 6}
                                className="w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 disabled:opacity-50"
                                style={{ backgroundColor: '#000', color: '#fff' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; }}
                            >
                                {verifying ? 'Verifying...' : 'Unlock Protocol'}
                            </button>
                            <button
                                onClick={() => setShowOtpInput(false)}
                                className="w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500"
                                style={{ backgroundColor: 'transparent', border: '1px solid #1a1a1a20', color: '#1a1a1a99' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1a1a'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a20'}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (showVerificationSent) {
            return (
                <div className="assessment-step max-w-2xl mx-auto py-20 px-6 animate-in fade-in duration-700 bg-white">
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: '#FFDE5915', border: '2px solid #FFDE5940' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="3" className="animate-pulse">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-6">
                            Verification Sent
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-4" style={{ color: '#1a1a1a' }}>
                            Check Your <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>Email.</span>
                        </h2>
                        <p className="font-medium uppercase tracking-[0.2em] text-[10px] max-w-md mx-auto leading-relaxed" style={{ color: '#1a1a1a99' }}>
                            Clinical verification link transmitted to:{' '}
                            <span className="font-black" style={{ color: '#1a1a1a' }}>{authData.email}</span>
                        </p>
                    </div>

                    <div className="rounded-[40px] p-8 md:p-12" style={{ backgroundColor: '#f9f9f7', border: '1px solid #1a1a1a10' }}>
                        <div className="space-y-4 mb-10 text-left">
                            <div className="flex gap-4 p-5 bg-white rounded-2xl" style={{ border: '1px solid #1a1a1a08' }}>
                                <span className="font-black" style={{ color: '#1a1a1a' }}>01.</span>
                                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#1a1a1a80' }}>Open the email from uGlowMD and click the verification link.</p>
                            </div>
                            <div className="flex gap-4 p-5 bg-white rounded-2xl" style={{ border: '1px solid #1a1a1a08' }}>
                                <span className="font-black" style={{ color: '#1a1a1a' }}>02.</span>
                                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#1a1a1a80' }}>Verify your ownership to unlock the medical intake portal.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => window.open(`https://${authData.email.split('@')[1]}`, '_blank')}
                                className="w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500"
                                style={{ backgroundColor: '#000', color: '#fff' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; }}
                            >
                                Open Mailbox
                            </button>
                            <button
                                onClick={() => setShowVerificationSent(false)}
                                className="w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500"
                                style={{ backgroundColor: 'transparent', border: '1px solid #1a1a1a20', color: '#1a1a1a99' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1a1a'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a20'}
                            >
                                Back to Sign Up
                            </button>
                        </div>

                        <p className="mt-8 text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: '#1a1a1a40', textAlign: 'center' }}>
                            Waiting for secure confirmation...
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="assessment-step max-w-2xl mx-auto py-20 px-6 bg-white">
                <div className="text-center mb-12">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-8">
                        Secure Clinical Portal
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4" style={{ color: '#1a1a1a' }}>
                        {authMode === 'signup' ? 'Create' : 'Access'}<br />
                        <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>Your Account.</span>
                    </h2>
                    <p className="font-medium uppercase tracking-[0.2em] text-[10px]" style={{ color: '#1a1a1a80' }}>
                        Join the telemedicine platform to proceed with your protocol.
                    </p>
                </div>

                <div className="rounded-[40px] p-8 md:p-12" style={{ backgroundColor: '#f9f9f7', border: '1px solid #1a1a1a10' }}>
                    <div className="space-y-6">
                        {authMode === 'signup' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: '#1a1a1a60' }}>First Name</label>
                                        <input
                                            type="text"
                                            placeholder="John"
                                            value={authData.firstName}
                                            onChange={(e) => setAuthData({ ...authData, firstName: e.target.value })}
                                            className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all"
                                            style={{ backgroundColor: '#fff', border: '1.5px solid #1a1a1a15', color: '#1a1a1a' }}
                                            onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                            onBlur={e => e.target.style.borderColor = '#1a1a1a15'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: '#1a1a1a60' }}>Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Doe"
                                            value={authData.lastName}
                                            onChange={(e) => setAuthData({ ...authData, lastName: e.target.value })}
                                            className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all"
                                            style={{ backgroundColor: '#fff', border: '1.5px solid #1a1a1a15', color: '#1a1a1a' }}
                                            onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                            onBlur={e => e.target.style.borderColor = '#1a1a1a15'}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: '#1a1a1a60' }}>Phone Number</label>
                                    <div className="flex gap-4">
                                        <input
                                            type="text"
                                            value={authData.countryCode}
                                            onChange={(e) => {
                                                let val = e.target.value;
                                                if (!val.startsWith('+') && val.length > 0) val = '+' + val;
                                                setAuthData({ ...authData, countryCode: val.replace(/[^\d+]/g, '').slice(0, 5) });
                                            }}
                                            placeholder="+1"
                                            className="w-24 rounded-2xl py-5 text-center font-bold outline-none transition-all"
                                            style={{ backgroundColor: '#fff', border: '1.5px solid #1a1a1a15', color: '#1a1a1a' }}
                                            onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                            onBlur={e => e.target.style.borderColor = '#1a1a1a15'}
                                            required
                                        />
                                        <input
                                            type="tel"
                                            placeholder="555 000 0000"
                                            value={authData.phoneNumber}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setAuthData({ ...authData, phoneNumber: val.replace(/\D/g, '').slice(0, 15) });
                                            }}
                                            className="flex-1 rounded-2xl py-5 px-8 font-bold outline-none transition-all"
                                            style={{ backgroundColor: '#fff', border: '1.5px solid #1a1a1a15', color: '#1a1a1a' }}
                                            onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                            onBlur={e => e.target.style.borderColor = '#1a1a1a15'}
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: '#1a1a1a60' }}>Email Address</label>
                            <input
                                type="email"
                                placeholder="name@email.com"
                                value={authData.email}
                                onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                                className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all"
                                style={{ backgroundColor: '#fff', border: '1.5px solid #1a1a1a15', color: '#1a1a1a' }}
                                onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                onBlur={e => e.target.style.borderColor = '#1a1a1a15'}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: '#1a1a1a60' }}>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={authData.password}
                                onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                                className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all"
                                style={{ backgroundColor: '#fff', border: '1.5px solid #1a1a1a15', color: '#1a1a1a' }}
                                onFocus={e => e.target.style.borderColor = '#FFDE59'}
                                onBlur={e => e.target.style.borderColor = '#1a1a1a15'}
                            />
                        </div>

                        {authMode === 'signup' && (
                            <div className="pt-4 space-y-4">
                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <div className="relative flex items-center mt-1">
                                        <input
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                            className="peer appearance-none w-5 h-5 border-2 rounded-md transition-all"
                                            style={{ borderColor: '#1a1a1a30', backgroundColor: '#fff' }}
                                            onFocus={e => { e.target.style.borderColor = '#FFDE59'; }}
                                        />
                                        <div className="absolute inset-0 peer-checked:bg-[#FFDE59] rounded-md transition-all pointer-events-none" />
                                        <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 left-1 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span className="text-[10px] font-medium leading-relaxed uppercase tracking-wider" style={{ color: '#1a1a1a60' }}>
                                        I accept all <a href="/terms-conditions" target="_blank" className="font-black underline hover:opacity-70 transition-opacity" style={{ color: '#1a1a1a' }}>Terms and Conditions</a> of the telemedicine platform.
                                    </span>
                                </label>

                                <label className="flex items-start gap-4 cursor-pointer group">
                                    <div className="relative flex items-center mt-1">
                                        <input
                                            type="checkbox"
                                            checked={acceptedRisks}
                                            onChange={(e) => setAcceptedRisks(e.target.checked)}
                                            className="peer appearance-none w-5 h-5 border-2 rounded-md transition-all"
                                            style={{ borderColor: '#1a1a1a30', backgroundColor: '#fff' }}
                                        />
                                        <div className="absolute inset-0 peer-checked:bg-[#FFDE59] rounded-md transition-all pointer-events-none" />
                                        <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 left-1 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span className="text-[10px] font-medium leading-relaxed uppercase tracking-wider" style={{ color: '#1a1a1a60' }}>
                                        I understand the medical risks and protocols.
                                    </span>
                                </label>
                            </div>
                        )}

                        <div className="pt-8 space-y-4">
                            <button
                                onClick={handleAuthSubmit}
                                disabled={authLoading || (authMode === 'signup' && (!acceptedTerms || !acceptedRisks))}
                                className="w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 disabled:opacity-30"
                                style={{ backgroundColor: '#000', color: '#fff' }}
                                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; } }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; }}
                            >
                                {authLoading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Clinical Handshake...
                                    </span>
                                ) : authMode === 'signup' ? 'Initiate Protocol' : 'Access Account'}
                            </button>
                            <button
                                onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                                className="w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500"
                                style={{ backgroundColor: 'transparent', border: '1px solid #1a1a1a20', color: '#1a1a1a99' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1a1a'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a20'}
                            >
                                {authMode === 'signup' ? 'Already have an account? Sign In' : 'Need an account? Create one'}
                            </button>
                        </div>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1" style={{ backgroundColor: '#1a1a1a10' }}></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: '#1a1a1a30' }}>OR</span>
                            <div className="h-px flex-1" style={{ backgroundColor: '#1a1a1a10' }}></div>
                        </div>

                        {/* Social Logins */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={async () => {
                                    try {
                                        const { error } = await supabase.auth.signInWithOAuth({
                                            provider: 'google',
                                            options: {
                                                redirectTo: window.location.href
                                            }
                                        });
                                        if (error) throw error;
                                    } catch (err) {
                                        setAuthError(err.message);
                                    }
                                }}
                                className="flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                style={{ backgroundColor: '#fff', border: '1px solid #1a1a1a15', color: '#1a1a1a' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1a1a'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a15'}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                            <button
                                className="flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed opacity-30"
                                style={{ backgroundColor: '#fff', border: '1px solid #1a1a1a15', color: '#1a1a1a' }}
                                disabled
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm5-4H7V6h10v10z" />
                                </svg>
                                Phone
                            </button>
                        </div>

                        <div className="pt-8 text-center" style={{ borderTop: '1px solid #1a1a1a08' }}>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed" style={{ color: '#1a1a1a60' }}>
                                {authMode === 'signup' ? 'Already a member?' : 'New to uGlowMD?'}{' '}
                                <button
                                    onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                                    className="font-black underline hover:opacity-70 transition-opacity"
                                    style={{ color: '#1a1a1a' }}
                                >
                                    {authMode === 'signup' ? 'Sign In Here' : 'Create Clinical Account'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <button onClick={() => setStep(0)} className="text-[9px] font-black uppercase tracking-[0.3em] hover:opacity-70 transition-opacity" style={{ color: '#1a1a1a50' }}>
                        ← Back to goals
                    </button>
                </div>
            </div>
        );
    };


    const renderEligibilityStep = () => {
        // Don't render eligibility step for sexual health - skip directly to identification
        if (categoryId === 'sexual-health') {
            return null;
        }

        return (
            <div className="assessment-step max-w-2xl mx-auto py-20 px-6">
                <div className="text-center mb-12">
                    <div className="inline-block py-2 px-6 bg-accent-black/10 border border-accent-black/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-black mb-8">
                        Step 5: Eligibility Review
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4 leading-tight">
                        Let's make sure you're <br />
                        <span className="text-accent-black">eligible for treatment.</span>
                    </h2>
                    <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[10px]">
                        It's just like intake forms at the doctor.
                    </p>

                </div>

                <div className="bg-gray-50 border border-black/5 rounded-[40px] p-8 md:p-12 backdrop-blur-xl">
                    <div className="space-y-10">
                        {/* Sex Selection - Only show for non-sexual-health categories */}
                        {categoryId !== 'sexual-health' && (
                            <>
                                {/* State & Phone */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 ml-4">Residing State</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search state..."
                                                className={inputClassName}
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
                                                <div className="absolute z-50 left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white border border-black/10 rounded-2xl shadow-2xl backdrop-blur-xl no-scrollbar">
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
                                                                className="px-8 py-4 text-[#1a1a1a] hover:bg-accent-black hover:text-black cursor-pointer text-[10px] font-black uppercase tracking-widest transition-colors flex justify-between items-center"
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
                                                            <div className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-300 text-center">
                                                                No matches found
                                                            </div>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                        {triedToContinue && !eligibilityData.state && (
                                            <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest animate-pulse">State selection is required</p>
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
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="(XXX) XXX-XXXX"
                                            className={`w-full bg-black/5 border ${triedToContinue && !eligibilityData.phone ? 'border-red-500/50' : 'border-black/5'} rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold`}
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
                                            <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest animate-pulse">Phone number is required</p>
                                        )}
                                    </div>
                                </div>

                                {/* PCP Visit */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-4">Have you seen your primary care provider in the past 12 months?</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Yes', 'No'].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setEligibilityData({ ...eligibilityData, pcpVisitLast6Months: v })}
                                                className={`py-4 px-6 rounded-2xl text-[10px] font-medium tracking-widest transition-all assessment-option-arial ${eligibilityData.pcpVisitLast6Months === v
                                                    ? 'border-black text-black bg-white shadow-md scale-[1.02]'
                                                    : (triedToContinue && !eligibilityData.pcpVisitLast6Months ? 'bg-black/5 text-gray-400 border-red-500/50' : 'bg-black/5 text-gray-400 border-black/5 hover:border-black/20')
                                                    } border`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                    {triedToContinue && !eligibilityData.pcpVisitLast6Months && (
                                        <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest animate-pulse">Please select an option</p>
                                    )}

                                    {eligibilityData.pcpVisitLast6Months && (
                                        <div className="mt-6 p-6 bg-white/[0.02] border border-black/5 rounded-3xl">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 leading-relaxed">
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
                                                                <div key={idx} className="flex items-center justify-between p-4 bg-black/5 border border-black/5 rounded-2xl group/file">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 bg-accent-black/10 rounded-lg flex items-center justify-center text-accent-black">
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                                                        </div>
                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Lab Document {idx + 1}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <a href={url} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-accent-black hover:underline">View</a>
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
                                                        className={`w-full flex items-center justify-center gap-4 px-8 py-6 bg-black/5 border-2 border-dashed ${triedToContinue && (!eligibilityData.labResults || eligibilityData.labResults.length === 0) ? 'border-red-500/50' : 'border-black/5'} rounded-2xl hover:border-accent-black transition-all group`}
                                                    >
                                                        {uploading === 'lab-results' ? (
                                                            <div className="w-5 h-5 border-2 border-accent-black border-t-transparent animate-spin rounded-full"></div>
                                                        ) : (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-black">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                                <polyline points="17 8 12 3 7 8"></polyline>
                                                                <line x1="12" y1="3" x2="12" y2="15"></line>
                                                            </svg>
                                                        )}
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 group-hover:text-white">
                                                            {eligibilityData.labResults?.length > 0 ? 'Upload Another Lab Result' : 'Upload Lab Results'}
                                                        </span>
                                                    </button>
                                                    {triedToContinue && (!eligibilityData.labResults || eligibilityData.labResults.length === 0) && (
                                                        <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest animate-pulse">At least one lab result is REQUIRED</p>
                                                    )}
                                                    {eligibilityData.labResults?.length > 0 && (
                                                        <p className="mt-4 text-[8px] font-black uppercase tracking-widest text-accent-black opacity-60 ml-4 text-center">✓ {eligibilityData.labResults.length} Files verified and encrypted</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Consent Text */}
                                    <div className={`p-6 bg-white/[0.02] border ${triedToContinue && !eligibilityData.consent ? 'border-red-500/50' : 'border-black/5'} rounded-3xl`}>
                                        <label className="flex gap-4 cursor-pointer group">
                                            <div className="relative flex-shrink-0 mt-1">
                                                <input
                                                    type="checkbox"
                                                    className="peer hidden"
                                                    checked={eligibilityData.consent}
                                                    onChange={(e) => setEligibilityData({ ...eligibilityData, consent: e.target.checked })}
                                                />
                                                <div className="w-6 h-6 border-2 border-black/5 rounded peer-checked:bg-accent-black peer-checked:border-accent-black transition-all"></div>
                                                <svg className="absolute top-1 left-1 w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed tracking-wide group-hover:text-gray-600 transition-colors">
                                                I agree to receive text messages from uGlowMD with important updates, including prescription reminders, order updates, exclusive offers and information about new products. Message and data rates may apply. Message frequency varies. Reply STOP to opt-out.
                                            </span>
                                        </label>
                                        {triedToContinue && !eligibilityData.consent && (
                                            <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest animate-pulse">Consent is required</p>
                                        )}
                                    </div>

                                    {/* Navigation */}
                                    <div className="flex flex-col md:flex-row gap-4 pt-2">
                                        <button
                                            onClick={() => setStep(0)}
                                            className="w-full md:flex-1 py-6 bg-black/5 border border-black/5 text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-white/30"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Validate all required fields
                                                const requiredFields = ['state', 'phone', 'pcpVisitLast6Months', 'consent'];
                                                const missingFields = requiredFields.filter(field => !eligibilityData[field]);

                                                if (missingFields.length > 0) {
                                                    setTriedToContinue(true);
                                                    return;
                                                }

                                                // Validate lab results if PCP visit was "Yes"
                                                if (eligibilityData.pcpVisitLast6Months === 'Yes' && (!eligibilityData.labResults || eligibilityData.labResults.length === 0)) {
                                                    setTriedToContinue(true);
                                                    return;
                                                }

                                                // Format DOB
                                                const formattedDob = `${eligibilityData.dobYear}-${eligibilityData.dobMonth.padStart(2, '0')}-${eligibilityData.dobDay.padStart(2, '0')}`;
                                                setEligibilityData(prev => ({ ...prev, dob: formattedDob }));
                                                setStep(8);
                                            }}
                                            className={`flex-[2] py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 bg-white border border-black/10 text-black hover:bg-black hover:text-white shadow-sm`}
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="mt-12 text-center text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
                    clinical screening protocol v2.4 • secure encryption enabled
                </div>
            </div>
        );
    };

    const renderDynamicIntakeStep = () => {
        const question = medicalQuestions[medicalStep];
        const progress = Math.round(((medicalStep + 1) / medicalQuestions.length) * 100);

        const hasAnswer = () => {
            if (question.type === 'text' || question.type === 'info' || question.isOptional) return true;
            if (question.type === 'file') {
                const files = intakeData[question.id];
                return Array.isArray(files) && files.length > 0;
            }
            const val = intakeData[question.id];
            if (Array.isArray(val)) return val.length > 0;
            return !!val;
        };

        const handleNext = () => {
            // Check for unanswered required questions
            if (!hasAnswer()) {
                setIntakeError('⚠️ No answer has been selected. Please provide an answer before continuing.');
                return;
            }
            setIntakeError('');

            // Validation for compulsory uploads
            const isGlp1Selected = Array.isArray(intakeData.current_meds) && intakeData.current_meds.some(opt => opt.includes('GLP-1 agonist'));
            if (question.id === 'current_meds' && isGlp1Selected && !intakeData[`${question.id}_file`]) {
                setIntakeError('⚠️ Please upload your prescription before continuing.');
                return;
            }

            // Step 19 Validation (Past Prescriptions)
            if (question.id === 'past_rx_weightloss') {
                const selected = intakeData[question.id] || [];
                const hasRetatruide = selected.includes('Retatruide');
                const hasSema = selected.includes('Semaglutide (Wegovy/Ozempic)');
                const hasTirz = selected.includes('Tirzepatide (Zepbound/Mounjaro)');

                if (hasRetatruide && !intakeData[`${question.id}_file`]) {
                    setIntakeError('⚠️ A prescription photo is strictly REQUIRED for Retatruide.');
                    return;
                }

                const hasPendingRxFile = pendingFile && pendingFile.type === 'past_rx';
                if ((hasSema || hasTirz) && !intakeData[`${question.id}_file`] && !hasPendingRxFile && !piiData.pastDosage?.trim()) {
                    setIntakeError('⚠️ Please upload a prescription photo or enter your past dosage amount.');
                    return;
                }
            }

            // Step 23 Validation (Primary Care & Labs)
            if (question.isStep23) {
                const mainAnswer = intakeData[question.id];
                if (!mainAnswer) {
                    setIntakeError('⚠️ Please answer if you have seen your PCP or had labs.');
                    return;
                }

                if (mainAnswer === 'Yes') {
                    if (!intakeData.lab_results_url || intakeData.lab_results_url.length === 0) {
                        setIntakeError('⚠️ Please upload your lab results before proceeding.');
                        return;
                    }
                    if (!intakeData.pcp_npi) {
                        setIntakeError('⚠️ Please verify your Primary Care Provider (PCP) details before proceeding.');
                        return;
                    }
                } else if (mainAnswer === 'No') {
                    const fulfillment = intakeData.lab_fulfillment;
                    if (!fulfillment) {
                        setIntakeError('⚠️ Please select how you will fulfill the lab requirements.');
                        return;
                    }
                    if (fulfillment === 'optout') {
                        if (!piiData.noPcp) {
                            if (pcpNotFound) {
                                setIntakeError('⚠️ The provider you entered cannot be found. Please double-check the spelling or try another name.');
                                return;
                            }
                            if (!intakeData.pcp_npi) {
                                setIntakeError('⚠️ Please verify your Primary Care Provider (PCP) details to retrieve their NPI.');
                                return;
                            }
                        }
                    }
                }
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
                if (categoryId === 'sexual-health') {
                    setStep(25); // Sexual health: go to AI review step
                    callSexualHealthAIReview();
                } else if (categoryId === 'hair-restoration') {
                    setStep(25); // Hair restoration: go to Review step
                    callHairRestorationAIReview();
                } else {
                    setStep(25); // All other categories: AI review
                    callAIReview();
                }
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
            <div className={`assessment-step ${question.id === 'quote3' ? 'max-w-7xl' : 'max-w-3xl'} mx-auto py-20 px-6`}>
                <div className={`${question.id === 'quote3' ? 'bg-white p-0 overflow-hidden' : 'bg-gray-50 border border-black/5 rounded-[40px] p-8 md:p-16 backdrop-blur-xl'}`}>
                    {question.id !== 'quote3' && (
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-black mb-6">Step {7 + medicalStep}: {question.title}</h3>
                    )}
                    {question.id !== 'quote3' && question.question && (
                        <h2 className={`font-black uppercase tracking-tighter mb-12 leading-tight ${question.id === 'heart_conditions' ? 'text-lg opacity-80' : 'text-2xl'}`}>
                            {question.question}
                        </h2>
                    )}
                    {question.id !== 'quote3' && question.subtext && (
                        <p className="text-sm font-medium text-gray-500 mb-12 -mt-8 leading-relaxed max-w-2xl">
                            {question.subtext}
                        </p>
                    )}
                    {question.id !== 'quote3' && question.type === 'multiselect' && question.id !== 'heart_conditions' && (
                        <p className="text-sm font-semibold text-black -mt-8 mb-8">
                            Select all that apply
                        </p>
                    )}

                    <div className="space-y-4">
                        {question.isStep19 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-3">
                                    {question.options.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => {
                                                const current = intakeData[question.id] || [];
                                                setIntakeData({ ...intakeData, [question.id]: current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt] });
                                                setIntakeError('');
                                            }}
                                            className={`w-full py-5 px-8 pr-12 rounded-2xl border text-sm font-semibold tracking-wide transition-all text-left ${intakeData[question.id]?.includes(opt)
                                                ? 'border-black text-black bg-white shadow-md scale-[1.01]'
                                                : 'bg-white text-black border-black/15 hover:border-black/50 hover:shadow-sm'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {(intakeData[question.id]?.includes('Semaglutide (Wegovy/Ozempic)') ||
                                    intakeData[question.id]?.includes('Tirzepatide (Zepbound/Mounjaro)') ||
                                    intakeData[question.id]?.includes('Retatruide')) && (
                                        <div className="mt-8 p-8 bg-black/5 rounded-[32px] border border-black/10">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 text-black">Prescription Verification</h4>

                                            {intakeData[`${question.id}_file`] ? (
                                                <div className="p-6 bg-white rounded-2xl border border-black/5 flex items-center justify-between">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-accent-black">File Uploaded ✓</span>
                                                    <button onClick={() => { const d = { ...intakeData }; delete d[`${question.id}_file`]; setIntakeData(d); }} className="text-[10px] font-bold text-red-500">Remove</button>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <input
                                                        type="file"
                                                        id="step19-upload"
                                                        className="hidden"
                                                        onChange={(e) => handleFileSelection(e.target.files[0], 'past_rx')}
                                                    />
                                                    <button
                                                        onClick={() => document.getElementById('step19-upload').click()}
                                                        className="w-full py-4 border-2 border-dashed border-black/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black/40 hover:border-black transition-all"
                                                    >
                                                        Upload Prescription Photo {intakeData[question.id]?.includes('Retatruide') && '(Required)'}
                                                    </button>

                                                    {pendingFile && pendingFile.type === 'past_rx' && (
                                                        <div className="p-4 bg-accent-black/5 border border-accent-black/20 rounded-2xl space-y-4 animate-in slide-in-from-top-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    {pendingFile.previewUrl ? (
                                                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-black/5 bg-white flex items-center justify-center shadow-sm shrink-0">
                                                                            <img src={pendingFile.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-accent-black border border-black/5 shrink-0">
                                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-black/30">Ready</span>
                                                                        <span className="text-[10px] font-bold text-black truncate">{pendingFile.file.name}</span>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => setPendingFile(null)}
                                                                    className="text-[8px] font-black uppercase text-red-500 hover:underline"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    handleFileUpload(pendingFile.file, 'past_rx', (url) => {
                                                                        setIntakeData({ ...intakeData, [`${question.id}_file`]: url });
                                                                        setPendingFile(null);
                                                                    });
                                                                }}
                                                                disabled={uploading === 'past_rx'}
                                                                className="w-full py-3 bg-black text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-accent-black transition-all flex items-center justify-center gap-2"
                                                            >
                                                                {uploading === 'past_rx' ? (
                                                                    <div className="w-3 h-3 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                                                                ) : (
                                                                    'Process to Upload'
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {!intakeData[question.id]?.includes('Retatruide') && (
                                                        <div className="space-y-3">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-black/40 text-center">— OR —</p>
                                                            <input
                                                                type="text"
                                                                placeholder="Enter your past dosage amount"
                                                                className="w-full py-4 px-6 rounded-2xl bg-white border border-black/10 text-sm font-bold outline-none focus:border-black"
                                                                value={piiData.pastDosage}
                                                                onChange={(e) => setPiiData({ ...piiData, pastDosage: e.target.value })}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>
                        )}

                        {question.isStep23 && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    {['Yes', 'No'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => {
                                                setIntakeData({ ...intakeData, [question.id]: intakeData[question.id] === opt ? '' : opt });
                                                setIntakeError('');
                                            }}
                                            className={`py-6 rounded-2xl border font-black text-sm uppercase tracking-widest transition-all ${intakeData[question.id] === opt ? 'bg-black text-white border-black' : 'bg-white text-black border-black/20 hover:border-black'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>

                                {intakeData[question.id] === 'Yes' && (
                                    <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-xl space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                        {/* Lab Results Section */}
                                        <div className="space-y-6">
                                            <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-accent-black border-b border-black/5 pb-4">Lab Testing Verification</h4>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                                    <div className="space-y-4">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-2">Upload Recent Lab Results</p>
                                                        <div className="relative group">
                                                            <input
                                                                type="file"
                                                                id="lab-upload-input"
                                                                className="hidden"
                                                                onChange={(e) => handleFileSelection(e.target.files[0], 'labs')}
                                                            />
                                                            <button
                                                                onClick={() => document.getElementById('lab-upload-input').click()}
                                                                className="w-full aspect-video border-2 border-dashed border-black/10 rounded-[30px] flex flex-col items-center justify-center gap-4 hover:border-accent-black/40 transition-all bg-black/[0.02]"
                                                            >
                                                                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-black/20 group-hover:text-accent-black transition-colors">
                                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Select File to Upload</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-2">Preview Section</p>

                                                        {pendingFile && pendingFile.type === 'labs' && (
                                                            <div className="p-6 bg-accent-black/5 border border-accent-black/20 rounded-[30px] space-y-6 animate-in slide-in-from-right-4 duration-500 shadow-sm">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-4 min-w-0">
                                                                        {pendingFile.previewUrl ? (
                                                                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-black/5 bg-white flex items-center justify-center shadow-md shrink-0">
                                                                                <img src={pendingFile.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md text-accent-black border border-black/5 shrink-0">
                                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-accent-black">Staged For Upload</span>
                                                                            <span className="text-sm font-bold text-black truncate">{pendingFile.file.name}</span>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setPendingFile(null)}
                                                                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                                    >
                                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                                    </button>
                                                                </div>

                                                                <button
                                                                    onClick={() => {
                                                                        handleFileUpload(pendingFile.file, 'labs', (url) => {
                                                                            setIntakeData({ ...intakeData, lab_results_url: [...(intakeData.lab_results_url || []), url] });
                                                                            setPendingFile(null);
                                                                        });
                                                                    }}
                                                                    disabled={uploading === 'labs'}
                                                                    className="w-full py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-accent-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                                                                >
                                                                    {uploading === 'labs' ? (
                                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                                                                    ) : (
                                                                        <>
                                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                                            Proceed to Upload
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {intakeData.lab_results_url?.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {intakeData.lab_results_url.map((url, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between p-4 bg-black/5 rounded-2xl border border-black/5 group">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-black"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                                                            </div>
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-black">Lab_{idx + 1}.pdf</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <a href={url} target="_blank" rel="noreferrer" className="text-[8px] font-black uppercase tracking-widest text-accent-black hover:underline">View</a>
                                                                            <button
                                                                                onClick={() => setIntakeData({ ...intakeData, lab_results_url: intakeData.lab_results_url.filter((_, i) => i !== idx) })}
                                                                                className="p-2 hover:text-red-500 transition-colors"
                                                                            >
                                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : !pendingFile && (
                                                            <div className="h-full min-h-[120px] flex items-center justify-center border-2 border-dashed border-black/5 rounded-[30px] opacity-20">
                                                                <span className="text-[9px] font-black uppercase tracking-widest">No files uploaded yet</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* PCP Information Section */}
                                        <div className="space-y-8">
                                            <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-accent-black border-b border-black/5 pb-4">PCP Information</h4>

                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 gap-6">
                                                    <div className="flex flex-col gap-1.5 bg-black/[0.02] p-5 rounded-2xl border border-black/5 group focus-within:border-black transition-all">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-black/40 group-focus-within:text-black transition-colors">First Name</label>
                                                        <input
                                                            placeholder="Provider's First Name"
                                                            className="w-full bg-transparent border-none text-sm font-bold outline-none placeholder:text-black/40"
                                                            value={piiData.pcpFirstName}
                                                            onChange={e => setPiiData({ ...piiData, pcpFirstName: e.target.value })}
                                                        />
                                                    </div>

                                                    <div className="flex flex-col gap-1.5 bg-black/[0.02] p-5 rounded-2xl border border-black/5 group focus-within:border-black transition-all">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-black/40 group-focus-within:text-black transition-colors">Last Name</label>
                                                        <input
                                                            placeholder="Provider's Last Name"
                                                            className="w-full bg-transparent border-none text-sm font-bold outline-none placeholder:text-black/40"
                                                            value={piiData.pcpLastName}
                                                            onChange={e => setPiiData({ ...piiData, pcpLastName: e.target.value })}
                                                        />
                                                    </div>

                                                    <div className="flex flex-col gap-1.5 bg-black/[0.02] p-5 rounded-2xl border border-black/5 group focus-within:border-black transition-all relative">
                                                        <label className="text-[9px] font-black uppercase tracking-widest text-black/40 group-focus-within:text-black transition-colors">State</label>
                                                        <div className="relative w-full">
                                                            <input
                                                                placeholder="Search State..."
                                                                className="w-full bg-transparent border-none text-sm font-bold outline-none placeholder:text-black/40"
                                                                value={showPcpStateDropdown ? pcpStateSearch : (piiData.pcpState ? stateFullNames[piiData.pcpState] : pcpStateSearch)}
                                                                onChange={(e) => {
                                                                    setPcpStateSearch(e.target.value);
                                                                    setShowPcpStateDropdown(true);
                                                                }}
                                                                onFocus={() => {
                                                                    if (piiData.pcpState) setPcpStateSearch('');
                                                                    setShowPcpStateDropdown(true);
                                                                }}
                                                            />
                                                            {showPcpStateDropdown && (
                                                                <div className="absolute z-[100] left-[-160px] md:left-0 right-0 top-full mt-4 max-h-48 overflow-y-auto bg-white border border-black/10 rounded-2xl shadow-2xl no-scrollbar overflow-x-hidden">
                                                                    {Object.entries(stateFullNames)
                                                                        .filter(([code, name]) =>
                                                                            name.toLowerCase().includes(pcpStateSearch.toLowerCase()) ||
                                                                            code.toLowerCase().includes(pcpStateSearch.toLowerCase())
                                                                        )
                                                                        .map(([code, name]) => (
                                                                            <div
                                                                                key={code}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setPiiData({ ...piiData, pcpState: code });
                                                                                    setPcpStateSearch('');
                                                                                    setShowPcpStateDropdown(false);
                                                                                }}
                                                                                className="px-6 py-4 text-black hover:bg-black hover:text-white cursor-pointer text-[9px] font-black uppercase tracking-widest transition-colors flex justify-between items-center border-b border-black/[0.02] last:border-none"
                                                                            >
                                                                                <span className="truncate mr-2">{name}</span>
                                                                                <span className="opacity-40 shrink-0">{code}</span>
                                                                            </div>
                                                                        ))
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                        {showPcpStateDropdown && (
                                                            <div
                                                                className="fixed inset-0 z-[90] bg-transparent cursor-default"
                                                                onClick={() => setShowPcpStateDropdown(false)}
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleNPISearch(piiData.pcpFirstName, piiData.pcpLastName, piiData.pcpState)}
                                                    disabled={npiLoading}
                                                    className="w-full py-6 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-accent-black transition-all disabled:opacity-50 shadow-lg active:scale-[0.98]"
                                                >
                                                    {npiLoading ? 'Verifying...' : 'Verify PCP Information'}
                                                </button>

                                                {/* NPI Search Results */}
                                                {npiResults.length > 0 && (
                                                    <div className="space-y-4 mt-6 animate-in zoom-in-95 duration-500">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-black/40 text-center">Select Your Provider From Results</p>
                                                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                            {npiResults.map((r, i) => (
                                                                <div
                                                                    key={i}
                                                                    onClick={() => {
                                                                        setIntakeData({ ...intakeData, pcp_npi: r.number, pcp_first_name: r.basic.first_name, pcp_last_name: r.basic.last_name });
                                                                        setNpiResults([]);
                                                                        toast.success(`PCP Identity Verified: ${r.number}`);
                                                                    }}
                                                                    className="p-5 bg-white border border-black/5 rounded-2xl hover:border-black cursor-pointer transition-all shadow-sm hover:shadow-md flex items-center justify-between group"
                                                                >
                                                                    <div>
                                                                        <p className="font-black text-[12px] uppercase tracking-tighter text-black">{r.basic.first_name} {r.basic.last_name}</p>
                                                                        <div className="flex items-center gap-3 mt-1">
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-accent-black">NPI: {r.number}</span>
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-black/40">•</span>
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-black/40">{r.addresses[0]?.city}, {r.addresses[0]?.state}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {intakeData.pcp_npi && (
                                                    <div className="p-6 bg-green-50 border border-green-200 rounded-[30px] flex items-center justify-between animate-in slide-in-from-bottom-2 duration-500">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-green-800">Verification Successful</p>
                                                                <p className="text-[11px] font-bold text-green-600">NPI: {intakeData.pcp_npi}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setIntakeData({ ...intakeData, pcp_npi: '', pcp_first_name: '', pcp_last_name: '' })}
                                                            className="text-[10px] font-black uppercase tracking-widest text-green-800/40 hover:text-red-500 transition-colors"
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {intakeData[question.id] === 'No' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                        {/* Advisory Banner */}
                                        <div className="flex items-start gap-5 p-7 bg-amber-50 border border-amber-200 rounded-[28px]">
                                            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-amber-900 mb-1.5">Please Be Advised</p>
                                                <p className="text-[12px] font-bold text-amber-800/70 leading-relaxed text-left">
                                                    Lab results are important for eligibility verification for the weight loss prescription from a licensed provider. Select how you will proceed further in fulfilling this requirement.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Two Option Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* Option 1: Order Lab Test */}
                                            <button
                                                onClick={() => {
                                                    setLabFulfillment('order');
                                                    setIntakeData({ ...intakeData, lab_fulfillment: 'order' });
                                                }}
                                                className={`p-8 rounded-[32px] border-2 text-left transition-all duration-300 relative group overflow-hidden ${labFulfillment === 'order' ? 'border-black bg-black text-white shadow-2xl scale-[1.02]' : 'border-black/10 bg-white hover:border-black/30 hover:shadow-lg'}`}
                                            >
                                                {labFulfillment === 'order' && (
                                                    <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </div>
                                                )}
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${labFulfillment === 'order' ? 'bg-white/10' : 'bg-black/5'}`}>
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={labFulfillment === 'order' ? 'white' : 'currentColor'} strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h10m0 0V3m0 11v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1" /></svg>
                                                </div>
                                                <p className={`font-black text-[15px] uppercase tracking-tight mb-2 ${labFulfillment === 'order' ? 'text-white' : 'text-black'}`}>Lab Test Order</p>
                                                <p className={`text-[11px] font-black mb-4 ${labFulfillment === 'order' ? 'text-white/60' : 'text-black/30'}`}>FROM OUR HEALTHCARE TEAM</p>
                                                <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-5 ${labFulfillment === 'order' ? 'bg-white/20 text-white' : 'bg-black text-white'}`}>$29.99</div>
                                                <p className={`text-[10px] font-bold leading-relaxed uppercase tracking-widest ${labFulfillment === 'order' ? 'text-white/50' : 'text-black/40'}`}>Get tested at any of 2,000+ Quest Diagnostics locations across the USA.</p>
                                            </button>

                                            {/* Option 2: Opt Out */}
                                            <button
                                                onClick={() => {
                                                    setLabFulfillment('optout');
                                                    setIntakeData({ ...intakeData, lab_fulfillment: 'optout' });
                                                    setPiiData(prev => ({ ...prev, noPcp: false }));
                                                }}
                                                className={`p-8 rounded-[32px] border-2 text-left transition-all duration-300 relative group overflow-hidden ${labFulfillment === 'optout' ? 'border-amber-500 bg-amber-50 shadow-xl scale-[1.02]' : 'border-black/10 bg-white hover:border-amber-300 hover:shadow-lg'}`}
                                            >
                                                {labFulfillment === 'optout' && (
                                                    <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </div>
                                                )}
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${labFulfillment === 'optout' ? 'bg-amber-200/60' : 'bg-black/5'}`}>
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={labFulfillment === 'optout' ? '#92400e' : 'currentColor'} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                                </div>
                                                <p className={`font-black text-[15px] uppercase tracking-tight mb-2 ${labFulfillment === 'optout' ? 'text-amber-900' : 'text-black'}`}>Opt Out for Lab Review</p>
                                                <p className={`text-[11px] font-black mb-4 ${labFulfillment === 'optout' ? 'text-amber-500' : 'text-black/20'}`}>PCP REFERRAL ONLY</p>
                                                <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-5 ${labFulfillment === 'optout' ? 'bg-amber-200 text-amber-900' : 'bg-black/5 text-black/40'}`}>No Fee</div>
                                                <p className={`text-[10px] font-bold leading-relaxed uppercase tracking-widest ${labFulfillment === 'optout' ? 'text-amber-800/50' : 'text-black/40'}`}>May lead to eligibility denial. Only allowed if a PCP has already assessed and recommended weight loss treatment for you.</p>
                                            </button>
                                        </div>

                                        {/* Opt-Out PCP Section */}
                                        {labFulfillment === 'optout' && (
                                            <div className="animate-in slide-in-from-top-4 fade-in duration-500 space-y-6 p-8 bg-white border border-amber-200/60 rounded-[32px] shadow-sm">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-900">Your Primary Care Provider</p>
                                                        <p className="text-[9px] font-bold text-amber-900/40 uppercase tracking-widest">We'll verify their NPI automatically</p>
                                                    </div>
                                                </div>

                                                {/* No PCP Toggle */}
                                                <button
                                                    onClick={() => setPiiData({ ...piiData, noPcp: !piiData.noPcp, pcpFirstName: '', pcpLastName: '', pcpState: '' })}
                                                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${piiData.noPcp ? 'border-amber-400 bg-amber-50' : 'border-black/10 bg-black/[0.02] hover:border-amber-300'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${piiData.noPcp ? 'bg-amber-500 border-amber-500' : 'border-black/20'}`}>
                                                        {piiData.noPcp && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-widest ${piiData.noPcp ? 'text-amber-900' : 'text-black/50'}`}>I currently do not have a primary care provider</span>
                                                </button>

                                                {/* PCP Form Fields */}
                                                {!piiData.noPcp && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="flex flex-col gap-1.5 bg-black/[0.02] p-5 rounded-2xl border border-black/5 focus-within:border-amber-400 transition-all">
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-black/40">First Name</label>
                                                                <input placeholder="Provider's first name" className="w-full bg-transparent border-none text-sm font-bold outline-none placeholder:text-black/40" value={piiData.pcpFirstName}
                                                                    onChange={e => {
                                                                        setPiiData({ ...piiData, pcpFirstName: e.target.value });
                                                                        setPcpNotFound(false);
                                                                        setIntakeData(prev => ({ ...prev, pcp_npi: '', pcp_details: null }));
                                                                    }} />
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 bg-black/[0.02] p-5 rounded-2xl border border-black/5 focus-within:border-amber-400 transition-all">
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-black/40">Last Name</label>
                                                                <input placeholder="Provider's last name" className="w-full bg-transparent border-none text-sm font-bold outline-none placeholder:text-black/40" value={piiData.pcpLastName}
                                                                    onChange={e => {
                                                                        setPiiData({ ...piiData, pcpLastName: e.target.value });
                                                                        setPcpNotFound(false);
                                                                        setIntakeData(prev => ({ ...prev, pcp_npi: '', pcp_details: null }));
                                                                    }} />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5 bg-black/[0.02] p-5 rounded-2xl border border-black/5 focus-within:border-amber-400 transition-all relative">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-black/40">State</label>
                                                            <div className="relative w-full">
                                                                <input placeholder="Search state..." className="w-full bg-transparent border-none text-sm font-bold outline-none placeholder:text-black/40"
                                                                    value={showPcpStateDropdown ? pcpStateSearch : (piiData.pcpState ? stateFullNames[piiData.pcpState] : pcpStateSearch)}
                                                                    onChange={(e) => { setPcpStateSearch(e.target.value); setShowPcpStateDropdown(true); }}
                                                                    onFocus={() => { if (piiData.pcpState) setPcpStateSearch(''); setShowPcpStateDropdown(true); }}
                                                                />
                                                                {showPcpStateDropdown && (
                                                                    <div className="absolute z-[100] left-0 right-0 top-full mt-3 max-h-44 overflow-y-auto bg-white border border-black/10 rounded-2xl shadow-2xl no-scrollbar overflow-x-hidden">
                                                                        {Object.entries(stateFullNames).filter(([code, name]) => name.toLowerCase().includes(pcpStateSearch.toLowerCase()) || code.toLowerCase().includes(pcpStateSearch.toLowerCase())).map(([code, name]) => (
                                                                            <div key={code} onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPiiData({ ...piiData, pcpState: code });
                                                                                setPcpStateSearch('');
                                                                                setShowPcpStateDropdown(false);
                                                                                setPcpNotFound(false);
                                                                                setIntakeData(prev => ({ ...prev, pcp_npi: '', pcp_details: null }));
                                                                            }} className="px-6 py-3 text-black hover:bg-black hover:text-white cursor-pointer text-[9px] font-black uppercase tracking-widest transition-colors flex justify-between items-center border-b border-black/[0.03] last:border-none">
                                                                                <span className="truncate mr-2">{name}</span>
                                                                                <span className="opacity-40 shrink-0">{code}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {showPcpStateDropdown && <div className="fixed inset-0 z-[90]" onClick={() => setShowPcpStateDropdown(false)} />}
                                                        </div>
                                                        <button
                                                            onClick={() => handleNPISearch(piiData.pcpFirstName, piiData.pcpLastName, piiData.pcpState)}
                                                            disabled={npiLoading || !piiData.pcpFirstName || !piiData.pcpLastName || !piiData.pcpState}
                                                            className="w-full py-5 bg-amber-900 text-amber-50 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-amber-950 transition-all shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                                        >
                                                            {npiLoading ? (<><div className="w-4 h-4 border-2 border-amber-50/30 border-t-amber-50 animate-spin rounded-full" /> Searching NPI Registry...</>) : (<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg> Verify Provider &amp; Retrieve NPI</>)}
                                                        </button>
                                                        {npiResults.length > 0 && (
                                                            <div className="space-y-3 animate-in zoom-in-95 duration-400 text-left">
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-black/40 text-center">Select Your Provider From Results</p>
                                                                <div className="grid grid-cols-1 gap-3 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                                                                    {npiResults.map((r, i) => (
                                                                        <div key={i} onClick={() => { setIntakeData({ ...intakeData, pcp_npi: r.number, pcp_first_name: r.basic.first_name, pcp_last_name: r.basic.last_name }); setNpiResults([]); toast.success(`PCP Verified — NPI: ${r.number}`); }} className="p-5 bg-white border border-black/5 rounded-2xl hover:border-amber-400 cursor-pointer transition-all shadow-sm hover:shadow-md flex items-center justify-between group">
                                                                            <div className="text-left">
                                                                                <p className="font-black text-[12px] uppercase tracking-tighter text-black">{r.basic.first_name} {r.basic.last_name}</p>
                                                                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">NPI: {r.number}</span>
                                                                                    <span className="text-[9px] font-black text-black/30">•</span>
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-black/40">{r.addresses[0]?.city}, {r.addresses[0]?.state}</span>
                                                                                    {r.basic.credential && (<><span className="text-[9px] font-black text-black/30">•</span><span className="text-[9px] font-black uppercase tracking-widest text-black/40">{r.basic.credential}</span></>)}
                                                                                </div>
                                                                            </div>
                                                                            <div className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-white transition-all shrink-0 ml-4">
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {intakeData.pcp_npi && (
                                                            <div className="p-5 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-500">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-green-800">Provider NPI Verified</p>
                                                                        <p className="text-[11px] font-black text-green-700">{intakeData.pcp_first_name} {intakeData.pcp_last_name} — NPI: {intakeData.pcp_npi}</p>
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => setIntakeData({ ...intakeData, pcp_npi: '', pcp_first_name: '', pcp_last_name: '' })} className="text-[9px] font-black uppercase tracking-widest text-green-800/30 hover:text-red-500 transition-colors">Clear</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {piiData.noPcp && (
                                                    <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in duration-300">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1">Noted</p>
                                                        <p className="text-[11px] font-bold text-amber-700/70 leading-relaxed text-left">You've indicated you don't have a primary care provider. Our clinical team will review your eligibility. Note that this may impact your verification outcome.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {!question.isStep19 && !question.isStep23 && (question.type === 'multiselect' || question.type === 'choice') && (
                            <div className="grid grid-cols-1 gap-3">
                                {question.options.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => {
                                            const current = intakeData[question.id] || [];
                                            if (question.type === 'choice') {
                                                // Toggle: clicking selected answer deselects it
                                                setIntakeData({ ...intakeData, [question.id]: intakeData[question.id] === opt ? '' : opt });
                                            } else {
                                                setIntakeData({ ...intakeData, [question.id]: current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt] });
                                            }
                                            setIntakeError('');
                                        }}
                                        className={`w-full py-5 px-8 pr-12 rounded-2xl border text-sm font-semibold tracking-wide transition-all text-left ${(question.type === 'choice' ? intakeData[question.id] === opt : intakeData[question.id]?.includes(opt))
                                            ? 'border-black text-black bg-white shadow-md scale-[1.01]'
                                            : 'bg-white text-black border-black/15 hover:border-black/50 hover:shadow-sm'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!question.isStep19 && !question.isStep23 && question.type === 'info' && (
                            <div className="space-y-6">
                                {question.id === 'quote3' ? (
                                    <div className="flex flex-col md:flex-row items-center gap-16">
                                        {/* Left Side: Quote Image with Fine Print */}
                                        <div className="w-full md:w-1/2 relative group">
                                            <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                                                <img
                                                    src={quoteFatCutImg}
                                                    alt="Clinical Perspective"
                                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                                                {/* Citation overlay */}
                                                <div className="absolute bottom-6 left-6 right-6 z-10">
                                                    <p className="text-[8px] text-white/60 font-medium leading-relaxed">
                                                        {question.footer}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Quote Content */}
                                        <div className="w-full md:w-1/2 text-left flex flex-col gap-10">
                                            <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white self-start">
                                                Clinical Breakthrough
                                            </div>
                                            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight text-[#1a1a1a]">
                                                {question.content}
                                            </h2>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-10 bg-black/5 rounded-[40px] border border-black/5">
                                        <p className="text-[#1a1a1a] text-xl md:text-2xl font-black italic tracking-tight leading-relaxed">
                                            {question.content}
                                        </p>
                                        {question.footer && (
                                            <p className="mt-8 text-[9px] font-medium text-black/40 leading-relaxed italic">
                                                {question.footer}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {!question.isStep19 && !question.isStep23 && question.type === 'text' && (
                            <textarea
                                placeholder={question.placeholder}
                                className="w-full h-48 bg-black/5 border border-black/5 rounded-3xl py-8 px-10 text-black focus:outline-none focus:border-black transition-all font-bold resize-none underline-none"
                                value={intakeData[question.id] || ''}
                                onChange={(e) => setIntakeData({ ...intakeData, [question.id]: e.target.value })}
                            />
                        )}

                        {!question.isStep19 && !question.isStep23 && question.type === 'file' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                id={`generic-upload-${question.id}`}
                                                className="hidden"
                                                multiple={question.maxFiles > 1}
                                                accept="image/*,.pdf"
                                                onChange={(e) => handleMultipleFileSelection(e.target.files, 'generic', question.id)}
                                            />
                                            <button
                                                onClick={() => document.getElementById(`generic-upload-${question.id}`).click()}
                                                className="w-full aspect-video border-2 border-dashed border-black/10 rounded-[30px] flex flex-col items-center justify-center gap-4 hover:border-accent-black/40 transition-all bg-black/[0.02]"
                                            >
                                                <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-black/20 group-hover:text-accent-black transition-colors">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Select Photo(s) to Upload</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {pendingFile && pendingFile.type === 'generic' && pendingFile.questionId === question.id && (
                                            <div className="p-6 bg-accent-black/5 border border-accent-black/20 rounded-[30px] space-y-6 animate-in slide-in-from-right-4 duration-500 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        {pendingFile.previewUrl ? (
                                                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-black/5 bg-white flex items-center justify-center shadow-md shrink-0">
                                                                <img src={pendingFile.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md text-accent-black border border-black/5 shrink-0">
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-accent-black">Staged For Upload</span>
                                                            <span className="text-sm font-bold text-black truncate">{pendingFile.file.name}</span>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setPendingFile(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        handleFileUpload(pendingFile.file, 'scalp-images', (url) => {
                                                            const currentUrls = intakeData[question.id] || [];
                                                            setIntakeData({ ...intakeData, [question.id]: [...currentUrls, url] });
                                                            setPendingFile(null);
                                                        });
                                                    }}
                                                    disabled={uploading === 'scalp-images'}
                                                    className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-accent-black transition-all shadow-xl flex items-center justify-center gap-3"
                                                >
                                                    {uploading === 'scalp-images' ? (
                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                                                    ) : (
                                                        <>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                            Upload This Photo
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {intakeData[question.id]?.length > 0 && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {intakeData[question.id].map((url, idx) => (
                                                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-black/10 group shadow-sm">
                                                        <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button
                                                                onClick={() => {
                                                                    const newUrls = [...intakeData[question.id]];
                                                                    newUrls.splice(idx, 1);
                                                                    setIntakeData({ ...intakeData, [question.id]: newUrls });
                                                                }}
                                                                className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
                                                            >
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {!pendingFile && (!intakeData[question.id] || intakeData[question.id].length === 0) && (
                                            <div className="aspect-video flex items-center justify-center border-2 border-dashed border-black/5 rounded-[30px] opacity-20 bg-black/[0.01]">
                                                <span className="text-[9px] font-black uppercase tracking-widest">No photos uploaded yet</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {question.info && (
                            <div className="mt-8 p-6 bg-accent-black/10 border border-accent-black/20 rounded-2xl">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-black mb-2">Why we ask</h4>
                                <p className="text-[11px] font-bold text-gray-600 leading-relaxed">
                                    {question.info}
                                </p>
                            </div>
                        )}

                        {question.upload && intakeData[question.id] && (
                            <div className="mt-8">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-4">
                                    {question.id === 'current_meds' && Array.isArray(intakeData.current_meds) && intakeData.current_meds.some(opt => opt.includes('GLP-1 agonist'))
                                        ? 'Upload RX / Proof (Compulsory)'
                                        : 'Upload RX / Proof (Optional)'}
                                </label>

                                {intakeData[`${question.id}_file`] ? (
                                    <div className="p-6 bg-black/5 border border-black/5 rounded-[30px] flex items-center justify-between group/upload transition-all hover:border-accent-black/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-accent-black/10 rounded-2xl flex items-center justify-center text-accent-black">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-black">Document Uploaded</p>
                                                <a href={intakeData[`${question.id}_file`]} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-accent-black hover:underline">View File</a>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newData = { ...intakeData };
                                                delete newData[`${question.id}_file`];
                                                setIntakeData(newData);
                                            }}
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/upload:opacity-100"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <input
                                            type="file"
                                            id={`upload-${question.id}`}
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            onChange={(e) => handleFileSelection(e.target.files[0], 'prescriptions', question.id)}
                                        />
                                        <button
                                            onClick={() => document.getElementById(`upload-${question.id}`).click()}
                                            disabled={uploading === 'prescriptions'}
                                            className="w-full flex items-center justify-center gap-4 py-8 bg-black/5 border-2 border-dashed border-black/5 rounded-[30px] hover:border-accent-black transition-all group"
                                        >
                                            {uploading === 'prescriptions' ? (
                                                <div className="w-6 h-6 border-2 border-accent-black border-t-transparent animate-spin rounded-full"></div>
                                            ) : (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-black">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="17 8 12 3 7 8"></polyline>
                                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                                </svg>
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]/40 group-hover:text-[#1a1a1a]">
                                                Choose prescription file
                                            </span>
                                        </button>

                                        {pendingFile && pendingFile.type === 'prescriptions' && pendingFile.questionId === question.id && (
                                            <div className="p-6 bg-accent-black/5 border border-accent-black/20 rounded-[30px] space-y-6 animate-in slide-in-from-top-4 duration-500">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        {pendingFile.previewUrl ? (
                                                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-black/5 bg-white flex items-center justify-center shadow-md shrink-0">
                                                                <img src={pendingFile.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md text-accent-black border border-black/5 shrink-0">
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#1a1a1a]/30">Staged for Upload</span>
                                                            <span className="text-sm font-bold text-black truncate">{pendingFile.file.name}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setPendingFile(null)}
                                                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        handleFileUpload(pendingFile.file, 'prescriptions', (url) => {
                                                            setIntakeData({ ...intakeData, [`${question.id}_file`]: url });
                                                            setPendingFile(null);
                                                        });
                                                    }}
                                                    disabled={uploading === 'prescriptions'}
                                                    className="w-full py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-accent-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                                                >
                                                    {uploading === 'prescriptions' ? (
                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                                                    ) : (
                                                        <>
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                            Proceed to Upload
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {intakeData[`${question.id}_file`] && (
                                    <div className="mt-4 p-4 bg-accent-black/5 rounded-2xl border border-accent-black/10 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-accent-black shadow-sm">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-accent-black">Prescription Linked ✓</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const d = { ...intakeData };
                                                delete d[`${question.id}_file`];
                                                setIntakeData(d);
                                            }}
                                            className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
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
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-4">Provide Details</label>
                                    <textarea
                                        placeholder="Enter details here..."
                                        className="w-full h-32 bg-black/5 border border-black/5 rounded-3xl py-6 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold resize-none"
                                        value={intakeData[`${question.id}_details`] || ''}
                                        onChange={(e) => setIntakeData({ ...intakeData, [`${question.id}_details`]: e.target.value })}
                                    />
                                </div>
                            )}
                    </div>

                    <div className="mt-12 space-y-4">
                        {/* Validation Error Message */}
                        {intakeError && (
                            <div className="flex items-center gap-3 px-6 py-4 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <p className="text-sm font-bold text-red-600">{intakeError}</p>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <button
                                onClick={() => {
                                    if (medicalStep > 0) {
                                        handlePrevious();
                                    } else {
                                        setMedicalStep(0);
                                        // Weight-loss users who came from auth (step 3) go directly to step 8,
                                        // bypassing step 4 (BMI) and step 5 (Eligibility).
                                        // For them, going back should return to their goals/improvements step (step 0).
                                        // For users who went through the full flow (step 4 → step 5 → step 8),
                                        // going back should return to step 5 (Eligibility).
                                        if (categoryId === 'weight-loss') {
                                            setStep(0);
                                        } else {
                                            setStep(5);
                                        }
                                    }
                                }}
                                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-6 rounded-2xl bg-black/5 border border-black/5 text-[10px] font-black uppercase tracking-widest text-[#1a1a1a] hover:border-black/20 transition-all group"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-100 transition-opacity">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Backward
                            </button>

                            <button
                                onClick={handleNext}
                                className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all group bg-white border border-black/10 text-black hover:bg-black hover:text-white shadow-sm"
                            >
                                {medicalStep === medicalQuestions.length - 1 ? 'Finish Intake' : 'Forward'}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-100 transition-opacity">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div >
            </div >
        );
    };

    const renderIdentificationStep = () => (
        <div className="assessment-step max-w-2xl mx-auto py-20 px-6">
            <div className="text-center mb-12">
                <div className="inline-block py-2 px-6 bg-accent-black/10 border border-accent-black/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-black mb-8">
                    {categoryId === 'sexual-health' ? 'Step 34: Identification' : 'Step 26: Identification'}
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4 leading-tight">
                    Verify your <span className="text-accent-black">Identity.</span>
                </h2>
                <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[10px]">
                    Required for prescription medication fulfillment.
                </p>
            </div>

            <div className="bg-gray-50 border border-black/5 rounded-[40px] p-12 backdrop-blur-xl space-y-8">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-4">ID Type</label>
                    <div className="grid grid-cols-2 gap-4">
                        {["Driver's License", "Passport"].map(type => (
                            <button
                                key={type}
                                onClick={() => {
                                    if (idData.type !== type) {
                                        setIdData({ ...idData, type, file_url: '' });
                                    }
                                }}
                                className={`py-5 rounded-2xl text-sm font-semibold uppercase tracking-widest border transition-all ${idData.type === type ? 'border-black text-black bg-white shadow-md scale-[1.01]' : 'bg-white text-black border-black/15 hover:border-black/40'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">ID Number</label>
                    <input
                        type="text"
                        placeholder="Enter ID number..."
                        className="w-full bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold"
                        value={idData.number}
                        onChange={(e) => setIdData({ ...idData, number: e.target.value })}
                    />
                </div>

                <div className="pt-4 space-y-6">
                    <input
                        type="file"
                        id="id-upload"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileSelection(e.target.files[0], 'id-verification')}
                    />
                    {idData.file_url ? (
                        <div className="p-6 bg-black/5 border border-black/5 rounded-[30px] flex items-center justify-between group/upload transition-all hover:border-accent-black/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-accent-black/10 rounded-2xl flex items-center justify-center text-accent-black">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-black">Document Uploaded</p>
                                    <a href={idData.file_url} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-accent-black hover:underline">View File</a>
                                </div>
                            </div>
                            <button
                                onClick={() => setIdData({ ...idData, file_url: '' })}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/upload:opacity-100"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <button
                                onClick={() => document.getElementById('id-upload').click()}
                                disabled={uploading === 'id-verification'}
                                className="w-full py-8 border-2 border-dashed border-black/5 rounded-[30px] flex flex-col items-center justify-center gap-4 hover:border-accent-black transition-all group"
                            >
                                {uploading === 'id-verification' ? (
                                    <div className="w-8 h-8 border-2 border-accent-black border-t-transparent animate-spin rounded-full"></div>
                                ) : (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-black">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-black">
                                    Upload Front of ID
                                </span>
                            </button>

                            {pendingFile && pendingFile.type === 'id-verification' && (
                                <div className="p-6 bg-accent-black/5 border border-accent-black/20 rounded-[30px] space-y-6 animate-in slide-in-from-top-4 duration-500 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {pendingFile.previewUrl ? (
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-black/5 bg-white flex items-center justify-center shadow-md shrink-0">
                                                    <img src={pendingFile.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md text-accent-black border border-black/5 shrink-0">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]/30">Staged ID Document</span>
                                                <span className="text-[12px] font-black text-black truncate">{pendingFile.file.name}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setPendingFile(null)}
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleFileUpload(pendingFile.file, 'id-verification', (url) => {
                                                setIdData({ ...idData, file_url: url });
                                                setPendingFile(null);
                                            });
                                        }}
                                        disabled={uploading === 'id-verification'}
                                        className="w-full py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-accent-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        {uploading === 'id-verification' ? (
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                                        ) : (
                                            <>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                Proceed to Upload
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {idData.file_url && (
                        <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-accent-black text-center opacity-60">Identity document securely processed</p>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <button
                        onClick={() => categoryId === 'sexual-health' ? setStep(8) : setStep(25)}
                        className="w-full md:flex-1 py-6 bg-black/5 border border-black/5 text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-white/30"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => setStep(11)}
                        disabled={!idData.type || !idData.number || !idData.file_url}
                        className={`w-full md:flex-[2] py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all ${idData.type && idData.number && idData.file_url ? 'bg-white border border-black/10 text-black hover:bg-black hover:text-white shadow-sm' : 'bg-black/5 text-gray-300 cursor-not-allowed'}`}
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
                <div className="inline-block py-2 px-6 bg-accent-black/10 border border-accent-black/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-black mb-8">
                    {categoryId === 'sexual-health' ? 'Step 35: Shipping' : 'Step 27: Delivery'}
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4 leading-tight">
                    Where should we <span className="text-accent-black">deliver?</span>
                </h2>
                <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[9px] mt-2">
                    ⚠️ PO Boxes are not accepted. Provide a valid street address for delivery.
                </p>
            </div>

            <div className="bg-gray-50 border border-black/5 rounded-[40px] p-8 md:p-12 backdrop-blur-xl space-y-6">
                {/* Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">First Name *</label>
                        <input
                            type="text"
                            placeholder="John"
                            className="w-full bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold"
                            value={shippingData.firstName}
                            onChange={(e) => setShippingData({ ...shippingData, firstName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">Last Name *</label>
                        <input
                            type="text"
                            placeholder="Doe"
                            className="w-full bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold"
                            value={shippingData.lastName}
                            onChange={(e) => setShippingData({ ...shippingData, lastName: e.target.value })}
                        />
                    </div>
                </div>

                {/* Street Address */}
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">Street Address *</label>
                    <input
                        type="text"
                        placeholder="123 Main Street"
                        className="w-full bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold"
                        value={shippingData.address}
                        onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                    />
                </div>

                {/* Apt/Unit (optional) */}
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">Apartment / Unit <span className="opacity-50">(Optional)</span></label>
                    <input
                        type="text"
                        placeholder="Apt 4B"
                        className="w-full bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold"
                        value={shippingData.apt}
                        onChange={(e) => setShippingData({ ...shippingData, apt: e.target.value })}
                    />
                </div>

                {/* City + State */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">City *</label>
                        <input
                            type="text"
                            className="w-full bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold"
                            value={shippingData.city}
                            onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">State *</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={shippingData.state ? stateFullNames[shippingData.state] : "Search..."}
                                className="w-full bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold placeholder:text-gray-300"
                                value={stateSearch}
                                onChange={(e) => {
                                    setStateSearch(e.target.value);
                                    setShowStateDropdown(true);
                                }}
                                onFocus={() => setShowStateDropdown(true)}
                            />
                            {showStateDropdown && (
                                <div className="absolute z-50 left-0 right-0 mt-2 max-h-40 overflow-y-auto bg-white border border-black/10 rounded-2xl shadow-2xl backdrop-blur-xl no-scrollbar">
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
                                                className="px-6 py-3 hover:bg-black hover:text-white cursor-pointer text-[10px] font-black uppercase tracking-widest transition-colors flex justify-between text-black"
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

                {/* ZIP + Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">ZIP Code *</label>
                        <input
                            type="text"
                            className="w-full bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold"
                            value={shippingData.zip}
                            onChange={(e) => setShippingData({ ...shippingData, zip: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">Phone Number *</label>
                        <input
                            type="tel"
                            placeholder="(XXX) XXX-XXXX"
                            className="w-full bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold"
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

                {/* Email */}
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">Email Address *</label>
                    <input
                        type="email"
                        placeholder={user?.email || 'you@example.com'}
                        className="w-full bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold"
                        value={shippingData.email || user?.email || ''}
                        onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                    />
                </div>

                {/* Navigation */}
                <div className="flex flex-col md:flex-row gap-4 pt-2">
                    <button
                        onClick={() => setStep(10)}
                        className="w-full md:flex-1 py-6 bg-black/5 border border-black/5 text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-white/30"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => {
                            if (categoryId === 'sexual-health') {
                                setStep(12); // Sexual health: go to Coupon step after Shipping
                            } else {
                                setStep(12); // Normal flow: go to Coupon step
                            }
                        }}
                        disabled={!shippingData.firstName || !shippingData.lastName || !shippingData.address || !shippingData.city || !shippingData.zip || !shippingData.state || !shippingData.phone}
                        className={`w-full md:flex-[2] py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all ${shippingData.firstName && shippingData.lastName && shippingData.address && shippingData.city && shippingData.zip && shippingData.state && shippingData.phone ? 'bg-white border border-black/10 text-black hover:bg-black hover:text-white shadow-sm' : 'bg-black/5 text-gray-300 cursor-not-allowed'}`}
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCouponStep = () => (
        <div className="assessment-step max-w-2xl mx-auto py-20 px-6">
            <div className="text-center mb-10">
                <div className="inline-block py-2 px-6 bg-black/5 border border-black/10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-black mb-6">
                    {categoryId === 'sexual-health' ? 'Step 36: Coupons' : 'Step 28: Coupons'}
                </div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-3 leading-tight">
                    Have a <span className="text-black/60">Coupon Code?</span>
                </h2>
                <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[9px]">
                    Enter an online coupon or one given by an affiliated uGlowMD licensed provider.
                </p>
            </div>

            <div className="bg-gray-50 border border-black/5 rounded-[40px] p-8 backdrop-blur-xl mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Enter coupon code"
                        className="w-full md:flex-1 bg-white border border-black/10 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-black transition-all font-bold"
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
                                    toast.error(data?.error || data?.message || 'Invalid coupon code.');
                                } else {
                                    toast.success(`Discount applied: ${data.discountType === 'percentage' ? data.discountValue + '%' : '$' + data.discountValue} off!`);
                                    setPaymentData(prev => ({ ...prev, appliedDiscount: data }));
                                }
                            } catch (err) {
                                console.error('Discount validation error:', err);
                                toast.error('Could not validate coupon at this time.');
                            }
                        }}
                        className="w-full md:w-auto py-5 px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1a1a1a] transition-all"
                    >
                        Apply
                    </button>
                </div>
                {paymentData.appliedDiscount && (
                    <div className="mt-4 p-4 bg-black/5 border border-black/10 rounded-2xl flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-black">✓ Coupon Applied</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-black/60">
                            -{paymentData.appliedDiscount.discountType === 'percentage'
                                ? `${paymentData.appliedDiscount.discountValue}%`
                                : `$${paymentData.appliedDiscount.discountValue}`}
                        </span>
                    </div>
                )}
                {!paymentData.coupon && (
                    <p className="text-center text-[9px] font-black uppercase tracking-widest text-gray-300 mt-4">
                        Skip if you don't have a coupon
                    </p>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                    onClick={() => setStep(11)}
                    className="w-full md:flex-1 py-6 bg-black/5 border border-black/5 text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/10"
                >
                    Back
                </button>
                <button
                    onClick={() => setStep(13)}
                    className="w-full md:flex-[2] py-6 bg-white border border-black/10 text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all shadow-sm"
                >
                    Continue to Billing
                </button>
            </div>
        </div>
    );

    const renderBillingStep = () => (
        <div className="assessment-step max-w-2xl mx-auto py-20 px-6">
            <div className="text-center mb-10">
                <div className="inline-block py-2 px-6 bg-accent-black/10 border border-accent-black/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-black mb-6">
                    {categoryId === 'sexual-health' ? 'Step 37: Payment' : 'Step 29: Billing'}
                </div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-3 leading-tight">
                    Complete Your <span className="text-accent-black">Payment.</span>
                </h2>
                <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[10px]">
                    Clinical assessment fee for professional provider review.
                </p>
            </div>

            <div className="bg-gray-50 border border-black/5 rounded-[40px] p-12 backdrop-blur-xl space-y-10 mb-8">
                <div className="flex justify-between items-start pb-8 border-b border-black/5">
                    <div>
                        <h3 className="text-black text-xl font-black uppercase tracking-tighter mb-2">Eligibility Verification Fee</h3>
                        <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest leading-relaxed max-w-xs">
                            A healthcare provider will review and verify your eligibility for the program.
                        </p>
                    </div>
                    <span className="text-accent-black text-3xl font-black">
                        {paymentData.appliedDiscount ? (
                            <>
                                <span className="line-through text-gray-300 text-xl mr-2">
                                    ${(25.00 + (labFulfillment === 'order' ? 29.99 : 0)).toFixed(2)}
                                </span>
                                ${(() => {
                                    const base = 25.00 + (labFulfillment === 'order' ? 29.99 : 0);
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
                        ) : `$${(25.00 + (labFulfillment === 'order' ? 29.99 : 0)).toFixed(2)}`}
                    </span>
                </div>

                {labFulfillment === 'order' && (
                    <div className="flex justify-between items-start pb-8 border-b border-black/5">
                        <div className="flex-1">
                            <h3 className="text-black text-[10px] font-black uppercase tracking-widest mb-1">Quest Diagnostics Lab Order</h3>
                            <p className="text-gray-400 text-[8px] font-medium uppercase tracking-widest leading-relaxed">
                                Universal clinical lab requisition for any Quest location.
                            </p>
                        </div>
                        <span className="text-black/40 text-sm font-black">$29.99</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4 mt-8">
                <button
                    onClick={() => setStep(12)}
                    className="w-full md:flex-1 py-6 bg-black/5 border border-black/5 text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/10"
                >
                    Back
                </button>
                <button
                    onClick={() => setStep(14)}
                    className="w-full md:flex-[2] py-6 bg-white border border-black/10 text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all shadow-sm"
                >
                    Continue to Payment
                </button>
            </div>
        </div>
    );

    const renderPaymentStep = () => (
        <div className="assessment-step max-w-2xl mx-auto py-20 px-6">
            <div className="text-center mb-10">
                <div className="inline-block py-2 px-6 bg-accent-black/10 border border-accent-black/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-black mb-6">
                    {categoryId === 'sexual-health' ? 'Step 37: Secure Checkout' : 'Step 30: Secure Checkout'}
                </div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-3 leading-tight">
                    Add <span className="text-accent-black">Payment Details.</span>
                </h2>
                <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[10px]">
                    Enter your card information below to complete activation.
                </p>
            </div>

            <div className="bg-gray-50 border border-black/5 rounded-[40px] p-8 md:p-12 backdrop-blur-xl">
                <div className="space-y-6">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mb-8">Secure 256-bit SSL encrypted payment</label>
                    {(() => {
                        const baseCents = 2500 + (labFulfillment === 'order' ? 2999 : 0);
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
                                    className="w-full py-6 bg-white border border-black/10 text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all shadow-sm"
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
                                    tempUserId={tempUserId}
                                    email={authData.email || shippingData.email}
                                />
                            </Elements>
                        );
                    })()}
                </div>

                <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-8 mt-10">
                    By clicking "Process Activation", you agree to our clinical terms of service.
                </p>

                <div className="pt-8 mt-8 text-center border-t border-black/5">
                    <button
                        onClick={() => setStep(13)}
                        className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#1a1a1a] transition-colors"
                    >
                        ← Back to Billing
                    </button>
                </div>
            </div>
        </div>
    );

    const renderAIResultStep = () => (
        <div className="assessment-step max-w-4xl mx-auto py-20 px-6 text-center">
            {aiReviewing ? (
                <div className="space-y-12 animate-in fade-in duration-700">
                    <div className="relative w-48 h-48 mx-auto">
                        <div className="absolute inset-0 border-[6px] border-black/5 rounded-full"></div>
                        <div className="absolute inset-0 border-[6px] border-black border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Analyzing</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight">
                            Evaluating Your<br />
                            <span className="bg-[#FFDE59] px-4 py-1">Clinical Profile.</span>
                        </h2>
                        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-black/40">Our AI engine is reviewing your medical intake</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-16 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="w-32 h-32 bg-black/[0.02] border border-black/5 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl">
                        {aiApproved ? (
                            <div className="w-16 h-16 bg-[#FFDE59] rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 transition-transform hover:rotate-0">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-black"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg transform -rotate-12 transition-transform hover:rotate-0">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                        )}
                    </div>

                    <div className="space-y-10">
                        {aiApproved ? (
                            <div className="space-y-8">
                                <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-black">
                                    🎉Congratulations! 🎉
                                </h2>
                                <p className="text-xl md:text-3xl font-black tracking-tight text-black max-w-2xl mx-auto leading-tight">
                                    {categoryId === 'hair-restoration'
                                        ? "You may be eligible for our hair restoration program and specialized treatment. ✅"
                                        : categoryId === 'sexual-health'
                                            ? "You may be eligible for our performance support program and specialized treatment. ✅"
                                            : "You may be eligible for our program and prescription treatment. ✅"}
                                </p>
                                <p className="text-sm md:text-lg font-bold italic text-black/40 max-w-xl mx-auto leading-relaxed">
                                    A licensed healthcare provider will carefully review your information to determine your eligibility and next steps.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight text-black flex flex-col items-center">
                                    <span>Review In</span>
                                    <span className="bg-[#FFDE59] px-6 py-2 transform -rotate-2">Progress.</span>
                                </h2>
                                <p className="text-xl md:text-3xl font-black tracking-tight text-black max-w-3xl mx-auto leading-tight">
                                    A licensed healthcare provider will thoroughly review your health information to determine your eligibility for the program. 🔎
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={() => setStep(10)}
                            className="group relative inline-flex items-center justify-center px-16 py-8 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all hover:bg-[#FFDE59] hover:text-black overflow-hidden"
                        >
                            <span className="relative z-10">Continue to ID Verification</span>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#FFDE59] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                        </button>

                        <button
                            onClick={() => {
                                setStep(8);
                                setMedicalStep(medicalQuestions.length - 1);
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                        >
                            ← Back to Clinical Intake
                        </button>
                    </div>

                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/20">Official Clinical Assessment • GLP-1 Protocol</p>
                </div>
            )
            }
        </div >
    );


    const renderSuccessStep = () => (
        <div className="assessment-step max-w-2xl mx-auto py-20 px-6 text-center">
            <div className="w-24 h-24 bg-accent-black/10 border border-accent-black/20 rounded-full flex items-center justify-center mx-auto mb-10">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent-black">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 leading-tight">
                Assessment <br />
                <span className="text-accent-black">Complete.</span>
            </h2>
            <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[10px] mb-12 max-w-md mx-auto leading-relaxed">
                Your medical profile has been encrypted and submitted to our clinical board. A licensed provider will review your case within 24 hours.
            </p>

            {tempUserId && !user && (
                <div className="mb-12 p-8 rounded-[32px] bg-[#FFDE5910] border-2 border-[#FFDE5940] text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#FFDE59] flex items-center justify-center text-black">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tighter text-[#1a1a1a]">Final Step: Verify Identity</h3>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#1a1a1a80] leading-relaxed mb-6">
                        We've sent a verification link to <span className="text-black">{authData.email || 'your email'}</span>. You must click this link to activate your clinical profile and access your dashboard.
                    </p>
                    <button
                        onClick={() => {
                            const domain = (authData.email || '').split('@')[1];
                            if (domain) window.open(`https://${domain}`, '_blank');
                        }}
                        className="w-full py-4 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#FFDE59] hover:text-black transition-all"
                    >
                        Open Mailbox & Verify
                    </button>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                    onClick={() => navigate('/')}
                    className="w-full md:w-auto px-12 py-6 rounded-2xl bg-white border border-black/10 text-black font-black text-[10px] uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all shadow-sm"
                >
                    Home Page
                </button>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-12 py-8 bg-white text-black border border-black/10 rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all duration-500 shadow-sm"
                >
                    Enter Dashboard
                </button>
            </div>
        </div>
    );


    return (
        <div className="min-h-screen bg-white text-[#1a1a1a] font-sans selection:bg-accent-black selection:text-black">
            {/* Minimal Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 h-[84px] flex items-center">
                <div className="max-w-7xl mx-auto w-full flex justify-between items-center h-full">
                    <Link to="/" className="relative flex items-center mt-[10px]">
                        <img
                            src={logo}
                            alt="uGlowMD Logo"
                            className="h-20 md:h-30 w-auto transition-transform hover:scale-105 object-contain absolute left-0 "
                            style={{
                                filter: 'brightness(0.1)',
                                maxWidth: 'none'
                            }}
                        />
                    </Link >

                    {step > 0 && step < 15 && (
                        <div className="flex items-center gap-6">
                            <button
                                onClick={handleClearProgress}
                                className="text-[9px] font-black uppercase tracking-widest text-white bg-black border border-black hover:bg-[#1a1a1a] transition-all px-5 py-2.5 rounded-full pointer-events-auto shadow-lg"
                            >
                                Stop & Clear Progress
                            </button>
                        </div>
                    )}
                </div >

                {/* Compact Progress Bar directly under the logo/header content */}
                {
                    ((step > 0 && step < 15) || (step === 0 && !(showQuote || showBMI || showQuote2 || showSexualHealthQuote || showSexualHealthGoals || showSexualHealthQuote2 || showHairQuote || showHairGoals || showHairQuote2))) && (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5">
                            <div
                                className="h-full bg-black transition-all duration-1000 ease-out"
                                style={{
                                    width: `${(() => {
                                        if (step === 0) return 5;
                                        if (step === 2) return 10;
                                        if (step === 3) return 15;
                                        if (step === 4) return 20;
                                        if (step === 5) return 25;
                                        if (step === 8) {
                                            const medProgress = (medicalStep / (medicalQuestions.length || 1)) * 60;
                                            return 30 + medProgress;
                                        }
                                        if (step === 25) return 85;
                                        if (step === 10) return 90;
                                        if (step === 11) return 92;
                                        if (step === 12) return 94;
                                        if (step === 13) return 96;
                                        if (step === 14) return 98;
                                        if (step === 15) return 100;
                                        return (step / 15) * 100;
                                    })()}%`
                                }}
                            ></div>
                        </div>
                    )
                }
            </header >

            <main className="pt-28 pb-20 min-h-[calc(100vh-100px)]">
                <div className="w-full">
                    {categoryId === 'weight-loss' && showQuote && step === 0 && renderQuoteStep()}
                    {categoryId === 'weight-loss' && !showQuote && showBMI && step === 0 && renderBMICalculatorStep()}
                    {categoryId === 'weight-loss' && !showQuote && !showBMI && showQuote2 && step === 0 && renderQuote2Step()}
                    {categoryId === 'sexual-health' && step === 0 && (
                        showSexualHealthQuote ? renderSexualHealthQuoteStep() :
                            showSexualHealthGoals ? renderSexualHealthGoalsStep() :
                                showSexualHealthQuote2 ? renderSexualHealthQuote2Step() :
                                    renderSexualHealthQuoteStep() // Safety Fallback
                    )}
                    {categoryId === 'hair-restoration' && step === 0 && (
                        showHairQuote ? renderHairQuoteStep() :
                            showHairGoals ? renderHairGoalsStep() :
                                showHairQuote2 ? renderHairQuote2Step() :
                                    renderHairQuoteStep() // Safety Fallback
                    )}
                    {!(categoryId === 'weight-loss' && (showQuote || showBMI || showQuote2)) &&
                        categoryId !== 'sexual-health' &&
                        categoryId !== 'hair-restoration' &&
                        (step === 0 || step === 1) && renderStep0()}
                    {step === 2 && renderReviewStep()}
                    {step === 3 && renderAuthStep()}
                    {step === 4 && renderBMIAndDrugStep()}
                    {(step === 5 || step === 6 || step === 7) && renderEligibilityStep()}

                    {step === 8 && renderDynamicIntakeStep()}

                    {step === 10 && renderIdentificationStep()}
                    {step === 11 && renderShippingStep()}
                    {step === 12 && renderCouponStep()}
                    {step === 13 && renderBillingStep()}
                    {step === 14 && renderPaymentStep()}
                    {step === 25 && renderAIResultStep()}
                    {step === 15 && renderSuccessStep()}
                </div>
            </main>

            {/* Mobile Clear Button */}
            {step > 0 && step < 15 && (
                <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
                    <button
                        onClick={handleClearProgress}
                        className="w-full bg-black border border-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-2xl active:scale-95 transition-all"
                    >
                        Reset Progress & Exit
                    </button>
                </div>
            )
            }

            <style dangerouslySetInnerHTML={{
                __html: `
                .assessment-step {
                    perspective: 1000px;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(0);
                    cursor: pointer;
                }
                ::placeholder {
                    color: rgba(0, 0, 0, 0.4) !important;
                    opacity: 1;
                }
                :-ms-input-placeholder {
                    color: rgba(0, 0, 0, 0.4) !important;
                }
                ::-ms-input-placeholder {
                    color: rgba(0, 0, 0, 0.4) !important;
                }
                .assessment-option-arial {
                    font-family: Arial, sans-serif !important;
                    text-transform: none !important;
                }
                .assessment-option-arial::first-letter {
                    text-transform: uppercase !important;
                }
            `}} />

            {/* Verification Loading Modal */}
            {
                npiLoading && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white p-12 rounded-[50px] shadow-2xl border border-black/5 flex flex-col items-center gap-8 max-w-sm text-center">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-black/5 border-t-black rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-pulse text-accent-black"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-black uppercase tracking-tighter">Verifying PCP Details</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">Searching Federal NPI Registry...</p>
                            </div>
                            <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-widest">
                                We are cross-referencing your provider's credentials to ensure clinical compliance.
                            </p>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Assessment;
