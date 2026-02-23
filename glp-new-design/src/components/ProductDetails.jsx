import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Loader from './Loader';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Import assets directly since we are in a new file
import semaglutideInjection from '../assets/semaglutide-injection.png';
import tirzepetideInjection from '../assets/tirzepetide_injection.png';
import semaglutideDrops from '../assets/semaglutide_drops.png';
import tirzepatideDrops from '../assets/tirzepatide_drops.png';
import semaglutidePrdBg from '../assets/semaglutide_prd_bg.png';
import tirzepatidePrdBg from '../assets/tirzepatide_prd_bg.png';
import semaglutideDropBg from '../assets/semaglutide_drop_bg.png';
import tirzepatideDropBg from '../assets/tirpetide_drop.png';
import medicalConsult from '../assets/medical_consult.png';
import medicationDelivery from '../assets/medication_delivery.png';
import labAnalysis from '../assets/lab_analysis.png';
import ongoingSupport from '../assets/ongoing_support.png';
import finasterideBottleImg from '../assets/finastride_tablet_bottle.png';
import sildenafilTadalafilPrdImg from '../assets/sildenafil_tadalafi_prd_img.png';
import sildenafilTadalafilTabletsPrdImg from '../assets/Sildenafil _Tadalafil_Tablets_prd.png';
import growthTabsSildenafilImg from '../assets/growth-tab-sidnafil.png';

import finasterideHeroImg from '../assets/finasteride_tablet.png';
import finasterideMinoxidilBg from '../assets/Finasteride_  Minoxidil_bg.png';
import finasterideTripleBg from '../assets/Finasteride  Minoxidil  Tretinoi_bg.png';
import threeInOneImg from '../assets/3_in_1img.png';
import fiveInOneImg from '../assets/5_in-1_hairloss.png';
import fiveInOneBg from '../assets/5_IN_1_HAIRLOSS_BG.png';
import dualGrowthPrdImg from '../assets/Finasteride_  Minoxidil_prd.png';
import hairGrowth2in1Img from '../assets/2-in-1-hairgrowthtab.png';

import hairLossImg from '../assets/hair-loss.png';
import mensHealthImg from '../assets/mens-health.png';
import sildenafilTadalafilBg from '../assets/Sildenafil_Tadalafil_bg.png';
import sildenafilTadalafilTabletsBg from '../assets/Sildenafil _Tadalafil_Tablets.png';
import sildenafilYohimbeBg from '../assets/Sildenafil_ Yohimbe_bg.png';
import sildenafilYohimbePrdImg from '../assets/Sildenafil_ Yohimbe_prd.png';
import oxytocinPrdImg from '../assets/Oxytocin (Fast Absorb Tab)_jk.png';
import oxytocinTabletsPrd from '../assets/Oxytocin_Tablets_prd__3.png';
import oxytocinNasalPrd from '../assets/oxytocin_nasal_prd.png.png';
import oxytocinNasalBg from '../assets/oxytocin_nasal.png';
import prdDetailBg from '../assets/prd_detial_bg_image.png';
import longevityImg from '../assets/longevity.png';
import nadInjectionImg from '../assets/NAD+ (Subcutaneous Injection)_prd.png';
import nadInjectionPrd from '../assets/NAD+ (Subcutaneous Injection)_prd.png';
import glutathioneBg from '../assets/Glutathione (IM or Subcutaneous Injection)_bg.png';
import glutathionePrd from '../assets/Glutathione (IM or Subcutaneous Injection)_prd.png';
import nadNasalSprayBg from '../assets/Nad+_spray_bg.png';
import nadSprayPrd from '../assets/nad_spray_prd.png';
import hormonalMasteryImg from '../assets/hormonal_mastery.png';
import metabolicPrecisionImg from '../assets/metabolic_precision.png';
import clinicalBreakthroughImg from '../assets/clinical_breakthrough.png';
import dualActionImg from '../assets/dual_action.png';
import glycemicControlImg from '../assets/glycemic_control.png';
import maxPotencyImg from '../assets/max_potency.png';
import testosteroneHeroImg from '../assets/testosterone-image-v2.png';
import testosteroneInjectionImg from '../assets/testosterone_injection.png';
import testosteroneRdtImg from '../assets/testosterone_rdt_prd_img.png';
import estPrdImg from '../assets/est_prd_image.png';
import skincareHeroImg from '../assets/skincare.png';
import antiAgingImg from '../assets/ant-aging.png';
import faceSpotCreamImg from '../assets/face-spot-cream.png';
import acneCleanserImg from '../assets/Acne-Cleanser-Cream.png';
import rosaceaCareImg from '../assets/rosacea_care_set.png';
import eyeSerumImg from '../assets/Eye-Serum-prd-image.png';
import bodyAcneCreamImg from '../assets/Body-Acne-Spots-Cream.png';
import bpc157Img from '../assets/BPC-157-(Subq Inj).png';
import bpc157Tb500Img from '../assets/BPC-157-TB-500 -(Subq Inj).png';
import Footer from './Footer';

