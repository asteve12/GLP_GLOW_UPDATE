import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from './Navbar';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import weightLossImg from '../assets/weight-loss.png';
import hairLossImg from '../assets/hair-loss.png';
import mensHealthImg from '../assets/mens-health.png';
import longevityImg from '../assets/longevity.png';
import prdDetailBg from '../assets/prd_detial_bg_image.png';
import weightLossBanner from '../assets/weight-loss-banner.png';
import semaglutideInjection from '../assets/semaglutide-injection.png';
import tirzepetideInjection from '../assets/tirzepetide_injection.png';
import semaglutideDrops from '../assets/semaglutide_drops.png';
import tirzepatideDrops from '../assets/tirzepatide_drops.png';
import medicationDelivery from '../assets/medication_delivery.png';
import ongoingSupport from '../assets/ongoing_support.png';
import medicalConsult from '../assets/medical_consult.png';
import labAnalysis from '../assets/lab_analysis.png';
import medicalEvalDashboard from '../assets/medical-eval-dashboard.png';
import finasterideTabletBg from '../assets/finastride_tablet_bottle.png';
import threeInOneImg from '../assets/3_in_1img.png';
import finasterideMinoxidilPrd from '../assets/Finasteride_  Minoxidil_prd.png';
import fiveInOneImg from '../assets/5_in-1_hairloss.png';
import sildenafilTadalafilPrdImg from '../assets/sildenafil_tadalafi_prd_img.png';
import sildenafilTadalafilTabletsPrd from '../assets/Sildenafil _Tadalafil_Tablets_prd.png';
import sildenafilYohimbePrd from '../assets/Sildenafil_ Yohimbe_prd.png';
import oxytocinTabletsPrd from '../assets/Oxytocin_Tablets_prd.png';
import oxytocinNasalPrd from '../assets/oxytocin_nasal_prd.png';
import nadInjectionImg from '../assets/NAD+ (Subcutaneous Injection).png';
import nadInjectionPrd from '../assets/NAD+ (Subcutaneous Injection)_prd.png';
import glutathionePrd from '../assets/Glutathione (IM or Subcutaneous Injection)_prd.png';
import nadSprayPrd from '../assets/nad_spray_prd.png';
import Footer from './Footer';

