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

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
    console.error('VITE_STRIPE_PUBLISHABLE_KEY is missing! Check your .env file.');
}
const stripePromise = loadStripe(stripePublishableKey || '');

// Assets
const weightLossImg = null; // Removed missing import: ../assets/weight-loss.png
import hairLossImg from '../assets/hair-loss.webp';
import mensHealthImg from '../assets/mens-health.webp';
import longevityImg from '../assets/longevity.webp';
const smilingImg = null; // Removed missing import: ../assets/happy_people.png
const alabamaMapImg = null; // Removed missing import: ../assets/us_map_alabama.png
const ongoingSupportImg = null; // Removed missing import: ../assets/ongoing_support.png
import smilingDoctorImg from '../assets/smiling_doctor.webp';
import happyPatientImg from '../assets/happy_patient.webp';

import { categoryQuestions as baseCategoryQuestions, intakeQuestions } from '../data/questions';
import logo from '../assets/logo.webp';
import weightlossQuoteImg from '../assets/weightloss-quote-img.webp';
import quoteTargetImg from '../assets/quote-target.webp';
import quoteFatCutImg from '../assets/quote-image-fat-cut-weight-loss.webp';
import sexualHealthFirstQuoteImg from '../assets/sexual_health_first_quote.webp';
import sexualHealthQuote2Img from '../assets/sexual_health_quote_2.webp';
import hairLossFirstQuoteImg from '../assets/hair-loss-first-quote.webp';
import hairLossSecondQuoteImg from '../assets/hair_loss_second_quote.webp';
import longevityFirstQuoteImg from '../assets/longetivity_first_quote_img.webp';
import testosteroneQuote1Img from '../assets/testosterone-image-v2.webp';
import testosteroneQuote2Img from '../assets/testosterone-quote_img_2.webp';