// Mock data
const productSpecificData = {
    'semaglutide-injection': {
        name: 'Semaglutide',
        type: 'Subcutaneous Injection',
        price: '$299/mo',
        image: semaglutideInjection,
        heroBg: semaglutidePrdBg,
        description: 'The gold standard for medical weight loss. Semaglutide Subcutaneous Injection mimics the GLP-1 hormone to regulate appetite and food intake, helping you feel full faster and longer.',
        highlights: ["Appetite-suppressing formula", "Works in 24 hours on average*", "Active for up to 7 days", "Starts as low as $299/mo*"],
        benefits: [
            { id: "01", title: "Hormonal Mastery", desc: "Semaglutide Subcutaneous Injection specifically targets GLP-1 receptors in the brain to eliminate 'food noise' and restore natural satiety signals.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Metabolic Precision", desc: "Stabilizes blood sugar levels and optimizes insulin response, allowing your body to efficiently burn stored fat for energy.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Clinical Breakthrough", desc: "Achieve medical-grade weight loss with an average of 15-20% reduction in body weight through sustained glycemic control.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Semaglutide", desc: "Mimics the GLP-1 hormone to regulate appetite and digestion." },
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
        faqs: [
            { q: 'How does Semaglutide Subcutaneous Injection work for weight loss?', a: 'Semaglutide Subcutaneous Injection is a GLP-1 receptor agonist that mimics a natural hormone in your body. It works by slowing digestion, reducing appetite, and helping you feel fuller longer, leading to reduced calorie intake and sustainable weight loss.' },
            { q: 'How much weight can I expect to lose?', a: 'Clinical trials show an average weight loss of 15-20% of body weight over 68 weeks. Individual results vary based on starting weight, adherence to treatment, and lifestyle factors.' },
            { q: 'How often do I inject Semaglutide Subcutaneous Injection?', a: 'Semaglutide Subcutaneous Injection is administered once weekly via subcutaneous injection. Your dose will be gradually increased over time to minimize side effects and optimize results.' },
            { q: 'Where do I inject it?', a: 'Common injection sites include the abdomen (stomach area), thigh, or upper arm. Rotate injection sites each week to prevent irritation. Detailed instructions will be provided with your prescription.' },
            { q: 'What are the common side effects?', a: 'The most common side effects include nausea, vomiting, diarrhea, constipation, and stomach discomfort. These typically subside as your body adjusts to the medication, usually within the first few weeks.' },
            { q: 'Is Semaglutide Subcutaneous Injection safe for long-term use?', a: 'Yes, Semaglutide Subcutaneous Injection is FDA-approved and has been extensively studied for long-term safety. However, it should be used under medical supervision with regular check-ins with your healthcare provider.' },
            { q: 'Do I need to refrigerate it?', a: 'Yes, unopened Semaglutide Subcutaneous Injection pens should be stored in the refrigerator between 36°F to 46°F (2°C to 8°C). Once in use, the pen can be kept at room temperature (below 86°F/30°C) for up to 56 days.' },
            { q: 'When will I start seeing results?', a: 'Most patients begin to notice appetite suppression within the first week. Visible weight loss typically starts within 4-8 weeks, with optimal results achieved after several months of consistent use.' },
            { q: 'Can I take Semaglutide Subcutaneous Injection if I have diabetes?', a: 'Semaglutide Subcutaneous Injection is also used to treat Type 2 diabetes. However, you must inform your healthcare provider about all medical conditions during your consultation to ensure it\'s safe for you.' },
            { q: 'What happens if I miss a dose?', a: 'If you miss a dose and it\'s been less than 5 days, take it as soon as you remember. If more than 5 days have passed, skip the missed dose and resume your regular weekly schedule. Never double up on doses.' }
        ],
        readyAccordion: [
            { q: "What is Semaglutide Subcutaneous Injection?", a: "Semaglutide Subcutaneous Injection is a GLP-1 receptor agonist that mimics the hormone responsible for feeling full, helping you eat less and lose weight consistently." },
            { q: "How do I take it?", a: "Administered as a once-weekly subcutaneous injection. Detailed instructions will be provided with your prescription." },
            { q: "Common side effects", a: "Nausea, vomiting, diarrhea, stomach pain, and constipation. These usually subside as your body adjusts." }
        ],
        strengths: [
            {
                dosage: '0.25 mg', plans: [
                    { name: 'Monthly', price: '$99.99', badge: 'Try First' },
                    { name: '3 Months', price: '$269.99', badge: '' },
                    { name: '6 Months', price: '$499.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '0.5 mg', plans: [
                    { name: 'Monthly', price: '$134.99', badge: 'Try First' },
                    { name: '3 Months', price: '$364.50', badge: '' },
                    { name: '6 Months', price: '$674.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '1 mg', plans: [
                    { name: 'Monthly', price: '$179.99', badge: 'Try First' },
                    { name: '3 Months', price: '$484.99', badge: '' },
                    { name: '6 Months', price: '$899.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '1.5 mg', plans: [
                    { name: 'Monthly', price: '$219.99', badge: 'Try First' },
                    { name: '3 Months', price: '$594.99', badge: '' },
                    { name: '6 Months', price: '$1,099.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '2 mg', plans: [
                    { name: 'Monthly', price: '$249.99', badge: 'Try First' },
                    { name: '3 Months', price: '$689.99', badge: '' },
                    { name: '6 Months', price: '$1,279.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '2.4 mg', plans: [
                    { name: 'Monthly', price: '$249.99', badge: 'Try First' },
                    { name: '3 Months', price: '$689.99', badge: '' },
                    { name: '6 Months', price: '$1,279.99', badge: 'Best Value' },
                ]
            },
        ]
    },
    'tirzepatide-injection': {
        name: 'Tirzepatide',
        type: 'Subcutaneous Injection',
        price: '$399/mo',
        image: tirzepetideInjection,
        heroBg: tirzepatidePrdBg,
        description: 'Dual-action power. Tirzepatide mimics both GLP-1 and GIP hormones for potentially greater weight loss efficacy.',
        highlights: ["Dual-hormone action (GLP-1 + GIP)", "Potentially higher weight loss*", "Once weekly dosing", "Starts as low as $399/mo*"],
        benefits: [
            { id: "01", title: "Double Action", desc: "Targets both GLP-1 and GIP receptors for enhanced appetite control.", color: "#FFDE59", image: dualActionImg },
            { id: "02", title: "Blood Sugar Control", desc: "Improves insulin sensitivity and reduces blood sugar spikes.", color: "#5CE1E6", image: glycemicControlImg },
            { id: "03", title: "Maximum Potency", desc: "Clinical studies show higher average weight loss compared to Semaglutide alone.", color: "#7ED957", image: maxPotencyImg }
        ],
        ingredients: [
            { name: "Tirzepatide", desc: "A dual GIP/GLP-1 receptor agonist." },
            { name: "Niacinamide", desc: "Vitamin B3, sometimes added to support metabolic health." }
        ],
        howItWorks: [
            { id: "01", title: "Two is better than one.", desc: "While Semaglutide targets one hunger hormone, Tirzepatide targets two, offering a more comprehensive approach." },
            { id: "02", title: "Synergistic Effect.", desc: "The combination of GLP-1 and GIP agonism results in superior metabolic regulation." }
        ],
        timeline: [
            { time: "Today", step: "Tell us about your health" },
            { time: "24–48 Hours", step: "Get a personalized plan" },
            { time: "4–7 Days", step: "Receive your medication" },
            { time: "Ongoing", step: "365 support" }
        ],
        faqs: [
            { q: 'Is it stronger than Semaglutide?', a: 'Clinical trials suggest it may lead to greater weight loss.' },
            { q: 'How often do I take it?', a: 'Once weekly via subcutaneous injection.' }
        ],
        readyAccordion: [
            { q: "What is Tirzepatide?", a: "Tirzepatide is a dual GIP and GLP-1 receptor agonist, targeting two hunger-regulating hormones for superior weight loss results." },
            { q: "How is it different?", a: "Unlike Semaglutide which only targets GLP-1, Tirzepatide adds GIP agonism, providing better glycemic control and appetite suppression." },
            { q: "Common side effects", a: "Similar to other GLP-1s, including nausea and digestive changes. Most users find these manageable as they titration up." }
        ],
        strengths: [
            {
                dosage: '2.5 mg', plans: [
                    { name: 'Monthly', price: '$190', badge: 'Try First' },
                    { name: '3 Months', price: '$499.99', badge: '' },
                    { name: '6 Months', price: '$999.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '5 mg', plans: [
                    { name: 'Monthly', price: '$299.99', badge: 'Try First' },
                    { name: '3 Months', price: '$799.99', badge: '' },
                    { name: '6 Months', price: '$1,499.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '7.5 mg', plans: [
                    { name: 'Monthly', price: '$320.00', badge: 'Try First' },
                    { name: '3 Months', price: '$864.99', badge: '' },
                    { name: '6 Months', price: '$1,599.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '10 mg', plans: [
                    { name: 'Monthly', price: '$460.00', badge: 'Try First' },
                    { name: '3 Months', price: '$1,242.00', badge: '' },
                    { name: '6 Months', price: '$2,299.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '12.5 mg', plans: [
                    { name: 'Monthly', price: '$500', badge: 'Try First' },
                    { name: '3 Months', price: '$1,349.99', badge: '' },
                    { name: '6 Months', price: '$2,499.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '15 mg', plans: [
                    { name: 'Monthly', price: '$500', badge: 'Try First' },
                    { name: '3 Months', price: '$1,349.99', badge: '' },
                    { name: '6 Months', price: '$2,499.99', badge: 'Best Value' },
                ]
            },
        ]
    },
    'semaglutide-drops': {
        name: 'Semaglutide',
        type: 'Fast Absorb Sublingual Drops',
        price: '$249/mo',
        image: semaglutideDrops,
        heroBg: semaglutideDropBg,
        description: 'Needle-free weight loss. A convenient daily dissolve tablet for those who prefer to avoid injections.',
        highlights: ["No needles required", "Daily routine", "Great for maintenance", "Starts as low as $249/mo*"],
        benefits: [
            { id: "01", title: "Needle Free", desc: "No injections required. Simply place under the tongue to dissolve.", color: "#FFDE59", image: glycemicControlImg },
            { id: "02", title: "Daily Consistency", desc: "Easier to remember as part of your daily morning or evening routine.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Gentle Absorption", desc: "Sublingual delivery bypasses the stomach for effective absorption without the needle.", color: "#7ED957", image: dualActionImg }
        ],
        ingredients: [
            { name: "Semaglutide Base", desc: "The active GLP-1 agonist in a sublingual formulation." }
        ],
        howItWorks: [
            { id: "01", title: "Absorbs under the tongue.", desc: "The sublingual mucosa provides a direct route into the bloodstream, bypassing the digestive system." },
            { id: "02", title: "Daily steady state.", desc: "Daily dosing maintains stable levels of the medication in your system." }
        ],
        timeline: [
            { time: "Today", step: "Tell us about your health" },
            { time: "24–48 Hours", step: "Get a personalized plan" },
            { time: "4–7 Days", step: "Receive your medication" },
            { time: "Ongoing", step: "365 support" }
        ],
        faqs: [
            { q: 'Does it taste bad?', a: 'It is flavored to be palatable, often mint or berry.' },
            { q: 'Do I swallow it?', a: 'Allow to dissolve under tongue for best results.' }
        ],
        readyAccordion: [
            { q: "How do the drops work?", a: "The sublingual formulation is absorbed directly into the bloodstream through the tissues under the tongue, bypassing the digestive tract." },
            { q: "Are they as effective?", a: "While sublingual absorption varies, consistent daily dosing maintains steady therapeutic levels for effective weight management." },
            { q: "When should I take them?", a: "Take them at the same time each day for best results, ideally on an empty stomach." }
        ]
    },
    'tirzepatide-drops': {
        name: 'Tirzepatide',
        type: 'Fast Absorb Sublingual Drops',
        price: '$349/mo',
        image: tirzepatideDrops,
        heroBg: tirzepatideDropBg,
        description: 'The most advanced needle-free option. Dual-action power in a convenient daily drop.',
        highlights: ["Dual-hormone power", "Needle-free application", "Premium formulation", "Starts as low as $349/mo*"],
        benefits: [
            { id: "01", title: "Max Power, No Pain", desc: "Tirzepatide's dual action without the injection.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Rapid Dissolve", desc: "Formulated for quick absorption under the tongue.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Travel Friendly", desc: "No need to worry about needles or sharps containers while traveling.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Tirzepatide Base", desc: "Dual GIP/GLP-1 agonist." }
        ],
        howItWorks: [
            { id: "01", title: "Sublingual Efficiency.", desc: "Delivers powerful medication directly into circulation." },
            { id: "02", title: "Advanced Modulation.", desc: "Regulates both insulin and appetite pathways." }
        ],
        timeline: [
            { time: "Today", step: "Tell us about your health" },
            { time: "24–48 Hours", step: "Get a personalized plan" },
            { time: "4–7 Days", step: "Receive your medication" },
            { time: "Ongoing", step: "365 support" }
        ],
        faqs: [
            { q: 'Is this as effective as the shot?', a: 'Oral bioavailability is lower, but daily dosing helps maintain therapeutic levels.' }
        ],
        readyAccordion: [
            { q: "Why Tirzepatide drops?", a: "You get the dual-hormone benefits of Tirzepatide (GLP-1 + GIP) in a convenient, needle-free daily format." },
            { q: "How to use?", a: "Place the required drops under your tongue and hold for 60-90 seconds before swallowing for maximum absorption." },
            { q: "What to expect?", a: "Significant appetite suppression and metabolic support starting within the first few days of consistent use." }
        ]
    },
    'finasteride-tablets': {
        name: 'Finasteride',
        type: 'Oral Tablets',
        price: '$49/mo',
        image: finasterideBottleImg,
        heroBg: finasterideHeroImg,
        description: 'The clinically proven oral treatment that targets hair loss at the source by blocking DHT production.',
        highlights: ["Stops hair loss at the root", "Once-daily tablet", "FDA-approved active ingredient", "Starts at $49/mo"],
        benefits: [
            { id: "01", title: "DHT Blocker", desc: "Prevents the conversion of testosterone to DHT, the hormone responsible for shrinking hair follicles.", color: "#FFDE59", image: dualActionImg },
            { id: "02", title: "Preserve Density", desc: "Protects existing hair follicles from miniaturization and shedding.", color: "#5CE1E6", image: glycemicControlImg },
            { id: "03", title: "Proven Results", desc: "Clinical studies show stabilization of hair loss in 90% of men.", color: "#7ED957", image: maxPotencyImg }
        ],
        ingredients: [
            { name: "Finasteride (1mg)", desc: "A 5-alpha-reductase inhibitor that lowers scalp DHT levels." }
        ],
        howItWorks: [
            { id: "01", title: "Targets the Root Cause.", desc: "Genetic hair loss is driven by sensitivity to DHT. Finasteride lowers DHT levels systemically." },
            { id: "02", title: "Protects the Follicle.", desc: "With less DHT binding to follicles, they can remain in the growth phase longer." }
        ],
        timeline: [
            { time: "Month 1-3", step: "Shedding stabilizes" },
            { time: "Month 3-6", step: "Early regrowth visible" },
            { time: "Month 12+", step: "Maximum density achieved" },
            { time: "Ongoing", step: "Maintenance required" }
        ],
        faqs: [
            { q: 'When is the best time to take it?', a: 'Take it at the same time every day, with or without food.' },
            { q: 'Will it work for a receding hairline?', a: 'It is most effective for the crown and mid-scalp, but can help slow frontal recession.' }
        ],
        readyAccordion: [
            { q: "What is Finasteride?", a: "An FDA-approved oral medication that treats male pattern hair loss by blocking DHT production." },
            { q: "Are there side effects?", a: "Side effects are rare (less than 2% of patients) and may include sexual side effects, which typically resolve upon stopping medication." },
            { q: "How long until I see results?", a: "It typically takes 3 to 6 months of daily use to see visible improvements in hair density." }
        ]
    },
    'finasteride-minoxidil-liquid': {
        name: 'Dual Growth Formula',
        type: 'Topical Liquid Solution',
        price: '$79/mo',
        image: dualGrowthPrdImg,
        heroBg: finasterideMinoxidilBg,
        description: 'A powerful dual-action topical solution combining a DHT blocker with a growth stimulant.',
        highlights: ["Dual-action formula", "Direct scalp application", "Reduced systemic side effects", "Starts at $79/mo"],
        benefits: [
            { id: "01", title: "Block & Stimulate", desc: "Finasteride blocks DHT while Minoxidil stimulates blood flow and extending the growth phase.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Targeted Delivery", desc: "Applied directly to the scalp for maximum local concentration.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Synergistic Effect", desc: "Studies show the combination often yields better results than either ingredient alone.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Finasteride (0.1% - 0.25%)", desc: "Topical DHT blocker." },
            { name: "Minoxidil (6% - 8%)", desc: "Potent vasodilator to stimulate follicles." }
        ],
        howItWorks: [
            { id: "01", title: "Two Pathways.", desc: "Stops the damage (DHT) and promotes repair (blood flow/nutrients)." },
            { id: "02", title: "Local Absorption.", desc: "Minimizes drug exposure to the rest of the body." }
        ],
        timeline: [
            { time: "Month 1-3", step: "Reduced shedding" },
            { time: "Month 3-4", step: "Fine hairs appear" },
            { time: "Month 6+", step: "Thicker, darker hair" },
            { time: "Ongoing", step: "Apply once daily" }
        ],
        faqs: [
            { q: 'Is it greasy?', a: 'Our compounds are formulated to be quick-drying and non-greasy.' },
            { q: 'Do I need a prescription?', a: 'Yes, because it contains Finasteride.' },
            { q: 'How long until I see results?', a: 'Most patients see a noticeable reduction in shedding within 3 to 6 months, with peak growth occurring around the 12-month mark.' },
            { q: 'Are there side effects?', a: 'Topical application minimizes systemic absorption, significantly reducing the risk of side effects compared to oral versions. Some users may experience mild scalp irritation.' },
            { q: 'What is the difference between topical and oral?', a: 'Topical Finasteride targets the scalp directly, achieving high local concentrations while maintaining lower blood levels compared to the oral tablet, which reduces the likelihood of systemic side effects.' }
        ],
        readyAccordion: [
            { q: "Why combine them?", a: "Combining mechanisms of action attacks hair loss from two angles for superior efficacy." },
            { q: "What is the synergistic effect?", a: "Studies show that blocking DHT while simultaneously stimulating follicles yields significantly better results than either treatment alone." },
            { q: "How do I apply it?", a: "Use the dropper to apply directly to the affected areas of the scalp once daily." },
            { q: "Is it safe for women?", a: "Generally, Finasteride is not recommended for women of childbearing age due to risks during pregnancy." }
        ]
    },
    'finasteride-minoxidil-tretinoin-liquid': {
        name: 'Triple Growth Liquid',
        type: 'Topical Liquid - 3-in-1',
        price: '$99/mo',
        image: threeInOneImg,
        heroBg: finasterideTripleBg,
        description: 'The "Golden Triple" of hair restoration. Tretinoin enhances the scalp penetration of Minoxidil and Finasteride.',
        highlights: ["Enhanced absorption", "clinical strength", "3 active ingredients", "Starts at $99/mo"],
        benefits: [
            { id: "01", title: "Deep Penetration", desc: "Tretinoin (Retin-A) exfoliates the scalp and increases permeability for the other actives.", color: "#FFDE59", image: dualActionImg },
            { id: "02", title: "Max Stimulation", desc: "Ensures more drug reaches the follicle root.", color: "#5CE1E6", image: glycemicControlImg },
            { id: "03", title: "Cell Turnover", desc: "Promotes a healthier scalp environment for growth.", color: "#7ED957", image: maxPotencyImg }
        ],
        ingredients: [
            { name: "Finasteride", desc: "DHT Blocker" },
            { name: "Minoxidil", desc: "Growth Stimulant" },
            { name: "Tretinoin", desc: "Absorption Enhancer" }
        ],
        howItWorks: [
            { id: "01", title: "Prepare the canvas.", desc: "Tretinoin clears the path." },
            { id: "02", title: "Deliver the goods.", desc: "Finasteride and Minoxidil work more effectively at the root." }
        ],
        timeline: [
            { time: "Week 2-4", step: "Scalp exfoliation" },
            { time: "Month 2-3", step: "Visible sprouting" },
            { time: "Month 6+", step: "Significant density" },
            { time: "Ongoing", step: "Daily application" }
        ],
        faqs: [
            { q: 'Why add Tretinoin?', a: 'Tretinoin improves the penetration of both Finasteride and Minoxidil by increasing skin permeability, potentially speeding up results.' },
            { q: 'How often do I apply it?', a: 'Apply once daily, preferably at night, to the areas of the scalp experiencing thinning.' },
            { q: 'Are there side effects?', a: 'Tretinoin can cause mild redness or peeling as the scalp adjusts. We recommend starting slowly if you have sensitive skin.' },
            { q: 'How long until I see results?', a: 'Most patients see a noticeable reduction in shedding within 3 to 4 months, with peak growth occurring around the 12-month mark.' }
        ],
        readyAccordion: [
            { q: "Why add Tretinoin?", a: "Evidence suggests Tretinoin can triple the absorption of Minoxidil in some patients." },
            { q: "Who is this for?", a: "Ideal for men who haven't seen enough result with standard Minoxidil alone." }
        ]
    },
    'minoxidil-max-compound-liquid': {
        name: 'Max Growth Compound',
        type: 'Topical Liquid - 5-in-1',
        price: '$129/mo',
        image: fiveInOneImg,
        heroBg: fiveInOneBg,
        description: 'Our most comprehensive formula. 5 powerful ingredients to tackle hair loss from every angle.',
        highlights: ["Most comprehensive", "Anti-inflammatory", "Nutrient rich", "Starts at $129/mo"],
        benefits: [
            { id: "01", title: "Complete Defense", desc: "Blocks DHT, stimulates growth, reduces inflammation, and nourishes the scalp.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Anti-Inflammatory", desc: "Betamethasone reduces scalp inflammation which can hinder growth.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Antioxidant Support", desc: "Vitamin E Acetate protects against oxidative stress.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Minoxidil", desc: "Stimulant" },
            { name: "Finasteride", desc: "DHT Blocker" },
            { name: "Tretinoin", desc: "Enhancer" },
            { name: "Betamethasone", desc: "Anti-inflammatory" },
            { name: "Vitamin E", desc: "Antioxidant" }
        ],
        howItWorks: [
            { id: "01", title: "Total Optimization.", desc: "Creates the perfect environment for hair to thrive." },
            { id: "02", title: "Barrier Defense.", desc: "Protects against multiple causes of follicle degradation." }
        ],
        timeline: [
            { time: "Month 1", step: "Healthier scalp" },
            { time: "Month 3", step: "Robust regrowth" },
            { time: "Month 6+", step: "Transformation" },
            { time: "Ongoing", step: "Daily nightly use" }
        ],
        faqs: [
            { q: 'Is this formula too strong?', a: 'For aggressive hair loss, a multi-modal approach is often necessary. The various ingredients target different pathways of hair miniaturization.' },
            { q: 'What is the role of Betamethasone?', a: 'It is a mild corticosteroid that reduces scalp inflammation, creating a healthier environment for the growth stimulants to work.' },
            { q: 'How long until I see results?', a: 'Due to the potentiating effect of Tretinoin, many users see initial stabilization within 60-90 days.' },
            { q: 'Are there side effects?', a: 'As with all topical combinations, localized redness or dryness can occur. Systemic side effects are rare.' }
        ],
        readyAccordion: [
            { q: "What makes this 'Max'?", a: "It includes anti-inflammatories and antioxidants alongside the standard growth agents." },
            { q: "Can I use this long term?", a: "Yes, under doctor supervision, specifically to monitor the steroid component (Betamethasone)." }
        ]
    },
    'sildenafil-tadalafil-troche': {
        name: 'Dual Performance Formula',
        type: 'Fast Absorb Troche (2-in-1)',
        price: '$89/mo',
        image: sildenafilTadalafilPrdImg,
        heroBg: sildenafilTadalafilTabletsBg,
        description: 'The ultimate dual-action formula. Combines the rapid onset of Sildenafil with the sustained duration of Tadalafil in a fast-dissolving troche.',
        highlights: ["Rapid Onset (15-30m)", "Up to 36-hour window", "Custom compounded", "Starts at $89/mo"],
        benefits: [
            { id: "01", title: "Best of Both", desc: "Sildenafil provides the strong peak, while Tadalafil ensures you are ready anytime for up to 36 hours.", color: "#FFDE59", image: dualActionImg },
            { id: "02", title: "Rapid Absorption", desc: "Sublingual troches bypass digestion for faster entry into the bloodstream.", color: "#5CE1E6", image: glycemicControlImg },
            { id: "03", title: "Confidence", desc: "Eliminate performance anxiety with a protocol that covers all bases.", color: "#7ED957", image: maxPotencyImg }
        ],
        ingredients: [
            { name: "Sildenafil", desc: "Potent PDE5 inhibitor for strong erections." },
            { name: "Tadalafil", desc: "Long-acting PDE5 inhibitor for sustained readiness." }
        ],
        howItWorks: [
            { id: "01", title: "Dissolve.", desc: "Place under tongue 30 minutes before activity." },
            { id: "02", title: "Engage.", desc: "Supports blood flow when stimulated." }
        ],
        timeline: [
            { time: "15-30m", step: "Initial absorption" },
            { time: "1-4h", step: "Peak effect" },
            { time: "36h", step: "Window of opportunity" },
            { time: "Ongoing", step: "As needed use" }
        ],
        faqs: [
            { q: 'Can I take this daily?', a: 'This is typically prescribed for use as needed, but consult your provider.' }
        ],
        readyAccordion: [
            { q: "Why a troche?", a: "Troches dissolve in the mouth, allowing medication to enter the bloodstream directly, often working faster than swallowed pills." },
            { q: "Is it safe?", a: "These are FDA-approved ingredients compounded by licensed pharmacies. Safety screening is required." }
        ]
    },
    'sildenafil-yohimbe-troche': {
        name: 'Synergy Performance Formula',
        type: 'Fast Absorb Troche (2-in-1)',
        price: '$79/mo',
        image: sildenafilYohimbePrdImg,
        heroBg: sildenafilYohimbeBg,
        description: 'The clinically proven combination of blood flow enhancement and libido stimulation. Sildenafil provides the physical support while Yohimbe enhances desire and drive.',
        highlights: ["Enhanced libido", "Rapid onset (15-20m)", "Natural stimulant", "Starts at $79/mo"],
        benefits: [
            { id: "01", title: "Drive Amplification", desc: "Yohimbe is an alpha-2 antagonist that increases centrally mediated sexual drive and arousal.", color: "#FFDE59", image: clinicalBreakthroughImg },
            { id: "02", title: "Physical Support", desc: "Sildenafil ensures strong, reliable blood flow for optimal erectile function.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Heightened Sensitivity", desc: "The combination enhances both mental desire and physical performance for complete confidence.", color: "#7ED957", image: dualActionImg }
        ],
        ingredients: [
            { name: "Sildenafil", desc: "A potent PDE5 inhibitor that increases blood flow for strong, reliable erections." },
            { name: "Yohimbe Extract", desc: "A natural alpha-2 antagonist that enhances libido and sexual arousal from the central nervous system." }
        ],
        howItWorks: [
            { id: "01", title: "Dual Pathway Activation.", desc: "Sildenafil works peripherally to enhance blood flow, while Yohimbe works centrally to increase sexual desire and arousal." },
            { id: "02", title: "Synergistic Enhancement.", desc: "The combination addresses both the physical and psychological aspects of sexual performance for comprehensive support." }
        ],
        timeline: [
            { time: "15-20 min", step: "Initial onset" },
            { time: "45-60 min", step: "Peak effectiveness" },
            { time: "4-6 hours", step: "Duration of effects" },
            { time: "As needed", step: "Flexible dosing" }
        ],
        faqs: [
            { q: 'Will it make me jittery?', a: 'Yohimbe can cause mild stimulation in some individuals. Start with the lowest effective dose to assess your tolerance.' },
            { q: 'How is this different from Sildenafil alone?', a: 'The addition of Yohimbe provides enhanced libido and desire, addressing both the physical and mental aspects of sexual performance.' },
            { q: 'When should I take it?', a: 'Take 15-30 minutes before anticipated sexual activity. The troche dissolves under the tongue for faster absorption than traditional pills.' }
        ],
        readyAccordion: [
            { q: "What is Sildenafil/Yohimbe combination?", a: "A custom-compounded fast-absorb troche that combines FDA-approved Sildenafil with natural Yohimbe extract to enhance both physical performance and sexual desire." },
            { q: "Are there side effects?", a: "Common side effects may include mild stimulation, headache, flushing, or increased heart rate. These are typically mild. Consult your provider if you have cardiovascular concerns." },
            { q: "How long until I see results?", a: "Most men experience effects within 15-30 minutes of taking the troche, with peak effectiveness at 45-60 minutes and benefits lasting 4-6 hours." }
        ]
    },
    'sildenafil-tadalafil-tablets': {
        name: 'Dual Action Tablets',
        type: 'Oral Tablets',
        price: '$69/mo',
        image: sildenafilTadalafilTabletsPrdImg,
        heroBg: sildenafilTadalafilBg,
        description: 'The clinically proven dual-action oral treatment combining the rapid onset of Sildenafil with the extended duration of Tadalafil for complete confidence.',
        highlights: ["Dual-action formula", "Up to 36-hour window", "FDA-approved ingredients", "Starts at $69/mo"],
        benefits: [
            { id: "01", title: "Dual Mechanism", desc: "Combines Sildenafil's powerful peak effect with Tadalafil's long-lasting support for maximum flexibility.", color: "#FFDE59", image: dualActionImg },
            { id: "02", title: "Extended Window", desc: "Enjoy spontaneity with an effectiveness window of up to 36 hours from a single dose.", color: "#5CE1E6", image: glycemicControlImg },
            { id: "03", title: "Proven Efficacy", desc: "Both ingredients are FDA-approved PDE5 inhibitors with decades of clinical validation.", color: "#7ED957", image: maxPotencyImg }
        ],
        ingredients: [
            { name: "Sildenafil", desc: "A potent PDE5 inhibitor that increases blood flow for strong, reliable erections." },
            { name: "Tadalafil", desc: "A long-acting PDE5 inhibitor providing sustained support for up to 36 hours." }
        ],
        howItWorks: [
            { id: "01", title: "Targets the Root Cause.", desc: "PDE5 inhibitors work by relaxing blood vessels and increasing blood flow to support natural erectile function when sexually stimulated." },
            { id: "02", title: "Synergistic Action.", desc: "The combination provides both immediate and sustained effects, giving you confidence whenever the moment is right." }
        ],
        timeline: [
            { time: "30-60 min", step: "Initial onset" },
            { time: "1-2 hours", step: "Peak effectiveness" },
            { time: "24-36 hours", step: "Extended window" },
            { time: "As needed", step: "Flexible dosing" }
        ],
        faqs: [
            { q: 'When should I take it?', a: 'Take 30-60 minutes before anticipated sexual activity. The effects can last up to 36 hours.' },
            { q: 'Can I take it with food?', a: 'Yes, though high-fat meals may slightly delay absorption. For fastest results, take on an empty stomach.' },
            { q: 'Is it safe to combine both medications?', a: 'When properly dosed and prescribed by a licensed provider, this combination is safe and effective for most men.' }
        ],
        readyAccordion: [
            { q: "What is Sildenafil/Tadalafil combination?", a: "A custom-compounded oral medication that combines two FDA-approved PDE5 inhibitors to provide both rapid onset and extended duration for erectile dysfunction treatment." },
            { q: "Are there side effects?", a: "Common side effects may include headache, flushing, nasal congestion, or indigestion. These are typically mild and temporary. Consult your provider if you experience any concerning symptoms." },
            { q: "How long until I see results?", a: "Most men experience effects within 30-60 minutes of taking the medication, with peak effectiveness at 1-2 hours and benefits lasting up to 36 hours." }
        ]
    },
    'oxytocin-troche': {
        name: 'Oxytocin',
        type: 'Sublingual Troche',
        price: '$129/mo',
        image: oxytocinTabletsPrd,
        heroBg: oxytocinPrdImg,
        description: 'The "Love Hormone" designed to enhance emotional connection, intimacy, and climax intensity. Oxytocin promotes bonding, trust, and heightened physical sensation.',
        highlights: ["Enhanced intimacy", "Emotional bonding", "Increased sensitivity", "Starts at $129/mo"],
        benefits: [
            { id: "01", title: "Emotional Connection", desc: "Promotes feelings of bonding, trust, and emotional closeness with your partner.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Heightened Sensation", desc: "Can enhance physical sensitivity and increase orgasm intensity for both men and women.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Stress Reduction", desc: "Reduces cortisol levels to create a relaxed, open state conducive to intimacy.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Oxytocin", desc: "A naturally occurring peptide hormone that plays a key role in social bonding, sexual reproduction, and emotional connection." }
        ],
        howItWorks: [
            { id: "01", title: "Sublingual Absorption.", desc: "The troche dissolves under the tongue, allowing oxytocin to enter the bloodstream directly for rapid onset." },
            { id: "02", title: "Central Nervous System.", desc: "Oxytocin acts on receptors in the brain to promote feelings of trust, bonding, and relaxation while enhancing physical sensitivity." }
        ],
        timeline: [
            { time: "10-15 min", step: "Initial onset" },
            { time: "30-45 min", step: "Peak effectiveness" },
            { time: "1-2 hours", step: "Duration of effects" },
            { time: "As needed", step: "Flexible dosing" }
        ],
        faqs: [
            { q: 'Is this only for women?', a: 'No, oxytocin is effective for both men and women to enhance bonding, intimacy, and sexual satisfaction.' },
            { q: 'How does it feel?', a: 'Most patients report a subtle sense of warmth, relaxation, emotional openness, and heightened physical sensitivity.' },
            { q: 'When should I take it?', a: 'Take 15-30 minutes before intimate activity. The troche dissolves under the tongue for faster absorption.' }
        ],
        readyAccordion: [
            { q: "What is Oxytocin?", a: "Oxytocin is a naturally occurring peptide hormone often called the 'love hormone' or 'bonding hormone' that enhances emotional connection, trust, and physical intimacy." },
            { q: "Are there side effects?", a: "Oxytocin is generally well-tolerated. Some individuals may experience mild headache, nausea, or flushing. These effects are typically mild and temporary." },
            { q: "How long until I see results?", a: "Most people experience effects within 10-15 minutes of taking the troche, with peak effectiveness at 30-45 minutes and benefits lasting 1-2 hours." }
        ]
    },
    'oxytocin-nasal-spray': {
        name: 'Oxytocin',
        type: 'Nasal Spray',
        price: '$119/mo',
        image: oxytocinNasalPrd,
        heroBg: oxytocinNasalBg,
        description: 'Direct-to-brain delivery. The fastest way to boost oxytocin levels for immediate intimacy support and emotional connection.',
        highlights: ["Fastest onset (5-10m)", "Direct brain delivery", "Precise dosing", "Starts at $119/mo"],
        benefits: [
            { id: "01", title: "Speed", desc: "Nasal delivery provides the quickest path to the brain, bypassing the digestive system entirely.", color: "#FFDE59", image: dualActionImg },
            { id: "02", title: "Efficiency", desc: "Direct absorption across the blood-brain barrier ensures maximum potency and central effects.", color: "#5CE1E6", image: glycemicControlImg },
            { id: "03", title: "Bonding", desc: "Instant support for social connection, trust, and romantic intimacy.", color: "#7ED957", image: maxPotencyImg }
        ],
        ingredients: [
            { name: "Oxytocin", desc: "A naturally occurring peptide hormone that plays a key role in social bonding and intimacy." }
        ],
        howItWorks: [
            { id: "01", title: "Intranasal Delivery.", desc: "The nasal mucosa offers a direct pathway to the brain via the olfactory and trigeminal nerves." },
            { id: "02", title: "Rapid Action.", desc: "Bypassing metabolism allows for onset of effects in as little as 5-10 minutes." }
        ],
        timeline: [
            { time: "5-10 min", step: "Initial onset" },
            { time: "30-45 min", step: "Peak effect" },
            { time: "1-2 hours", step: "Duration" },
            { time: "As needed", step: "Flexible use" }
        ],
        faqs: [
            { q: 'Do I need to refrigerate it?', a: 'Yes, oxytocin is a peptide and maintains potency best when refrigerated.' },
            { q: 'Does it hurt?', a: 'No, it is a gentle mist. Mild nasal irritation is rare but possible.' },
            { q: 'How often can I use it?', a: 'Typically used as needed before intimate activities, but follow your provider\'s instructions.' }
        ],
        readyAccordion: [
            { q: "Why nasal spray?", a: "It is the most efficient non-injection route for peptides to cross the blood-brain barrier for maximum central effects." },
            { q: "How to use?", a: "Administer one spray per nostril 10-15 minutes before desired effect. Tilt head back slightly to ensure absorption." },
            { q: "Common side effects", a: "Generally well tolerated. Mild nasal congestion, headache, or temporary irritation can occur." }
        ]
    },
    'nad-nasal-spray': {
        name: 'NAD+',
        type: 'Nasal Spray',
        price: '$99/mo',
        image: nadSprayPrd,
        heroBg: nadNasalSprayBg,
        description: 'Brain fuel. Replenish your cellular energy levels directly through the blood-brain barrier for enhanced mental clarity and focus.',
        highlights: ["Boosts brain energy", "Direct CNS delivery", "Non-invasive", "Starts at $99/mo"],
        benefits: [
            { id: "01", title: "Mental Clarity", desc: "Restores NAD+ levels in the brain to reduce brain fog and improve focus.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "DNA Repair", desc: "Supports sirtuin activity, which helps repair damaged DNA and regulate cellular aging.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Energy Boost", desc: "Enhances mitochondrial function for better sustained mental and physical energy.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "NAD+", desc: "Nicotinamide Adenine Dinucleotide, a coenzyme found in all living cells." }
        ],
        howItWorks: [
            { id: "01", title: "Nasal Absorption.", desc: "Bypasses the digestive system for direct delivery to the bloodstream and brain." },
            { id: "02", title: "Cellular Fuel.", desc: "Feeds mitochondria to create ATP (energy) for your cells." }
        ],
        timeline: [
            { time: "Day 1", step: "Initial energy boost" },
            { time: "Week 2", step: "Improved clarity" },
            { time: "Month 1+", step: "Enhanced vitality" }
        ],
        faqs: [
            { q: 'How often do I use it?', a: 'Typically 1-2 sprays per nostril daily, or as directed.' },
            { q: 'Does it burn?', a: 'Some users experience a brief tingling sensation.' }
        ],
        readyAccordion: [
            { q: "What is NAD+?", a: "A critical coenzyme that declines with age, leading to fatigue and cellular dysfunction." },
            { q: "Why nasal spray?", a: "It offers a convenient, needle-free way to boost NAD+ levels efficiently." }
        ],
        strengths: [
            {
                dosage: '100 mg/mL (15 mL)', plans: [
                    { name: 'Monthly', price: '$124.99', badge: '' },
                ]
            },
            {
                dosage: '100 IU (15 mL)', plans: [
                    { name: 'Monthly', price: '$149.99', badge: '' },
                ]
            },
        ]
    },
    'nad-injection': {
        name: 'NAD+',
        type: 'Subcutaneous Injection',
        price: '$119.99/mo',
        image: nadInjectionPrd,
        heroBg: nadInjectionImg,
        description: 'Pharmaceutical-grade NAD+ delivered directly into circulation for maximum cellular repair and energy production.',
        highlights: ['200 mg/mL (5 mL)', 'Bypasses digestion', 'Cellular repair', 'Physician-prescribed'],
        benefits: [
            { id: "01", title: "Max Energy", desc: "Direct delivery boosts ATP production in mitochondria for physical and mental vitality.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "DNA Repair", desc: "NAD+ acts as a critical substrate for enzymes that fix age-related DNA damage.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Neuro-Protection", desc: "Supports cognitive function and reduces oxidative stress in brain tissue.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [{ name: "NAD+", desc: "Nicotinamide Adenine Dinucleotide — a vital coenzyme found in all living cells." }],
        howItWorks: [
            { id: "01", title: "Direct Absorption.", desc: "Injection bypasses the GI tract, where NAD+ is typically degraded before absorption." }
        ],
        timeline: [{ time: "Day 1-3", step: "Initial energy lift" }, { time: "Week 2", step: "Mental clarity improved" }],
        faqs: [{ q: 'How often do I inject?', a: 'Dosing frequency is determined by your provider based on your specific health needs.' }],
        readyAccordion: [
            { q: "Why injections?", a: "Injections bypass the digestive system where NAD+ is often broken down, ensuring maximum potency." },
            { q: "Is it safe?", a: "Yes, NAD+ is a naturally occurring molecule in your body." }
        ],
        strengths: [
            {
                dosage: '200 mg/mL (5 mL)', plans: [
                    { name: 'Monthly', price: '$119.99', badge: '' },
                ]
            }
        ]
    },
    'glutathione-injection': {
        name: 'Glutathione',
        type: 'Subcutaneous Injection',
        price: '$64.99/mo',
        image: glutathionePrd,
        heroBg: glutathioneBg,
        description: 'The "Master Antioxidant" for detoxification, skin brightness, and immune support.',
        highlights: ['200 mg/mL (10 mL)', 'Detoxification support', 'Immune health', 'Physician-prescribed'],
        benefits: [
            { id: "01", title: "Deep Detox", desc: "Glutathione binds to toxins and heavy metals to assist the liver in safe removal.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Skin Glow", desc: "Known for promoting a brighter, more even-toned complexion from the inside out.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Immune Shield", desc: "Neutralises free radicals and supports white blood cell function.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [{ name: "Glutathione", desc: "The body's most powerful internal antioxidant, composed of three amino acids." }],
        howItWorks: [
            { id: "01", title: "Oxidative Balance.", desc: "Glutathione regenerates vitamins C and E to maintain a stable antioxidant state." }
        ],
        timeline: [{ time: "Week 1", step: "Improved recovery" }, { time: "Month 1", step: "Visible skin radiance" }],
        faqs: [
            { q: 'Can I take it orally?', a: 'Oral glutathione is poorly absorbed. Injections are far more effective.' }
        ],
        readyAccordion: [
            { q: "What is Glutathione?", a: "The most robust antioxidant naturally produced by the body, crucial for health and aging." }
        ],
        strengths: [
            {
                dosage: '200 mg/mL (10 mL)', plans: [
                    { name: 'Monthly', price: '$64.99', badge: '' },
                ]
            }
        ]
    },

    // ─── Hormone Therapy ───────────────────────────────────────────────────────
    'testosterone-injection': {
        name: 'Testosterone',
        type: 'Subcutaneous Injection',
        price: '$149/mo',
        image: testosteroneInjectionImg,
        heroBg: testosteroneInjectionImg,
        description: 'Restore your hormonal edge. Clinically compounded testosterone therapy to optimise energy, muscle, libido and mental clarity.',
        highlights: ["Physician-prescribed", "Boosts energy & libido", "Increase lean muscle", "Starts at $149/mo"],
        benefits: [
            { id: "01", title: "Energy & Drive", desc: "Restores testosterone to optimal levels, reviving energy, motivation and focus.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Lean Muscle", desc: "Supports protein synthesis for increased strength and muscle retention.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Sexual Health", desc: "Improves libido, erectile function and overall intimate performance.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Testosterone Cypionate", desc: "A long-acting ester form of testosterone for stable, sustained hormone levels." }
        ],
        howItWorks: [
            { id: "01", title: "Binds Androgen Receptors.", desc: "Signals muscle, bone and brain cells to perform optimally." },
            { id: "02", title: "Restores Hormonal Balance.", desc: "Brings free and total testosterone back to healthy ranges within weeks." }
        ],
        timeline: [
            { time: "Week 1-2", step: "Improved energy" },
            { time: "Month 1", step: "Libido returns" },
            { time: "Month 3+", step: "Lean muscle gains" }
        ],
        faqs: [
            { q: 'Do I need labs?', a: 'Yes. We require baseline lab work to ensure your safety and proper dosing.' },
            { q: 'Is it safe long-term?', a: 'When prescribed and monitored correctly, TRT is well-tolerated and highly effective long-term.' }
        ],
        readyAccordion: [
            { q: "What is TRT?", a: "Testosterone Replacement Therapy restores testosterone to healthy levels under the supervision of a licensed provider." }
        ],
        strengths: [
            {
                dosage: 'TBA', plans: [
                    { name: 'Monthly', price: '$99.99', badge: '' },
                ]
            }
        ]
    },
    'testosterone-rdt': {
        name: 'Testosterone (RDT)',
        type: 'Rapid Dissolve Tablet',
        price: '$125/mo',
        image: testosteroneRdtImg,
        heroBg: testosteroneRdtImg,
        description: 'Needle-free testosterone replacement. Rapid-dissolve tablets deliver physician-prescribed hormones efficiently through the sublingual pathway.',
        highlights: ['TBA', 'Needle-free technology', 'Optimises energy & mood', 'Physician-prescribed'],
        benefits: [
            { id: "01", title: "Needle-Free", desc: "Dissolves under the tongue, bypassing the need for painful weekly injections.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Steady Levels", desc: "Designed for consistent absorption to avoid the \"peaks and valleys\" of other methods.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Convenience", desc: "Discreet and easy to take anywhere — no supplies or disposal required.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Testosterone", desc: "Bioidentical testosterone in a rapid-dissolve sublingual tablet." }
        ],
        howItWorks: [
            { id: "01", title: "Sublingual Absorption.", desc: "Bypasses first-pass liver metabolism for superior bioavailability." },
            { id: "02", title: "Direct Bloodstream Entry.", desc: "Quickly raises and maintains optimal testosterone levels throughout the day." }
        ],
        timeline: [
            { time: "Week 1", step: "Greater alertness" },
            { time: "Month 1", step: "Libido improvement" },
            { time: "Month 2+", step: "Sustained vitality" }
        ],
        faqs: [
            { q: 'How do I take it?', a: 'Place the tablet under your tongue and let it dissolve completely — do not swallow.' }
        ],
        readyAccordion: [
            { q: "Why choose RDT over injection?", a: "RDT is ideal for those who prefer needle-free administration with comparable efficacy." }
        ],
        strengths: [
            {
                dosage: 'TBA', plans: [
                    { name: 'Monthly', price: '$125', badge: '' },
                ]
            }
        ]
    },
    'estradiol-tabs': {
        name: 'Estradiol Tabs',
        type: 'Oral Tablets',
        price: '$30.00/mo',
        image: estPrdImg,
        heroBg: estPrdImg,
        description: 'Targeted estrogen replacement therapy to manage symptoms of hormonal decline and support long-term metabolic health.',
        highlights: ['TBA', 'Relieves symptoms', 'Supports bone health', 'Physician-prescribed'],
        benefits: [
            { id: "01", title: "Menopause Relief", desc: "Significantly reduces hot flashes, night sweats and mood swings.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Bone Protection", desc: "Helps maintain bone density, reducing fracture risk.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Mood & Cognition", desc: "Stabilises mood and supports mental clarity and memory.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Estradiol", desc: "The primary human oestrogen, bioidentical to what the body naturally produces." }
        ],
        howItWorks: [
            { id: "01", title: "Binds Oestrogen Receptors.", desc: "Activates receptors in the brain, bone and reproductive tissues." },
            { id: "02", title: "Hormone Replacement.", desc: "Replaces declining oestrogen to restore pre-menopausal hormonal balance." }
        ],
        timeline: [
            { time: "Week 2", step: "Hot flash reduction" },
            { time: "Month 1", step: "Improved sleep" },
            { time: "Month 3+", step: "Bone & mood support" }
        ],
        faqs: [
            { q: 'Is it safe?', a: 'Yes. Bioidentical oestrogen prescribed by a licensed provider is safe and well-studied.' }
        ],
        readyAccordion: [
            { q: "What is HRT?", a: "Hormone Replacement Therapy replenishes declining hormones to relieve symptoms and protect long-term health." }
        ],
        strengths: [
            {
                dosage: 'TBA', plans: [
                    { name: 'Monthly', price: '$30.00', badge: '' },
                ]
            }
        ]
    },

    // ─── Skin Care ─────────────────────────────────────────────────────────────
    'anti-aging-cream': {
        name: 'Anti-Aging Cream',
        type: 'Topical Cream',
        price: '$79/mo',
        image: antiAgingImg,
        heroBg: antiAgingImg,
        description: 'Turn back the clock. Our prescription-grade anti-aging cream combines retinoids, peptides and growth factors to visibly rejuvenate skin.',
        highlights: ["Prescription retinoid formula", "Reduces fine lines", "Boosts collagen", "Starts at $79/mo"],
        benefits: [
            { id: "01", title: "Wrinkle Reduction", desc: "Retinoids increase cell turnover to visibly smooth fine lines and wrinkles.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Collagen Boost", desc: "Peptides stimulate collagen production for firmer, plumper skin.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Radiant Complexion", desc: "Brightens dull skin and evens tone for a luminous, youthful glow.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Tretinoin", desc: "A clinically proven retinoid that accelerates skin cell renewal." },
            { name: "Niacinamide", desc: "Reduces inflammation and minimises pore size while brightening." }
        ],
        howItWorks: [
            { id: "01", title: "Accelerates Cell Turnover.", desc: "Old, damaged skin cells are replaced faster, revealing fresher skin beneath." },
            { id: "02", title: "Stimulates Collagen.", desc: "Peptides signal fibroblasts to produce more structural collagen." }
        ],
        timeline: [
            { time: "Week 2", step: "Skin texture improves" },
            { time: "Month 1", step: "Fine lines soften" },
            { time: "Month 3+", step: "Radiant complexion" }
        ],
        faqs: [
            { q: 'Can I use it daily?', a: 'Start every other night, gradually increasing to nightly use as tolerated.' }
        ],
        readyAccordion: [
            { q: "Who is this for?", a: "Anyone looking to reduce visible signs of aging with a clinically backed topical treatment." }
        ],
        strengths: [
            {
                dosage: 'TBA', plans: [
                    { name: 'Once', price: '$79.99', badge: '' },
                    { name: 'Every 2 Mo', price: '$69.99', badge: '' },
                    { name: 'Monthly', price: '$35.00', badge: 'Best Value' },
                ]
            }
        ]
    },
    'face-spot-peel': {
        name: 'Face Spot Peel',
        type: 'Topical Peel',
        price: '$69/mo',
        image: faceSpotCreamImg,
        heroBg: faceSpotCreamImg,
        description: 'Target stubborn dark spots and uneven pigmentation with our medical-grade chemical peel. Reveal brighter, more uniform skin in weeks.',
        highlights: ["Fades dark spots", "Evens skin tone", "Prescription-grade AHAs", "Starts at $69/mo"],
        benefits: [
            { id: "01", title: "Pigment Correction", desc: "Alpha hydroxy acids dissolve the bonds holding pigmented cells together.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Smoother Texture", desc: "Chemical exfoliation reveals softer, refined skin underneath.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Brightening Effect", desc: "Kojic acid and Vitamin C inhibit melanin to leave skin visibly luminous.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Glycolic Acid", desc: "A powerful AHA that exfoliates and lightens pigmentation." },
            { name: "Kojic Acid", desc: "Naturally derived melanin inhibitor for spot fading." }
        ],
        howItWorks: [
            { id: "01", title: "Dissolves Surface Cells.", desc: "AHAs loosen dead, pigmented skin cells to reveal brighter skin." },
            { id: "02", title: "Inhibits Melanin.", desc: "Kojic acid blocks the enzyme responsible for dark spot formation." }
        ],
        timeline: [
            { time: "Day 3", step: "Peeling begins" },
            { time: "Week 2", step: "Spots visibly lighter" },
            { time: "Month 2", step: "Even complexion" }
        ],
        faqs: [
            { q: 'How often should I peel?', a: 'Typically once every 2–4 weeks depending on your skin type and provider guidance.' }
        ],
        readyAccordion: [
            { q: "Is it safe for all skin tones?", a: "Our providers customise peel strength based on your skin type and melanin levels for safe, effective results." }
        ],
        strengths: [
            {
                dosage: 'TBA', plans: [
                    { name: 'Once', price: '$99.99', badge: '' },
                    { name: 'Every 2 Mo', price: '$72.00', badge: '' },
                    { name: 'Monthly', price: '$36.00', badge: 'Best Value' },
                ]
            }
        ]
    },
    'acne-cleanser': {
        name: 'Acne Cleanser',
        type: 'Topical Cleanser',
        price: '$49/mo',
        image: acneCleanserImg,
        heroBg: acneCleanserImg,
        description: 'A prescription-strength daily cleanser that combines salicylic acid and benzoyl peroxide to clear active breakouts while preventing future ones.',
        highlights: ["Prescription-strength formula", "Clears & prevents acne", "Gentle daily use", "Starts at $49/mo"],
        benefits: [
            { id: "01", title: "Deep Pore Cleansing", desc: "Salicylic acid penetrates pores to dissolve excess oil and dead skin cells.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Bacteria Elimination", desc: "Benzoyl peroxide kills acne-causing bacteria on contact.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Breakout Prevention", desc: "Daily use keeps pores clear and skin balanced to prevent future acne.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Salicylic Acid", desc: "A BHA that exfoliates inside the pore to prevent congestion." },
            { name: "Benzoyl Peroxide", desc: "Kills P. acnes bacteria and reduces inflammation." }
        ],
        howItWorks: [
            { id: "01", title: "Exfoliates Inside Pores.", desc: "Salicylic acid unclogs comedones before they become breakouts." },
            { id: "02", title: "Antimicrobial Action.", desc: "Benzoyl peroxide creates an oxygen-rich environment hostile to bacteria." }
        ],
        timeline: [
            { time: "Day 7", step: "Redness reduces" },
            { time: "Week 3", step: "Fewer active pimples" },
            { time: "Month 2", step: "Clear, balanced skin" }
        ],
        faqs: [
            { q: 'Can I use it twice a day?', a: 'Yes, morning and evening use is recommended for best results.' }
        ],
        readyAccordion: [
            { q: "How is this different from drugstore cleansers?", a: "Our formula uses prescription-level concentrations compounded specifically for your skin by licensed providers." }
        ],
        strengths: [
            {
                dosage: 'TBA', plans: [
                    { name: 'Once', price: '$84.99', badge: '' },
                    { name: 'Every 2 Mo', price: '$59.99', badge: '' },
                    { name: 'Monthly', price: '$29.99', badge: 'Best Value' },
                ]
            }
        ]
    },
    'rosacea-red-cream': {
        name: 'Rosacea Relief Cream',
        type: 'Topical Cream',
        price: '$79/mo',
        image: rosaceaCareImg,
        heroBg: rosaceaCareImg,
        description: 'Calm redness and visible blood vessels with our compounded rosacea cream. Combines metronidazole and azelaic acid for lasting relief.',
        highlights: ["Reduces redness & flushing", "Prescription metronidazole", "Anti-inflammatory formula", "Starts at $79/mo"],
        benefits: [
            { id: "01", title: "Redness Reduction", desc: "Metronidazole reduces visible redness, papules and pustules.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Anti-Inflammatory", desc: "Azelaic acid calms inflamed skin and reduces pore congestion.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Barrier Repair", desc: "Strengthens the skin barrier to reduce sensitivity to triggers.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Metronidazole", desc: "An antiparasitic and antibacterial agent proven to treat rosacea lesions." },
            { name: "Azelaic Acid", desc: "Reduces redness, kills bacteria and normalises skin cell growth." }
        ],
        howItWorks: [
            { id: "01", title: "Reduces Demodex.", desc: "Metronidazole targets the mites and bacteria associated with rosacea flares." },
            { id: "02", title: "Calms Inflammation.", desc: "Azelaic acid inhibits inflammatory pathways responsible for flushing." }
        ],
        timeline: [
            { time: "Week 2", step: "Flushing reduces" },
            { time: "Month 1", step: "Pimples clear" },
            { time: "Month 3+", step: "Sustained calm skin" }
        ],
        faqs: [
            { q: 'Can I wear makeup over it?', a: 'Yes. Apply the cream first, allow it to absorb, then apply your usual makeup.' }
        ],
        readyAccordion: [
            { q: "What triggers rosacea?", a: "Sun, alcohol, spicy food and stress are common triggers. Our cream helps manage flares from all causes." }
        ],
        strengths: [
            {
                dosage: 'TBA', plans: [
                    { name: 'Once', price: '$114.99', badge: '' },
                    { name: 'Every 2 Mo', price: '$79.99', badge: '' },
                    { name: 'Monthly', price: '$39.99', badge: 'Best Value' },
                ]
            }
        ]
    },
    'eye-serum': {
        name: 'Eye Serum',
        type: 'Topical Serum',
        price: '$59/mo',
        image: eyeSerumImg,
        heroBg: eyeSerumImg,
        description: `Brighten dark circles, lift puffiness and smooth crow's feet. Our targeted eye serum delivers prescription peptides and caffeine directly where you need them.`,
        highlights: ["Brightens dark circles", "Reduces puffiness", "Smooths crow's feet", "Starts at $59/mo"],
        benefits: [
            { id: "01", title: "Dark Circle Fading", desc: "Vitamin K and peptides reduce pooled blood and pigmentation around eyes.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "De-Puffing", desc: "Caffeine constricts blood vessels and drains lymphatic fluid to reduce swelling.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Line Smoothing", desc: "Retinol peptides firm the delicate eye contour area.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Caffeine", desc: "Constricts capillaries and reduces puffiness around the eye area." },
            { name: "Vitamin K", desc: "Reduces dark circles caused by vascular pooling." }
        ],
        howItWorks: [
            { id: "01", title: "Vasoconstrictive Action.", desc: "Caffeine tightens dilated capillaries that contribute to puffiness." },
            { id: "02", title: "Peptide Stimulation.", desc: "Growth-factor peptides increase collagen around the eye area." }
        ],
        timeline: [
            { time: "Day 7", step: "Puffiness reduced" },
            { time: "Week 3", step: "Circles lighter" },
            { time: "Month 2+", step: "Lines visibly smoother" }
        ],
        faqs: [
            { q: 'How do I apply it?', a: 'Gently tap with your ring finger around the orbital bone — morning and night.' }
        ],
        readyAccordion: [
            { q: "Can I use this with other serums?", a: "Yes, apply this first as it is the most lightweight, then layer heavier products on top." }
        ],
        strengths: [
            {
                dosage: 'TBA', plans: [
                    { name: 'Once', price: '$114.99', badge: '' },
                    { name: 'Monthly', price: '$79.99', badge: 'Best Value' },
                ]
            }
        ]
    },
    'body-acne-cream': {
        name: 'Body Acne Cream',
        type: 'Topical Cream',
        price: '$59/mo',
        image: bodyAcneCreamImg,
        heroBg: bodyAcneCreamImg,
        description: 'Tackle chest, back and shoulder breakouts with prescription-strength body acne treatment. Clears existing acne and prevents new ones from forming.',
        highlights: ["Clears body acne fast", "Prescription-level strength", "Safe for large areas", "Starts at $59/mo"],
        benefits: [
            { id: "01", title: "Rapid Clearing", desc: "High-concentration salicylic acid clears clogged pores across large skin areas.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Anti-Bacterial", desc: "Benzoyl peroxide eliminates body acne bacteria on contact.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Scar Prevention", desc: "Early treatment prevents post-inflammatory hyperpigmentation and scarring.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Salicylic Acid", desc: "Oil-soluble BHA that penetrates and clears clogged follicles on large skin surfaces." },
            { name: "Benzoyl Peroxide", desc: "Antibacterial agent customised to low concentrations for body use." }
        ],
        howItWorks: [
            { id: "01", title: "Penetrates Follicles.", desc: "Salicylic acid liquefies sebum plugs across chest and back." },
            { id: "02", title: "Kills Surface Bacteria.", desc: "Benzoyl peroxide creates an inhospitable environment for acne bacteria." }
        ],
        timeline: [
            { time: "Week 1", step: "Less inflammation" },
            { time: "Week 3", step: "Fewer breakouts" },
            { time: "Month 2+", step: "Clear, smooth skin" }
        ],
        faqs: [
            { q: 'Can I use it daily?', a: 'Yes. Apply to clean, dry skin once daily or as directed by your provider.' }
        ],
        readyAccordion: [
            { q: "Will it bleach my clothes?", a: "Benzoyl peroxide can bleach fabric — allow the cream to fully absorb before dressing." }
        ],
        strengths: [
            {
                dosage: 'TBA', plans: [
                    { name: 'Once', price: '$139.99', badge: '' },
                    { name: 'Monthly', price: '$99.99', badge: 'Best Value' },
                ]
            }
        ]
    },

    // ─── Hair Loss Tabs ────────────────────────────────────────────────────────
    'hair-growth-tabs-3in1': {
        name: '3-in-1 Hair Growth Tabs', type: 'Oral Tablet', price: '$99.99',
        image: finasterideBottleImg, heroBg: finasterideHeroImg,
        description: 'The all-in-one oral solution for hair loss. Three clinically active ingredients in a single daily tablet.',
        highlights: ['3 active ingredients', 'Once-daily tablet', 'Clinician-prescribed', 'No topical required'],
        benefits: [
            { id: '01', title: 'DHT Blocking', desc: 'Targets the root hormonal cause of male pattern hair loss.', color: '#FFDE59', image: hormonalMasteryImg },
            { id: '02', title: 'Follicle Stimulation', desc: 'Promotes blood flow and nutrient delivery to follicles.', color: '#5CE1E6', image: metabolicPrecisionImg },
            { id: '03', title: 'Scalp Health', desc: 'Supports an optimal scalp environment for growth.', color: '#7ED957', image: clinicalBreakthroughImg },
        ],
        ingredients: [{ name: '3 Active Ingredients', desc: 'Formulation confirmed at consultation with your provider.' }],
        howItWorks: [
            { id: '01', title: 'Block. Grow. Protect.', desc: 'Three mechanisms act simultaneously on the hair growth cycle.' },
            { id: '02', title: 'Systemic Delivery.', desc: 'Oral absorption ensures all follicles receive consistent treatment.' },
        ],
        timeline: [{ time: 'Month 1-3', step: 'Shedding stabilises' }, { time: 'Month 3-6', step: 'Early regrowth' }, { time: 'Month 12+', step: 'Thicker density' }],
        faqs: [{ q: 'What are the 3 ingredients?', a: 'Confirmed at consultation — typically a DHT blocker, growth stimulant, and supporting nutrient.' }],
        readyAccordion: [{ q: 'Who is this for?', a: 'Men experiencing androgenic alopecia looking for a convenient oral solution.' }],
        plans: [
            { name: '30 Day Supply', price: '$99.99', badge: 'Try First' },
            { name: '60 Day Supply', price: '$179.99', badge: '' },
            { name: '90 Day Supply', price: '$249.99', badge: 'Best Value' },
        ],
        strengths: [
            {
                dosage: 'TBA', plans: [
                    { name: '30 Day Supply', price: '$99.99', badge: 'Try First' },
                    { name: '60 Day Supply', price: '$179.99', badge: '' },
                    { name: '90 Day Supply', price: '$249.99', badge: 'Best Value' },
                ]
            }
        ]
    },
    'hair-growth-tabs-2in1': {
        name: '2-in-1 Hair Growth Tabs', type: 'Oral Tablet (1mg / 2.5mg)', price: '$89.99',
        image: hairGrowth2in1Img, heroBg: finasterideHeroImg,
        description: 'Dual-action hair restoration. Finasteride 1mg + oral Minoxidil 2.5mg in one convenient daily tablet.',
        highlights: ['Finasteride 1mg / Minoxidil 2.5mg', 'Once-daily dosing', 'No topical application', 'Clinician-prescribed'],
        benefits: [
            { id: '01', title: 'Stop Shedding', desc: 'Finasteride blocks DHT to halt follicle miniaturisation.', color: '#FFDE59', image: dualActionImg },
            { id: '02', title: 'Stimulate Growth', desc: 'Oral Minoxidil at 2.5mg extends the hair growth phase.', color: '#5CE1E6', image: glycemicControlImg },
            { id: '03', title: 'Convenient', desc: 'One tablet replaces two separate products.', color: '#7ED957', image: maxPotencyImg },
        ],
        ingredients: [
            { name: 'Finasteride 1mg', desc: '5-alpha reductase inhibitor — reduces scalp DHT.' },
            { name: 'Minoxidil 2.5mg', desc: 'Oral vasodilator — extends hair growth cycle.' },
        ],
        howItWorks: [
            { id: '01', title: 'Hormonal Blockade.', desc: 'Finasteride prevents testosterone converting to DHT.' },
            { id: '02', title: 'Growth Activation.', desc: 'Low-dose oral Minoxidil stimulates follicles through circulation.' },
        ],
        timeline: [{ time: 'Month 1-2', step: 'Reduced shedding' }, { time: 'Month 3-6', step: 'New growth visible' }, { time: 'Month 12+', step: 'Fuller density' }],
        faqs: [{ q: 'Is oral Minoxidil safe?', a: 'At 2.5mg, oral Minoxidil is well-tolerated and increasingly preferred for efficacy.' }],
        readyAccordion: [{ q: 'Why choose this over topical?', a: 'Oral dosing delivers whole-scalp coverage without topical mess.' }],
        plans: [
            { name: '30 Day Supply', price: '$89.99', badge: 'Try First' },
            { name: '60 Day Supply', price: '$159.99', badge: '' },
            { name: '90 Day Supply', price: '$224.99', badge: 'Best Value' },
        ],
        strengths: [
            {
                dosage: 'TBA', plans: [
                    { name: '30 Day Supply', price: '$89.99', badge: 'Try First' },
                    { name: '60 Day Supply', price: '$159.99', badge: '' },
                    { name: '90 Day Supply', price: '$224.99', badge: 'Best Value' },
                ]
            }
        ]
    },

    // ─── Better Sex ────────────────────────────────────────────────────────────
    'readysetgo-men': {
        name: 'ReadySetGo', type: '2-in-1 RDT (Men)', price: '$39',
        image: sildenafilTadalafilPrdImg, heroBg: sildenafilTadalafilTabletsBg,
        description: 'Triple-action rapid-dissolve tablet. Sildenafil + Tadalafil + Oxytocin for peak performance and deeper connection.',
        highlights: ['Triple active formula', 'Fast onset 15-30 min', 'Up to 36-hr window', 'Custom compounded'],
        benefits: [
            { id: '01', title: 'Rapid Onset', desc: 'Sublingual delivery reaches the bloodstream in minutes.', color: '#FFDE59', image: dualActionImg },
            { id: '02', title: 'Extended Duration', desc: 'Tadalafil keeps you ready for up to 36 hours.', color: '#5CE1E6', image: glycemicControlImg },
            { id: '03', title: 'Deeper Connection', desc: 'Oxytocin enhances emotional intimacy and bonding.', color: '#7ED957', image: maxPotencyImg },
        ],
        ingredients: [
            { name: 'Sildenafil', desc: 'Fast-acting PDE5 inhibitor.' }, { name: 'Tadalafil', desc: 'Long-acting PDE5 inhibitor.' }, { name: 'Oxytocin', desc: 'Bonding hormone.' },
        ],
        howItWorks: [
            { id: '01', title: 'Dissolve & Absorb.', desc: 'Active ingredients enter circulation within 15 minutes.' },
            { id: '02', title: 'Triple Pathway.', desc: 'Each ingredient acts on a distinct pathway for comprehensive support.' },
        ],
        timeline: [{ time: '15-30 min', step: 'Onset' }, { time: '1-2 hours', step: 'Peak' }, { time: 'Up to 36h', step: 'Window' }],
        faqs: [{ q: 'How many do I take?', a: 'One tablet as needed, 15-30 min before activity. Max one per day.' }],
        readyAccordion: [{ q: 'Why 3 ingredients?', a: 'Each targets a different aspect — physical, sustained, and emotional.' }],
        strengths: [
            {
                dosage: '40/14/2 mg', plans: [
                    { name: '6 Pack', price: '$39', badge: 'Try First' }, { name: '10 Pack', price: '$59.99', badge: '' },
                    { name: '17 Pack', price: '$94.99', badge: '' }, { name: '34 Pack', price: '$189.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '65/22/2 mg', plans: [
                    { name: '6 Pack', price: '$42', badge: 'Try First' }, { name: '10 Pack', price: '$62.99', badge: '' },
                    { name: '17 Pack', price: '$99.99', badge: '' }, { name: '34 Pack', price: '$199.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '80/22/3 mg', plans: [
                    { name: '6 Pack', price: '$45', badge: 'Try First' }, { name: '10 Pack', price: '$67.50', badge: '' },
                    { name: '17 Pack', price: '$104.99', badge: '' }, { name: '34 Pack', price: '$209.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '110/22/3 mg', plans: [
                    { name: '6 Pack', price: '$50', badge: 'Try First' }, { name: '10 Pack', price: '$74.99', badge: '' },
                    { name: '17 Pack', price: '$116.99', badge: '' }, { name: '34 Pack', price: '$229.99', badge: 'Best Value' },
                ]
            },
        ]
    },
    'growtabs-sildenafil': {
        name: 'GrowTabs (Sildenafil)', type: 'Oral Tablet (Men)', price: '$29.99',
        image: growthTabsSildenafilImg, heroBg: sildenafilTadalafilBg,
        description: 'Pure Sildenafil oral tablets. Fast, reliable erectile support with clinically proven efficacy.',
        highlights: ['Sildenafil PDE5 inhibitor', 'Onset 30-60 min', 'Flexible pack sizes', 'Physician-prescribed'],
        benefits: [
            { id: '01', title: 'Strong Erections', desc: 'Sildenafil maximises penile blood flow for reliable response.', color: '#FFDE59', image: dualActionImg },
            { id: '02', title: 'Clinically Proven', desc: 'Decades of evidence supporting safety and efficacy.', color: '#5CE1E6', image: glycemicControlImg },
            { id: '03', title: 'Two Strengths', desc: 'Choose 30mg or 45mg based on your individual response.', color: '#7ED957', image: maxPotencyImg },
        ],
        ingredients: [{ name: 'Sildenafil', desc: 'PDE5 inhibitor that increases penile blood flow when sexually stimulated.' }],
        howItWorks: [{ id: '01', title: 'PDE5 Inhibition.', desc: 'Prevents breakdown of cGMP, allowing smooth muscle relaxation and blood flow.' }, { id: '02', title: 'Natural Arousal Required.', desc: 'Works with sexual stimulation — not a standalone aphrodisiac.' }],
        timeline: [{ time: '30-60 min', step: 'Onset' }, { time: '1-4 hours', step: 'Peak effect' }],
        faqs: [{ q: 'How is 30mg different from 45mg?', a: 'Higher doses produce stronger effects. Start low and adjust based on response.' }],
        readyAccordion: [{ q: 'Do I need a prescription?', a: 'Yes. Our licensed providers prescribe after a brief online assessment.' }],
        strengths: [
            {
                dosage: '30 mg', plans: [
                    { name: '6 Pack', price: '$29.99', badge: 'Try First' }, { name: '10 Pack', price: '$44.99', badge: '' },
                    { name: '17 Pack', price: '$69.99', badge: '' }, { name: '34 Pack', price: '$139.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '45 mg', plans: [
                    { name: '6 Pack', price: '$35', badge: 'Try First' }, { name: '10 Pack', price: '$52.50', badge: '' },
                    { name: '17 Pack', price: '$83.00', badge: '' }, { name: '34 Pack', price: '$164.99', badge: 'Best Value' },
                ]
            },
        ]
    },
    'growtabs-tadalafil': {
        name: 'GrowTabs (Tadalafil)', type: 'Oral Tablet (Men)', price: '$29.99',
        image: sildenafilTadalafilTabletsPrdImg, heroBg: sildenafilTadalafilBg,
        description: 'Long-acting Tadalafil. Stay ready for up to 36 hours with a single dose.',
        highlights: ['36-hr duration', 'Daily-dose option', 'Flexible pack sizes', 'Physician-prescribed'],
        benefits: [
            { id: '01', title: '36-Hour Window', desc: 'One dose keeps you ready all day and night.', color: '#FFDE59', image: dualActionImg },
            { id: '02', title: 'Spontaneity', desc: 'No need to plan timing — Tadalafil works when you do.', color: '#5CE1E6', image: glycemicControlImg },
            { id: '03', title: 'Daily Option', desc: 'Small daily dose maintains consistent readiness.', color: '#7ED957', image: maxPotencyImg },
        ],
        ingredients: [{ name: 'Tadalafil', desc: 'Long-acting PDE5 inhibitor providing support for up to 36 hours.' }],
        howItWorks: [{ id: '01', title: 'Sustained PDE5 Inhibition.', desc: 'Longer half-life than Sildenafil gives a wider window of effectiveness.' }, { id: '02', title: 'On-Demand or Daily.', desc: 'Take as needed or as a small daily dose for continuous support.' }],
        timeline: [{ time: '45-60 min', step: 'Onset' }, { time: 'Up to 36h', step: 'Duration' }],
        faqs: [{ q: 'Can I use this daily?', a: 'Yes — at low doses Tadalafil is approved for daily use.' }],
        readyAccordion: [{ q: 'Sildenafil vs Tadalafil?', a: 'Sildenafil is faster and shorter. Tadalafil lasts much longer for greater spontaneity.' }],
        strengths: [
            {
                dosage: '6 mg', plans: [
                    { name: '6 Pack', price: '$29.99', badge: 'Try First' }, { name: '10 Pack', price: '$44.99', badge: '' },
                    { name: '17 Pack', price: '$69.99', badge: '' }, { name: '34 Pack', price: '$139.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '9 mg', plans: [
                    { name: '6 Pack', price: '$35', badge: 'Try First' }, { name: '10 Pack', price: '$52.50', badge: '' },
                    { name: '17 Pack', price: '$83.00', badge: '' }, { name: '34 Pack', price: '$164.99', badge: 'Best Value' },
                ]
            },
        ]
    },
    'quicklover-women': {
        name: 'QuickLover', type: 'RDT Oxytocin (Women)', price: '$43.99',
        image: oxytocinTabletsPrd, heroBg: oxytocinPrdImg,
        description: 'Oxytocin rapid-dissolve tablets for women. Heighten sensation, deepen connection, enhance every intimate moment.',
        highlights: ['Oxytocin love hormone', 'Fast sublingual onset', 'Enhances intimacy', 'Physician-prescribed'],
        benefits: [
            { id: '01', title: 'Heightened Sensation', desc: 'Increases physical sensitivity for more satisfying experiences.', color: '#FFDE59', image: hormonalMasteryImg },
            { id: '02', title: 'Emotional Bond', desc: 'Promotes trust, warmth and deeper emotional connection.', color: '#5CE1E6', image: metabolicPrecisionImg },
            { id: '03', title: 'Stress Relief', desc: 'Lowers cortisol for a relaxed, open state.', color: '#7ED957', image: clinicalBreakthroughImg },
        ],
        ingredients: [{ name: 'Oxytocin', desc: 'Naturally occurring peptide hormone that enhances bonding and sensitivity.' }],
        howItWorks: [{ id: '01', title: 'Sublingual Absorption.', desc: 'Dissolves under tongue for rapid bloodstream entry.' }, { id: '02', title: 'Central Nervous System.', desc: 'Acts on brain receptors for relaxation and heightened sensation.' }],
        timeline: [{ time: '10-15 min', step: 'Onset' }, { time: '30-45 min', step: 'Peak' }, { time: '1-2 hours', step: 'Duration' }],
        faqs: [{ q: 'Is this only for women?', a: 'QuickLover is formulated specifically for women.' }],
        readyAccordion: [{ q: 'How do I take it?', a: 'Place under tongue 15-30 min before intimate activity.' }],
        strengths: [
            {
                dosage: '50 IU', plans: [
                    { name: '6 Pack', price: '$43.99', badge: 'Try First' }, { name: '10 Pack', price: '$64.99', badge: '' },
                    { name: '17 Pack', price: '$102.99', badge: '' }, { name: '34 Pack', price: '$204.99', badge: 'Best Value' },
                ]
            },
            {
                dosage: '100 IU', plans: [
                    { name: '6 Pack', price: '$49.99', badge: 'Try First' }, { name: '10 Pack', price: '$74.99', badge: '' },
                    { name: '17 Pack', price: '$116.99', badge: '' }, { name: '34 Pack', price: '$229.99', badge: 'Best Value' },
                ]
            },
        ]
    },
    'loverspray-women': {
        name: 'LoverSpray', type: 'Nasal Spray Oxytocin (Women)', price: '$99.99/mo',
        image: oxytocinNasalPrd, heroBg: oxytocinNasalBg,
        description: 'Direct-to-brain oxytocin for women. The fastest way to enhance bonding, sensitivity and intimate connection.',
        highlights: ['Fastest onset 5-10 min', 'Direct brain delivery', '150 IU/mL (5 mL)', 'Physician-prescribed'],
        benefits: [
            { id: '01', title: 'Speed', desc: 'Nasal delivery reaches the brain faster than any oral route.', color: '#FFDE59', image: dualActionImg },
            { id: '02', title: 'Connection', desc: 'Instant support for emotional openness and romantic intimacy.', color: '#5CE1E6', image: glycemicControlImg },
            { id: '03', title: 'Sensitivity', desc: 'Enhances physical sensation for more satisfying experiences.', color: '#7ED957', image: maxPotencyImg },
        ],
        ingredients: [{ name: 'Oxytocin 150 IU/mL', desc: 'Pharmaceutical-grade oxytocin in a 5 mL nasal spray.' }],
        howItWorks: [{ id: '01', title: 'Intranasal Pathway.', desc: 'Crosses the blood-brain barrier via the olfactory nerve.' }, { id: '02', title: 'Rapid Effect.', desc: 'Signals brain receptors for trust, warmth and heightened sensitivity.' }],
        timeline: [{ time: '5-10 min', step: 'Onset' }, { time: '30-45 min', step: 'Peak' }, { time: '1-2 hours', step: 'Duration' }],
        faqs: [{ q: 'How do I store it?', a: 'Refrigerate when not in use. Allow to reach room temperature before spraying.' }],
        readyAccordion: [{ q: 'Why spray over tablet?', a: 'Nasal spray has the fastest onset — ideal when spontaneity matters.' }],
        strengths: [{ dosage: '150 IU/mL (5 mL)', plans: [{ name: 'Monthly', price: '$99.99', badge: '' }] }]
    },

    // ─── Repair & Healing ──────────────────────────────────────────────────────
    'bpc-157-injection': {
        name: 'BPC-157', type: 'Subcutaneous Injection', price: '$249.99/mo',
        image: bpc157Img, heroBg: bpc157Img,
        description: 'Body Protection Compound 157. A powerful regenerative peptide that accelerates healing of muscles, tendons, ligaments and joints.',
        highlights: ['TBA', 'Accelerates repair', 'Reduces inflammation', 'Physician-prescribed'],
        benefits: [
            { id: '01', title: 'Tissue Regeneration', desc: 'Stimulates growth factors to accelerate healing of damaged tissue.', color: '#FFDE59', image: hormonalMasteryImg },
            { id: '02', title: 'Anti-Inflammatory', desc: 'Powerfully reduces local and systemic inflammation.', color: '#5CE1E6', image: metabolicPrecisionImg },
            { id: '03', title: 'Gut Health', desc: 'Shown to support healing of the gastrointestinal tract lining.', color: '#7ED957', image: clinicalBreakthroughImg },
        ],
        ingredients: [{ name: 'BPC-157', desc: 'A 15-amino acid peptide fragment derived from a protective gastric protein.' }],
        howItWorks: [{ id: '01', title: 'Growth Factor Activation.', desc: 'Stimulates VEGF for blood vessel formation and tissue repair.' }],
        timeline: [{ time: 'Week 1-2', step: 'Reduced pain' }, { time: 'Month 1', step: 'Improved mobility' }],
        faqs: [{ q: 'What injuries can it help?', a: 'Tendon, ligament, muscle, joint, and gut injuries.' }],
        readyAccordion: [{ q: 'Is BPC-157 safe?', a: 'BPC-157 has a strong safety profile in research.' }],
        strengths: [{ dosage: 'TBA', plans: [{ name: 'Monthly', price: '$249.99', badge: '' }] }]
    },
    'bpc-157-tb500-injection': {
        name: 'BPC-157 / TB 500', type: 'Subcutaneous Injection', price: '$299.99/mo',
        image: bpc157Tb500Img, heroBg: bpc157Tb500Img,
        description: 'The ultimate healing stack. BPC-157 and TB-500 combined for synergistic tissue repair and accelerated recovery.',
        highlights: ['TBA', 'Maximum repair', 'Systemic recovery', 'Physician-prescribed'],
        benefits: [
            { id: '01', title: 'Synergistic Repair', desc: 'Combined local and systemic action for superior healing.', color: '#FFDE59', image: hormonalMasteryImg },
            { id: '02', title: 'Inflammation Control', desc: 'Both peptides powerfully downregulate inflammatory pathways.', color: '#5CE1E6', image: metabolicPrecisionImg },
            { id: '03', title: 'Full-Body Recovery', desc: 'TB-500 circulates for comprehensive systemic support.', color: '#7ED957', image: clinicalBreakthroughImg },
        ],
        ingredients: [
            { name: 'BPC-157', desc: 'Site-specific healing peptide.' }, { name: 'TB-500', desc: 'Systemic regenerative peptide.' },
        ],
        howItWorks: [{ id: '01', title: 'Dual Pathway.', desc: 'BPC-157 acts locally while TB-500 circulates for whole-body effect.' }],
        timeline: [{ time: 'Week 1', step: 'Pain reduction' }, { time: 'Month 1', step: 'Restored mobility' }],
        faqs: [{ q: 'Why combine them?', a: 'Complementary local and systemic mechanisms for best outcomes.' }],
        readyAccordion: [{ q: 'Who is this for?', a: 'Athletes and individuals recovering from injury.' }],
        strengths: [{ dosage: 'TBA', plans: [{ name: 'Monthly', price: '$299.99', badge: '' }] }]
    },

    // ─── Retatruide ────────────────────────────────────────────────────────────
    'retatruide-injection': {
        name: 'Retatruide', type: 'Subcutaneous Injection', price: '$499.99/mo',
        image: tirzepetideInjection, heroBg: tirzepatidePrdBg,
        description: 'The next generation of weight loss. Retatruide is a triple-hormone agonist — the successor to Tirzepatide.',
        highlights: ['TBA', 'Triple-hormone action', 'Successor to Tirzepatide', 'Physician-prescribed'],
        benefits: [
            { id: '01', title: 'Triple Action', desc: 'Targets GLP-1, GIP, and Glucagon simultaneously.', color: '#FFDE59', image: hormonalMasteryImg },
            { id: '02', title: 'Max Weight Loss', desc: 'Early data suggests greater weight loss potential than any existing GLP-1.', color: '#5CE1E6', image: metabolicPrecisionImg },
            { id: '03', title: 'Early Access', desc: 'Get verified now to be among the first to receive Retatruide.', color: '#7ED957', image: clinicalBreakthroughImg },
        ],
        ingredients: [{ name: 'Retatruide', desc: 'Triple agonist of GLP-1, GIP, and Glucagon receptors.' }],
        howItWorks: [{ id: '01', title: 'Three Pathways.', desc: 'Reduces appetite, improves insulin, and increases energy expenditure.' }],
        timeline: [{ time: 'Now', step: 'Waitlist/Early Access' }, { time: 'Late 2026', step: 'Market launch' }],
        faqs: [
            { q: 'When available?', a: 'Targeted for late 2026. Access programs available now for verified patients.' },
            { q: 'Special access?', a: 'A $100 fee grants qualified patients early eligibility verification.' },
        ],
        readyAccordion: [{ q: 'What is Retatruide?', a: 'The most powerful triple-hormone weight loss medication coming to market.' }],
        strengths: [{
            dosage: 'TBA', plans: [
                { name: 'Waitlist', price: 'Free', badge: '' },
                { name: 'Early Access', price: '$100 verification', badge: 'Limited' },
                { name: 'Monthly', price: '$499.99', badge: '' },
            ]
        }]
    },
};


const getStartedSteps = [
    {
        title: "Today",
        desc: "Tell us about your health",
        image: medicalConsult
    },
    {
        title: "24–48 Hours",
        desc: "Get a personalized plan",
        image: labAnalysis
    },
    {
        title: "4–7 Days",
        desc: "Receive your medication",
        image: medicationDelivery
    },
    {
        title: "Ongoing",
        desc: "365 support",
        image: ongoingSupport
    }
];

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const product = productSpecificData[productId];
    const [openFaq, setOpenFaq] = useState(null);
    const [isCompareOpen, setIsCompareOpen] = useState(false);

    const getCategory = (id) => {
        if (!id) return 'weight-loss';
        if (id.includes('semaglutide') || id.includes('tirzepatide') || id.includes('retatruide')) return 'weight-loss';
        if (id.includes('finasteride') || id.includes('minoxidil') || id.includes('hair-growth-tabs')) return 'hair-loss';
        if (id.includes('sildenafil') || id.includes('tadalafil') || id.includes('oxytocin') || id.includes('yohimbe') || id === 'readysetgo-men' || id.includes('growtabs') || id.includes('quicklover') || id.includes('loverspray')) return 'sexual-health';
        if (id.includes('nad') || id.includes('glutathione')) return 'longevity';
        if (id.includes('testosterone') || id.includes('estradiol')) return 'hormone-therapy';
        if (id.includes('cream') || id.includes('peel') || id.includes('cleanser') || id.includes('rosacea') || id.includes('serum') || id === 'body-acne-cream' || id === 'anti-aging-cream') return 'skin-care';
        if (id.includes('bpc-157')) return 'longevity';
        return 'weight-loss';
    };

    const category = getCategory(productId);
    const qualifyLink = `/qualify?category=${category}&product=${productId}`;

    useEffect(() => {
        window.scrollTo(0, 0);

        // Entry animations
        gsap.fromTo(".product-hero-info",
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 }
        );

        gsap.fromTo(".product-hero-image",
            { x: 50, opacity: 0, scale: 0.9 },
            { x: 0, opacity: 1, scale: 1, duration: 1, ease: "power3.out", delay: 0.4 }
        );

        // Scroll animations
        const scrollSections = [
            ".ready-section",
            ".benefits-header",
            ".signature-banner",
            ".ingredients-section",
            ".how-it-works-section",
            ".getting-started-section",
            ".faq-section"
        ];

        scrollSections.forEach(section => {
            gsap.fromTo(section,
                { y: 50, opacity: 0 },
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

        // Benefits staggered reveal
        gsap.fromTo(".benefit-card",
            { x: -50, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.3,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: ".benefits-container",
                    start: "top 70%"
                }
            }
        );

        // Grid items staggered reveal
        gsap.fromTo(".get-started-card",
            { y: 30, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.2,
                scrollTrigger: {
                    trigger: ".get-started-container",
                    start: "top 80%"
                }
            }
        );

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, [productId, product, navigate]);

    if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

    const hairLossIds = ['finasteride-tablets', 'finasteride-minoxidil-liquid', 'finasteride-minoxidil-tretinoin-liquid', 'minoxidil-max-compound-liquid', 'hair-growth-tabs-3in1', 'hair-growth-tabs-2in1'];
    const sexualHealthIds = ['sildenafil-tadalafil-troche', 'sildenafil-yohimbe-troche', 'sildenafil-tadalafil-tablets', 'oxytocin-troche', 'oxytocin-nasal-spray', 'readysetgo-men', 'growtabs-sildenafil', 'growtabs-tadalafil', 'quicklover-women', 'loverspray-women'];
    const longevityIds = ['nad-nasal-spray', 'nad-injection', 'glutathione-injection', 'bpc-157-injection', 'bpc-157-tb500-injection'];
    const weightLossIds = ['semaglutide-injection', 'tirzepatide-injection', 'semaglutide-drops', 'tirzepatide-drops', 'retatruide-injection'];
    const hormoneTherapyIds = ['testosterone-injection', 'testosterone-rdt', 'estradiol-tabs'];
    const skinCareIds = ['anti-aging-cream', 'face-spot-peel', 'acne-cleanser', 'rosacea-red-cream', 'eye-serum', 'body-acne-cream'];

    const competitorInfo = {
        'semaglutide-injection': { code: 'SEM', shortDesc: 'The gold standard injection for medical weight loss.', active: 'Semaglutide', brand: 'Ozempic®' },
        'tirzepatide-injection': { code: 'TIR', shortDesc: 'Dual-action power for maximum metabolic efficacy.', active: 'Tirzepatide', brand: 'Mounjaro®' },
        'semaglutide-drops': { code: 'SEM-D', shortDesc: 'Needle-free daily metabolic support.', active: 'Semaglutide', brand: 'Rybelsus®' },
        'tirzepatide-drops': { code: 'TIR-D', shortDesc: 'Advanced dual-action formula in daily drops.', active: 'Tirzepatide', brand: 'Mounjaro®' },
        'finasteride-tablets': { code: 'FIN', shortDesc: 'Clinically proven oral treatment for hair loss.', active: 'Finasteride', brand: 'Propecia®' },
        'finasteride-minoxidil-liquid': { code: 'DUAL', shortDesc: 'Two-in-one topical for blocking and growing.', active: 'Minoxidil', brand: 'Rogaine®' },
        'finasteride-minoxidil-tretinoin-liquid': { code: 'TRIPLE', shortDesc: 'Enhanced absorption for faster regrowth.', active: 'Minoxidil', brand: 'Rogaine®' },
        'minoxidil-max-compound-liquid': { code: 'MAX', shortDesc: 'Our most comprehensive hair restoration formula.', active: 'Minoxidil', brand: 'Rogaine®' },
        'hair-growth-tabs-3in1': { code: '3-IN-1', shortDesc: 'Triple action oral tablets for maximum density.', active: 'Finasteride', brand: 'Propecia®' },
        'hair-growth-tabs-2in1': { code: '2-IN-1', shortDesc: 'Dual action oral tablets for hair health.', active: 'Finasteride', brand: 'Propecia®' },
        'sildenafil-tadalafil-troche': { code: 'SIL/TAD', shortDesc: 'Fast-acting sublingual for double performance.', active: 'Sildenafil', brand: 'Viagra®' },
        'sildenafil-yohimbe-troche': { code: 'SIL/YOH', shortDesc: 'Rapid absorption with enhanced libido drive.', active: 'Sildenafil', brand: 'Viagra®' },
        'sildenafil-tadalafil-tablets': { code: 'SIL/TAD-T', shortDesc: 'Dual oral treatment for confidence and window.', active: 'Sildenafil', brand: 'Viagra®' },
        'oxytocin-troche': { code: 'OXY', shortDesc: 'Enhance emotional connection and intimacy.', active: 'Oxytocin', brand: 'Syntocinon®' },
        'oxytocin-nasal-spray': { code: 'OXY-N', shortDesc: 'Rapid onset intimacy support spray.', active: 'Oxytocin', brand: 'Syntocinon®' },
        'readysetgo-men': { code: 'RSG', shortDesc: 'Comprehensive male performance protocol.', active: 'Sildenafil', brand: 'Viagra®' },
        'growtabs-sildenafil': { code: 'GROW-S', shortDesc: 'Performance support with nutrient focus.', active: 'Sildenafil', brand: 'Viagra®' },
        'growtabs-tadalafil': { code: 'GROW-T', shortDesc: 'Long-lasting support with nutrient focus.', active: 'Tadalafil', brand: 'Cialis®' },
        'quicklover-women': { code: 'QL', shortDesc: 'Enhanced sensation and drive for women.', active: 'Sildenafil', brand: 'Viagra®' },
        'loverspray-women': { code: 'LS', shortDesc: 'Intimate sensitivity spray for women.', active: 'Lidocaine', brand: 'Prilocaine®' },
        'nad-nasal-spray': { code: 'NAD-N', shortDesc: 'Direct energetic support for brain and cells.', active: 'NAD+', brand: 'Nicotinamide' },
        'nad-injection': { code: 'NAD-I', shortDesc: 'Max bioavailability for total cellular repair.', active: 'NAD+', brand: 'Nicotinamide' },
        'glutathione-injection': { code: 'GLU', shortDesc: 'The master antioxidant for detox and skin.', active: 'Glutathione', brand: 'Antioxidant' },
        'bpc-157-injection': { code: 'BPC', shortDesc: 'Regenerative peptide for rapid tissue repair.', active: 'BPC-157', brand: 'Peptide' },
        'bpc-157-tb500-injection': { code: 'BPC/TB', shortDesc: 'Ultimate recovery stack for joints and muscle.', active: 'BPC-157', brand: 'Peptide' },
        'testosterone-injection': { code: 'TEST-I', shortDesc: 'Clinical grade testosterone replacement.', active: 'Testosterone', brand: 'Depo-Testosterone®' },
        'testosterone-rdt': { code: 'TEST-R', shortDesc: 'Fast-dissolving hormone replacement.', active: 'Testosterone', brand: 'AndroGel®' },
        'estradiol-tabs': { code: 'EST', shortDesc: 'Hormone balance for women.', active: 'Estradiol', brand: 'Estrace®' },
        'anti-aging-cream': { code: 'AGE', shortDesc: 'Premium restorative night cream.', active: 'Tretinoin', brand: 'Retin-A®' },
        'face-spot-peel': { code: 'PEEL', shortDesc: 'Targets hyperpigmentation and fine lines.', active: 'Hydroquinone', brand: 'Tri-Luma®' },
        'acne-cleanser': { code: 'ACNE', shortDesc: 'Medical-grade clearing formula.', active: 'Clindamycin', brand: 'Cleocin®' },
        'rosacea-red-cream': { code: 'RED', shortDesc: 'Calms redness and inflammation.', active: 'Ivermectin', brand: 'Soolantra®' },
        'eye-serum': { code: 'EYE', shortDesc: 'Advanced firming and dark circle repair.', active: 'Peptides', brand: 'Serum' },
        'body-acne-cream': { code: 'BODY', shortDesc: 'Clears breakouts and smooths skin texture.', active: 'Salicylic Acid', brand: 'Skin' },
    };
    const simplifiedHeroIds = [...weightLossIds, ...hairLossIds, ...sexualHealthIds, ...longevityIds, ...hormoneTherapyIds, ...skinCareIds];
    const allPremiumIds = [...weightLossIds, ...hairLossIds, ...sexualHealthIds, ...longevityIds, ...hormoneTherapyIds, ...skinCareIds];

    // Some products (like Sexual Health) use a background image BUT still need the text content overlaid.
    // Legacy products (Weight Loss, Hair Loss) typically have the text "baked in" to their hero images, so we hide the overlay.
    // Products with text baked into the background should be listed here
    const productsWithoutOverlay = [];
    const showHeroContent = !productsWithoutOverlay.includes(productId) && (!product.heroBg || !weightLossIds.includes(productId) || simplifiedHeroIds.includes(productId));

    const [selectedStrength, setSelectedStrength] = useState(product.strengths?.[0]?.dosage || '');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [openQuickFaqIdx, setOpenQuickFaqIdx] = useState(null);

    // Build plan list from strengths OR auto-generate from product price
    const getDefaultPlans = (price) => {
        const monthly = parseInt((price || '$99').replace(/[^0-9]/g, '')) || 99;
        return [
            { name: 'Monthly', price: `$${monthly}`, badge: 'Try First' },
            { name: '3 Months', price: `$${Math.round(monthly * 2.7)}`, badge: '' },
            { name: '6 Months', price: `$${Math.round(monthly * 5)}`, badge: 'Best Value' },
        ];
    };
    const displayPlans = product.strengths
        ? (product.strengths.find(s => s.dosage === selectedStrength)?.plans || [])
        : (product.plans || getDefaultPlans(product.price));

    useEffect(() => {
        if (product.strengths) {
            setSelectedStrength(product.strengths[0].dosage);
            setSelectedPlan(product.strengths[0].plans[1]?.name || product.strengths[0].plans[0].name);
        } else if (product.plans) {
            // Default to middle plan if it exists, otherwise first
            setSelectedPlan(product.plans[1]?.name || product.plans[0].name);
        } else {
            // Default to middle plan (3 Months) for auto-generated plans
            setSelectedPlan('3 Months');
        }
    }, [productId, product]);

    useEffect(() => {
        // Trigger loader when product changes
        setIsLoading(true);
        setIsLoaded(false);

        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 1500);

        return () => clearTimeout(timer);
    }, [productId]);

    return (
        <div className="min-h-screen font-sans text-[#1a1a1a] bg-white overflow-x-hidden">
            {isLoading && <Loader loaded={isLoaded} onComplete={() => setIsLoading(false)} />}
            <Navbar isProductDetails={true} />

            {/* Hero Section */}
            <section className="relative min-h-screen bg-white overflow-hidden">
                <div className="relative z-10 max-w-[1400px] mx-auto px-10 h-full">
                    <div className="flex flex-col lg:flex-row h-full">

                        {/* Left Side: Product Display */}
                        <div className="w-full lg:w-1/2 flex flex-col items-center justify-start pt-12 lg:pt-20 pb-12 relative overflow-visible">
                            {/* Main Product Image in a Card-like Container */}
                            <div className="relative z-10 w-full aspect-square max-w-[600px] flex items-center justify-center bg-[#F9F9F9] rounded-[48px] border border-black/5 shadow-sm p-12 lg:p-16 transform scale-100 lg:scale-105">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.12)] transition-transform duration-700 hover:scale-110"
                                />
                            </div>

                            {/* Fine Print */}
                            <div className="mt-12 max-w-[480px] space-y-4 px-4 text-center">
                                <p className="text-[9px] text-gray-400 font-bold leading-relaxed uppercase tracking-tight">
                                    *Results vary by individual. Based on clinical data and internal patient surveys. Customer results have not been independently verified. Price shown with 3 month shipping option.
                                </p>
                                <p className="text-[9px] text-gray-400 font-bold leading-relaxed uppercase tracking-tight">
                                    Prescription products require an online consultation with a healthcare provider. The featured products are compounded using FDA-approved active ingredients.
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Configuration */}
                        <div className="w-full lg:w-1/2 flex flex-col justify-start pt-12 lg:pt-12 lg:pb-24 lg:pl-12 xl:pl-20">
                            <div className="w-full max-w-xl space-y-8">

                                {/* Title Section */}
                                <div className="space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1a1a1a] tracking-tight leading-none uppercase" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                                            {product.name}
                                        </h1>
                                        <button
                                            onClick={() => setIsCompareOpen(true)}
                                            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gray-100 text-[9px] font-black uppercase tracking-[0.2em] text-[#1a1a1a] hover:bg-gray-50 hover:border-gray-200 transition-all group mb-1"
                                        >
                                            Compare Options
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-100 transition-opacity"><path d="m9 18 6-6-6-6" /></svg>
                                        </button>
                                    </div>
                                    <p className="text-gray-400 text-sm font-light">
                                        {hairLossIds.includes(productId)
                                            ? 'Clinical-grade hair restoration treatment'
                                            : sexualHealthIds.includes(productId)
                                                ? 'Medical-grade performance & intimacy formula'
                                                : longevityIds.includes(productId)
                                                    ? 'Advanced longevity & cellular wellness therapy'
                                                    : hormoneTherapyIds.includes(productId)
                                                        ? 'Physician-prescribed hormonal optimisation'
                                                        : skinCareIds.includes(productId)
                                                            ? 'Prescription-grade dermatology & skin science'
                                                            : 'Prescription GLP-1 for weight management'}
                                    </p>
                                </div>

                                {/* Method / Route */}
                                {product.type && product.type !== 'TBA' && category !== 'skin-care' && (
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0a0a0a]">Method / Route:</h3>
                                        <button className="w-full bg-[#0a0a0a] text-white py-4 rounded-[14px] text-sm font-semibold tracking-wide shadow-lg active:scale-[0.98] transition-all">
                                            {product.type}
                                        </button>
                                    </div>
                                )}

                                {/* Select Strength — only for products with multiple dosage options */}
                                {product.strengths && product.strengths.some(s => s.dosage !== 'TBA') && (
                                    <div className="space-y-3">
                                        {product.strengths.filter(s => s.dosage !== 'TBA').length > 1 ? (
                                            <>
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0a0a0a]">
                                                    Select Strength:&nbsp;
                                                    <span className="text-gray-400 font-normal normal-case tracking-normal">{selectedStrength}</span>
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {product.strengths.filter(s => s.dosage !== 'TBA').map((s) => (
                                                        <button
                                                            key={s.dosage}
                                                            onClick={() => {
                                                                setSelectedStrength(s.dosage);
                                                                const strengthObj = product.strengths.find(st => st.dosage === s.dosage);
                                                                const currentStrengthPlans = strengthObj?.plans || [];
                                                                const prevStrengthPlans = product.strengths.find(st => st.dosage === selectedStrength)?.plans || [];
                                                                const planIndex = prevStrengthPlans.findIndex(p => p.name === selectedPlan);
                                                                setSelectedPlan(currentStrengthPlans[planIndex !== -1 ? planIndex : 0]?.name || currentStrengthPlans[0]?.name);
                                                            }}
                                                            className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${selectedStrength === s.dosage
                                                                ? 'bg-[#0a0a0a] border-[#0a0a0a] text-white shadow-md'
                                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                                                                }`}
                                                        >
                                                            {s.dosage}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0a0a0a]">Strength:</h3>
                                                <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">{product.strengths.find(s => s.dosage !== 'TBA').dosage}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Select Plan — shown for all products */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#0a0a0a]">Select Plan</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {displayPlans.map((plan) => (
                                            <button
                                                key={plan.name}
                                                onClick={() => setSelectedPlan(plan.name)}
                                                className={`relative min-h-[150px] rounded-[18px] border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all ${selectedPlan === plan.name
                                                    ? 'border-[#1a1a1a] bg-white ring-4 ring-[#1a1a1a]/5 shadow-2xl'
                                                    : 'border-gray-100 bg-white hover:border-gray-300 shadow-sm'
                                                    }`}
                                            >
                                                {plan.badge && (
                                                    <span className="absolute -top-[11px] left-1/2 -translate-x-1/2 px-4 py-[4px] bg-[#1a1a1a] text-white text-[8px] font-black uppercase tracking-widest rounded-[5px] whitespace-nowrap z-10">
                                                        {plan.badge}
                                                    </span>
                                                )}
                                                <div className="text-sm font-black text-gray-900 text-center leading-tight">{plan.name}</div>
                                                <div className="text-xs font-medium text-gray-400">{plan.price}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <Link
                                    to={qualifyLink}
                                    className="block w-full bg-[#1a1a1a] text-white py-6 rounded-[18px] text-[12px] font-black uppercase tracking-[0.25em] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.35)] hover:bg-[#2a2a2a] active:scale-[0.99] transition-all text-center mt-2"
                                >
                                    Complete Your Assessment
                                </Link>

                                {/* Quick FAQ Section */}
                                <div className="pt-8 border-t border-gray-100 mt-8 space-y-6 text-left">
                                    <div className="space-y-4">
                                        {[
                                            {
                                                q: `What is ${product.name.split(' ')[0]}?`,
                                                a: productId.includes('finasteride') ? 'Finasteride is a prescription medication that blocks DHT, the primary hormone responsible for male pattern hair loss.' :
                                                    productId.includes('semaglutide') ? 'Semaglutide is a GLP-1 receptor agonist that mimics naturally occurring hormones to regulate appetite and blood sugar.' :
                                                        productId.includes('tirzepatide') ? 'Tirzepatide is a dual-acting GLP-1 and GIP receptor agonist that provides powerful metabolic support for weight loss.' :
                                                            productId.includes('sildenafil') ? 'Sildenafil is a PDE5 inhibitor that increases blood flow to specific areas of the body to support reliable performance.' :
                                                                productId.includes('tadalafil') ? 'Tadalafil is a long-acting PDE5 inhibitor that remains effective for up to 36 hours for greater spontaneity.' :
                                                                    productId.includes('nad') ? 'NAD+ is a critical coenzyme found in all living cells that is essential for energy metabolism and DNA repair.' :
                                                                        productId.includes('bpc-157') ? 'BPC-157 is a regenerative peptide that promotes tissue repair and reduces inflammation in muscles and joints.' :
                                                                            `A physician-prescribed ${product.type.toLowerCase()} designed for clinical-grade results.`
                                            },
                                            {
                                                q: "Are there side effects?",
                                                a: productId.includes('finasteride') ? 'Possible side effects include decreased libido or erectile dysfunction in a small percentage of users. Most effects resolve if use is discontinued.' :
                                                    productId.includes('semaglutide') || productId.includes('tirzepatide') ? 'Common side effects include mild nausea, vomiting, or digestive changes as your body adjusts. These typically subside within weeks.' :
                                                        productId.includes('sildenafil') || productId.includes('tadalafil') ? 'Potential effects include flushing, headaches, or mild congestion. These are usually temporary and dose-dependent.' :
                                                            'As with any prescription medication, side effects can occur. A licensed physician will review your history to ensure safety.'
                                            },
                                            {
                                                q: "How long until I see results?",
                                                a: productId.includes('finasteride') ? 'Hair growth follow a cycle. Most men see initial stabilization in 3-6 months, with peak regrowth at 12 months.' :
                                                    productId.includes('semaglutide') || productId.includes('tirzepatide') ? 'Many patients see weight loss within the first 4-8 weeks, with more significant results after 3-4 months of consistent use.' :
                                                        productId.includes('sildenafil') || productId.includes('tadalafil') ? 'Results are typically felt within 30-60 minutes of the first dose. Optimal response may take 1-2 uses.' :
                                                            'Timeline varies by individual. Most clinical-grade therapies show noticeable results within 4-12 weeks of consistent use.'
                                            }
                                        ].map((faq, idx) => (
                                            <div key={idx} className="group border-b border-gray-50 pb-4 last:border-0 overflow-hidden">
                                                <button
                                                    onClick={() => setOpenQuickFaqIdx(openQuickFaqIdx === idx ? null : idx)}
                                                    className="flex items-start justify-between w-full text-left gap-4"
                                                >
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a] group-hover:text-accent-blue transition-colors">
                                                        {faq.q}
                                                    </h4>
                                                    <span className={`text-gray-300 group-hover:text-black transition-all font-light text-lg leading-none transform ${openQuickFaqIdx === idx ? 'rotate-45' : ''}`}>+</span>
                                                </button>
                                                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openQuickFaqIdx === idx ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                                                    <div className="text-[11px] leading-relaxed text-gray-500 font-medium">
                                                        {faq.a}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BENEFITS SECTION: Exceed Expectations (Signature Series Style) */}
            <section className="bg-[#0A0A0A] text-white py-24 md:py-40 px-6 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

                <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto relative z-10">
                    {/* Header with Crown Icon */}
                    <div className="benefits-header text-center mb-16 md:mb-24">
                        <div className="flex justify-center mb-6">
                            <svg width="36" height="28" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                                <path d="M24 0L31.5 12L48 9L39 36H9L0 9L16.5 12L24 0Z" fill="currentColor" />
                            </svg>
                        </div>
                        <h2 className="text-3xl md:text-5xl lg:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-4">
                            Exceed <br /> <span className="text-white">Expectations</span>
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto text-base md:text-lg leading-relaxed italic font-serif">
                            {hairLossIds.includes(productId)
                                ? "Experience clinical-grade hair restoration powered by advanced DHT blocking and follicle stimulation."
                                : sexualHealthIds.includes(productId)
                                    ? "Rekindle intimacy with medical-grade performance protocols designed for modern life."
                                    : longevityIds.includes(productId)
                                        ? "Combat cellular ageing with clinically proven antioxidant and NAD+ therapy."
                                        : hormoneTherapyIds.includes(productId)
                                            ? "Restore peak hormonal balance with physician-prescribed, compounded therapy."
                                            : skinCareIds.includes(productId)
                                                ? "Reveal your best skin with prescription-grade dermatology formulas."
                                                : "Experience medical-grade weight loss powered by precise compounding and hormonal mastery."}
                        </p>
                    </div>

                    {/* Main Pill-Shaped Feature Cards */}
                    <div className="benefits-container space-y-8 md:space-y-12 relative">
                        {/* Scroll Indicator (Vertical text) */}
                        <div className="hidden lg:block absolute right-[-60px] top-1/2 -translate-y-1/2 vertical-text">
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 flex items-center gap-4">
                                Scroll Down <div className="w-1 h-12 bg-gray-800 relative overflow-hidden"><div className="absolute inset-0 bg-accent-blue animate-scroll-line"></div></div>
                            </span>
                        </div>

                        {product.benefits.map((b, i) => (
                            <div key={i} className="benefit-card flex flex-col lg:flex-row items-stretch gap-0 group h-[310px]">
                                {/* The Image Side (Left) */}
                                <div className="bg-[#1A1A1A] rounded-t-[30px] lg:rounded-t-none lg:rounded-l-[60px] w-full lg:w-5/12 border-b lg:border-b-0 lg:border-r border-white/5 relative overflow-hidden p-0 h-[200px] lg:h-auto">
                                    {b.image && (
                                        <>
                                            <img
                                                src={b.image}
                                                alt={b.title}
                                                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                        </>
                                    )}
                                </div>

                                {/* The Content Side (Right) */}
                                <div className="bg-[#151515] rounded-b-[30px] lg:rounded-b-none lg:rounded-r-[60px] p-5 md:p-8 flex-1 flex flex-col justify-center border-t lg:border-t-0 border-white/5 shadow-2xl relative overflow-hidden transition-colors duration-500 group-hover:bg-[#1a1a1a]">
                                    {/* Moved Title/Phase Header */}
                                    <div className="flex flex-col items-start gap-3 mb-4 relative z-10">
                                        <h3 className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight leading-[0.9] transition-colors" style={{ color: b.color }}>
                                            {b.title}
                                        </h3>
                                    </div>

                                    <div className="absolute top-0 right-0 w-24 h-24 blur-[80px] opacity-20 pointer-events-none" style={{ backgroundColor: b.color }}></div>

                                    <p className="text-sm md:text-base text-gray-400 leading-relaxed font-light mb-4 relative z-10 line-clamp-3">
                                        {b.desc}
                                    </p>
                                    <div className="flex gap-4 relative z-10">
                                        <div className="w-10 h-1 bg-white/20" style={{ backgroundColor: b.color }}></div>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Precision Standard</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Signature Banner - EXCEED EXPECTATIONS CARD */}
                <div className="signature-banner mt-40 bg-black rounded-[32px] md:rounded-[60px] overflow-hidden p-8 md:p-20 flex flex-col lg:flex-row items-center gap-16 relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] mx-2 md:mx-0">
                    <div className="w-full lg:w-7/12 relative z-10">
                        <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-8">
                            The <br /> Signature <br /> Series
                        </h3>

                        <p className="text-white/80 text-lg md:text-xl font-medium mb-12 leading-snug max-w-lg">
                            Our Signature Series represents a <span className="text-white font-extrabold">new era of clinical care</span>. <br /> Combining high-grade compounding with personalized protocols.
                        </p>

                        <Link to="/qualify" className="bg-white text-black px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-gray-100 transition-all shadow-xl text-lg transform hover:scale-105 inline-block">
                            Get started
                        </Link>
                    </div>
                    <div className="w-full lg:w-5/12 flex justify-center items-center">
                        <img
                            src={product.image}
                            className="w-full max-w-[450px] h-auto object-contain drop-shadow-[0_45px_45px_rgba(0,0,0,0.5)] transform -rotate-12 hover:rotate-0 transition-transform duration-1000"
                            alt="Signature Medication"
                        />
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                        .vertical-text {
                            writing-mode: vertical-rl;
                            text-orientation: mixed;
                        }
                        @keyframes scroll-line {
                            0% { transform: translateY(-100%); }
                            100% { transform: translateY(100%); }
                        }
                        .animate-scroll-line {
                            animation: scroll-line 2s infinite linear;
                        }
                    `}} />
            </section>


            {/* INGREDIENTS SECTION */}
            <section className="ingredients-section py-20 md:py-32 px-6 bg-[#F0F2EB]">
                <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto flex flex-col md:flex-row gap-16 items-center">
                    <div className="w-full md:w-1/2">
                        <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6 leading-none">
                            The Science <br /> Inside
                        </h3>
                        <p className="text-xl text-gray-600 leading-relaxed font-medium">Compounded for maximum efficacy. We use only high-grade ingredients to ensure safety and results.</p>
                    </div>
                    <div className="w-full md:w-1/2 space-y-6">
                        {product.ingredients.map((ing, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-lg shadow-black/5 border border-black/5 hover:border-black transition-colors">
                                <h4 className="text-2xl font-bold uppercase mb-2 text-[#1a1a1a]">{ing.name}</h4>
                                <p className="text-gray-600">{ing.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="how-it-works-section py-20 md:py-32 px-6 bg-white">
                <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto">
                    <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-20 text-center">How It Works</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>

                        {product.howItWorks.map((step, i) => (
                            <div key={i} className="bg-white p-4 md:p-6 border border-black/5 rounded-2xl shadow-lg text-center group hover:border-accent-blue/30 transition-all duration-500">
                                <div className="text-4xl font-black text-gray-100 mb-2 group-hover:text-accent-blue/10 transition-colors">{step.id}</div>
                                <h4 className="text-lg font-bold uppercase mb-2">{step.title}</h4>
                                <p className="text-gray-500 leading-relaxed text-sm max-w-sm mx-auto">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* GET STARTED SLIDER - BLOG STYLE TEMPLATE */}
            <section className="getting-started-section py-24 md:py-40 bg-[#F9F8F4] overflow-hidden">
                <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-none mx-auto px-6">
                    <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
                        <div className="max-w-3xl">
                            <h2 className="text-5xl md:text-7xl font-black text-[#1a1a1a] uppercase tracking-tighter leading-[0.85] mb-8">
                                Getting started
                            </h2>
                            <div className="space-y-6">
                                <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed">
                                    All medical assessments and prescriptions from uGlowMD are administered by physicians and pharmacists licensed in the United States.
                                </p>
                                <p className="text-gray-500 text-lg font-medium leading-relaxed">
                                    Prescription products require an online consultation with a healthcare provider.
                                </p>
                                <div className="pt-4">
                                    <Link to="/qualify" className="bg-black text-white px-10 py-4 rounded-full font-black uppercase tracking-widest border border-white/20 hover:bg-white hover:text-black transition-all shadow-xl text-lg transform hover:scale-105 inline-block">
                                        Get started
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Scroll Area */}
                    <div className="get-started-container flex gap-4 overflow-x-auto pb-8 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style dangerouslySetInnerHTML={{ __html: `.snap-x::-webkit-scrollbar { display: none; }` }} />
                        {getStartedSteps.map((step, i) => (
                            <div key={i} className="get-started-card min-w-[260px] md:min-w-[320px] bg-white rounded-2xl overflow-hidden shadow-lg shadow-black/5 snap-start group border border-transparent hover:border-black/10 transition-all duration-500">
                                <div className="h-[150px] overflow-hidden relative">
                                    <img src={step.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={step.title} />
                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]">0{i + 1}</div>
                                </div>
                                <div className="p-6 bg-[#fdfdfd] min-h-[120px] flex flex-col justify-start">
                                    <h3 className="text-lg font-black text-[#1a1a1a] uppercase tracking-tight mb-2 leading-none">{step.title}</h3>
                                    <p className="text-gray-500 text-xs leading-relaxed font-medium line-clamp-3">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* CTA BANNER - Reordered */}
            <div className="py-24 md:py-32 bg-black text-white text-center px-6">
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-none">Ready for <br /><span className="text-white">Results?</span></h2>
                <Link to="/qualify" className="bg-white text-[#1a1a1a] px-12 py-5 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl text-xl inline-block">
                    Get Started
                </Link>
            </div>

            {/* FAQ SECTION - NOW LAST */}
            <section className="faq-section px-6 py-20 md:py-32 bg-[#F7F8F1]">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight mb-12 text-center">Questions?</h2>
                    <div className="space-y-4">
                        {product.faqs.map((faq, i) => (
                            <div key={i} className="bg-white rounded-2xl p-2 shadow-sm">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="flex justify-between w-full text-left font-bold text-lg md:text-xl p-4 hover:text-black transition-colors gap-4">
                                    {faq.q}
                                    <span className="flex-shrink-0 text-black text-2xl">{openFaq === i ? '−' : '+'}</span>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="p-4 pt-0 text-gray-600 text-base md:text-lg">{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            <Footer />
            {/* Compare Drawer Modal */}
            {isCompareOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCompareOpen(false)}></div>
                    <div className="relative w-full max-w-[500px] h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400">Comparison</h2>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-[#1a1a1a]">{category.replace('-', ' ')} LINEUP</h3>
                            </div>
                            <button
                                onClick={() => setIsCompareOpen(false)}
                                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            {Object.keys(productSpecificData)
                                .filter(id => {
                                    const currentCat = getCategory(id);
                                    return currentCat === category;
                                })
                                .map(id => {
                                    const p = productSpecificData[id];
                                    const info = competitorInfo[id] || { code: id.slice(0, 3).toUpperCase(), shortDesc: p.description.slice(0, 50) + '...', active: 'Active', brand: 'Regimen' };
                                    const isCurrent = id === productId;

                                    return (
                                        <div key={id} className={`group relative transition-all duration-300 ${isCurrent ? "scale-[1.02]" : "opacity-80 hover:opacity-100"}`}>
                                            <div className="flex gap-6 items-start">
                                                {/* Left: Product Image Card */}
                                                <div
                                                    onClick={() => { if (!isCurrent) { navigate(`/product/${id}`); setIsCompareOpen(false); } }}
                                                    className={`relative w-40 h-40 shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-all border-2 ${isCurrent ? 'border-accent-black ring-4 ring-black/5' : 'border-gray-100 hover:border-gray-300'} bg-[#f8f9fb] flex items-center justify-center p-4`}
                                                >
                                                    <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                                                    {isCurrent && (
                                                        <div className="absolute bottom-3 left-3 w-6 h-6 bg-accent-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Info */}
                                                <div className="flex-1 space-y-2 py-1">
                                                    <div className="flex items-start justify-between">
                                                        <h4 className="text-2xl font-black uppercase tracking-tighter text-[#1a1a1a] leading-none mb-1">
                                                            {info.code}
                                                        </h4>
                                                        {isCurrent && <span className="text-[10px] font-black uppercase tracking-widest text-accent-black bg-black/5 px-2 py-1 rounded-md">Viewing</span>}
                                                    </div>

                                                    <p className="text-sm font-black text-gray-900 leading-tight">
                                                        <span className="text-accent-black/80">{info.shortDesc.split(' ')[0]}</span> {info.shortDesc.split(' ').slice(1).join(' ')}
                                                    </p>

                                                    <p className="text-[11px] font-medium italic text-gray-400 leading-snug">
                                                        Includes {info.active} (the active ingredient in <span className="font-black text-gray-500">{info.brand}</span>)
                                                    </p>

                                                    <div className="pt-2">
                                                        <p className="text-sm font-black text-[#1a1a1a]">From: <span className="text-lg">{p.price.split('/')[0]}</span></p>
                                                    </div>

                                                    {!isCurrent && (
                                                        <button
                                                            onClick={() => { navigate(`/product/${id}`); setIsCompareOpen(false); }}
                                                            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-2 pt-2"
                                                        >
                                                            Switch Product
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="w-full h-px bg-gray-100 mt-8"></div>
                                        </div>
                                    );
                                })}
                        </div>

                        <div className="p-8 pt-0">
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                                    Compare clinical efficacy, delivery methods, and pricing across our complete {category} protocol.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;