const productsData = {
    'weight-loss': {
        title: 'WEIGHT LOSS',
        tagline: <>Join 100,000+ <span className="font-serif italic-u"><span className="italic">u</span>Glow<sup>MD</sup></span> patients</>,
        description: 'Finally serious about weight loss? So are we. Fat loss made easy with personalized care and GLP-1 medication.',
        valueProps: [
            'Lose pounds of fat every week',
            'No membership or hidden fees! Everything you need is included',
            'Start for just $99, no insurance required + free shipping',
            'HSA/FSA Approved'
        ],
        image: weightLossImg,
        bannerImage: weightLossBanner,
        resultImages: [
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop&crop=faces',
            'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=500&h=500&fit=crop&crop=faces',
            'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=500&fit=crop&crop=faces'
        ],
        items: [
            { name: 'Semaglutide (Subcutaneous Injection)*', type: 'Subcutaneous Injection', price: '$299/mo', featured: true, productImage: semaglutideInjection, slug: 'semaglutide-injection' },
            { name: 'Tirzepatide (Subcutaneous Injection)*', type: 'Subcutaneous Injection', price: '$399/mo', featured: true, productImage: tirzepetideInjection, slug: 'tirzepatide-injection' },
            { name: 'Semaglutide (Fast Absorb Sublingual Drops)*', type: 'Fast Absorb Sublingual Drops', price: '$249/mo', featured: true, productImage: semaglutideDrops, slug: 'semaglutide-drops' },
            { name: 'Tirzepatide (Fast Absorb Sublingual Drops)*', type: 'Fast Absorb Sublingual Drops', price: '$349/mo', featured: true, productImage: tirzepatideDrops, slug: 'tirzepatide-drops' }
        ],
        detailsTabs: {
            'What is it?': 'GLP-1 agonists like Semaglutide and Tirzepatide mimic a hormone that targets areas of the brain that regulate appetite and food intake.',
            'How to take': 'Administered as a once-weekly subcutaneous injection or daily sublingual drops. Detailed instructions will be provided with your prescription.',
            'Side Effects': 'Common side effects include nausea, vomiting, diarrhea, stomach pain, and constipation. These usually subside as your body adjusts.'
        },
        whySection: [
            { title: 'Clinically Proven', text: 'Shown to reduce body weight by up to 15-20% in clinical trials.' },
            { title: 'Metabolic Reset', text: 'Helps regulate blood sugar levels and improve metabolic health.' },
            { title: 'Non-Stimulant', text: 'Works with your body natural hormones, not against them.' },
            { title: 'Ongoing Support', text: 'Regular check-ins with healthcare providers to monitor progress.' }
        ],
        faqs: [
            { q: 'What is the price?', a: 'Start for just $99, no insurance required. Treatments range from $249/mo for sublingual drops to $399/mo for injections. Free shipping included!' },
            { q: 'Is it safe?', a: 'FDA-approved medications prescribed by licensed providers. We offer a Weight Loss Money Back Guarantee.' },
            { q: 'Do I need a prescription?', a: 'Yes, an online consultation is required. HSA/FSA approved.' },
            { q: 'Are there hidden fees?', a: 'No membership or hidden fees! Everything you need is included in the price.' }
        ],
        richDetails: {
            brandName: 'uGlowMD',
            highlights: ["Appetite-suppressing formula", "Works in 24 hours on average*", "Active for up to 7 days", "Starts as low as $299/mo*"],
            benefits: [
                { id: "01", title: "Curb Cravings", desc: "Designed to target appetite receptors in the brain, silencing food noise." },
                { id: "02", title: "Metabolic Reset", desc: "Helps regulate blood sugar levels, preventing energy crashes and fat storage." },
                { id: "03", title: "Sustained Results", desc: "Consistent use leads to 15-20% body weight loss on average in clinical trials." }
            ],
            ingredients: [
                { name: "Semaglutide / Tirzepatide", desc: "Mimics the GLP-1 hormone to regulate appetite and digestion." },
                { name: "Cyanocobalamin", desc: "Vitamin B12 often compounded to support energy levels and reduce nausea." }
            ],
            howItWorks: [
                { id: "01", title: "Obesity is hormonal, not just behavioral.", desc: "Your body has a 'set point' weight that it fights to maintain, making traditional diet and exercise difficult to sustain long-term." },
                { id: "02", title: "GLP-1 targets the root cause.", desc: "By mimicking natural hormones, these medications shift your biology to favor fat burning, satiety, and metabolic balance." }
            ],
            timeline: [
                { time: "Today", step: "Tell us about your health" },
                { time: "24–48 Hours", step: "Get a personalized plan" },
                { time: "4–7 Days", step: "Receive your medication" },
                { time: "Ongoing", step: "365 support" }
            ],
            successStories: [
                {
                    name: "Helen F.",
                    lost: "85lbs",
                    timeline: "85lbs lost in 7 months",
                    quote: "Drastically improved life",
                    subQuote: "Increased deep sleep",
                    beforeImage: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop",
                    afterImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop"
                },
                {
                    name: "Sarah M.",
                    lost: "45lbs",
                    timeline: "45lbs lost in 4 months",
                    quote: "More energy than ever",
                    subQuote: "Confidence restored",
                    beforeImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
                    afterImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop"
                },
                {
                    name: "Michael R.",
                    lost: "60lbs",
                    timeline: "60lbs lost in 6 months",
                    quote: "Saved my life",
                    subQuote: "Blood pressure normalized",
                    beforeImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
                    afterImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
                },
                {
                    name: "David K.",
                    lost: "55lbs",
                    timeline: "55lbs lost in 5 months",
                    quote: "Feeling fantastic",
                    subQuote: "Active with kids again",
                    beforeImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
                    afterImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop"
                }
            ],
            stats: [
                { val: "18", unit: "%", label: "Average weight loss", desc: "Clinically observed in 2024 cohorts" },
                { val: "9/10", unit: "", label: "Success Rate", desc: "Reported 'Most Effective' treatment" },
                { val: "6.5", unit: "\"", label: "Waist Reduction", desc: "Average potential reduction" },
                { val: "93", unit: "%", label: "Maintenance", desc: "Kept weight off after 12 months" }
            ],
            scienceSection: {
                title: "We will fix your broken metabolism.",
                description: "Traditional diets don't work because nearly <span class=\"font-semibold text-gray-900\">70% of weight is genetically determined</span>. With medication, you will work <span class=\"font-semibold text-gray-900\">with your body</span> rather than against it - to reach your goal weight and keep it that way.",
                images: [
                    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=700&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&h=700&fit=crop&crop=center"
                ],
                cta: "Get Started"
            }
        }
    },
    'hair-restoration': {
        title: 'HAIR LOSS',
        tagline: 'Advanced Scalp & Follicle Recovery',
        description: 'Stop hair loss and stimulate new growth with our medical-grade compounded formulas.',
        valueProps: [
            'Clinical-grade DHT blockers',
            'Stimulates dormant follicles',
            'Personalized formula concentrations',
            'Results visible in 3-6 months'
        ],
        image: hairLossImg,
        bannerImage: prdDetailBg,
        resultImages: [
            'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&h=500&fit=crop',
            'https://images.unsplash.com/photo-1622296089863-eb7fc530daa8?w=500&h=500&fit=crop',
            'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500&h=500&fit=crop'
        ],
        items: [
            { name: 'Finasteride (Tablets)', type: 'Tablets', price: '$49/mo', featured: false, bestFor: 'Early Prevention', slug: 'finasteride-tablets', image: finasterideTabletBg },
            { name: 'Finasteride / Minoxidil (Liquid - 2 in 1)*', type: 'Liquid - 2 in 1*', price: '$79/mo', featured: true, bestFor: 'Dual Action', slug: 'finasteride-minoxidil-liquid', image: finasterideMinoxidilPrd },
            { name: 'Finasteride / Minoxidil / Tretinoin (Liquid - 3 in 1)*', type: 'Liquid - 3 in 1*', price: '$99/mo', featured: true, bestFor: 'Non-Invasive Protocol', slug: 'finasteride-minoxidil-tretinoin-liquid', image: threeInOneImg },
            { name: 'Minoxidil / Tretinoin / Betamethasone / Finasteride / Vitamin E Acetate (Liquid - 5 in 1)*', type: 'Liquid - 5 in 1*', price: '$129/mo', featured: true, bestFor: 'Maximum Recovery', slug: 'minoxidil-max-compound-liquid', image: fiveInOneImg }
        ],
        detailsTabs: {
            'What is it?': 'Our hair loss protocols combine FDA-approved DHT blockers with clinically proven growth stimulants, often compounded into a single, easy-to-use formula.',
            'How to take': 'Tablets are taken once daily. Liquids are applied topically to the scalp once or twice daily as directed.',
            'Side Effects': 'Potential side effects include scalp irritation for topicals and, in rare cases, hormonal changes for oral treatments.'
        },
        whySection: [
            { title: 'Multi-Targeted', text: 'Addresses both the hormonal causes and the physiological needs of the hair follicle.' },
            { title: 'Custom Compounding', text: 'Tailored concentrations of Minoxidil, Tretinoin, and Finasteride for maximum efficacy.' },
            { title: 'Doctor Formulated', text: 'Evidence-based protocols designed by clinical pharmacists and doctors.' },
            { title: 'Discrete Care', text: 'Private consultations and shipping in non-descript packaging.' }
        ],
        faqs: [
            { q: 'When will I see results?', a: 'Most patients notice a significant reduction in hair shedding within 3 months and visible regrowth by month 6.' },
            { q: 'Is it permanent?', a: 'Consistent use is required to maintain the regrowth. Stopping treatment will likely lead to a return of hair loss.' },
            { q: 'What is the liquid asterisk?', a: '*Indicates a compounded prescription tailored to your specific scalp health and needs.' }
        ],
        richDetails: {
            brandName: 'uGlowMD',
            highlights: ["Stop Hair Loss", "Promote New Growth", "Clinical Grade Ingredients", "Start for $49/mo"],
            benefits: [
                { id: "01", title: "Block DHT", desc: "Finasteride targets the hormone responsible for male pattern baldness at the root." },
                { id: "02", title: "Reactivate Follicles", desc: "Minoxidil stimulates blood flow to revive dormant hair follicles." },
                { id: "03", title: "Scale Progress", desc: "Tretinoin and Vitamin E improve absorption and maintain scalp vitality." }
            ],
            ingredients: [
                { name: "Finasteride", desc: "A potent DHT-blocker that stops the miniaturization of hair follicles." },
                { name: "Minoxidil", desc: "A vasodilator that increases nutrient delivery to the hair roots." },
                { name: "Tretinoin", desc: "Increases the permeability of the scalp to enhance the absorption of active ingredients." }
            ],
            howItWorks: [
                { id: "01", title: "DHT miniaturizes follicles.", desc: "Dihydrotestosterone shrinks hair follicles over time until they stop producing hair entirely." },
                { id: "02", title: "Our combination reverses the process.", desc: "By blocking DHT and increasing blood flow simultaneously, follicles can return to their active growth phase." }
            ],
            timeline: [
                { time: "Today", step: "Tell us about your hair goals" },
                { time: "24–48 Hours", step: "Doctor review & prescription" },
                { time: "4–7 Days", step: "Direct delivery to your door" },
                { time: "Month 3+", step: "Reduced shedding & visible density" }
            ],
            successStories: [
                {
                    name: "James T.",
                    lost: "Fuller Crown",
                    timeline: "6 months of treatment",
                    quote: "Confidence restored",
                    subQuote: "Visible improvement in density",
                    beforeImage: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop",
                    afterImage: "https://images.unsplash.com/photo-1622296089863-eb7fc530daa8?w=400&h=400&fit=crop"
                }
            ],
            stats: [
                { val: "90", unit: "%", label: "Stabilization", desc: "Men saw stabilization of hair loss" },
                { val: "3-6", unit: "mo", label: "Visible Results", desc: "Time to see density improvement" },
                { val: "2x", unit: "", label: "Effectiveness", desc: "More effective than monotherapy" },
                { val: "FDA", unit: "", label: "Approved Ingredients", desc: "Clinically proven compounds" }
            ],
            scienceSection: {
                title: "The Science of Regrowth.",
                description: "Hair loss is largely genetic, driven by DHT sensitivity. <span class=\"font-semibold text-gray-900\">It's not your fault</span>. Our protocols target the root cause by blocking DHT and stimulating blood flow to <span class=\"font-semibold text-gray-900\">revitalize dormant follicles</span>.",
                images: [
                    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&h=700&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1585747833206-ca954e3dbe72?w=500&h=700&fit=crop&crop=center"
                ],
                cta: "Start Regrowth"
            }
        }
    },
    'sexual-health': {
        title: 'SEXUAL HEALTH',
        tagline: 'Performance & Vitality Boosters',
        description: 'Enhance your performance and intimacy with our discreet, medical-grade treatments.',
        valueProps: ['Rapid onset action', 'Prolonged performance'],
        image: mensHealthImg,
        bannerImage: prdDetailBg,
        resultImages: [
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&h=500&fit=crop',
            'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=500&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop'
        ],
        items: [
            { name: 'Sildenafil / Tadalafil (Fast Absorb Tab 2 in 1)*', type: 'Fast Absorb Tab 2 in 1', price: '$89/mo', featured: true, category: 'ED (Men)', slug: 'sildenafil-tadalafil-troche', productImage: sildenafilTadalafilPrdImg },
            { name: 'Sildenafil / Yohimbe (Fast Absorb Tab 2 in 1)*', type: 'Fast Absorb Tab 2 in 1', price: '$79/mo', featured: true, category: 'ED (Men)', slug: 'sildenafil-yohimbe-troche', productImage: sildenafilYohimbePrd },
            { name: 'Sildenafil / Tadalafil (Tablets)', type: 'Tablets', price: '$69/mo', featured: false, category: 'ED (Men)', slug: 'sildenafil-tadalafil-tablets', productImage: sildenafilTadalafilTabletsPrd },
            { name: 'Oxytocin (Fast Absorb Tab)*', type: 'Fast Absorb Tab', price: '$129/mo', featured: true, category: 'Love Hormone (Women)', slug: 'oxytocin-troche', productImage: oxytocinTabletsPrd },
            { name: 'Oxytocin (Nasal Spray)', type: 'Nasal Spray', price: '$119/mo', featured: false, category: 'Love Hormone (Women)', slug: 'oxytocin-nasal-spray', productImage: oxytocinNasalPrd }
        ],
        stats: [
            { val: "30", unit: "m", label: "Onset Time", desc: "Fast-acting forms work in minutes" },
            { val: "36", unit: "h", label: "Performance", desc: "Duration of support up to 36 hours" },
            { val: "2", unit: "in-1", label: "Synergy", desc: "Combined actives for better results" },
            { val: "100", unit: "%", label: "Discreet", desc: "Privacy prioritized shipping" }
        ],
        scienceSection: {
            title: "Performance Science.",
            description: "Sexual health is vascular health. Our treatments enhance blood flow and neurotransmitter, <span class=\"font-semibold text-gray-900\">signaling to optimize response</span>. Whether you need immediate support or long-term vitality, we have a protocol for you.",
            images: [
                "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&h=700&fit=crop&crop=center",
                "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=700&fit=crop&crop=center"
            ],
            cta: "Restore Vitality"
        },
        detailsTabs: {
            'What is it?': 'PDE5 inhibitors like Sildenafil and Tadalafil increase blood flow to improve erectile function. Oxytocin enhances intimacy and connection.',
            'How to take': 'Taken orally 30-60 minutes before sexual activity, or as nasal spray for immediate effect.',
            'Side Effects': 'Headache, flushing, upset stomach, or nasal congestion.'
        },
        whySection: [
            { title: 'Fast Acting', text: 'Works when you need it most.' },
            { title: 'Long Lasting', text: 'Options available for up to 36 hours of support.' },
            { title: 'Discreet', text: 'Private online consultation and shipping.' },
            { title: 'Safe & Effective', text: 'Proven treatments prescribed by doctors.' }
        ],
        faqs: [
            { q: 'Which is better?', a: 'It depends on your lifestyle. Sildenafil is for planned use, Tadalafil for spontaneous.' },
            { q: 'Do I need a prescription?', a: 'Yes, all ED medications require a prescription.' }
        ]
    },
    'longevity': {
        title: 'LONGEVITY',
        tagline: 'Cellular Repair & Anti-Aging',
        description: 'Invest in your future self. Protocols for cellular repair and metabolic optimization.',
        valueProps: ['Boosts cellular energy', 'Slows biological aging'],
        image: longevityImg,
        bannerImage: prdDetailBg,
        resultImages: [
            'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500&h=500&fit=crop',
            'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=500&h=500&fit=crop',
            'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&h=500&fit=crop'
        ],
        items: [
            { name: 'NAD+ (Nasal Spray)*', type: 'Nasal Spray', price: '$99/mo', featured: true, slug: 'nad-nasal-spray', productImage: nadSprayPrd },
            { name: 'NAD+ (Subcutaneous Injection)*', type: 'Subcutaneous Injection', price: '$199/mo', featured: true, slug: 'nad-injection', productImage: nadInjectionPrd },
            { name: 'Glutathione (IM or Subcutaneous Injection)', type: 'IM or Subcutaneous Injection', price: '$149/mo', featured: false, slug: 'glutathione-injection', productImage: glutathionePrd }
        ],
        detailsTabs: {
            'What is it?': 'NAD+ and Glutathione supplements to support cellular health and detoxification. Retatruide is the next-generation weight loss medication, successor to Tirzepatide.',
            'How to take': 'Subcutaneous injections or nasal spray for maximum absorption, typically 1-3 times per week.',
            'Side Effects': 'Injection site reactions, mild fatigue initially.'
        },
        whySection: [
            { title: 'Cellular Energy', text: 'Replenish NAD+ levels that decline with age.' },
            { title: 'Master Antioxidant', text: 'Glutathione detoxifies and protects cells.' },
            { title: 'Cognitive Function', text: 'Support brain health and mental clarity.' },
            { title: 'Healthy Aging', text: 'Optimize your biological age.' }
        ],
        faqs: [
            { q: 'How often do I take it?', a: 'Protocols vary, typically 1-3 times per week based on your needs.' },
            { q: 'Is it safe?', a: 'Yes, these are naturally occurring compounds in the body.' },
            { q: 'What is Retatruide?', a: 'The successor to Tirzepatide, launching late 2026. Join our waitlist for early access.' }
        ]
    }
};