const categoryQuestions = {
    ...baseCategoryQuestions,
    'weight-loss': { ...baseCategoryQuestions['weight-loss'], stat: { ...baseCategoryQuestions['weight-loss'].stat, image: happyPatientImg } },
    'hair-restoration': { ...baseCategoryQuestions['hair-restoration'], stat: { ...baseCategoryQuestions['hair-restoration'].stat, image: smilingImg } },
    'sexual-health': { ...baseCategoryQuestions['sexual-health'], stat: { ...baseCategoryQuestions['sexual-health'].stat, image: smilingImg } },
    'longevity': { ...baseCategoryQuestions['longevity'], stat: { ...baseCategoryQuestions['longevity'].stat, image: smilingImg } },
    'testosterone': { ...baseCategoryQuestions['testosterone'], stat: { ...baseCategoryQuestions['testosterone'].stat, image: smilingImg } },
    'skin-care': { ...baseCategoryQuestions['skin-care'], stat: { ...baseCategoryQuestions['skin-care'].stat, image: smilingImg } },
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

const CheckoutForm = ({ onComplete, amount, couponCode, categoryId, tempUserId, email, dob }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { session } = useAuth();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        if (!session && !tempUserId) {
            setError("Identity missing. Please start over to authenticate your checkout.");
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setError(submitError.message);
                setProcessing(false);
                return;
            }

            let accessToken = session?.access_token || null;
            if (!accessToken) {
                const { data: sessionData } = await supabase.auth.getSession();
                accessToken = sessionData?.session?.access_token || null;
            }

            const invokeHeaders = {
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            };
            if (accessToken) invokeHeaders['Authorization'] = `Bearer ${accessToken}`;

            if (amount > 0) {
                // Payment Intent for > $0 using standard edge function
                const { data, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
                    body: {
                        couponCode: couponCode || null,
                        amount: amount,
                        type: 'eligibility_verification',
                        categoryId: categoryId,
                        userId: session?.user?.id || tempUserId,
                        email: session?.user?.email || email
                    }
                });

                if (intentError || !data?.clientSecret) {
                    throw new Error(data?.error || intentError?.message || 'Failed to initialize payment.');
                }

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
                } else if (paymentIntent) {
                    const pmId = typeof paymentIntent.payment_method === 'string'
                        ? paymentIntent.payment_method
                        : paymentIntent.payment_method?.id;

                    if (pmId) {
                        const userId = session?.user?.id || tempUserId;
                        await supabase.from('profiles').update({
                            stripe_payment_method_id: pmId,
                            date_of_birth: dob || null
                        }).eq('id', userId);
                    }
                    onComplete();
                }
            } else {
                // Setup Intent for $0 (Skincare)
                const { data, error: setupError } = await supabase.functions.invoke('create-setup-intent', {
                    method: 'POST',
                    headers: invokeHeaders
                });

                if (setupError || !data?.clientSecret) {
                    throw new Error(data?.error || setupError?.message || 'Failed to initialize security vault.');
                }

                const { setupIntent, error: confirmError } = await stripe.confirmSetup({
                    elements,
                    clientSecret: data.clientSecret,
                    confirmParams: {
                        return_url: `${window.location.origin}/dashboard?payment=success`,
                    },
                    redirect: 'if_required'
                });

                if (confirmError) {
                    setError(confirmError.message);
                } else if (setupIntent) {
                    const pmId = typeof setupIntent.payment_method === 'string'
                        ? setupIntent.payment_method
                        : setupIntent.payment_method?.id;

                    if (pmId) {
                        const userId = session?.user?.id || tempUserId;
                        await supabase.from('profiles').update({
                            stripe_payment_method_id: pmId,
                            date_of_birth: dob || null
                        }).eq('id', userId);
                    }
                    onComplete();
                }
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
                    {processing ? 'Processing Securely...' : (amount > 0 ? `Process Submission • $${(amount / 100).toFixed(2)}` : 'Save Payment Method')}
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

    const baseFee = (categoryId === 'weight-loss' || categoryId === 'retatrutide') ? 25.00 : (categoryId === 'testosterone' ? 30.00 : (categoryId === 'skin-care' ? 0.00 : 25.00));
    const baseFeeCents = (categoryId === 'weight-loss' || categoryId === 'retatrutide') ? 2500 : (categoryId === 'testosterone' ? 3000 : (categoryId === 'skin-care' ? 0 : 2500));
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
    const [showLongevityQuote, setShowLongevityQuote] = useState(true);
    const [showLongevityGoals, setShowLongevityGoals] = useState(false);
    const [selectedLongevityGoals, setSelectedLongevityGoals] = useState([]);
    const [showTestosteroneQuote, setShowTestosteroneQuote] = useState(true);
    const [showTestosteroneGoals, setShowTestosteroneGoals] = useState(false);
    const [showTestosteroneQuote2, setShowTestosteroneQuote2] = useState(false);
    const [selectedTestosteroneGoals, setSelectedTestosteroneGoals] = useState([]);
    const [selectedSkinCareGoals, setSelectedSkinCareGoals] = useState([]);
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
        phoneNumber: '',
        dobMonth: '',
        dobDay: '',
        dobYear: '',
        sex: 'male'
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
        countryCode: '+1',
        phone: '',
        consent: false,
        pcpVisitLast6Months: '',
        labResults: []
    });
    const [idData, setIdData] = useState({ type: '', number: '', file: null });
    const [shippingData, setShippingData] = useState({ firstName: '', lastName: '', address: '', apt: '', city: '', state: '', zip: '', countryCode: '+1', phone: '', email: '' });
    const [paymentData, setPaymentData] = useState({ cardNumber: '', expiry: '', cvc: '', coupon: '' });
    const [showStripe, setShowStripe] = useState(false);
    const [stateSearch, setStateSearch] = useState('');
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const [pcpStateSearch, setPcpStateSearch] = useState('');
    const [showPcpStateDropdown, setShowPcpStateDropdown] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showEligibilityCountryDropdown, setShowEligibilityCountryDropdown] = useState(false);
    const [showShippingCountryDropdown, setShowShippingCountryDropdown] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');

    const countryCodes = [
        { code: '+1', country: 'United States', flag: '🇺🇸' },
        { code: '+1', country: 'Canada', flag: '🇨🇦' },
        { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
        { code: '+61', country: 'Australia', flag: '🇦🇺' },
        { code: '+49', country: 'Germany', flag: '🇩🇪' },
        { code: '+33', country: 'France', flag: '🇫🇷' },
        { code: '+39', country: 'Italy', flag: '🇮🇹' },
        { code: '+34', country: 'Spain', flag: '🇪🇸' },
        { code: '+81', country: 'Japan', flag: '🇯🇵' },
        { code: '+86', country: 'China', flag: '🇨🇳' },
        { code: '+91', country: 'India', flag: '🇮🇳' },
        { code: '+52', country: 'Mexico', flag: '🇲🇽' },
        { code: '+55', country: 'Brazil', flag: '🇧🇷' },
        { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
        { code: '+27', country: 'South Africa', flag: '🇿🇦' },
        { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
        { code: '+7', country: 'Russia', flag: '🇷🇺' },
        { code: '+82', country: 'South Korea', flag: '🇰🇷' },
        { code: '+65', country: 'Singapore', flag: '🇸🇬' },
        { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
        { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
        { code: '+46', country: 'Sweden', flag: '🇸🇪' },
        { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
        { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
        { code: '+66', country: 'Thailand', flag: '🇹🇭' },
        { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
        { code: '+63', country: 'Philippines', flag: '🇵🇭' },
        { code: '+90', country: 'Turkey', flag: '🇹🇷' },
        { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
        { code: '+972', country: 'Israel', flag: '🇮🇱' },
        { code: '+20', country: 'Egypt', flag: '🇪🇬' },
        { code: '+54', country: 'Argentina', flag: '🇦🇷' },
        { code: '+56', country: 'Chile', flag: '🇨🇱' },
        { code: '+57', country: 'Colombia', flag: '🇨🇴' },
        { code: '+43', country: 'Austria', flag: '🇦🇹' },
        { code: '+32', country: 'Belgium', flag: '🇧🇪' },
        { code: '+45', country: 'Denmark', flag: '🇩🇰' },
        { code: '+358', country: 'Finland', flag: '🇫🇮' },
        { code: '+30', country: 'Greece', flag: '🇬🇷' },
        { code: '+353', country: 'Ireland', flag: '🇮🇪' },
        { code: '+47', country: 'Norway', flag: '🇳🇴' },
        { code: '+48', country: 'Poland', flag: '🇵🇱' },
        { code: '+351', country: 'Portugal', flag: '🇵🇹' },
        { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
        { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
    ];
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [uploading, setUploading] = useState(null); // Track which file is being uploaded
    const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
    const [showVerificationSent, setShowVerificationSent] = useState(false);
    const [tempUserId, setTempUserId] = useState(null);
    const [piiData, setPiiData] = useState({ pcpFirstName: '', pcpLastName: '', pcpState: '', pcpNpi: '', pastDosage: '', noPcp: false, dosagePreference: '', desiredDose: '' });
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

    // Force white body background while Assessment is mounted.
    // index.css sets body { background: #050505 } globally which bleeds
    // through in any gap/transition/loading state.
    useEffect(() => {
        const prev = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#ffffff';
        return () => {
            document.body.style.backgroundColor = prev;
        };
    }, []);

    // When the user clicks the confirmation link, Supabase redirects them back to
    // /assessment/{categoryId} as an authenticated user. We detect assessment_pending
    // in their metadata and auto-advance to the intake questions, restoring their goals.
    useEffect(() => {
        if (!user) return;

        const meta = user.user_metadata || {};
        if (!meta.assessment_pending) return;
        if (meta.assessment_category && meta.assessment_category !== categoryId) return;

        // Restore goals they selected before creating the account
        try {
            const savedGoals = meta.assessment_goals ? JSON.parse(meta.assessment_goals) : [];
            if (savedGoals.length > 0) {
                setSelectedImprovements(savedGoals);
            }

            // Sync DOB and Sex from metadata to eligibilityData for the current flow
            if (meta.date_of_birth || meta.birthday) {
                const rawDob = meta.date_of_birth || meta.birthday;
                const [y, m, d] = rawDob.split('-');
                setEligibilityData(prev => ({
                    ...prev,
                    dob: rawDob,
                    dobYear: y || prev.dobYear,
                    dobMonth: (m || '').replace(/^0/, '') || m || prev.dobMonth,
                    dobDay: (d || '').replace(/^0/, '') || d || prev.dobDay,
                    sex: meta.gender || meta.sex || prev.sex
                }));
            }
        } catch (e) {
            console.warn('Could not parse assessment_goals from metadata', e);
        }

        // Secondary Sync: Ensure profile has DOB and Gender from metadata
        // This is necessary because the initial upsert at signup might fail if the user is not yet confirmed (RLS)
        if (meta.date_of_birth || meta.gender) {
            supabase.from('profiles').update({
                date_of_birth: meta.date_of_birth,
                first_name: meta.first_name,
                last_name: meta.last_name
            }).eq('id', user.id).then(({ error }) => {
                if (error) console.warn('Secondary profile sync failed:', error.message);
            });
        }

        // Advance to the correct next step based on category
        // weight-loss needs BMI data (integrated into step 0) before medical intake (step 8)
        if (categoryId === 'weight-loss') {
            setStep(0);
            setShowQuote(false);
            setShowBMI(true);
            setShowQuote2(false);
        } else {
            setMedicalStep(0);
            setStep(8);
        }

        // Clear the pending flag so this only runs once
        supabase.auth.updateUser({
            data: { assessment_pending: false }
        }).catch(err => console.warn('Could not clear assessment_pending flag', err));

    }, [user, categoryId]);

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
        const ownerId = user?.id || tempUserId;
        const filePath = `${ownerId}/${folder}/${fileName}`;

        setUploading(folder);
        if (import.meta.env.DEV) {
            console.log('Upload starting for folder:', folder, 'User:', user?.id, 'User: (TEMP)', tempUserId);
        }
        try {
            const { data, error } = await supabase.storage
                .from('assessment-uploads')
                .upload(filePath, file);

            if (import.meta.env.DEV) {
                console.log('Upload attempt for:', filePath);
            }
            if (error) {
                console.error('Supabase upload error object:', error);
                throw error;
            }
            if (import.meta.env.DEV) {
                console.log('Upload success data:', data);
            }

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
            if (step === 14 || step === 15) return;

            // Try matching on selected_drug (stores categoryId)
            const { data, error } = await supabase
                .from('form_submissions')
                .select('id')
                .eq('user_id', user.id)
                .eq('selected_drug', categoryId)
                .limit(1);

            if (data && data.length > 0) {
                document.body.style.backgroundColor = '#ffffff';
                document.body.style.background = '#ffffff';
                setHasExistingSubmission(true);
                return;
            }

            // Fallback: try matching on 'category' column
            const { data: data2 } = await supabase
                .from('form_submissions')
                .select('id')
                .eq('user_id', user.id)
                .eq('category', categoryId)
                .limit(1);

            if (data2 && data2.length > 0) {
                document.body.style.backgroundColor = '#ffffff';
                document.body.style.background = '#ffffff';
                setHasExistingSubmission(true);
            }
        };
        checkExisting();
    }, [user, categoryId, step, STORAGE_KEY]);


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

            // Determine the correct goals array based on category
            let resolvedGoals = selectedImprovements;
            if (categoryId === 'sexual-health') resolvedGoals = selectedSexualHealthGoals;
            else if (categoryId === 'hair-restoration') resolvedGoals = selectedHairGoals;
            else if (categoryId === 'longevity') resolvedGoals = selectedLongevityGoals;
            else if (categoryId === 'testosterone') resolvedGoals = selectedTestosteroneGoals;
            else if (categoryId === 'skin-care') resolvedGoals = selectedSkinCareGoals;

            // Prepare submission data mapping
            const resolvedUserId = user?.id || tempUserId;
            if (!resolvedUserId) {
                console.error("No valid user ID found for submission.");
                alert("Session error: Please ensure you are logged in correctly.");
                setSubmitLoading(false);
                return;
            }

            // Helper to ensure values are arrays (for Postgres TEXT[] columns)
            const ensureArray = (val) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                // If it's a string from a single-choice question, wrap it in an array
                return [val];
            };

            const submissionData = {
                user_id: resolvedUserId,
                goals: resolvedGoals,
                custom_goal: intakeData.other_goal_details,

                // Biometrics (weight-loss specific — null for other categories)
                height_feet: h.feet > 0 ? h.feet : (parseInt(bmiHeightFeet) || null),
                height_inches: h.inches > 0 ? h.inches : (parseInt(bmiHeightInches) || null),
                weight: weightVal > 0 ? weightVal : (parseFloat(bmiWeight) || null),
                bmi: (computedBMI ? parseFloat(computedBMI) : (parseFloat(bmiVal.toFixed(1)) || null)),

                // Basics
                sex: eligibilityData.sex || intakeData.assigned_sex_intake || intakeData.sex,
                state: eligibilityData.state || shippingData.state || intakeData.state,
                seen_pcp: intakeData.pcp_labs || eligibilityData.pcpVisitLast6Months || intakeData.has_pcp_long,
                email: user?.email || authData.email || shippingData.email,

                // Medical Conditions (ensure these are arrays for TEXT[] columns)
                heart_conditions: ensureArray(intakeData.heart_conditions || intakeData.heart || intakeData.heart_condition_dx_sh),
                atrial_fib_change: intakeData.afib_follow,
                hormone_conditions: ensureArray(intakeData.hormone_conditions || intakeData.hormone),
                cancer_history: ensureArray(intakeData.cancer_history || intakeData.cancer || intakeData.personal_cancer_hx),
                cancer_details: intakeData.cancer_details || intakeData.personal_cancer_hx_details,
                diabetes_status: intakeData.diabetes || (intakeData.med_diagnostics_sh?.includes('BP/Diabetes/Cholesterol') ? 'Diabetes (from SH)' : null),
                gi_conditions: ensureArray(intakeData.gi_conditions || intakeData.gi),
                mental_health_conditions: ensureArray(intakeData.mental_health || intakeData.mental || intakeData.mental_health_list_sh),
                anxiety_severity: intakeData.anxiety_sev,
                additional_conditions: ensureArray(intakeData.additional_conditions || intakeData.additional),

                // Lifestyle & Impact
                weight_impact_qol: intakeData.weight_impact || intakeData.qol_rate,
                weight_impact_details: intakeData.qol_details || intakeData.weight_impact,

                // Medications & Allergies
                allergies: ensureArray(intakeData.allergies || intakeData.allergies_repair || intakeData.allergies_sh_sh || intakeData.allergies_list_long),
                current_medications: ensureArray(intakeData.current_meds || intakeData.current_meds_repair || intakeData.cardio_meds_list_sh),
                other_medications: ensureArray(intakeData.other_meds || intakeData.supplements || intakeData.meds_list_long),
                past_weight_loss_methods: ensureArray(intakeData.past_weightloss_methods || intakeData.past_methods),
                past_prescription_meds: ensureArray(intakeData.past_rx_weightloss || intakeData.past_rx),

                // Identity & Diversity
                race_ethnicity: intakeData.ethnicity,
                other_health_goals: ensureArray(intakeData.other_health_goals || intakeData.other_goals),
                has_additional_info: intakeData.additional_health_info || 'No',
                additional_health_info: intakeData.additional_health_info_details || intakeData.symptom_detail_sh || intakeData.anything_else_long || intakeData.photo_details,

                // Identification
                identification_type: idData.type,
                identification_number: idData.number,
                identification_url: idData.file_url,

                // Shipping (only columns confirmed to exist in original schema)
                shipping_first_name: shippingData.firstName || firstName,
                shipping_last_name: shippingData.lastName || lastName,
                shipping_address: shippingData.address,
                shipping_city: shippingData.city,
                shipping_state: shippingData.state,
                shipping_zip: shippingData.zip,
                shipping_phone: shippingData.phone ? `${shippingData.countryCode}${shippingData.phone.replace(/\D/g, '')}` : (eligibilityData.phone ? `${eligibilityData.countryCode}${eligibilityData.phone.replace(/\D/g, '')}` : ''),
                shipping_email: shippingData.email || user?.email || authData.email,

                // Metadata & Files
                approval_status: 'pending',
                submitted_at: new Date().toISOString(),
                selected_drug: categoryId,
                category: categoryId === 'skin-care' ? 'weight-loss' : categoryId,
                intake_data: {
                    ...intakeData,
                    ...piiData,
                    goals: selectedImprovements,
                    category: categoryId,
                    date_of_birth: eligibilityData.dob || (eligibilityData.dobYear && eligibilityData.dobMonth && eligibilityData.dobDay ? `${eligibilityData.dobYear}-${eligibilityData.dobMonth.padStart(2, '0')}-${eligibilityData.dobDay.padStart(2, '0')}` : intakeData.dob),
                    eligibility: eligibilityData,
                    shipping: shippingData,
                    identification: idData,
                    lab_fulfillment: labFulfillment || intakeData.lab_fulfillment,
                    past_dosage: piiData.pastDosage,
                    no_pcp: piiData.noPcp,
                },

                glp1_prescription_url: intakeData.current_meds_file ? [intakeData.current_meds_file] : [],
                coupon_code: paymentData.coupon
            };


            // 1. Parent-First Sync: Ensure the profile record exists BEFORE inserting the submission.
            // This satisfies Foreign Key constraints (like form_submissions_user_id_fkey -> profiles).
            const dob = (authData.dobYear && authData.dobMonth && authData.dobDay
                ? `${authData.dobYear}-${authData.dobMonth.padStart(2, '0')}-${authData.dobDay.padStart(2, '0')}`
                : (eligibilityData.dob || user?.user_metadata?.date_of_birth || (eligibilityData.dobYear && eligibilityData.dobMonth && eligibilityData.dobDay ? `${eligibilityData.dobYear}-${eligibilityData.dobMonth.padStart(2, '0')}-${eligibilityData.dobDay.padStart(2, '0')}` : null)));

            const { error: profileSyncError } = await supabase
                .from('profiles')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    email: user?.email || authData.email || shippingData.email,
                    date_of_birth: dob,
                    phone_number: shippingData.phone ? `${shippingData.countryCode}${shippingData.phone.replace(/\D/g, '')}` : (eligibilityData.phone ? `${eligibilityData.countryCode}${eligibilityData.phone.replace(/\D/g, '')}` : ''),
                    legal_address: `${shippingData.address || ''}, ${shippingData.city || ''}, ${shippingData.state || ''} ${shippingData.zip || ''}`.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', resolvedUserId);

            if (profileSyncError) {
                console.warn("Pre-submission profile sync warning:", profileSyncError.message);
            }

            // 2. Submit the form data
            const { error: submitError } = await supabase
                .from('form_submissions')
                .insert([submissionData]);

            if (submitError) throw submitError;

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

            if (isFree || categoryId === 'skin-care') {
                await supabase.functions.invoke('send-email---v2', {
                    body: {
                        userId: user?.id,
                        email: user?.email || authData.email,
                        first_name: firstName,
                        last_name: lastName,
                        type: categoryId === 'skin-care' ? 'skincare_eligibility' : 'eligibility'
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

            if (!authData.dobMonth || !authData.dobDay || !authData.dobYear) {
                toast.error('Please enter your date of birth.');
                setAuthLoading(false);
                return;
            }

            try {
                const cleanedEmail = authData.email.trim().toLowerCase();
                const cleanedPhone = formattedPhone.replace(/\D/g, '');
                const phoneForQuery = cleanedPhone.length > 10 ? cleanedPhone.slice(-10) : cleanedPhone;

                // Check if email or phone already exists in profiles
                // We're being more aggressive here to prevent "shadow" accounts or duplicate registration
                const { data: existingUser, error: checkError } = await supabase
                    .from('profiles')
                    .select('id, email, phone_number')
                    .or(`email.eq.${cleanedEmail},phone_number.ilike.%${phoneForQuery}%`)
                    .maybeSingle();

                if (checkError) {
                    console.warn('Strict account check warning:', checkError);
                }

                if (existingUser) {
                    if (existingUser.email?.toLowerCase() === cleanedEmail) {
                        toast.error('This email is already registered. Please sign in instead.');
                    } else {
                        toast.error('This phone number is already associated with an account. Please sign in or use a different number.');
                    }
                    setAuthLoading(false);
                    return;
                }

                const dobString = (authData.dobYear && authData.dobMonth && authData.dobDay ? `${authData.dobYear}-${authData.dobMonth.padStart(2, '0')}-${authData.dobDay.padStart(2, '0')}` : null);

                const { data: signUpData, error: signUpError } = await signUp({
                    email: cleanedEmail,
                    password: authData.password,
                    options: {
                        data: {
                            full_name: `${authData.firstName} ${authData.lastName}`,
                            first_name: authData.firstName,
                            last_name: authData.lastName,
                            email: authData.email,
                            phone_number: formattedPhone,
                            date_of_birth: dobString,
                            gender: authData.sex,
                            // Save assessment progress server-side so
                            // confirmation link works in any browser
                            assessment_pending: true,
                            assessment_category: categoryId,
                            assessment_goals: JSON.stringify(selectedImprovements)
                        },
                        emailRedirectTo: `${window.location.origin}/assessment/${categoryId}`
                    }
                });

                if (signUpError) {
                    if (signUpError.message.includes('already registered') || signUpError.status === 400) {
                        toast.error('This email is already registered. Please sign in instead.');
                        setAuthLoading(false);
                        return;
                    }
                    throw signUpError;
                }

                // Supabase enumeration protection check:
                // If the user already exists, 'identities' will be an empty array
                if (signUpData?.user && (!signUpData.user.identities || signUpData.user.identities.length === 0)) {
                    toast.error('An account already exists with this email address. Please sign in.');
                    setAuthLoading(false);
                    return;
                }

                // Create/Update Profile record immediately
                // Note: This might fail if email confirmation is required and RLS blocks unconfirmed users.
                // We have a secondary sync in the useEffect for when they return and are authenticated.
                if (signUpData?.user) {
                    setTempUserId(signUpData.user.id);
                    try {
                        await supabase
                            .from('profiles')
                            .update({
                                email: authData.email,
                                first_name: authData.firstName,
                                last_name: authData.lastName,
                                phone_number: formattedPhone,
                                date_of_birth: dobString,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', signUpData.user.id);
                    } catch (err) {
                        console.warn('Initial profile update attempt failed (likely RLS or row not yet created by trigger):', err);
                    }
                }

                // Sync to eligibilityData so the rest of the flow works
                setEligibilityData(prev => ({
                    ...prev,
                    dob: (authData.dobYear && authData.dobMonth && authData.dobDay ? `${authData.dobYear}-${authData.dobMonth.padStart(2, '0')}-${authData.dobDay.padStart(2, '0')}` : prev.dob),
                    dobMonth: authData.dobMonth || prev.dobMonth,
                    dobDay: authData.dobDay || prev.dobDay,
                    dobYear: authData.dobYear || prev.dobYear,
                    sex: authData.sex || prev.sex,
                }));

                // Show the email verification gate — do NOT advance yet.
                toast.success('Account created! We have sent a 6-digit code to your email.');
                setShowOtpInput(true);
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
                } else {
                    // All non-weight-loss categories go directly to medical intake.
                    // DOB and sex are already collected from the sign-up form or profile.
                    setMedicalStep(0);
                    setStep(8);
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

        try {
            const { error } = await verifyOtp({
                email: authData.email,
                token: otp,
                type: 'signup'
            });

            if (error) throw error;

            setShowOtpInput(false);

            if (categoryId === 'weight-loss') {
                setMedicalStep(0);
                setStep(8);
            } else {
                setMedicalStep(0);
                setStep(8);
            }
            toast.success('Email verified successfully!');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setVerifying(false);
        }
    };

    const categoryData = categoryQuestions[categoryId] || categoryQuestions['weight-loss'];
    const medicalQuestions = intakeQuestions[categoryId] || intakeQuestions['weight-loss'];

    // Compute BMI — must be here (before early return) so hooks below always run
    const computedBMI = (() => {
        const totalInches = (parseInt(bmiHeightFeet) || 0) * 12 + (parseInt(bmiHeightInches) || 0);
        const lbs = parseFloat(bmiWeight) || 0;
        if (totalInches <= 0 || lbs <= 0) return null;
        const bmi = ((lbs * 703) / (totalInches * totalInches)).toFixed(1);
        return bmi;
    })();

    // MUST be before any early return — React hooks must always run in same order
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (computedBMI) {
            setIntakeData(prev => ({ ...prev, bmi: computedBMI, weight: bmiWeight, height: `${bmiHeightFeet}'${bmiHeightInches}"` }));
        }
    }, [computedBMI, bmiWeight, bmiHeightFeet, bmiHeightInches]);

    if (hasExistingSubmission) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                fontFamily: 'Inter, system-ui, sans-serif'
            }}>
                <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>

                    {/* Check icon */}
                    <div style={{
                        width: '96px', height: '96px', borderRadius: '50%',
                        backgroundColor: '#FFDE5920', border: '2px solid #FFDE5970',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto', marginBottom: '32px'
                    }}>
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
                            stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>

                    {/* Headline */}
                    <h1 style={{
                        fontSize: '40px', fontWeight: '900', color: '#1a1a1a',
                        textTransform: 'uppercase', letterSpacing: '-0.03em',
                        lineHeight: '1.05', marginBottom: '12px'
                    }}>
                        Assessment<br />
                        <span style={{
                            backgroundColor: '#FFDE59', color: '#1a1a1a',
                            padding: '0 12px', display: 'inline-block', marginTop: '6px'
                        }}>
                            Completed
                        </span>
                    </h1>

                    {/* Message */}
                    <p style={{
                        fontSize: '13px', color: '#666', lineHeight: '1.7',
                        marginBottom: '40px', marginTop: '20px'
                    }}>
                        You have already completed this assessment.<br />
                        A licensed provider is reviewing your submission.<br />
                        Visit your dashboard to track your progress.
                    </p>

                    {/* Dashboard button */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000'; e.currentTarget.style.color = '#fff'; }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            padding: '18px 48px', borderRadius: '999px',
                            backgroundColor: '#000', color: '#fff', border: 'none',
                            fontSize: '12px', fontWeight: '800', textTransform: 'uppercase',
                            letterSpacing: '0.15em', cursor: 'pointer',
                            transition: 'background-color 0.25s, color 0.25s'
                        }}
                    >
                        Go to My Dashboard
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>

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

    const toggleLongevityGoal = (id) => {
        setSelectedLongevityGoals(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const toggleTestosteroneGoal = (id) => {
        setSelectedTestosteroneGoals(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const toggleRepairGoal = (id) => {
        setSelectedRepairGoals(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const toggleSkinCareGoal = (id) => {
        setSelectedSkinCareGoals(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleContinue = () => {
        if (selectedImprovements.length > 0) {
            if (user) {
                // All categories skip eligibility step and go straight to medical intake
                setMedicalStep(0);
                setStep(8);
            } else {
                setStep(3); // Go to Registration (Auth Step)
            }
        }
    };

    // (computedBMI and its useEffect moved above hasExistingSubmission early return)

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
                    onClick={() => {
                        if (step === 4) setStep(0);
                        setShowBMI(false);
                        setShowQuote(true);
                    }}
                    className="w-full md:w-auto px-10 py-6 bg-black/5 border border-black/10 text-[#1a1a1a] rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/30"
                >
                    Back
                </button>
                <button
                    onClick={() => {
                        if (step === 4) setStep(0);
                        setShowBMI(false);
                        setShowQuote2(true);
                    }}
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
        <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto py-20 px-6 bg-white" style={{ opacity: 1 }}>
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
                            onClick={() => { setShowQuote2(false); setStep(1); }}
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
        <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto py-20 px-6 bg-white" style={{ opacity: 1 }}>
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
        <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto py-10 px-6 bg-white assessment-step" style={{ opacity: 1 }}>
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
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full md:w-auto px-10 py-6 bg-black/5 border border-black/10 text-[#1a1a1a] rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/30"
                        >
                            Back
                        </button>
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
                    onClick={() => { setShowSexualHealthGoals(false); setShowSexualHealthQuote(true); }}
                    className="w-full md:w-auto px-12 py-8 bg-black/5 border border-black/10 text-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-black/30 flex justify-center items-center"
                >
                    Back
                </button>
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
        <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto py-10 px-6 bg-white assessment-step" style={{ opacity: 1 }}>
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
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => { setShowSexualHealthQuote2(false); setShowSexualHealthGoals(true); }}
                            className="w-full md:w-auto px-10 py-6 bg-black/5 border border-black/10 text-[#1a1a1a] rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/30"
                        >
                            Back
                        </button>
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
        </div>
    );

    // ─── Hair Restoration Intro Flow ───────────────────────────────────────────

    const renderHairQuoteStep = () => (
        <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto py-10 px-6 bg-white assessment-step" style={{ opacity: 1 }}>
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
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full md:w-auto px-10 py-6 bg-black/5 border border-black/10 text-[#1a1a1a] rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/30"
                        >
                            Back
                        </button>
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
                    onClick={() => { setShowHairGoals(false); setShowHairQuote(true); }}
                    className="w-full md:w-auto px-12 py-8 bg-black/5 border border-black/10 text-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-black/30 flex justify-center items-center"
                >
                    Back
                </button>
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
        <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto py-10 px-6 bg-white assessment-step" style={{ opacity: 1 }}>
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
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => { setShowHairQuote2(false); setShowHairGoals(true); }}
                            className="w-full md:w-auto px-10 py-6 bg-black/5 border border-black/10 text-[#1a1a1a] rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/30"
                        >
                            Back
                        </button>
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
        </div>
    );

    const renderLongevityQuoteStep = () => (
        <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto py-10 px-6 bg-white assessment-step" style={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row items-center gap-16">
                {/* Left: Image */}
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                        <img
                            src={longevityFirstQuoteImg}
                            alt="Longevity Treatment"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6 z-10">
                            <p className="text-[8px] text-white/60 font-medium leading-relaxed">
                                Reference (APA): Gomes, A. P., et al. (2013). Declining NAD+ induces a pseudohypoxic state disrupting nuclear-mitochondrial communication during aging. Cell, 155(7), 1624–1638. https://doi.org/10.1016/j.cell.2013.11.037
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Quote + CTA */}
                <div className="w-full md:w-1/2 text-left flex flex-col gap-10 bg-white">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white self-start">
                        Clinical Research
                    </div>
                    <h2 style={{ color: '#1a1a1a' }} className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.05]">
                        <span className="block">"Restoring cellular NAD+ levels can support </span>
                        <span className="block">
                            <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>energy production,</span>
                            {' '}mitochondrial function,
                        </span>
                        <span className="block">and overall vitality, helping you feel</span>
                        <span className="block">more resilient and alert in daily life."</span>
                    </h2>
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full md:w-auto px-10 py-6 bg-black/5 border border-black/10 text-[#1a1a1a] rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/30"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => { setShowLongevityQuote(false); setShowLongevityGoals(true); }}
                            className="w-full md:w-auto px-16 py-8 bg-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 transform hover:scale-105 flex items-center justify-center gap-4 text-white"
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
        </div>
    );

    const renderLongevityGoalsStep = () => (
        <div className="assessment-step max-w-5xl mx-auto py-20 px-6">
            <div className="text-center mb-16">
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                    Step 2 – Goals<br />
                    <span className="text-[#1a1a1a]">Focus</span>
                </h1>
                <p className="text-gray-600 font-medium uppercase tracking-[0.3em] text-[10px] mb-8">
                    What is your goal(s) for this treatment?
                </p>
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="space-y-4">
                    {[
                        { id: 'energy', label: 'Increase daily energy and reduce fatigue' },
                        { id: 'focus', label: 'Improve mental focus and cognitive clarity' },
                        { id: 'aging', label: 'Support healthy aging and cellular resilience' },
                        { id: 'recovery', label: 'Improve recovery after physical activity or stress' },
                        { id: 'vitality', label: 'Enhance overall vitality and feeling of wellness' },
                    ].map((goal) => (
                        <div
                            key={goal.id}
                            onClick={() => toggleLongevityGoal(goal.id)}
                            className={`group relative p-6 rounded-[20px] cursor-pointer transition-all duration-700 border-2 overflow-hidden ${selectedLongevityGoals.includes(goal.id)
                                ? 'border-black bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)]'
                                : 'border-black/10 bg-white hover:border-black/20'
                                }`}
                        >
                            <div className="relative z-10 flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${selectedLongevityGoals.includes(goal.id) ? 'bg-black border-black' : 'border-black/30'}`}>
                                    {selectedLongevityGoals.includes(goal.id) && (
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
                    onClick={() => { setShowLongevityGoals(false); setShowLongevityQuote(true); }}
                    className="w-full md:w-auto px-12 py-8 bg-black/5 border border-black/10 text-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-black/30 flex justify-center items-center"
                >
                    Back
                </button>
                <button
                    onClick={() => { user ? setStep(8) : setStep(3); }}
                    disabled={selectedLongevityGoals.length === 0}
                    className={`w-full md:w-auto px-20 py-8 rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 relative overflow-hidden group flex items-center justify-center gap-4 ${selectedLongevityGoals.length > 0
                        ? 'bg-black text-white hover:scale-105 shadow-sm cursor-pointer'
                        : 'bg-black/5 text-black/20 cursor-not-allowed'
                        }`}
                    onMouseEnter={e => { if (selectedLongevityGoals.length > 0) { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; } }}
                    onMouseLeave={e => { if (selectedLongevityGoals.length > 0) { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; } }}
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

    // ─── TESTOSTERONE FLOW ────────────────────────────────────────────────────

    const renderTestosteroneQuoteStep = () => (
        <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto py-10 px-6 bg-white assessment-step" style={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row items-center gap-16">
                {/* Left: Image */}
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                        <img
                            src={testosteroneQuote1Img}
                            alt="Testosterone Treatment"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6 z-10">
                            <p className="text-[8px] text-white/60 font-medium leading-relaxed">
                                Reference (APA): Traish, A. M., Guay, A., &amp; Zitzmann, M. (2011). Testosterone and the metabolic syndrome: An evidence-based review. The Journal of Sexual Medicine, 8(4), 1187–1204. https://doi.org/10.1111/j.1743-6109.2010.01977
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Quote + CTA */}
                <div className="w-full md:w-1/2 text-left flex flex-col gap-10 bg-white">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white self-start">
                        Clinical Research
                    </div>
                    <h2 style={{ color: '#1a1a1a' }} className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.05]">
                        <span className="block">"Restoring testosterone to healthy levels can help</span>
                        <span className="block">
                            <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>improve energy, vitality,</span>
                            {' '}and muscle strength,
                        </span>
                        <span className="block">supporting overall wellness and daily function</span>
                        <span className="block">in men and women with low hormone levels."</span>
                    </h2>
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full md:w-auto px-10 py-6 bg-black/5 border border-black/10 text-[#1a1a1a] rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/30"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => { setShowTestosteroneQuote(false); setShowTestosteroneGoals(true); }}
                            className="w-full md:w-auto px-16 py-8 bg-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 transform hover:scale-105 flex items-center justify-center gap-4 text-white"
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
        </div>
    );

    const renderTestosteroneGoalsStep = () => (
        <div className="assessment-step max-w-5xl mx-auto py-20 px-6">
            <div className="text-center mb-16">
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                    Step 2 – Health<br />
                    <span className="text-[#1a1a1a]">Goals</span>
                </h1>
                <p className="text-gray-600 font-medium uppercase tracking-[0.3em] text-[10px] mb-8">
                    What is your main goal(s) for this treatment?
                </p>
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="space-y-4">
                    {[
                        { id: 'energy', label: 'Increase daily energy and reduce fatigue' },
                        { id: 'muscle', label: 'Improve muscle strength and physical performance' },
                        { id: 'sexual', label: 'Support sexual health and libido' },
                        { id: 'mood', label: 'Enhance mood, motivation, or mental clarity' },
                        { id: 'wellness', label: 'Support overall wellness and healthy aging' },
                    ].map((goal) => (
                        <div
                            key={goal.id}
                            onClick={() => toggleTestosteroneGoal(goal.id)}
                            className={`group relative p-6 rounded-[20px] cursor-pointer transition-all duration-700 border-2 overflow-hidden ${selectedTestosteroneGoals.includes(goal.id)
                                ? 'border-black bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)]'
                                : 'border-black/10 bg-white hover:border-black/20'
                                }`}
                        >
                            <div className="relative z-10 flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${selectedTestosteroneGoals.includes(goal.id) ? 'bg-black border-black' : 'border-black/30'}`}>
                                    {selectedTestosteroneGoals.includes(goal.id) && (
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
                    onClick={() => { setShowTestosteroneGoals(false); setShowTestosteroneQuote(true); }}
                    className="w-full md:w-auto px-12 py-8 bg-black/5 border border-black/10 text-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-black/30 flex justify-center items-center"
                >
                    Back
                </button>
                <button
                    onClick={() => { setShowTestosteroneGoals(false); setShowTestosteroneQuote2(true); }}
                    disabled={selectedTestosteroneGoals.length === 0}
                    className={`w-full md:w-auto px-20 py-8 rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 relative overflow-hidden group flex items-center justify-center gap-4 ${selectedTestosteroneGoals.length > 0
                        ? 'bg-black text-white hover:scale-105 shadow-sm cursor-pointer'
                        : 'bg-black/5 text-black/20 cursor-not-allowed'
                        }`}
                    onMouseEnter={e => { if (selectedTestosteroneGoals.length > 0) { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; } }}
                    onMouseLeave={e => { if (selectedTestosteroneGoals.length > 0) { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; } }}
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

    const renderTestosteroneQuote2Step = () => (
        <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto py-10 px-6 bg-white assessment-step" style={{ opacity: 1 }}>
            <div className="flex flex-col md:flex-row items-center gap-16">
                {/* Left: Image */}
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl relative">
                        <img
                            src={testosteroneQuote2Img}
                            alt="Testosterone Therapy"
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6 z-10">
                            <p className="text-[8px] text-white/60 font-medium leading-relaxed">
                                Reference (APA): Bhasin, S., et al. (2018). Testosterone therapy in men with hypogonadism: An Endocrine Society clinical practice guideline. The Journal of Clinical Endocrinology &amp; Metabolism, 103(5), 1715–1744. https://doi.org/10.1210/jc.2018-00229
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Quote + CTA */}
                <div className="w-full md:w-1/2 text-left flex flex-col gap-10 bg-white">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white self-start">
                        Clinical Evidence
                    </div>
                    <h2 style={{ color: '#1a1a1a' }} className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.05]">
                        <span className="block">"Testosterone therapy has been associated with</span>
                        <span className="block">
                            <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>improvements in mood,</span>
                        </span>
                        <span className="block">cognitive function, sexual health, and quality of life,</span>
                        <span className="block">offering both physical and psychological benefits</span>
                        <span className="block">when appropriately prescribed."</span>
                    </h2>
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => { setShowTestosteroneQuote2(false); setShowTestosteroneGoals(true); }}
                            className="w-full md:w-auto px-10 py-6 bg-black/5 border border-black/10 text-[#1a1a1a] rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/30"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => { user ? (setMedicalStep(0), setStep(8)) : setStep(3); }}
                            className="w-full md:w-auto px-16 py-8 bg-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 transform hover:scale-105 flex items-center justify-center gap-4 text-white"
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
                        >
                            {user ? 'Start My Assessment' : 'Create Account'}
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );


    const renderSkinCareGoalsStep = () => (
        <div className="min-h-screen bg-white flex items-center">
            <div className="max-w-4xl mx-auto px-6 py-20 w-full">
                <div className="text-center mb-16">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-8">
                        Skin Care Goals
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-[#1a1a1a] leading-[1.05]">
                        What are your primary<br />skin care goals?
                    </h2>
                    <p className="text-black/40 text-xs uppercase tracking-[0.3em] mt-4">Select all that apply</p>
                </div>
                <div className="grid grid-cols-1 gap-4 mb-12">
                    {[
                        { id: 'anti-aging', label: 'Anti-Aging & Wrinkles', desc: 'Reduce fine lines and restore youthful elasticity.' },
                        { id: 'pigmentation', label: 'Pigmentation & Dark Spots', desc: 'Even out skin tone and fade stubborn sun damage.' },
                        { id: 'acne', label: 'Acne & Breakouts', desc: 'Clear active acne and prevent future congestion.' },
                        { id: 'redness', label: 'Redness & Rosacea', desc: 'Calm sensitive skin and reduce visible flushing.' }
                    ].map(goal => (
                        <div
                            key={goal.id}
                            onClick={() => toggleSkinCareGoal(goal.id)}
                            className={`flex items-center gap-6 p-6 rounded-[20px] border-2 cursor-pointer transition-all duration-300 ${selectedSkinCareGoals.includes(goal.id)
                                ? 'border-black bg-black/5'
                                : 'border-black/10 hover:border-black/30'
                                }`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${selectedSkinCareGoals.includes(goal.id) ? 'border-black bg-black' : 'border-black/30'
                                }`}>
                                {selectedSkinCareGoals.includes(goal.id) && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-full h-full p-1">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-sm uppercase tracking-wide text-[#1a1a1a]">{goal.label}</span>
                                <span className="text-[10px] font-medium text-black/40 uppercase tracking-widest mt-1">{goal.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button
                        onClick={() => {
                            if (selectedSkinCareGoals.length === 0) { return; }
                            setSelectedImprovements(selectedSkinCareGoals);
                            handleContinue();
                        }}
                        className="w-full md:w-auto px-16 py-6 bg-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:scale-105 flex items-center justify-center gap-3"
                        style={{ color: '#ffffff' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
                    >
                        Continue
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                    {categoryData.question[0]} <br />
                    <span className="text-[#1a1a1a]">{categoryData.question[1]}</span>
                </h1>
                <p className="text-gray-600 font-medium uppercase tracking-[0.3em] text-[10px] mb-8">
                    Select all that apply
                </p>
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="space-y-4 mb-16">
                    {categoryData.improvements.map((opt) => {
                        const isSelected = selectedImprovements.includes(opt.id);
                        return (
                            <div
                                key={opt.id}
                                onClick={() => toggleImprovement(opt.id)}
                                className={`group relative p-6 rounded-[20px] cursor-pointer transition-all duration-700 border-2 overflow-hidden ${isSelected
                                    ? 'border-black bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)]'
                                    : 'border-black/10 bg-white hover:border-black/20'
                                    }`}
                            >
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-black border-black' : 'border-black/30'
                                        }`}>
                                        {isSelected && (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-lg font-medium text-black">
                                        {opt.name}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
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
                <button
                    onClick={() => {
                        if (categoryId === 'weight-loss') {
                            setStep(0);
                            setShowQuote2(true);
                        } else {
                            navigate('/');
                        }
                    }}
                    className="w-full md:w-auto px-12 py-8 bg-black/5 border border-black/10 text-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:border-black/30 flex justify-center items-center"
                >
                    Back
                </button>
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
        <div className="assessment-step max-w-[1400px] 2xl:max-w-[1800px] mx-auto py-20 px-6 flex flex-col md:flex-row items-center gap-16">
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
                    onClick={() => {
                        if (user) {
                            if (categoryId === 'longevity' || categoryId === 'testosterone') {
                                setMedicalStep(0);
                                setStep(8); // Skip eligibility
                            } else {
                                setStep(4);
                            }
                        } else {
                            setStep(3);
                        }
                    }}
                    className="w-full md:w-auto px-20 py-8 bg-black text-white rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 hover:bg-accent-black hover:text-black hover:shadow-[0_0_60px_rgba(19,91,236,0.5)] transform hover:scale-105"
                >
                    Finalize My Plan
                </button>
            </div>
        </div>
    );

    const renderAuthStep = () => {
        // If already logged in, show a "Welcome back" continue screen
        // and pre-fill DOB / sex from the profiles table
        if (user) {
            const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there';
            return (
                <div className="assessment-step max-w-2xl mx-auto py-12 md:py-20 px-6 animate-in fade-in duration-700" style={{ backgroundColor: '#ffffff' }}>
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
                        <p className="font-medium uppercase tracking-[0.2em] text-[10px] max-w-md mx-auto leading-relaxed" style={{ color: 'rgba(0,0,0,0.5)' }}>
                            You're already signed in. Continue to your medical assessment below.
                        </p>
                    </div>

                    <div className="rounded-[40px] p-6 md:p-12 space-y-8" style={{ backgroundColor: '#f9fafb', border: '1px solid rgba(0,0,0,0.1)' }}>
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
                            onClick={async () => {
                                // Load profile to pre-fill DOB / sex before entering assessment
                                try {
                                    const { data: profile } = await supabase
                                        .from('profiles')
                                        .select('date_of_birth, phone_number')
                                        .eq('id', user.id)
                                        .maybeSingle();

                                    const meta = user?.user_metadata || {};
                                    const dobFromMeta = meta.date_of_birth || meta.birthday;

                                    if (profile || dobFromMeta) {
                                        const dob = profile?.date_of_birth || dobFromMeta || '';
                                        const [dobYear = '', dobMonth = '', dobDay = ''] = dob ? dob.split('-') : [];
                                        setEligibilityData(prev => ({
                                            ...prev,
                                            dob,
                                            dobYear,
                                            dobMonth: dobMonth.replace(/^0/, '') || dobMonth,
                                            dobDay: dobDay.replace(/^0/, '') || dobDay,
                                            phone: profile?.phone_number || prev.phone,
                                        }));
                                    }
                                } catch (e) {
                                    console.warn('Could not pre-fill profile data:', e);
                                }
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
                            style={{ backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                        >
                            Not you? Sign in with a different account
                        </button>
                    </div>
                </div>
            );
        }


        if (showOtpInput) {
            return (
                <div className="assessment-step max-w-2xl mx-auto py-20 px-6 animate-in fade-in duration-700" style={{ backgroundColor: '#ffffff' }}>
                    <div className="text-center mb-12">
                        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8" style={{ backgroundColor: 'rgba(0,0,0,0.05)', border: '2px solid rgba(0,0,0,0.1)' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                        </div>
                        <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-6">
                            Identity Verification
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-4" style={{ color: '#1a1a1a' }}>
                            Verify Your <span style={{ color: '#1a1a1a', display: 'inline-block' }}>Email.</span>
                        </h2>
                        <p className="font-medium uppercase tracking-[0.2em] text-[10px] max-w-md mx-auto leading-relaxed" style={{ color: '#1a1a1a' }}>
                            A security code has been transmitted to{' '}
                            <span className="font-black" style={{ color: '#1a1a1a' }}>{authData.email}</span>
                        </p>
                    </div>

                    <div className="rounded-[40px] p-8 md:p-12 text-center" style={{ backgroundColor: '#f9fafb', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <div className="space-y-6 mb-10">
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                placeholder="– – – – – – – –"
                                maxLength={8}
                                className="w-full rounded-2xl py-6 text-center text-4xl font-black tracking-[0.3em] outline-none transition-all"
                                style={{ backgroundColor: '#ffffff', border: '2px solid rgba(0,0,0,0.1)', color: '#1a1a1a' }}
                                onFocus={e => e.target.style.borderColor = '#93C5FD'}
                                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleVerifyOtp}
                                disabled={verifying || otp.length < 8}
                                className="w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 disabled:opacity-50"
                                style={{ backgroundColor: 'transparent', border: '1px solid rgba(0,0,0,0.2)', color: '#1a1a1a' }}
                                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#1a1a1a'; } }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'; }}
                            >
                                {verifying ? 'Verifying...' : 'Unlock Protocol'}
                            </button>
                            <button
                                onClick={() => setShowOtpInput(false)}
                                className="w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500"
                                style={{ backgroundColor: 'transparent', border: '1px solid rgba(0,0,0,0.2)', color: '#1a1a1a' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1a1a'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'}
                            >
                                Back
                            </button>
                            <button
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    setShowOtpInput(false);
                                    setAuthMode('signin');
                                    setAuthData({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '', countryCode: '+1' });
                                }}
                                className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-500"
                                style={{ backgroundColor: 'transparent', color: '#EF444499' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                onMouseLeave={e => e.currentTarget.style.color = '#EF444499'}
                            >
                                Logout / Use Different Account
                            </button>
                        </div>
                    </div>
                </div>
            );
        }



        return (
            <div className="assessment-step max-w-2xl mx-auto py-12 md:py-20 px-6" style={{ backgroundColor: '#ffffff' }}>
                <div className="text-center mb-12">
                    <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-8">
                        Secure Clinical Portal
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4" style={{ color: '#1a1a1a' }}>
                        {authMode === 'signup' ? 'Create' : 'Access'}<br />
                        <span style={{ color: '#1a1a1a', padding: '2px 10px', display: 'inline-block' }}>Your Account.</span>
                    </h2>
                    <p className="font-medium uppercase tracking-[0.2em] text-[10px]" style={{ color: 'rgba(0,0,0,0.5)' }}>
                        Join the telemedicine platform to proceed with your protocol.
                    </p>
                </div>

                <div className="rounded-[40px] p-6 md:p-12" style={{ backgroundColor: '#f9fafb', border: '1px solid rgba(0,0,0,0.1)' }}>
                    <div className="space-y-6">
                        {authMode === 'signup' && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: 'rgba(0,0,0,0.4)' }}>First Name</label>
                                        <input
                                            type="text"
                                            placeholder="John"
                                            value={authData.firstName}
                                            onChange={(e) => setAuthData({ ...authData, firstName: e.target.value })}
                                            className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all"
                                            style={{ backgroundColor: '#ffffff', border: '1.5px solid rgba(0,0,0,0.1)', color: '#1a1a1a' }}
                                            onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: 'rgba(0,0,0,0.4)' }}>Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Doe"
                                            value={authData.lastName}
                                            onChange={(e) => setAuthData({ ...authData, lastName: e.target.value })}
                                            className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all"
                                            style={{ backgroundColor: '#ffffff', border: '1.5px solid rgba(0,0,0,0.1)', color: '#1a1a1a' }}
                                            onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: 'rgba(0,0,0,0.4)' }}>Phone Number *</label>
                                    <div className="flex flex-col md:flex-row gap-3 relative">
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                                className="w-full md:w-auto h-full bg-white border border-black/10 rounded-2xl py-5 px-4 text-black font-bold text-sm flex items-center gap-2 whitespace-nowrap md:min-w-[100px] justify-center transition-all hover:bg-black/5"
                                            >
                                                <span>{countryCodes.find(c => c.code === authData.countryCode)?.flag}</span>
                                                <span>{authData.countryCode}</span>
                                            </button>
                                            {showCountryDropdown && (
                                                <div className="absolute z-50 left-0 top-full mt-2 bg-white border border-black/10 rounded-2xl shadow-2xl min-w-[160px] overflow-hidden">
                                                    {countryCodes.map((c, idx) => (
                                                        <div
                                                            key={`${c.country}-${idx}`}
                                                            onClick={() => {
                                                                setAuthData({ ...authData, countryCode: c.code });
                                                                setShowCountryDropdown(false);
                                                            }}
                                                            className="px-6 py-4 hover:bg-black hover:text-white cursor-pointer text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-3 text-black"
                                                        >
                                                            <span>{c.flag}</span>
                                                            <span>{c.country} ({c.code})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {showCountryDropdown && (
                                                <div className="fixed inset-0 z-40" onClick={() => setShowCountryDropdown(false)} />
                                            )}
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="(555) 000-0000"
                                            value={authData.phoneNumber}
                                            onChange={(e) => {
                                                const x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
                                                const formatted = !x[2] ? x[1] : `(${x[1]}) ${x[2]}${x[3] ? `-${x[3]}` : ''}`;
                                                setAuthData({ ...authData, phoneNumber: formatted });
                                            }}
                                            className="w-full md:flex-1 rounded-2xl py-5 px-6 md:px-8 font-bold outline-none transition-all"
                                            style={{ backgroundColor: '#ffffff', border: '1.5px solid rgba(0,0,0,0.1)', color: '#1a1a1a' }}
                                            onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* DOB + Sex — collected at sign-up so biometrics are always available */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: 'rgba(0,0,0,0.4)' }}>Date of Birth</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <input
                                            type="text" maxLength="2" placeholder="MM"
                                            value={authData.dobMonth}
                                            onChange={e => setAuthData(prev => ({ ...prev, dobMonth: e.target.value.replace(/\D/g, '') }))}
                                            className="w-full rounded-2xl py-5 text-center font-bold outline-none transition-all"
                                            style={{ backgroundColor: '#ffffff', border: '1.5px solid rgba(0,0,0,0.1)', color: '#1a1a1a' }}
                                            onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                                        />
                                        <input
                                            type="text" maxLength="2" placeholder="DD"
                                            value={authData.dobDay}
                                            onChange={e => setAuthData(prev => ({ ...prev, dobDay: e.target.value.replace(/\D/g, '') }))}
                                            className="w-full rounded-2xl py-5 text-center font-bold outline-none transition-all"
                                            style={{ backgroundColor: '#ffffff', border: '1.5px solid rgba(0,0,0,0.1)', color: '#1a1a1a' }}
                                            onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                                        />
                                        <input
                                            type="text" maxLength="4" placeholder="YYYY"
                                            value={authData.dobYear}
                                            onChange={e => setAuthData(prev => ({ ...prev, dobYear: e.target.value.replace(/\D/g, '') }))}
                                            className="w-full rounded-2xl py-5 text-center font-bold outline-none transition-all"
                                            style={{ backgroundColor: '#ffffff', border: '1.5px solid rgba(0,0,0,0.1)', color: '#1a1a1a' }}
                                            onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: 'rgba(0,0,0,0.4)' }}>Biological Sex</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['Male', 'Female'].map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => setAuthData(prev => ({ ...prev, sex: v.toLowerCase() }))}
                                                className="py-4 px-6 rounded-2xl text-[10px] font-bold tracking-widest transition-all border"
                                                style={{
                                                    backgroundColor: authData.sex === v.toLowerCase() ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
                                                    borderColor: authData.sex === v.toLowerCase() ? '#1a1a1a' : 'rgba(0,0,0,0.08)',
                                                    color: authData.sex === v.toLowerCase() ? '#1a1a1a' : 'rgba(0,0,0,0.4)',
                                                    boxShadow: authData.sex === v.toLowerCase() ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                                                }}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: 'rgba(0,0,0,0.4)' }}>Email Address</label>
                            <input
                                type="email"
                                placeholder="name@email.com"
                                value={authData.email}
                                onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                                className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all"
                                style={{ backgroundColor: '#ffffff', border: '1.5px solid rgba(0,0,0,0.1)', color: '#1a1a1a' }}
                                onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest mb-3 ml-1" style={{ color: 'rgba(0,0,0,0.4)' }}>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={authData.password}
                                onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                                className="w-full rounded-2xl py-5 px-8 font-bold outline-none transition-all"
                                style={{ backgroundColor: '#ffffff', border: '1.5px solid rgba(0,0,0,0.1)', color: '#1a1a1a' }}
                                onFocus={e => e.target.style.borderColor = '#1a1a1a'}
                                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                            />
                            {authMode === 'signin' && (
                                <div className="mt-2 text-right">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/forgot-password')}
                                        className="text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-all"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                        </div>

                        {authMode === 'signup' && (
                            <div className="pt-4 space-y-4">
                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <div className="relative flex items-center justify-center shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                            className="peer appearance-none w-5 h-5 border-2 rounded-md transition-all"
                                            style={{ borderColor: 'rgba(0,0,0,0.2)', backgroundColor: 'transparent' }}
                                            onFocus={e => { e.target.style.borderColor = '#1a1a1a'; }}
                                        />
                                        <div className="absolute inset-0 peer-checked:bg-[#000000] rounded-md transition-all pointer-events-none" />
                                        <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span className="text-[10px] font-medium leading-relaxed uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.4)' }}>
                                        I accept all <a href="/terms-conditions" target="_blank" className="font-black underline hover:opacity-70 transition-opacity" style={{ color: '#1a1a1a' }}>Terms and Conditions</a> of the telemedicine platform.
                                    </span>
                                </label>

                                <label className="flex items-center gap-4 cursor-pointer group">
                                    <div className="relative flex items-center justify-center shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={acceptedRisks}
                                            onChange={(e) => setAcceptedRisks(e.target.checked)}
                                            className="peer appearance-none w-5 h-5 border-2 rounded-md transition-all"
                                            style={{ borderColor: 'rgba(0,0,0,0.2)', backgroundColor: 'transparent' }}
                                        />
                                        <div className="absolute inset-0 peer-checked:bg-[#000000] rounded-md transition-all pointer-events-none" />
                                        <svg className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <span className="text-[10px] font-medium leading-relaxed uppercase tracking-wider" style={{ color: 'rgba(0,0,0,0.4)' }}>
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
                                onMouseEnter={e => { if (!e.currentTarget.disabled) { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; } }}
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
                                style={{ backgroundColor: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.6)' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1a1a'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'}
                            >
                                {authMode === 'signup' ? 'Already have an account? Sign In' : 'Need an account? Create one'}
                            </button>
                        </div>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: 'rgba(0,0,0,0.3)' }}>OR</span>
                            <div className="h-px flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}></div>
                        </div>

                        {/* Social Logins */}
                        <div className="flex flex-col gap-4">
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
                                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                                style={{ backgroundColor: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: '#1a1a1a' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1a1a'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </button>
                        </div>

                    </div>
                </div>

                <div className="mt-12 text-center">
                    <button onClick={() => setStep(0)} className="font-black uppercase tracking-[0.3em] hover:opacity-70 transition-opacity" style={{ color: '#1a1a1a', fontSize: '20px' }}>
                        ← Back to goals
                    </button>
                </div>
            </div>
        );
    };


    const renderEligibilityStep = () => {
        return (
            <div className="assessment-step max-w-2xl mx-auto py-12 md:py-20 px-6">
                <div className="text-center mb-10">
                    <div className="inline-block py-2 px-6 bg-black/5 border border-black/10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-black mb-6">
                        {categoryId === 'sexual-health' ? 'Step 2: Eligibility' : 'Clinical Screening'}
                    </div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-3 leading-tight">
                        Let's verify your <span className="text-black/60">eligibility.</span>
                    </h2>
                    <p className="text-gray-400 font-medium uppercase tracking-[0.2em] text-[9px]">
                        We need a few details to ensure this protocol is safe and available in your state.
                    </p>
                </div>

                <div className="bg-gray-50 border border-black/5 rounded-[40px] p-6 md:p-12 backdrop-blur-xl">
                    <div className="space-y-12">
                        {/* Sex Selection - Only show for non-sexual-health categories */}
                        {categoryId !== 'sexual-health' && categoryId !== 'hair-restoration' && categoryId !== 'testosterone' && (
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-4">Biological Sex (Birth)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Male', 'Female'].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setEligibilityData({ ...eligibilityData, sex: v.toLowerCase() })}
                                            className={`py-4 px-6 rounded-2xl text-[10px] font-bold tracking-widest transition-all ${eligibilityData.sex === v.toLowerCase()
                                                ? 'border-black text-black bg-white shadow-md'
                                                : 'bg-black/5 text-gray-400 border-black/5 hover:border-black/20'
                                                } border`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Date of Birth */}
                        <div className="mb-0">
                            <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 ml-4">Date of Birth</label>
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <input
                                        type="text"
                                        maxLength="2"
                                        placeholder="MM"
                                        className={`w-full bg-black/5 border ${triedToContinue && !eligibilityData.dobMonth ? 'border-red-500/50' : 'border-black/5'} rounded-2xl py-5 text-center text-black focus:outline-none focus:border-accent-black transition-all font-bold`}
                                        value={eligibilityData.dobMonth}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setEligibilityData({ ...eligibilityData, dobMonth: val });
                                        }}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        maxLength="2"
                                        placeholder="DD"
                                        className={`w-full bg-black/5 border ${triedToContinue && !eligibilityData.dobDay ? 'border-red-500/50' : 'border-black/5'} rounded-2xl py-5 text-center text-black focus:outline-none focus:border-accent-black transition-all font-bold`}
                                        value={eligibilityData.dobDay}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setEligibilityData({ ...eligibilityData, dobDay: val });
                                        }}
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        maxLength="4"
                                        placeholder="YYYY"
                                        className={`w-full bg-black/5 border ${triedToContinue && !eligibilityData.dobYear ? 'border-red-500/50' : 'border-black/5'} rounded-2xl py-5 text-center text-black focus:outline-none focus:border-accent-black transition-all font-bold`}
                                        value={eligibilityData.dobYear}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setEligibilityData({ ...eligibilityData, dobYear: val });
                                        }}
                                    />
                                </div>
                            </div>
                            {triedToContinue && (!eligibilityData.dobMonth || !eligibilityData.dobDay || !eligibilityData.dobYear) && (
                                <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest animate-pulse">Full date of birth is required</p>
                            )}
                        </div>

                        {/* State & Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 ml-4">Residing State</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search state..."
                                        className={`w-full bg-black/5 border ${triedToContinue && !eligibilityData.state ? 'border-red-500/50' : 'border-black/5'} rounded-2xl py-5 px-8 text-[#1a1a1a] focus:outline-none focus:border-black transition-all font-bold pr-12`}
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
                            <div className="relative">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">Phone Number *</label>
                                <div className="relative flex gap-2">
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowEligibilityCountryDropdown(!showEligibilityCountryDropdown)}
                                            className="h-full bg-black/5 border border-black/5 rounded-2xl py-5 px-4 text-black font-bold text-sm flex items-center gap-2 whitespace-nowrap min-w-[100px] justify-center"
                                        >
                                            <span>{countryCodes.find(c => c.code === eligibilityData.countryCode)?.flag}</span>
                                            <span>{eligibilityData.countryCode}</span>
                                        </button>
                                        {showEligibilityCountryDropdown && (
                                            <div className="absolute z-50 left-0 top-full mt-2 bg-white border border-black/10 rounded-2xl shadow-2xl min-w-[160px] overflow-hidden">
                                                {countryCodes.map((c, idx) => (
                                                    <div
                                                        key={`${c.country}-${idx}`}
                                                        onClick={() => {
                                                            setEligibilityData({ ...eligibilityData, countryCode: c.code });
                                                            setShowEligibilityCountryDropdown(false);
                                                        }}
                                                        className="px-6 py-4 hover:bg-black hover:text-white cursor-pointer text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-3"
                                                    >
                                                        <span>{c.flag}</span>
                                                        <span>{c.country} ({c.code})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {showEligibilityCountryDropdown && (
                                            <div className="fixed inset-0 z-40" onClick={() => setShowEligibilityCountryDropdown(false)} />
                                        )}
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="(XXX) XXX-XXXX"
                                        className={`flex-1 bg-black/5 border ${triedToContinue && !eligibilityData.phone ? 'border-red-500/50' : 'border-black/5'} rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold`}
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
                                </div>
                                {triedToContinue && !eligibilityData.phone && (
                                    <p className="text-red-500 text-[9px] mt-2 ml-4 font-black uppercase tracking-widest animate-pulse">Phone number is required</p>
                                )}
                            </div>
                        </div>


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
                                onClick={async () => {
                                    // Validate all required fields
                                    const requiredFields = ['state', 'phone', 'consent', 'dobMonth', 'dobDay', 'dobYear'];
                                    const missingFields = requiredFields.filter(field => !eligibilityData[field]);

                                    if (missingFields.length > 0) {
                                        setTriedToContinue(true);
                                        return;
                                    }

                                    // Format DOB
                                    const formattedDob = `${eligibilityData.dobYear}-${eligibilityData.dobMonth.padStart(2, '0')}-${eligibilityData.dobDay.padStart(2, '0')}`;
                                    setEligibilityData(prev => ({ ...prev, dob: formattedDob }));

                                    // Proactive check: Ensure phone number isn't already used by another account
                                    const rawPhone = eligibilityData.phone.replace(/\D/g, '');
                                    const phoneForQuery = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;
                                    if (phoneForQuery) {
                                        try {
                                            const { data: existingPhoneUser } = await supabase
                                                .from('profiles')
                                                .select('id')
                                                .ilike('phone_number', `%${phoneForQuery}%`)
                                                .maybeSingle();

                                            if (existingPhoneUser && existingPhoneUser.id !== user?.id) {
                                                toast.error('This phone number is already associated with an account. Please sign in or use a different number.');
                                                setTriedToContinue(true);
                                                return;
                                            }
                                        } catch (err) {
                                            console.warn('Silent phone check warning:', err);
                                        }
                                    }

                                    // Longevity goes directly to medical intake; other categories go to medical intake too
                                    setMedicalStep(0);
                                    setStep(8);
                                }}
                                className={`flex-[2] py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all duration-500 bg-white border border-black/10 text-black hover:bg-black hover:text-white shadow-sm`}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-12 text-center text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
                    clinical screening protocol v2.4 • secure encryption enabled
                </div>
            </div >
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

            // Skip compulsory upload validation for current_meds as per user request
            // (Used to require GLP-1 agonist prescription upload)

            // Step 19 Validation (Past Prescriptions)
            if (question.id === 'past_rx_weightloss') {
                const selected = intakeData[question.id] || [];
                const hasRetatrutide = selected.includes('Retatrutide');
                const hasSema = selected.includes('Semaglutide (Wegovy/Ozempic)');
                const hasTirz = selected.includes('Tirzepatide (Zepbound/Mounjaro)');

                if (hasRetatrutide && !intakeData[`${question.id}_file`]) {
                    setIntakeError('⚠️ A prescription photo is strictly REQUIRED for Retatrutide.');
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
                if (categoryId === 'weight-loss' || categoryId === 'retatrutide') {
                    setStep(25); // Weight-loss or Retatrutide: go to AI review step
                    callAIReview();
                } else {
                    // For other categories (Sexual Health, Hair restoration, etc.): go to AI result step (auto-approve)
                    setStep(25);
                    setAiApproved(true);
                    setAiReviewing(false);
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
            <div className={`assessment-step ${question.id === 'quote3' ? 'max-w-[1400px] 2xl:max-w-[1800px]' : 'max-w-3xl'} mx-auto py-12 md:py-20 px-6`}>
                <div className={`${question.id === 'quote3' ? 'bg-white p-0 overflow-hidden' : 'bg-gray-50 border border-black/5 rounded-[40px] p-6 md:p-16 backdrop-blur-xl space-y-8'}`}>
                    {question.id !== 'quote3' && (
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-black mb-6">Step {7 + medicalStep}: {question.title}</h3>
                    )}
                    {question.id !== 'quote3' && question.question && (
                        <h2 className={`font-black tracking-tighter mb-12 leading-tight ${question.id === 'heart_conditions' ? 'text-lg opacity-80' : 'text-2xl'}`}>
                            {question.question}
                        </h2>
                    )}
                    {question.id !== 'quote3' && question.subtext && (
                        <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed max-w-2xl">
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
                                    intakeData[question.id]?.includes('Retatrutide')) && (
                                        <div className="mt-8 p-8 bg-black/5 rounded-[32px] border border-black/10">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 text-black">Prescription Verification</h4>

                                            {intakeData[`${question.id}_file`] && (Array.isArray(intakeData[`${question.id}_file`]) ? intakeData[`${question.id}_file`].length > 0 : !!intakeData[`${question.id}_file`]) && (
                                                <div className="space-y-2 mb-6">
                                                    {(Array.isArray(intakeData[`${question.id}_file`]) ? intakeData[`${question.id}_file`] : [intakeData[`${question.id}_file`]]).map((url, idx) => (
                                                        <div key={idx} className="p-4 bg-white rounded-2xl border border-black/5 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-accent-black">Photo {idx + 1} ✓</span>
                                                                <a href={url} target="_blank" rel="noreferrer" className="text-[8px] font-bold text-black/40 hover:underline">View</a>
                                                            </div>
                                                            <button onClick={() => {
                                                                const files = Array.isArray(intakeData[`${question.id}_file`]) ? intakeData[`${question.id}_file`] : [intakeData[`${question.id}_file`]];
                                                                const newFiles = files.filter((_, i) => i !== idx);
                                                                setIntakeData({ ...intakeData, [`${question.id}_file`]: newFiles.length > 0 ? newFiles : null });
                                                            }} className="text-[10px] font-bold text-red-500">Remove</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="space-y-6">
                                                <input
                                                    type="file"
                                                    id="step19-upload"
                                                    className="hidden"
                                                    multiple
                                                    onChange={(e) => handleFileSelection(e.target.files[0], 'past_rx')}
                                                />
                                                <button
                                                    onClick={() => document.getElementById('step19-upload').click()}
                                                    className="w-full py-4 border-2 border-dashed border-black/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black/40 hover:border-black transition-all"
                                                >
                                                    {intakeData[`${question.id}_file`]?.length > 0 ? 'Upload Another Prescription Photo' : `Upload Prescription Photo ${intakeData[question.id]?.includes('Retatrutide') ? '(Required)' : ''}`}
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
                                                                    const currentFiles = Array.isArray(intakeData[`${question.id}_file`]) ? intakeData[`${question.id}_file`] : (intakeData[`${question.id}_file`] ? [intakeData[`${question.id}_file`]] : []);
                                                                    setIntakeData({ ...intakeData, [`${question.id}_file`]: [...currentFiles, url] });
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

                                                {!intakeData[question.id]?.includes('Retatrutide') && (
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

                                                {/* Dosage Preference */}
                                                <div className="mt-8 pt-8 border-t border-black/5 space-y-6">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40">Select your dosage preference</h4>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {['Higher dose', 'Lower dose', 'Continue with current dosage'].map(pref => (
                                                            <button
                                                                key={pref}
                                                                onClick={() => setPiiData({ ...piiData, dosagePreference: pref, desiredDose: pref === 'Continue with current dosage' ? '' : piiData.desiredDose })}
                                                                className={`w-full py-4 px-6 rounded-2xl border text-xs font-bold transition-all text-left ${piiData.dosagePreference === pref
                                                                    ? 'border-black bg-black text-white'
                                                                    : 'bg-white border-black/10 text-black hover:border-black/30'
                                                                    }`}
                                                            >
                                                                {pref}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {(piiData.dosagePreference === 'Higher dose' || piiData.dosagePreference === 'Lower dose') && (
                                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                                            <label className="text-[9px] font-black uppercase tracking-widest text-black/40 ml-2">Choose your desired dose</label>
                                                            <div className="relative">
                                                                <select
                                                                    className="w-full py-4 px-6 rounded-2xl bg-white border border-black/10 text-sm font-bold outline-none focus:border-black appearance-none cursor-pointer"
                                                                    value={piiData.desiredDose}
                                                                    onChange={(e) => setPiiData({ ...piiData, desiredDose: e.target.value })}
                                                                >
                                                                    <option value="">Select dose...</option>
                                                                    {['0.25 mg', '0.5 mg', '1 mg', '1.5 mg', '2 mg', '2.4 mg'].map(dose => (
                                                                        <option key={dose} value={dose}>{dose}</option>
                                                                    ))}
                                                                </select>
                                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-black/30">
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
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
                                                                            if (url) {
                                                                                setIntakeData(prev => {
                                                                                    const current = Array.isArray(prev.lab_results_url) ? prev.lab_results_url : (prev.lab_results_url ? [prev.lab_results_url] : []);
                                                                                    if (current.includes(url)) return prev;
                                                                                    return {
                                                                                        ...prev,
                                                                                        lab_results_url: [...current, url]
                                                                                    };
                                                                                });
                                                                                setPendingFile(null);
                                                                            }
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

                                                        {Array.isArray(intakeData.lab_results_url) && intakeData.lab_results_url.filter(Boolean).length > 0 ? (
                                                            <div className="space-y-3">
                                                                {Array.from(new Set(intakeData.lab_results_url.filter(Boolean))).map((url, idx) => (
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
                                                                                onClick={() => setIntakeData(prev => ({
                                                                                    ...prev,
                                                                                    lab_results_url: (prev.lab_results_url || []).filter((_, i) => i !== idx)
                                                                                }))}
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
                                                            <div className="flex flex-col gap-1.5 bg-black/[0.02] p-4 md:p-5 rounded-2xl border border-black/5 focus-within:border-amber-400 transition-all">
                                                                <label className="text-[9px] font-black uppercase tracking-widest text-black/40">First Name</label>
                                                                <input placeholder="Provider's first name" className="w-full bg-transparent border-none text-sm font-bold outline-none placeholder:text-black/40" value={piiData.pcpFirstName}
                                                                    onChange={e => {
                                                                        setPiiData({ ...piiData, pcpFirstName: e.target.value });
                                                                        setPcpNotFound(false);
                                                                        setIntakeData(prev => ({ ...prev, pcp_npi: '', pcp_details: null }));
                                                                    }} />
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 bg-black/[0.02] p-4 md:p-5 rounded-2xl border border-black/5 focus-within:border-amber-400 transition-all">
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
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-3">
                                    {question.options.map(opt => (
                                        <React.Fragment key={opt}>
                                            <button
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

                                            {/* Cancer History Sub-Forms - Integrated directly under choice */}
                                            {question.id === 'cancer_history' && opt === 'Yes, I have or have had cancer' && intakeData.cancer_history === opt && (
                                                <div className="mt-2 p-6 bg-white border border-black/10 rounded-[28px] shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black mb-5 border-b border-black/5 pb-3">Your Cancer History</h4>
                                                    <div className="space-y-3">
                                                        {(intakeData.personal_cancer_list || [{ type: '' }]).map((entry, idx) => (
                                                            <div key={idx} className="flex gap-3 items-center">
                                                                <div className="flex-1 flex flex-col gap-1 bg-black/[0.02] p-4 rounded-2xl border border-black/5 focus-within:border-black transition-all">
                                                                    <label className="text-[8px] font-black uppercase tracking-widest text-black/40">Type of Cancer</label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="e.g., Breast cancer, Lung cancer"
                                                                        className="bg-transparent border-none text-sm font-bold outline-none placeholder:text-black/25"
                                                                        value={entry.type}
                                                                        onChange={(e) => {
                                                                            const updated = [...(intakeData.personal_cancer_list || [{ type: '' }])];
                                                                            updated[idx] = { ...updated[idx], type: e.target.value };
                                                                            setIntakeData({ ...intakeData, personal_cancer_list: updated });
                                                                        }}
                                                                    />
                                                                </div>
                                                                {idx > 0 && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const updated = (intakeData.personal_cancer_list || []).filter((_, i) => i !== idx);
                                                                            setIntakeData({ ...intakeData, personal_cancer_list: updated });
                                                                        }}
                                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 transition-all"
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const updated = [...(intakeData.personal_cancer_list || [{ type: '' }]), { type: '' }];
                                                            setIntakeData({ ...intakeData, personal_cancer_list: updated });
                                                        }}
                                                        className="mt-4 w-full py-3 border-2 border-dashed border-black/15 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black/40 hover:border-black hover:text-black transition-all"
                                                    >
                                                        + Add Cancer Type
                                                    </button>
                                                </div>
                                            )}

                                            {question.id === 'cancer_history' && opt === 'Yes, I have a family member who has had cancer' && intakeData.cancer_history === opt && (
                                                <div className="mt-2 p-6 bg-white border border-black/10 rounded-[28px] shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black mb-5 border-b border-black/5 pb-3">Family Member's Cancer History</h4>
                                                    <div className="space-y-4">
                                                        {(intakeData.family_cancer_list || [{ type: '', relative: '' }]).map((entry, idx) => (
                                                            <div key={idx} className="space-y-2">
                                                                <div className="flex gap-3 items-start">
                                                                    <div className="flex-1 space-y-2">
                                                                        <div className="flex flex-col gap-1 bg-black/[0.02] p-4 rounded-2xl border border-black/5 focus-within:border-black transition-all">
                                                                            <label className="text-[8px] font-black uppercase tracking-widest text-black/40">Type of Cancer</label>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="e.g., Breast cancer, Lung cancer"
                                                                                className="bg-transparent border-none text-sm font-bold outline-none placeholder:text-black/25"
                                                                                value={entry.type}
                                                                                onChange={(e) => {
                                                                                    const updated = [...(intakeData.family_cancer_list || [{ type: '', relative: '' }])];
                                                                                    updated[idx] = { ...updated[idx], type: e.target.value };
                                                                                    setIntakeData({ ...intakeData, family_cancer_list: updated });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="flex flex-col gap-1 bg-black/[0.02] p-4 rounded-2xl border border-black/5 focus-within:border-black transition-all">
                                                                            <label className="text-[8px] font-black uppercase tracking-widest text-black/40">Which Relative</label>
                                                                            <select
                                                                                className="bg-transparent border-none text-sm font-bold outline-none text-black appearance-none cursor-pointer"
                                                                                value={entry.relative}
                                                                                onChange={(e) => {
                                                                                    const updated = [...(intakeData.family_cancer_list || [{ type: '', relative: '' }])];
                                                                                    updated[idx] = { ...updated[idx], relative: e.target.value };
                                                                                    setIntakeData({ ...intakeData, family_cancer_list: updated });
                                                                                }}
                                                                            >
                                                                                <option value="">Select relative</option>
                                                                                {['Mother', 'Father', 'Sister', 'Brother', 'Grandmother (Maternal)', 'Grandfather (Maternal)', 'Grandmother (Paternal)', 'Grandfather (Paternal)', 'Aunt', 'Uncle', 'Other'].map(r => (
                                                                                    <option key={r} value={r}>{r}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    {idx > 0 && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const updated = (intakeData.family_cancer_list || []).filter((_, i) => i !== idx);
                                                                                setIntakeData({ ...intakeData, family_cancer_list: updated });
                                                                            }}
                                                                            className="w-8 h-8 mt-1 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 transition-all"
                                                                        >
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const updated = [...(intakeData.family_cancer_list || [{ type: '', relative: '' }]), { type: '', relative: '' }];
                                                            setIntakeData({ ...intakeData, family_cancer_list: updated });
                                                        }}
                                                        className="mt-4 w-full py-3 border-2 border-dashed border-black/15 rounded-2xl text-[10px] font-black uppercase tracking-widest text-black/40 hover:border-black hover:text-black transition-all"
                                                    >
                                                        + Add Family Cancer History
                                                    </button>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {((question.type === 'multiselect' && Array.isArray(intakeData[question.id]) && intakeData[question.id].some(val => val.toLowerCase().includes('other'))) ||
                                    (question.type === 'choice' && typeof intakeData[question.id] === 'string' && intakeData[question.id].toLowerCase().includes('other'))) && (
                                        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-black/40 mb-3 ml-2">Please specify additional details below:</label>
                                            <textarea
                                                placeholder="Type your medications or details here..."
                                                className="w-full h-32 bg-white border border-black/10 rounded-2xl py-5 px-8 text-sm font-bold outline-none focus:border-black transition-all resize-none shadow-sm placeholder:text-black/20"
                                                value={intakeData[`${question.id}_other`] || ''}
                                                onChange={(e) => setIntakeData({ ...intakeData, [`${question.id}_other`]: e.target.value })}
                                            />
                                        </div>
                                    )}
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
                                    Upload RX / Proof (Optional)
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
                                        if (categoryId === 'weight-loss' || categoryId === 'longevity') {
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
                        {["Driver's License", "State ID", "Passport", "Military ID"].map(type => (
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
                        onClick={() => setStep(25)}
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
        <div className="assessment-step max-w-2xl mx-auto py-12 md:py-20 px-6">
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

            <div className="bg-gray-50 border border-black/5 rounded-[40px] p-6 md:p-12 backdrop-blur-xl space-y-10">
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
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">ZIP Code *</label>
                    <input
                        type="text"
                        className="w-full bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold"
                        value={shippingData.zip}
                        onChange={(e) => setShippingData({ ...shippingData, zip: e.target.value })}
                    />
                </div>
                <div className="relative">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-4">Phone Number *</label>
                    <div className="relative flex flex-col sm:flex-row gap-4">
                        <div className="relative group/dropdown">
                            <button
                                type="button"
                                onClick={() => setShowShippingCountryDropdown(!showShippingCountryDropdown)}
                                className="h-full bg-black/5 border border-black/5 rounded-2xl py-5 px-4 text-black font-bold text-sm flex items-center gap-2 whitespace-nowrap min-w-[100px] justify-center hover:bg-black/10 transition-colors"
                            >
                                <span>{countryCodes.find(c => c.code === shippingData.countryCode)?.flag}</span>
                                <span>{shippingData.countryCode}</span>
                                <svg className={`w-3 h-3 transition-transform ${showShippingCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {showShippingCountryDropdown && (
                                <div className="absolute z-[100] left-0 bottom-full mb-2 bg-white border border-black/10 rounded-2xl shadow-2xl min-w-[240px] max-h-[300px] overflow-hidden flex flex-col">
                                    <div className="p-3 border-b border-black/5 bg-gray-50/50">
                                        <input
                                            type="text"
                                            placeholder="Search country..."
                                            className="w-full bg-white border border-black/10 rounded-xl py-2 px-4 text-[10px] font-bold outline-none focus:border-black transition-all"
                                            value={countrySearch}
                                            onChange={(e) => setCountrySearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="overflow-y-auto no-scrollbar py-2">
                                        {countryCodes
                                            .filter(c => c.country.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch))
                                            .map((c, idx) => (
                                                <div
                                                    key={`${c.country}-${idx}`}
                                                    onClick={() => {
                                                        setShippingData({ ...shippingData, countryCode: c.code });
                                                        setShowShippingCountryDropdown(false);
                                                        setCountrySearch('');
                                                    }}
                                                    className="px-5 py-3 hover:bg-black hover:text-white cursor-pointer text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span>{c.flag}</span>
                                                        <span className="truncate max-w-[120px]">{c.country}</span>
                                                    </div>
                                                    <span className="opacity-40">{c.code}</span>
                                                </div>
                                            ))}
                                        {countryCodes.filter(c => c.country.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)).length === 0 && (
                                            <div className="px-5 py-8 text-center text-gray-400 text-[9px] font-black uppercase tracking-widest">No results</div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {showShippingCountryDropdown && (
                                <div className="fixed inset-0 z-[90]" onClick={() => setShowShippingCountryDropdown(false)} />
                            )}
                        </div>
                        <input
                            type="tel"
                            placeholder="(XXX) XXX-XXXX"
                            className="flex-1 bg-black/5 border border-black/5 rounded-2xl py-5 px-8 text-black focus:outline-none focus:border-accent-black transition-all font-bold"
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
                            if (categoryId === 'skin-care') {
                                setStep(14); // Skip coupon (12) and billing (13) for skincare
                            } else {
                                setStep(12); // Normal flow
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

    const renderCouponStep = () => {
        if (categoryId === 'skin-care') {
            setStep(14);
            return null;
        }
        return (
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
    };

    const renderBillingStep = () => {
        if (categoryId === 'skin-care') {
            setStep(14);
            return null;
        }
        return (
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
                    {categoryId !== 'skin-care' && (
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
                                            ${baseFee.toFixed(2)}
                                        </span>
                                        ${(() => {
                                            const base = baseFee;
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
                                ) : `$${baseFee.toFixed(2)}`}
                            </span>
                        </div>
                    )}

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
                        onClick={() => setStep(categoryId === 'skin-care' ? 11 : 12)}
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
    };

    const renderPaymentStep = () => {
        const eligibilityCents = baseFeeCents;
        const labCents = (labFulfillment === 'order' ? 2999 : 0);
        const disc = paymentData.appliedDiscount;
        let finalEligibilityCents = eligibilityCents;
        if (disc) {
            if (disc.discountType === 'percentage') {
                finalEligibilityCents = Math.round(eligibilityCents * (1 - disc.discountValue / 100));
            } else {
                finalEligibilityCents = Math.max(0, eligibilityCents - (disc.discountValue * 100));
            }
        }
        const finalAmountInCents = finalEligibilityCents + labCents;

        const dobString = (authData.dobYear && authData.dobMonth && authData.dobDay
            ? `${authData.dobYear}-${authData.dobMonth.padStart(2, '0')}-${authData.dobDay.padStart(2, '0')}`
            : (eligibilityData.dob || user?.user_metadata?.date_of_birth || (eligibilityData.dobYear && eligibilityData.dobMonth && eligibilityData.dobDay ? `${eligibilityData.dobYear}-${eligibilityData.dobMonth.padStart(2, '0')}-${eligibilityData.dobDay.padStart(2, '0')}` : null)));

        return (
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
                    <p className="mt-4 text-black font-black uppercase tracking-[0.1em] text-[11px] bg-black/5 py-3 px-6 rounded-full inline-block">
                        Once approved you will be charged your package type
                    </p>
                </div>

                <div className="bg-gray-50 border border-black/5 rounded-[40px] p-8 md:p-12 backdrop-blur-xl">
                    <div className="space-y-6">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mb-8">Secure 256-bit SSL encrypted payment</label>

                        {(finalAmountInCents === 0 && categoryId !== 'skin-care') ? (
                            <button
                                onClick={() => handleSubmitAssessment()}
                                className="w-full py-6 bg-white border border-black/10 text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all shadow-sm"
                            >
                                Complete Activation →
                            </button>
                        ) : (
                            <Elements stripe={stripePromise} options={{
                                mode: finalAmountInCents > 0 ? 'payment' : 'setup',
                                currency: 'usd',
                                ...(finalAmountInCents > 0 ? {
                                    amount: finalAmountInCents,
                                    setup_future_usage: 'off_session'
                                } : {})
                            }}>
                                <CheckoutForm
                                    onComplete={() => handleSubmitAssessment()}
                                    amount={finalAmountInCents}
                                    couponCode={paymentData.coupon}
                                    categoryId={categoryId}
                                    tempUserId={tempUserId}
                                    email={authData.email || shippingData.email}
                                    dob={dobString}
                                />
                            </Elements>
                        )}
                    </div>

                    <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-[#1a1a1a] px-8 mt-10">
                        By clicking "Process Submission", you agree to our clinical terms of service.
                    </p>

                    <div className="pt-8 mt-8 text-center border-t border-black/5">
                        <button
                            onClick={() => setStep(categoryId === 'skin-care' ? 11 : 13)}
                            className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1a1a1a] transition-colors"
                        >
                            ← Back to {categoryId === 'skin-care' ? 'Shipping' : 'Billing'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };



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
        <div className="min-h-screen bg-white flex items-center justify-center px-6 py-20">
            <div className="max-w-2xl w-full mx-auto text-center">

                {/* Animated check icon */}
                <div
                    className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10"
                    style={{ backgroundColor: '#FFDE5920', border: '2px solid #FFDE5960' }}
                >
                    <svg
                        width="52" height="52" viewBox="0 0 24 24"
                        fill="none" stroke="#1a1a1a" strokeWidth="3"
                        strokeLinecap="round" strokeLinejoin="round"
                        className="animate-in zoom-in duration-700"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>

                {/* Category pill */}
                <div className="inline-block py-2 px-6 bg-black rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-8">
                    {(categoryId || 'assessment').replace(/-/g, ' ')}
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95] mb-6" style={{ color: '#1a1a1a' }}>
                    Assessment<br />
                    <span style={{ backgroundColor: '#FFDE59', color: '#1a1a1a', padding: '2px 16px', display: 'inline-block', marginTop: '8px' }}>
                        Complete.
                    </span>
                </h1>

                <p className="text-black/40 font-medium uppercase tracking-[0.2em] text-[10px] mb-16 max-w-md mx-auto leading-relaxed">
                    Your medical profile has been securely submitted to our clinical board. A licensed provider will review your case shortly.
                </p>

                {/* What happens next */}
                <div className="rounded-[40px] p-8 md:p-12 mb-12 text-left" style={{ backgroundColor: '#f9f9f7', border: '1px solid #1a1a1a10' }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40 mb-8 text-center">What Happens Next</p>
                    <div className="space-y-6">
                        {[
                            {
                                num: '01',
                                title: 'Clinical Review',
                                desc: 'A licensed provider reviews your assessment within 24 hours.'
                            },
                            {
                                num: '02',
                                title: 'Provider Assigned',
                                desc: 'You will be matched with a provider specializing in your treatment category.'
                            },
                            {
                                num: '03',
                                title: 'Treatment Plan',
                                desc: 'Your personalized plan and next steps will appear in your dashboard.'
                            }
                        ].map(item => (
                            <div key={item.num} className="flex gap-6 items-start p-5 bg-white rounded-2xl" style={{ border: '1px solid #1a1a1a08' }}>
                                <span className="text-2xl font-black text-black/20 flex-shrink-0 leading-none">{item.num}</span>
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-black mb-1">{item.title}</p>
                                    <p className="text-[10px] font-medium uppercase tracking-widest text-black/40 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full md:w-auto px-10 py-6 bg-black/5 border border-black/10 text-[#1a1a1a] rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all hover:border-black/30"
                    >
                        Return Home
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full md:w-auto px-16 py-6 bg-black rounded-full font-black text-xs uppercase tracking-[0.4em] transition-all duration-700 transform hover:scale-105 flex items-center justify-center gap-4"
                        style={{ color: '#ffffff' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFDE59'; e.currentTarget.style.color = '#1a1a1a'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#000000'; e.currentTarget.style.color = '#ffffff'; }}
                    >
                        Go to My Dashboard
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                </div>

            </div>
        </div>
    );


    return (
        <div
            className="min-h-screen text-[#1a1a1a] font-sans selection:bg-accent-black selection:text-black"
            style={{ backgroundColor: '#ffffff' }}
        >
            {/* Minimal Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-8 h-[84px] flex items-center">
                <div className="max-w-[1400px] 2xl:max-w-[1800px] mx-auto w-full flex justify-between items-center h-full">
                    <Link to="/" className="relative flex items-center mt-[10px]">
                        <img
                            src={logo}
                            alt="uGlowMD Logo"
                            className="h-[100px] md:h-[180px] w-auto transition-transform hover:scale-105 object-contain absolute left-0 "
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
                    ((step > 0 && step < 15) || (step === 0 && !(showQuote || showBMI || showQuote2 || showSexualHealthQuote || showSexualHealthGoals || showSexualHealthQuote2 || showHairQuote || showHairGoals || showHairQuote2 || showLongevityQuote || showLongevityGoals || showTestosteroneQuote || showTestosteroneGoals || showTestosteroneQuote2))) && (
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
                    {categoryId === 'weight-loss' && step === 0 && (
                        showQuote ? renderQuoteStep() :
                            showBMI ? renderBMICalculatorStep() :
                                showQuote2 ? renderQuote2Step() :
                                    renderQuoteStep() // Safety fallback — resets to start
                    )}
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
                    {categoryId === 'longevity' && step === 0 && (
                        showLongevityQuote ? renderLongevityQuoteStep() :
                            showLongevityGoals ? renderLongevityGoalsStep() :
                                renderLongevityQuoteStep() // Safety Fallback
                    )}
                    {categoryId === 'testosterone' && step === 0 && (
                        showTestosteroneQuote ? renderTestosteroneQuoteStep() :
                            showTestosteroneGoals ? renderTestosteroneGoalsStep() :
                                showTestosteroneQuote2 ? renderTestosteroneQuote2Step() :
                                    renderTestosteroneQuoteStep() // Safety Fallback
                    )}

                    {categoryId === 'skin-care' && step === 0 && (
                        renderSkinCareGoalsStep()
                    )}
                    {categoryId === 'weight-loss' && step === 1 && renderStep0()}
                    {categoryId !== 'weight-loss' &&
                        categoryId !== 'sexual-health' &&
                        categoryId !== 'hair-restoration' &&
                        categoryId !== 'longevity' &&
                        categoryId !== 'testosterone' &&
                        categoryId !== 'skin-care' &&
                        (step === 0 || step === 1) && renderStep0()}
                    {step === 2 && renderReviewStep()}
                    {step === 3 && renderAuthStep()}
                    {step === 4 && renderBMICalculatorStep()}
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