const ProductPage = () => {
    const { categoryId } = useParams();
    const data = productsData[categoryId];
    const [activeTab, setActiveTab] = useState('What is it?');
    const [openFaq, setOpenFaq] = useState(null);
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);

    const isWeightLoss = categoryId === 'weight-loss';
    const isHairLoss = categoryId === 'hair-restoration';

    const group1Title = isWeightLoss ? 'Platinum Injections' : (isHairLoss ? 'Oral Treatment' : 'Primary Solutions');
    const group1Subtitle = isWeightLoss ? 'Maximum Potency • Once-Weekly Protocol' : (isHairLoss ? 'Internal Care • Daily DHT Control' : 'Clinical Grade');
    const group1Filter = (type) => type.toLowerCase().includes('injection') || type.toLowerCase().includes('tablets');

    const group2Title = isWeightLoss ? 'Sublingual Excellence' : (isHairLoss ? 'Topical Solutions' : 'Alternative Delivery');
    const group2Subtitle = isWeightLoss ? 'Daily Consistency • needle-free delivery' : (isHairLoss ? 'Direct Scalp Application • Custom Compounds' : 'Needle-Free');
    const group2Filter = (type) => type.toLowerCase().includes('drops') || type.toLowerCase().includes('liquid') || type.toLowerCase().includes('nasal') || type.toLowerCase().includes('fast absorb');

    const suiteTitleTop = isHairLoss ? 'Follicle' : 'Precision';
    const suiteTitleBottom = isHairLoss ? 'Restoration.' : 'Transformations.';
    const suiteQuote = isWeightLoss
        ? '"Our protocols are designed to target the biological roots of metabolic function, not just the symptoms of weight gain."'
        : (isHairLoss
            ? '"Our treatments focus on reactivating dormant follicles and blocking DHT at the scalp level to restore natural density."'
            : '"Personalized medical care designed for your specific health goals."');

    const goldStandardRow2Img = isWeightLoss ? semaglutideInjection : (isHairLoss ? hairLossImg : data.image);
    const goldStandardRow2Alt = isWeightLoss ? 'Science of Semaglutide' : (isHairLoss ? 'Advanced Hair Science' : 'Clinical Treatment');
    const goldStandardRow3Text = isWeightLoss ? 'we are with you every pound of the way.' : (isHairLoss ? 'we are with you every step toward fuller hair.' : 'we are with you every step of the way.');



    useEffect(() => {
        window.scrollTo(0, 0);

        // Hero Animation
        gsap.fromTo(".product-hero-text",
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 }
        );

        // Scroll animations for sections
        const sections = [
            ".trust-section",
            ".success-stories-header",
            ".gold-standard-card",
            ".calculator-section",
            ".patient-grid",
            ".metabolism-section"
        ];

        sections.forEach(section => {
            gsap.fromTo(section,
                { y: 60, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );
        });

        // Staggered animation for product cards
        gsap.fromTo(".product-card",
            { y: 40, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: ".products-grid",
                    start: "top 80%"
                }
            }
        );

        // Success stories items staggered reveal
        gsap.fromTo(".success-story-card",
            { scale: 0.9, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.7,
                stagger: 0.2,
                scrollTrigger: {
                    trigger: ".success-stories-container",
                    start: "top 85%"
                }
            }
        );

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, [categoryId]);

    // Auto-play slider effect
    useEffect(() => {
        const interval = setInterval(() => {
            setSliderPosition((prev) => (prev + 33.33) % 100);
        }, 3000); // Change image every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const handleSliderMove = (e) => {
        if (!isDragging) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        setSliderPosition(Math.min(Math.max(percentage, 0), 100));
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        setSliderPosition(Math.min(Math.max(percentage, 0), 100));
    };

    if (!data) return <div className="min-h-screen bg-bg-primary text-white flex items-center justify-center">Category not found</div>;

    return (
        <div className="relative min-h-screen font-sans text-white">
            {/* Whole Container Background */}
            <div className="fixed inset-0  z-0">
                <img src={prdDetailBg} alt="Background" className="w-full h-full object-cover opacity-60" />
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10 flex flex-col items-center">
                <Navbar />

                <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto w-[95%] bg-[#F7F8F1] rounded-[40px] md:rounded-[60px] overflow-hidden mt-24 md:mt-32 lg:mt-48 mb-8 md:mb-12 text-bg-primary shadow-2xl relative">

                    {/* HERO SECTION */}
                    <section className="pt-8 md:pt-12 lg:pt-16 pb-8 md:pb-12 px-6 md:px-12 lg:px-16 flex flex-col md:flex-row items-center gap-6 md:gap-8 lg:gap-12 border-b border-black/5">
                        <div className="w-full md:w-1/2 product-hero-text">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black uppercase tracking-tight mb-3 md:mb-4 leading-none">{data.title}</h1>
                            <p className="text-base sm:text-lg md:text-xl font-medium text-gray-700 mb-4 md:mb-6">{data.description}</p>

                            <div className="space-y-2 mb-6 md:mb-8">
                                {data.valueProps.map((prop, i) => (
                                    <div key={i} className="flex items-center gap-2 md:gap-3 text-xs sm:text-sm font-bold text-gray-800">
                                        <span className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-accent-black flex items-center justify-center text-xs text-white flex-shrink-0">✓</span>
                                        {prop}
                                    </div>
                                ))}
                            </div>

                            <Link to={`/qualify?category=${categoryId}`} className="bg-bg-primary text-white w-full md:w-auto px-6 md:px-8 lg:px-10 py-3 md:py-4 text-sm md:text-base uppercase font-bold tracking-widest hover:bg-accent-black hover:text-white transition-all rounded-full shadow-lg inline-block text-center">
                                Get Started
                            </Link>
                        </div>
                        <div className="w-full md:w-1/2 flex justify-center">
                            <div className="relative w-full max-w-[500px] aspect-square rounded-[40px] overflow-hidden shadow-2xl group border border-black/5 bg-white">
                                {/* Manual/Auto Slider Track */}
                                <div className="absolute inset-0 transition-transform duration-700 ease-out flex"
                                    style={{ transform: `translateX(-${(Math.floor(sliderPosition / 33.33) % 3) * 100}%)` }}>
                                    {data.resultImages.map((img, i) => (
                                        <div key={i} className="min-w-full h-full relative">
                                            <img
                                                src={img}
                                                alt={`Patient Result ${i + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation Arrows */}
                                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setSliderPosition(prev => (prev - 33.33 < 0 ? 66.66 : prev - 33.33))}
                                        className="w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
                                    >
                                        <span className="text-xl font-bold text-gray-800">‹</span>
                                    </button>
                                    <button
                                        onClick={() => setSliderPosition(prev => (prev + 33.33) % 100)}
                                        className="w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
                                    >
                                        <span className="text-xl font-bold text-gray-800">›</span>
                                    </button>
                                </div>

                                {/* Dots Indicator */}
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                                    {[0, 1, 2].map((index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSliderPosition(index * 33.33)}
                                            className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${Math.floor(sliderPosition / 33.33) % 3 === index
                                                ? 'bg-accent-black w-8'
                                                : 'bg-white/40 hover:bg-white/80'
                                                }`}
                                        />
                                    ))}
                                </div>

                                {/* Verified Badge */}
                                <div className="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-black/5 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-accent-black animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Verified Progress</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* TRUST SECTION WITH PRODUCTS */}
                    {/* EXPLORE OUR TREATMENTS SECTION - Editorial Layout */}
                    <section className="explore-treatments px-6 sm:px-12 md:px-16 py-24 md:py-40 bg-white relative overflow-hidden">
                        {/* Background Accents */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                            <div className="absolute top-[10%] left-[-5%] w-[40%] h-[40%] bg-accent-black/5 rounded-full blur-[120px]"></div>
                            <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-accent-black/5 rounded-full blur-[120px]"></div>
                        </div>

                        <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto relative z-10">
                            {/* Section Branding */}
                            <div className="text-center mb-24 md:mb-32">
                                <div className="inline-flex items-center gap-4 py-2 px-6 bg-[#1A1A1A] rounded-full mb-8">
                                    <div className="w-2 h-2 rounded-full bg-accent-black animate-pulse"></div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white">The Treatment Suite</div>
                                </div>
                                <h2 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter text-[#1A1A1A] leading-[0.85] italic mb-10 break-words">
                                    {suiteTitleTop} <br />
                                    <span className="text-accent-black">{suiteTitleBottom}</span>
                                </h2>
                                <p className="text-xl md:text-2xl text-[#4A4A4A] leading-relaxed max-w-3xl mx-auto font-medium font-serif italic">
                                    {suiteQuote}
                                </p>
                            </div>

                            {/* TREATMENT GROUPS */}
                            <div className="space-y-32">

                                {/* Group 1: Once-Weekly Injections (The Gold Standard) */}
                                <div className="treatment-group">
                                    <div className="flex items-end justify-between mb-12 border-b-2 border-[#1A1A1A]/5 pb-6">
                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#1A1A1A]">{group1Title}</h3>
                                            <p className="text-[#4A4A4A] font-medium uppercase tracking-widest text-xs mt-2">{group1Subtitle}</p>
                                        </div>
                                        <div className="hidden md:block text-right">
                                            <span className="text-xs font-bold text-[#1A1A1A]/40 uppercase tracking-widest">Clinical Grade</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                                        {data.items.filter(item => group1Filter(item.type)).map((item, i) => (
                                            <div key={i} className="product-card group relative bg-white border border-[#1A1A1A]/5 rounded-[40px] md:rounded-[60px] p-8 md:p-14 transition-all duration-700 hover:border-accent-black/30 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]">
                                                {/* Best For Tag */}
                                                <div className="absolute top-10 right-10 z-20">
                                                    <div className="bg-[#1A1A1A] text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl group-hover:bg-accent-black group-hover:text-white transition-colors">
                                                        Best for: {item.bestFor || (i === 0 ? (isWeightLoss ? "Efficient Loss" : "Standard") : (isWeightLoss ? "Maximum Response" : "Premium"))}
                                                    </div>
                                                </div>

                                                {/* Display Pedestal */}
                                                <div className="mb-12 relative aspect-square bg-[#F9F7F2] rounded-[30px] md:rounded-[50px] overflow-hidden flex items-center justify-center p-12 group-hover:bg-[#f3f1eb] transition-colors duration-500">
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-accent-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                                    <img src={item.image || item.productImage || data.image} alt={item.name} className="w-full h-auto max-h-[80%] object-contain z-10 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3 drop-shadow-3xl" />
                                                    <div className="absolute bottom-[-20%] left-[-20%] w-[140%] h-[40%] bg-black/5 blur-[50px] rounded-[100%]"></div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="text-xs font-bold text-[#4A4A4A] uppercase tracking-[0.3em] mb-4">Compound Protocol</div>
                                                    <h4 className="text-3xl md:text-4xl font-black text-[#1A1A1A] mb-4 uppercase tracking-tight italic leading-none">{item.name}</h4>
                                                    <div className="flex items-center justify-center gap-4 mb-10">
                                                        <div className="h-px w-8 bg-accent-black"></div>
                                                        <div className="text-lg font-medium text-[#1A1A1A]">Starts at <span className="font-black underline decoration-accent-black decoration-4 underline-offset-4">{item.price}</span></div>
                                                        <div className="h-px w-8 bg-accent-black"></div>
                                                    </div>

                                                    <div className="flex flex-col gap-4">
                                                        <Link to="/qualify" className="bg-[#1A1A1A] text-white py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-accent-black hover:text-white transition-all transform active:scale-95 shadow-lg group-hover:shadow-accent-black/20 block">
                                                            Start Evaluation
                                                        </Link>
                                                        <Link to={`/product/${item.slug}`} className="text-[#1A1A1A] py-3 text-xs font-black uppercase tracking-[0.2em] border-b-2 border-transparent hover:border-accent-black transition-all inline-block mx-auto">
                                                            View more →
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Group 2: Sublingual Excellence (Needle-Free) */}
                                <div className="treatment-group">
                                    <div className="flex items-end justify-between mb-12 border-b-2 border-[#1A1A1A]/5 pb-6">
                                        <div>
                                            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-[#1A1A1A]">{group2Title}</h3>
                                            <p className="text-[#4A4A4A] font-medium uppercase tracking-widest text-xs mt-2">{group2Subtitle}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                                        {data.items.filter(item => group2Filter(item.type)).map((item, i) => (
                                            <div key={i} className="product-card group relative bg-white border border-[#1A1A1A]/5 rounded-[40px] md:rounded-[60px] p-8 md:p-14 transition-all duration-700 hover:border-accent-black/30 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]">
                                                {/* Best For Tag */}
                                                <div className="absolute top-10 right-10 z-20">
                                                    <div className="bg-[#1A1A1A] text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl group-hover:bg-accent-black group-hover:text-white transition-colors">
                                                        Best for: {item.bestFor || (i === 0 ? (isWeightLoss ? "Maintenance" : "Standard") : (isWeightLoss ? "Rapid Absorption" : "Premium"))}
                                                    </div>
                                                </div>

                                                {/* Display Pedestal */}
                                                <div className="mb-12 relative aspect-square bg-[#F7F8F1] rounded-[30px] md:rounded-[50px] overflow-hidden flex items-center justify-center p-12 group-hover:bg-[#f0f1e8] transition-colors duration-500">
                                                    <img src={item.image || item.productImage || data.image} alt={item.name} className="w-full h-auto max-h-[80%] object-contain z-10 transition-all duration-700 group-hover:scale-110 drop-shadow-3xl" />
                                                </div>

                                                <div className="text-center">
                                                    <div className="text-xs font-bold text-[#4A4A4A] uppercase tracking-[0.3em] mb-4">Non-Invasive Protocol</div>
                                                    <h4 className="text-3xl md:text-4xl font-black text-[#1A1A1A] mb-4 uppercase tracking-tight italic leading-none">{item.name}</h4>
                                                    <div className="flex items-center justify-center gap-4 mb-10">
                                                        <div className="text-lg font-medium text-[#1A1A1A]">Starts at <span className="font-black underline decoration-accent-black decoration-2 underline-offset-4">{item.price}</span></div>
                                                    </div>

                                                    <div className="flex flex-col gap-4">
                                                        <Link to="/qualify" className="bg-[#1A1A1A] text-white py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-accent-black hover:text-white transition-all transform active:scale-95 shadow-lg block">
                                                            Start Evaluation
                                                        </Link>
                                                        <Link to={`/product/${item.slug}`} className="text-[#1A1A1A] py-3 text-xs font-black uppercase tracking-[0.2em] border-b-2 border-transparent hover:border-accent-black transition-all inline-block mx-auto">
                                                            View more →
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION FOOTER - Trust Bar */}
                        <div className="w-full mt-24 pt-12 border-t border-[#1A1A1A]/5 flex flex-wrap justify-between items-center gap-6">
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]">
                                <div className="w-2 h-2 rounded-full bg-accent-black animate-pulse shadow-[0_0_10px_rgba(19,91,236,0.5)]"></div>
                                Clinical Suite Active
                            </div>
                            <div className="flex gap-4 text-[9px] font-bold text-[#1A1A1A]/30 uppercase tracking-[0.2em]">
                                <span>Precision Sourcing</span>
                                <span>•</span>
                                <span>Pharmacy Licensed</span>
                                <span>•</span>
                                <span>Doctor Led</span>
                            </div>
                        </div>
                    </section>







                </div>

                {/* SUCCESS STORIES CAROUSEL (Full Width) */}
                {
                    data.richDetails?.successStories && (
                        <section className="success-stories-header w-full py-20 overflow-hidden bg-bg-primary/5 backdrop-blur-sm mb-8 md:mb-12">
                            <div className="mb-12 text-center max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-4">
                                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white drop-shadow-md mb-6">The results speak for themselves.</h2>
                                <p className="text-lg md:text-xl text-white/90 font-medium leading-relaxed mb-8">
                                    Sometimes you have to see it to believe it. Our medical-grade treatments are life-changing and improve confidence, well-being, and longevity. Photos, testimonials and results are from {data.richDetails?.brandName === 'uGlowMD' ? <span className="font-serif italic-u"><span className="italic">u</span>Glow<sup>MD</sup></span> : (data.richDetails?.brandName || <span className="font-serif italic-u"><span className="italic">u</span>Glow<sup>MD</sup></span>)} patients.
                                </p>
                                <button className="bg-accent-black text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-xl transform hover:scale-105">
                                    I'm ready, Let's Go
                                </button>
                            </div>
                            <div className="success-stories-container relative w-full overflow-hidden">
                                <div className="flex gap-6 animate-scroll whitespace-nowrap px-6" style={{
                                    width: 'max-content',
                                    animation: 'scroll 30s linear infinite'
                                }}>
                                    {/* Duplicate the list to create seamless infinite scroll */}
                                    {[...data.richDetails.successStories, ...data.richDetails.successStories, ...data.richDetails.successStories].map((story, i) => (
                                        <div key={i} className="success-story-card inline-block w-[350px] md:w-[400px] bg-white rounded-3xl overflow-hidden shadow-2xl flex-shrink-0 whitespace-normal">
                                            {/* Before/After Images */}
                                            <div className="flex h-[200px] md:h-[250px] relative">
                                                <div className="w-1/2 h-full relative border-r border-white/20">
                                                    <img src={story.beforeImage} alt="Before" className="w-full h-full object-cover" />
                                                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded">Before</span>
                                                </div>
                                                <div className="w-1/2 h-full relative">
                                                    <img src={story.afterImage} alt="After" className="w-full h-full object-cover" />
                                                    <span className="absolute bottom-2 right-2 bg-accent-black text-white text-xs font-bold px-2 py-1 rounded">After</span>
                                                </div>
                                            </div>
                                            {/* Content */}
                                            <div className="p-6 text-center bg-[#F7F8F1]">
                                                <div className="inline-block bg-accent-black text-white font-black text-xl px-4 py-1 rounded-full mb-3 transform -rotate-2">
                                                    {story.lost}
                                                </div>
                                                <h3 className="font-bold text-lg text-gray-900 mb-1">{story.name}</h3>
                                                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">{story.timeline}</p>

                                                <div className="border-t border-black/5 pt-4">
                                                    <p className="text-lg font-serif italic text-gray-800 leading-tight mb-1">"{story.quote}"</p>
                                                    <p className="text-sm text-accent-black font-bold">{story.subQuote}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <style>{`
                                @keyframes scroll {
                                    0% { transform: translateX(0); }
                                    100% { transform: translateX(-33.33%); } /* Move by 1 set of items (we have 3 sets) */
                                }
                                .animate-scroll:hover {
                                    animation-play-state: paused;
                                }
                            `}</style>
                            </div>

                            {/* SECTION FOOTER */}
                            <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto mt-16 pt-8 border-t border-white/5 flex justify-center opacity-30">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">Verified Patient Results • Individual Outcomes May Vary</span>
                            </div>
                        </section>
                    )
                }

                {/* SOCIAL PROOF SECTION */}
                {/* SOCIAL PROOF SECTION - "24K Gold" Style */}
                <section className="px-4 py-20 md:py-32 bg-transparent flex justify-center overflow-visible">

                    {/* Main Premium Card */}
                    <div className="gold-standard-card bg-[#ffdc42] border border-black/5 w-full max-w-[1400px] rounded-[50px] md:rounded-[80px] p-8 md:p-16 relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">

                        {/* Crown Icon (Floating Area) */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                            <div className="p-4 bg-[#111] rounded-2xl border border-white/10 shadow-2xl">
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ffdc42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
                                    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                                </svg>
                            </div>
                        </div>

                        {/* Main Title */}
                        <div className="text-center mb-16 md:mb-24 mt-6">
                            <h2 className="text-5xl md:text-7xl lg:text-7xl font-black uppercase tracking-tighter text-[#1A1A1A] condensed-font italic">
                                The <span className="text-black font-black">Gold</span> Standard
                            </h2>
                        </div>

                        {/* Content Row 1: Image Left, Text Right */}
                        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 mb-20 relative z-10">
                            <div className="w-full md:w-1/2">
                                <div className="bg-black/5 p-2 rounded-3xl transform -rotate-2 shadow-xl hover:rotate-0 transition-transform duration-500 border border-black/5">
                                    <div className="bg-white/40 rounded-2xl overflow-hidden aspect-[4/3] relative flex items-center justify-center">
                                        <img src={medicationDelivery} alt="Medical Grade Delivery" className="w-full h-full object-cover opacity-90" />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2">
                                <div className="w-20 h-1.5 bg-[#1A1A1A] mb-6 shadow-sm"></div>
                                <h3 className="text-3xl md:text-5xl font-black uppercase leading-[0.9] mb-6 text-[#1A1A1A] italic">Medical-Grade<br />Excellence</h3>
                                <p className="text-[#1A1A1A]/70 font-medium text-lg leading-relaxed">
                                    While others offer supplements, we deliver real, clinical-grade medications sourced from FDA-regulated pharmacies. This is the exact science used by world-class clinics, delivered straight to your door.
                                </p>
                                <p className="mt-4 text-[#1A1A1A] font-bold">The best results come from the best ingredients - <span className="text-black italic font-black">pure, potent, and proven.</span></p>
                            </div>
                        </div>

                        {/* Content Row 2: Text Left, Image Right */}
                        <div className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16 mb-20 relative z-10">
                            <div className="w-full md:w-1/2">
                                <div className="w-20 h-1.5 bg-[#1A1A1A] mb-6 shadow-sm"></div>
                                <h3 className="text-3xl md:text-5xl font-black uppercase leading-[0.9] mb-6 text-[#1A1A1A] italic">Personalized<br />Dosing Protocols</h3>
                                <p className="text-[#1A1A1A]/70 font-medium text-lg leading-relaxed">
                                    One size does not fit all in biology. Our doctors tailor your dosage based on your specific health profile, ensuring maximum efficacy with minimum side effects.
                                </p>
                                <p className="mt-4 text-[#1A1A1A]/80 font-medium text-lg leading-relaxed">
                                    {data.richDetails?.brandName === 'uGlowMD' ? <span className="font-serif italic-u"><span className="italic">u</span>Glow<sup>MD</sup></span> : (data.richDetails?.brandName || <span className="font-serif italic-u"><span className="italic">u</span>Glow<sup>MD</sup></span>)} provides a <span className="font-bold text-[#1A1A1A] uppercase italic">true clinical advantage</span> — precision medicine that adapts to your body's unique response to therapy.
                                </p>
                            </div>
                            <div className="w-full md:w-1/2">
                                <div className="bg-black/5 p-2 rounded-3xl transform rotate-2 shadow-xl hover:rotate-0 transition-transform duration-500 border border-black/5">
                                    <div className="bg-white/40 rounded-2xl overflow-hidden aspect-[4/3] relative flex items-center justify-center">
                                        <img src={goldStandardRow2Img} alt={goldStandardRow2Alt} className="w-full h-full object-contain p-4 opacity-90" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Row 3: Image Left, Text Right */}
                        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 relative z-10">
                            <div className="w-full md:w-1/2">
                                <div className="bg-black/5 p-2 rounded-3xl transform -rotate-1 shadow-xl hover:rotate-0 transition-transform duration-500 border border-black/5">
                                    <div className="bg-white/40 rounded-2xl overflow-hidden aspect-[4/3] relative flex items-center justify-center">
                                        <img src={ongoingSupport} alt="Ongoing Patient Support" className="w-full h-full object-cover opacity-90" />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2">
                                <div className="w-20 h-1.5 bg-[#1A1A1A] mb-6 shadow-sm"></div>
                                <h3 className="text-3xl md:text-5xl font-black uppercase leading-[0.9] mb-6 text-[#1A1A1A] italic">Ongoing Doctor<br />Access</h3>
                                <p className="text-[#1A1A1A]/70 font-medium text-lg leading-relaxed">
                                    We don't just ship medication and walk away. Our platform includes 365 days of provider support. Have a question? Need an adjustment? Our medical team is one click away.
                                </p>
                                <p className="mt-4 text-[#1A1A1A] font-bold">True partnership leads to true transformation - <span className="text-black italic font-black">{goldStandardRow3Text}</span></p>
                            </div>
                        </div>

                        {/* SECTION FOOTER */}
                        <div className="mt-24 pt-10 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1A1A1A] italic">Clinical Advantage Module • Gold Standard Sourcing</span>
                            <div className="flex gap-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* WEIGHT LOSS CALCULATOR SECTION */}
                {
                    isWeightLoss && (
                        <section className="calculator-section w-full py-24 md:py-32 bg-[#050505] relative overflow-hidden">
                            {/* Cinematic Ambient Glows */}
                            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-green/5 rounded-full blur-[150px] -mr-96 -mt-96 opacity-60"></div>
                            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-accent-green/10 rounded-full blur-[120px] -ml-96 -mb-96"></div>

                            <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-6 md:px-12 lg:px-16 relative z-10">
                                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                                    {/* Left Column - Text Content */}
                                    <div className="space-y-8">
                                        <div className="inline-block py-2 px-5 bg-accent-green/10 border border-accent-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-accent-green">
                                            Metabolic Forecasting
                                        </div>
                                        <h2 className="text-5xl md:text-6xl lg:text-8xl font-black text-white leading-[0.85] uppercase tracking-tighter italic">
                                            Reach <br />
                                            <span className="text-accent-green">Your Goal</span> <br />
                                            Weight Fast.
                                        </h2>
                                        <p className="text-xl md:text-2xl text-white/40 leading-relaxed max-w-xl font-medium">
                                            It's not magic—it's <span className="text-white font-bold">metabolic science</span>. GLP-1 is a naturally occurring hormone that regulates appetite, <span className="text-accent-green font-bold italic">re-engineering your biology</span> for effortless fat loss.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-6 pt-6">
                                            <Link to="/qualify?category=weight-loss" className="group relative bg-accent-green text-black px-12 py-6 rounded-full font-black uppercase tracking-[0.2em] transform transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(191,255,0,0.3)] inline-block text-center">
                                                <span className="relative z-10">Start My Assessment</span>
                                                <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Right Column - Interactive Calculator */}
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-accent-green/10 blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                        <div className="relative bg-[#0A0A0A]/80 backdrop-blur-3xl rounded-[50px] p-10 md:p-14 border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                                            <div className="mb-12">
                                                <div className="flex items-end justify-between mb-10">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">
                                                            Current Weight
                                                        </label>
                                                        <div className="h-1.5 w-12 bg-accent-green/20 rounded-full">
                                                            <div className="h-full w-1/2 bg-accent-green rounded-full shadow-[0_0_10px_rgba(191,255,0,1)]"></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="weight-display text-6xl md:text-7xl font-black text-white italic tracking-tighter leading-none">200</span>
                                                        <span className="text-xl font-black text-accent-green uppercase tracking-widest italic opacity-50">lbs</span>
                                                    </div>
                                                </div>

                                                {/* Slider */}
                                                <div className="relative pt-6 pb-10">
                                                    <input
                                                        type="range"
                                                        min="120"
                                                        max="400"
                                                        defaultValue="200"
                                                        className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer outline-none hover:bg-white/10 transition-all"
                                                        style={{
                                                            background: 'linear-gradient(to right, #bfff00 0%, #bfff00 40%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.05) 100%)'
                                                        }}
                                                        onInput={(e) => {
                                                            const value = e.target.value;
                                                            const percentage = ((value - 120) / (400 - 120)) * 100;
                                                            e.target.style.background = `linear-gradient(to right, #bfff00 0%, #bfff00 ${percentage}%, rgba(255,255,255,0.05) ${percentage}%, rgba(255,255,255,0.05) 100%)`;

                                                            const weightDisplay = document.querySelector('.weight-display');
                                                            const potentialDisplay = document.querySelector('.potential-display');

                                                            if (weightDisplay) {
                                                                gsap.to(weightDisplay, {
                                                                    innerText: value,
                                                                    duration: 0.1,
                                                                    snap: { innerText: 1 },
                                                                    ease: "none"
                                                                });
                                                            }

                                                            if (potentialDisplay) {
                                                                const potential = Math.round(value * 0.23);
                                                                gsap.to(potentialDisplay, {
                                                                    innerText: potential,
                                                                    duration: 0.4,
                                                                    snap: { innerText: 1 },
                                                                    ease: "power2.out"
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <style>{`
                                                input[type="range"]::-webkit-slider-thumb {
                                                    appearance: none;
                                                    width: 40px;
                                                    height: 40px;
                                                    border-radius: 50%;
                                                    background: #FAF9F6;
                                                    border: 10px solid #bfff00;
                                                    cursor: pointer;
                                                    box-shadow: 0 0 30px rgba(191, 255, 0, 0.5);
                                                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                                                }
                                                input[type="range"]::-webkit-slider-thumb:hover {
                                                    transform: scale(1.15);
                                                    border-width: 12px;
                                                }
                                                input[type="range"]::-moz-range-thumb {
                                                    appearance: none;
                                                    width: 20px;
                                                    height: 20px;
                                                    border-radius: 50%;
                                                    background: #FAF9F6;
                                                    border: 10px solid #bfff00;
                                                    cursor: pointer;
                                                    box-shadow: 0 0 30px rgba(191, 255, 0, 0.5);
                                                }
                                            `}</style>
                                                </div>
                                            </div>

                                            <div className="pt-12 border-t border-white/5 relative">
                                                <div className="absolute -top-[1.5px] left-0 w-32 h-[3px] bg-accent-green shadow-[0_0_15px_rgba(191,255,0,0.8)]"></div>
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <p className="text-[12px] font-black text-accent-green uppercase tracking-[0.4em]">
                                                            Potential Fat Loss
                                                        </p>
                                                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
                                                            Projected over 24 weeks*
                                                        </p>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="potential-display text-7xl md:text-8xl font-black text-accent-green italic tracking-tighter leading-none">46</span>
                                                        <span className="text-2xl font-black text-white/20 uppercase tracking-widest italic">lbs</span>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION FOOTER */}
                            <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30">

                                <div className="flex gap-4">
                                </div>
                            </div>
                        </section>
                    )
                }

                {/* TESTIMONIAL STATS SECTION */}
                < section className="w-full py-20 md:py-32 bg-white" >
                    <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-6 md:px-12 lg:px-16">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                                The change we've all been waiting for.
                            </h2>
                            <p className="text-lg md:text-xl text-gray-600">
                                Join the over <span className="font-bold text-gray-900">100,000 <span className="font-serif italic-u"><span className="italic">u</span>Glow<sup>MD</sup></span> patients</span> and we'll help you finally get real, lasting results.
                            </p>
                        </div>

                        {/* Patient Images Grid - Masonry Style */}
                        {isWeightLoss ? (
                            <div className="patient-grid grid grid-cols-4 md:grid-cols-12 gap-4 md:gap-6 mb-20">
                                {/* Row 1 */}
                                {/* Image 1 - Small */}
                                <div className="col-span-2 md:col-span-3 rounded-[40px] overflow-hidden aspect-[3/4] bg-gradient-to-br from-green-100 to-green-200 group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105">
                                    <img
                                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=faces"
                                        alt="Happy patient"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110"
                                    />
                                </div>

                                {/* Image 2 - Medium */}
                                <div className="col-span-2 md:col-span-4 row-span-1 rounded-[40px] overflow-hidden aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200 group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105">
                                    <img
                                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop&crop=faces"
                                        alt="Happy patient"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110"
                                    />
                                </div>

                                {/* Image 3 - Large (spans 2 rows) */}
                                <div className="col-span-4 md:col-span-5 row-span-2 rounded-[40px] overflow-hidden aspect-[3/5] bg-gradient-to-br from-gray-100 to-gray-200 group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105">
                                    <img
                                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=900&fit=crop&crop=faces"
                                        alt="Happy patient"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110"
                                    />
                                </div>

                                {/* Row 2 */}
                                {/* Image 4 - Small */}
                                <div className="col-span-2 md:col-span-3 rounded-[40px] overflow-hidden aspect-[3/4] bg-gradient-to-br from-purple-100 to-purple-200 group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105">
                                    <img
                                        src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop&crop=faces"
                                        alt="Happy patient"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110"
                                    />
                                </div>

                                {/* Image 5 - Medium */}
                                <div className="col-span-2 md:col-span-4 rounded-[40px] overflow-hidden aspect-[4/5] bg-gradient-to-br from-yellow-100 to-yellow-200 group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105">
                                    <img
                                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=600&fit=crop&crop=faces"
                                        alt="Happy patient"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                                {data.resultImages && data.resultImages.map((img, i) => (
                                    <div key={i} className="rounded-[40px] overflow-hidden aspect-[3/4] group cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-500">
                                        <img src={img} alt="Results" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Statistics */}
                        <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-8">
                            {data.stats ? data.stats.slice(0, 3).map((stat, i) => (
                                <div key={i} className="text-center">
                                    <p className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3">{stat.val}<span className="text-2xl">{stat.unit}</span></p>
                                    <p className="text-base md:text-lg text-gray-700 font-medium">{stat.label}</p>
                                </div>
                            )) : (
                                <>
                                    <div className="text-center">
                                        <p className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3">6x</p>
                                        <p className="text-base md:text-lg text-gray-700 font-medium">more weight loss than exercise and diet alone</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3">18%</p>
                                        <p className="text-base md:text-lg text-gray-700 font-medium">Lose an average of 18% of your body weight</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-3">93%</p>
                                        <p className="text-base md:text-lg text-gray-700 font-medium">kept the weight off for good</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Disclaimer */}
                        <p className="text-center text-sm text-gray-500 italic">
                            * Data based on uGlowMD patients over their first 6 months of treatment
                        </p>

                    </div>
                </section>

                {/* METABOLISM FIX SECTION (Dynamic Science Section) */}
                <section className="metabolism-section w-full py-20 md:py-32 bg-gradient-to-br from-gray-50 via-white to-gray-100">
                    <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-6 md:px-12 lg:px-16">
                        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

                            {/* Left Column - Images */}
                            <div className="grid grid-cols-2 gap-6">
                                {/* Patient/Result Image */}
                                <div className="rounded-[40px] overflow-hidden aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105">
                                    <img
                                        src={data.scienceSection?.images?.[0] || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=700&fit=crop&crop=faces"}
                                        alt="Happy patient"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110"
                                    />
                                </div>

                                {/* Injection/Product Image */}
                                <div className="rounded-[40px] overflow-hidden aspect-[3/4] bg-gradient-to-br from-orange-50 to-orange-100 group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-105">
                                    <img
                                        src={data.scienceSection?.images?.[1] || "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&h=700&fit=crop&crop=center"}
                                        alt="GLP-1 injection"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110"
                                    />
                                </div>
                            </div>

                            {/* Right Column - Text Content */}
                            <div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                    {data.scienceSection?.title || "We will fix your broken metabolism."}
                                </h2>
                                <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: data.scienceSection?.description || "Traditional diets don't work because nearly <span class=\"font-semibold text-gray-900\">70% of weight is genetically determined</span>. With medication, you will work <span class=\"font-semibold text-gray-900\">with your body</span> rather than against it - to reach your goal weight and keep it that way." }} />
                                <Link to={`/qualify?category=${categoryId}`} className="mt-8 bg-gray-900 text-white px-12 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg transform hover:scale-105 inline-block">
                                    {data.scienceSection?.cta || "Get Started"}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* WHY MEDVI WORKS - STATS SECTION */}
                <section className="w-full py-24 md:py-36 bg-[#050505] relative overflow-hidden">
                    {/* Atmospheric Glows */}
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-green/10 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent-green/10 rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

                    <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-6 md:px-12 lg:px-16 relative z-10">

                        {/* Header */}
                        <div className="text-center mb-20 md:mb-28">
                            <div className="inline-block py-2 px-6 bg-accent-green/10 border border-accent-green/20 rounded-full text-[11px] font-black uppercase tracking-[0.4em] text-accent-green mb-8">
                                Clinical Outcomes
                            </div>
                            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] mb-8 uppercase tracking-tighter italic">
                                Built on <br /><span className="text-accent-green">Proven Results.</span>
                            </h2>
                            <p className="text-xl md:text-2xl text-white/40 font-medium max-w-2xl mx-auto leading-relaxed">
                                Our protocols aren't just effective—they're transformative. Join over <span className="text-white font-bold italic">100,000+ patients</span> who have reclaimed their health.
                            </p>
                        </div>

                        {/* Stats Cards - High End Glassware */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

                            {[
                                ...(data.stats || [
                                    { val: "18", unit: "%", label: "Average weight loss", desc: "Clinically observed in 2024 cohorts" },
                                    { val: "9/10", unit: "", label: "Success Rate", desc: "Reported 'Most Effective' treatment" },
                                    { val: "6.5", unit: "\"", label: "Waist Reduction", desc: "Average potential reduction" },
                                    { val: "93", unit: "%", label: "Maintenance", desc: "Kept weight off after 12 months" }
                                ])
                            ].map((stat, idx) => (
                                <div key={idx} className="group relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-b from-accent-green/20 to-transparent rounded-[40px] blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="relative bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/5 hover:border-accent-green/30 rounded-[40px] p-10 text-center transition-all duration-500 transform hover:-translate-y-2">
                                        <div className="mb-6">
                                            <span className="text-6xl md:text-7xl font-black text-white italic tracking-tighter group-hover:text-accent-green transition-colors">{stat.val}</span>
                                            <span className="text-3xl font-black text-white/20 ml-1">{stat.unit}</span>
                                        </div>
                                        <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-3">{stat.label}</h4>
                                        <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">{stat.desc}</p>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                </section>

                {/* BEGIN YOUR JOURNEY SECTION - PREMIUM 3-CARD GRID */}
                <section className="w-full py-24 md:py-36 bg-[#F9F7F2] relative overflow-hidden">
                    <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-6 md:px-12 lg:px-16">

                        {/* Section Header */}
                        <div className="text-center mb-20 md:mb-28">
                            <div className="inline-block py-2 px-5 bg-[#1A1A1A] border border-transparent rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white mb-8">
                                Clinical Process
                            </div>
                            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-[#1A1A1A] leading-[0.9] uppercase tracking-tighter mb-8 italic">
                                Begin your journey <br />
                                <span className="text-accent-green">with <span className="font-serif italic-u"><span className="italic">u</span>Glow<sup>MD</sup></span>.</span>
                            </h2>
                            <p className="text-xl text-[#4A4A4A] leading-relaxed max-w-2xl mx-auto font-medium">
                                Start your transformation today with our medical-grade protocol. Our streamlined approach ensures you're supported <span className="font-bold text-[#1A1A1A] italic">every step of the way</span>.
                            </p>
                        </div>

                        {/* 3-Card Grid */}
                        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
                            {/* Connection Lines (Desktop) */}
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#1A1A1A]/5 hidden md:block -translate-y-32"></div>

                            {/* Card 1 - Get Approved */}
                            <div className="group relative">
                                <div className="absolute -top-12 -left-4 text-[120px] font-black text-[#1A1A1A]/5 select-none leading-none z-0 transform group-hover:-translate-y-2 transition-transform duration-500">
                                    01
                                </div>
                                <div className="relative z-10 bg-white/40 backdrop-blur-xl border border-white rounded-[40px] p-8 md:p-10 shadow-2xl hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-3">
                                    <div className="w-16 h-16 bg-accent-green rounded-2xl flex items-center justify-center mb-8 shadow-lg transform group-hover:rotate-6 transition-transform">
                                        <span className="text-2xl font-black text-[#1A1A1A]">01</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-[#1A1A1A] mb-4 uppercase italic tracking-tight">Get Approved</h3>
                                    <p className="text-[#4A4A4A] font-medium leading-relaxed mb-8 text-lg">
                                        Complete a clinical health profile. Our medical team reviews your data to ensure GLP-1 therapy is the right choice.
                                    </p>
                                    <div className="rounded-3xl overflow-hidden aspect-[16/10] border border-black/5">
                                        <img
                                            src={medicalEvalDashboard}
                                            alt="Online evaluation"
                                            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 2 - Get Prescribed */}
                            <div className="group relative">
                                <div className="absolute -top-12 -left-4 text-[120px] font-black text-[#1A1A1A]/5 select-none leading-none z-0 transform group-hover:-translate-y-2 transition-transform duration-500">
                                    02
                                </div>
                                <div className="relative z-10 bg-white/40 backdrop-blur-xl border border-white rounded-[40px] p-8 md:p-10 shadow-2xl hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-3">
                                    <div className="w-16 h-16 bg-[#1A1A1A] rounded-2xl flex items-center justify-center mb-8 shadow-lg transform group-hover:-rotate-6 transition-transform">
                                        <span className="text-2xl font-black text-white">02</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-[#1A1A1A] mb-4 uppercase italic tracking-tight">Get Prescribed</h3>
                                    <p className="text-[#4A4A4A] font-medium leading-relaxed mb-8 text-lg">
                                        Your assigned doctor creates a custom dosing protocol. Everything you need is included.
                                    </p>
                                    <div className="rounded-3xl overflow-hidden aspect-[16/10] border border-black/5">
                                        <img
                                            src={medicalConsult}
                                            alt="Prescription consultation"
                                            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 3 - Receive your Rx */}
                            <div className="group relative">
                                <div className="absolute -top-12 -left-4 text-[120px] font-black text-[#1A1A1A]/5 select-none leading-none z-0 transform group-hover:-translate-y-2 transition-transform duration-500">
                                    03
                                </div>
                                <div className="relative z-10 bg-white/40 backdrop-blur-xl border border-white rounded-[40px] p-8 md:p-10 shadow-2xl hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-3">
                                    <div className="w-16 h-16 bg-accent-green rounded-2xl flex items-center justify-center mb-8 shadow-lg transform group-hover:rotate-6 transition-transform">
                                        <span className="text-2xl font-black text-[#1A1A1A]">03</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-[#1A1A1A] mb-4 uppercase italic tracking-tight">Receive your Rx</h3>
                                    <p className="text-[#4A4A4A] font-medium leading-relaxed mb-8 text-lg">
                                        Your treatment is shipped cold-chain directly to you. Access 365 support for dosing and metabolic guidance.
                                    </p>
                                    <div className="rounded-3xl overflow-hidden aspect-[16/10] border border-black/5">
                                        <img
                                            src={medicationDelivery}
                                            alt="Medication delivery"
                                            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA Bottom */}
                        <div className="mt-20 md:mt-28 text-center">
                            <Link to="/qualify" className="bg-[#1A1A1A] text-white px-16 py-7 rounded-full font-black uppercase tracking-widest hover:bg-accent-green hover:text-[#1A1A1A] transition-all shadow-2xl transform hover:scale-105 active:scale-95 group inline-flex items-center gap-4">
                                Start Your Evaluation
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* MEDVI GUARANTEE SECTION */}
                <section className="w-full py-20 md:py-32 bg-white">
                    <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-6 md:px-12 lg:px-16">

                        <div className="bg-gradient-to-br from-[#FFF9F0] to-[#FFF5E8] rounded-[50px] md:rounded-[70px] p-12 md:p-16 lg:p-20 shadow-xl">
                            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

                                {/* Left Column - Icon */}
                                <div className="flex justify-center md:justify-start">
                                    <div className="relative">
                                        {/* Checkmark Circle */}
                                        <svg width="200" height="200" viewBox="0 0 200 200" className="transform hover:scale-110 transition-transform duration-500">
                                            {/* Circle */}
                                            <circle
                                                cx="100"
                                                cy="100"
                                                r="90"
                                                fill="none"
                                                stroke="url(#goldGradient)"
                                                strokeWidth="8"
                                                style={{
                                                    strokeDasharray: 565,
                                                    strokeDashoffset: 565,
                                                    animation: 'drawCircle 1.5s ease-out forwards'
                                                }}
                                            />
                                            {/* Checkmark */}
                                            <path
                                                d="M60 100 L85 125 L140 70"
                                                fill="none"
                                                stroke="url(#goldGradient)"
                                                strokeWidth="12"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                style={{
                                                    strokeDasharray: 120,
                                                    strokeDashoffset: 120,
                                                    animation: 'drawCheck 0.8s ease-out 1s forwards'
                                                }}
                                            />
                                            {/* Gradient Definition */}
                                            <defs>
                                                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" style={{ stopColor: '#D4A574', stopOpacity: 1 }} />
                                                    <stop offset="100%" style={{ stopColor: '#C89850', stopOpacity: 1 }} />
                                                </linearGradient>
                                            </defs>
                                        </svg>

                                        {/* CSS Animation Styles */}
                                        <style>{`
                                            @keyframes drawCircle {
                                                to {
                                                    stroke-dashoffset: 0;
                                                }
                                            }
                                            
                                            @keyframes drawCheck {
                                                to {
                                                    stroke-dashoffset: 0;
                                                }
                                            }
                                        `}</style>
                                    </div>
                                </div>

                                {/* Right Column - Content */}
                                <div>
                                    <p className="text-sm md:text-base font-semibold text-[#C89850] uppercase tracking-wider mb-4">
                                        <span className="font-serif italic-u"><span className="italic">u</span>Glow<sup>MD</sup></span> Guarantee
                                    </p>
                                    <h2 className="text-3xl md:text-4xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
                                        The only thing you'll lose is extra weight.
                                    </h2>
                                    <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8">
                                        We're so confident in our personalized program, we guarantee you'll lose weight or your money back. It's that simple.
                                    </p>
                                    <button className="bg-gradient-to-r from-[#D4A574] to-[#C89850] text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:shadow-xl hover:scale-105 transition-all duration-300">
                                        Continue with Confidence
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER CROSS-SELL - Premium Categorical Suite */}
                <section className="px-6 md:px-16 py-32 bg-[#0A0A0A] relative overflow-hidden">
                    {/* Ambient Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-accent-green/5 blur-[150px] pointer-events-none"></div>

                    <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                            <div>
                                <div className="text-xs font-black text-accent-green uppercase tracking-[0.4em] mb-4">The Suite</div>
                                <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white italic">Explore our <br /> <span className="text-accent-green">Treatments</span></h3>
                            </div>
                            <div className="text-gray-400 font-medium text-lg max-w-lg text-right hidden md:block italic">
                                Total body optimization from metabolic health to aesthetic excellence.
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { id: 'weight-loss', name: 'Weight Loss', tag: 'Metabolic Optimization', desc: 'Precision GLP-1 protocols for sustainable fat loss.', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80' },
                                { id: 'hair-restoration', name: 'Hair Restoration', tag: 'Aesthetic Growth', desc: 'Advanced formulas for thicker, healthier hair density.', image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80' },
                                { id: 'sexual-health', name: 'Sexual Health', tag: 'Vitality & Performance', desc: 'Clinical solutions for optimized performance and desire.', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80' },
                                { id: 'longevity', name: 'Longevity', tag: 'Cellular Health', desc: 'Anti-aging science for lifespan and healthspan extension.', image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=80' }
                            ].filter(cat => cat.id !== categoryId).map((cat) => (
                                <Link
                                    to={`/products/${cat.id}`}
                                    key={cat.id}
                                    className="group relative h-[400px] rounded-[40px] overflow-hidden bg-[#1A1A1A] border border-white/5 transition-all duration-700 hover:border-accent-green/50 hover:-translate-y-3 shadow-2xl"
                                >
                                    {/* Image Base */}
                                    <div className="absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-1000 transform group-hover:scale-110">
                                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/20 to-transparent"></div>
                                    </div>

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 p-10 flex flex-col justify-end">
                                        <div className="text-accent-green text-xs font-black uppercase tracking-widest mb-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                            {cat.tag}
                                        </div>
                                        <h4 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight italic mb-2">
                                            {cat.name}
                                        </h4>
                                        <p className="text-white/60 text-sm mb-6 line-clamp-2 leading-relaxed font-medium">
                                            {cat.desc}
                                        </p>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-4 text-white/40 group-hover:text-white transition-colors duration-500">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Discover Treatment</span>
                                                <div className="w-8 h-px bg-white/20 group-hover:w-16 group-hover:bg-accent-green transition-all duration-500"></div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    window.location.href = `/qualify?category=${cat.id}`;
                                                }}
                                                className="w-full py-3 bg-white/5 border border-white/10 text-white hover:bg-accent-green hover:border-accent-green hover:text-black rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0"
                                            >
                                                Qualify Now
                                            </button>
                                        </div>
                                    </div>

                                    {/* Hover Flare */}
                                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-12 h-12 rounded-full bg-accent-green/10 backdrop-blur-md flex items-center justify-center border border-accent-green/20">
                                            <span className="text-2xl text-accent-green">→</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* SECTION FOOTER */}
                        <div className="mt-24 pt-10 border-t border-white/5 flex justify-between items-center opacity-30">
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white italic">uGlowMD TREATMENT SUITE • v4.0</span>
                            <div className="flex gap-2">
                                <span className="w-1 h-1 rounded-full bg-accent-green"></span>
                                <span className="w-1 h-1 rounded-full bg-accent-green"></span>
                                <span className="w-1 h-1 rounded-full bg-accent-green"></span>
                            </div>
                        </div>
                    </div>
                </section>

                <Footer />
            </div >
        </div >
    );
};

export default ProductPage;
