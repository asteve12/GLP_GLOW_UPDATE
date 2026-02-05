import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Import assets directly since we are in a new file
import semaglutideInjection from '../assets/semaglutide-injection.png';
import tirzepetideInjection from '../assets/tirzepetide_injection.webp';
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

import finasterideHeroImg from '../assets/finasteride_tablet.png';
import finasterideMinoxidilBg from '../assets/Finasteride_  Minoxidil_bg.png';
import finasterideTripleBg from '../assets/Finasteride  Minoxidil  Tretinoi_bg.png';
import threeInOneImg from '../assets/3_in_1img.png';
import fiveInOneImg from '../assets/5_in-1_hairloss.png';
import fiveInOneBg from '../assets/5_IN_1_HAIRLOSS_BG.png';
import dualGrowthPrdImg from '../assets/Finasteride_  Minoxidil_prd.png';

import hairLossImg from '../assets/hair-loss.png';
import mensHealthImg from '../assets/mens-health.png';
import sildenafilTadalafilBg from '../assets/Sildenafil_Tadalafil_bg.png';
import sildenafilTadalafilTabletsBg from '../assets/Sildenafil _Tadalafil_Tablets.png';
import sildenafilYohimbeBg from '../assets/Sildenafil_ Yohimbe_bg.png';
import sildenafilYohimbePrdImg from '../assets/Sildenafil_ Yohimbe_prd.png';
import oxytocinPrdImg from '../assets/Oxytocin (Fast Absorb Tab).png';
import oxytocinTabletsPrd from '../assets/Oxytocin_Tablets_prd.png';
import oxytocinNasalPrd from '../assets/oxytocin_nasal_prd.png';
import oxytocinNasalBg from '../assets/oxytocin_nasal.png';
import prdDetailBg from '../assets/prd_detial_bg_image.png';
import longevityImg from '../assets/longevity.png';
import nadInjectionImg from '../assets/NAD+ (Subcutaneous Injection).png';
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
        ]
    },
    'nad-injection': {
        name: 'NAD+',
        type: 'Subcutaneous Injection',
        price: '$199/mo',
        image: nadInjectionPrd,
        heroBg: nadInjectionImg,
        description: 'The gold standard for longevity. Delivers 100% bioavailability to fuel your mitochondria and slow biological aging.',
        highlights: ["100% Bioavailability", "Max mitochondrial support", "Systemic rejuvenation", "Starts at $199/mo"],
        benefits: [
            { id: "01", title: "Max Absorption", desc: "Injections ensure the full dose reaches your systemic circulation immediately.", color: "#FFDE59", image: dualActionImg },
            { id: "02", title: "Metabolic Reset", desc: "Optimizes metabolic function and supports healthy weight management.", color: "#5CE1E6", image: glycemicControlImg },
            { id: "03", title: "Anti-Aging", desc: "Activates longevity pathways (sirtuins) to slow cellular aging.", color: "#7ED957", image: maxPotencyImg }
        ],
        ingredients: [
            { name: "NAD+", desc: "Pure pharmaceutical grade Nicotinamide Adenine Dinucleotide." }
        ],
        howItWorks: [
            { id: "01", title: "Direct Delivery.", desc: "Subcutaneous injection allows NAD+ to enter circulation and tissues immediately." },
            { id: "02", title: "Systemic Impact.", desc: "Reach optimal levels in all tissues for whole-body rejuvenation." }
        ],
        timeline: [
            { time: "Week 1", step: "Reduced fatigue" },
            { time: "Week 2-3", step: "Better sleep & mood" },
            { time: "Month 2+", step: "Metabolic optimization" }
        ],
        faqs: [
            { q: 'How often do I inject?', a: 'Protocols vary, but typically 1-3 times per week.' },
            { q: 'Does it hurt?', a: 'Subcutaneous injections use a tiny needle and are generally painless.' }
        ],
        readyAccordion: [
            { q: "Why injections?", a: "Injections bypass the digestive system where NAD+ is often broken down, ensuring maximum potency." },
            { q: "Is it safe?", a: "Yes, NAD+ is a naturally occurring molecule in your body." }
        ]
    },
    'glutathione-injection': {
        name: 'Glutathione',
        type: 'Injection',
        price: '$149/mo',
        image: glutathionePrd,
        heroBg: glutathioneBg,
        description: 'The Master Antioxidant. Powerful detoxification and immune support to brighten skin and reduce systemic inflammation.',
        highlights: ["Master Detoxifier", "Skin Brightening", "Immune Boost", "Starts at $149/mo"],
        benefits: [
            { id: "01", title: "Detoxification", desc: "Binds to toxins and heavy metals to remove them from the body.", color: "#FFDE59", image: hormonalMasteryImg },
            { id: "02", title: "Skin Health", desc: "Reduces melanin production for brighter, clearer skin and reduced age spots.", color: "#5CE1E6", image: metabolicPrecisionImg },
            { id: "03", title: "Immune Shield", desc: "Strengthens immune response and fights oxidative stress.", color: "#7ED957", image: clinicalBreakthroughImg }
        ],
        ingredients: [
            { name: "Glutathione", desc: "A potent antioxidant composed of glutamine, glycine, and cysteine." }
        ],
        howItWorks: [
            { id: "01", title: "Scavenges Free Radicals.", desc: "Neutralizes harmful oxidative stress molecules that damage cells." },
            { id: "02", title: "Liver Support.", desc: "Aids the liver in filtering and expelling toxins." }
        ],
        timeline: [
            { time: "Week 1", step: "Improved energy" },
            { time: "Month 1", step: "Skin glow" },
            { time: "Month 3+", step: "Deep detox" }
        ],
        faqs: [
            { q: 'Can I take it orally?', a: 'Oral glutathione is poorly absorbed. Injections are far more effective.' }
        ],
        readyAccordion: [
            { q: "What is Glutathione?", a: "The most robust antioxidant naturally produced by the body, crucial for health and aging." }
        ]
    }
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

    const getCategory = (id) => {
        if (!id) return 'weight-loss';
        if (id.includes('semaglutide') || id.includes('tirzepatide')) return 'weight-loss';
        if (id.includes('finasteride') || id.includes('minoxidil')) return 'hair-restoration';
        if (id.includes('sildenafil') || id.includes('tadalafil') || id.includes('oxytocin')) return 'sexual-health';
        if (id.includes('nad') || id.includes('glutathione')) return 'longevity';
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

    const hairLossIds = ['finasteride-tablets', 'finasteride-minoxidil-liquid', 'finasteride-minoxidil-tretinoin-liquid', 'minoxidil-max-compound-liquid'];
    const sexualHealthIds = ['sildenafil-tadalafil-troche', 'sildenafil-yohimbe-troche', 'sildenafil-tadalafil-tablets', 'oxytocin-troche', 'oxytocin-nasal-spray'];
    const longevityIds = ['nad-nasal-spray', 'nad-injection', 'glutathione-injection'];
    const weightLossIds = ['semaglutide-injection', 'tirzepatide-injection', 'semaglutide-drops', 'tirzepatide-drops'];
    const simplifiedHeroIds = [...weightLossIds, 'finasteride-tablets', 'finasteride-minoxidil-liquid', 'finasteride-minoxidil-tretinoin-liquid', 'minoxidil-max-compound-liquid', 'sildenafil-tadalafil-troche', 'sildenafil-yohimbe-troche', 'sildenafil-tadalafil-tablets', 'oxytocin-troche', 'oxytocin-nasal-spray', 'nad-nasal-spray', 'nad-injection', 'glutathione-injection'];
    const allPremiumIds = [...weightLossIds, ...hairLossIds, ...sexualHealthIds, ...longevityIds];

    // Some products (like Sexual Health) use a background image BUT still need the text content overlaid.
    // Legacy products (Weight Loss, Hair Loss) typically have the text "baked in" to their hero images, so we hide the overlay.
    // Products with text baked into the background should be listed here
    const productsWithoutOverlay = [];
    const showHeroContent = !productsWithoutOverlay.includes(productId) && (!product.heroBg || !weightLossIds.includes(productId) || simplifiedHeroIds.includes(productId));

    return (
        <div className="min-h-screen font-sans text-bg-primary bg-white overflow-x-hidden">
            <Navbar
                isProductDetails={!allPremiumIds.includes(productId)}
                customBgColor="#f7f8f1"
            />

            {/* NEW HERO SECTION (FORMERLY READY SECTION) */}
            <section className="ready-section pt-32 pb-20 md:pt-48 md:pb-32 bg-[#FCF9EE] min-h-screen flex items-center">
                <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16">
                    <div className="flex flex-col-reverse lg:flex-row gap-12 lg:gap-24 items-center">

                        {/* Left Column - Copy */}
                        <div className="w-full lg:w-1/2">
                            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black text-gray-900 mb-8 leading-[1] tracking-tighter">
                                {product.name} <br /> {product.type}
                            </h2>
                            <p className="text-xl md:text-2xl font-medium text-gray-800 mb-8 leading-relaxed">
                                {product.description}
                            </p>

                            <ul className="space-y-4 mb-10">
                                {product.highlights.map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-base md:text-lg font-bold text-gray-900">
                                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-accent-green"></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="mb-12">
                                <Link to="/qualify" className="bg-gray-900 text-white px-10 py-4 md:px-12 md:py-5 rounded-full font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl text-base md:text-lg transform hover:scale-105 inline-block">
                                    Get started
                                </Link>
                            </div>

                            {/* Accordion/Info Tabs */}
                            <div className="space-y-3 border-t border-black/10 pt-8">
                                {product.readyAccordion?.map((item, i) => (
                                    <div key={i} className="group border-b border-black/5 last:border-0">
                                        <button
                                            onClick={() => setOpenFaq(openFaq === `ready-${i}` ? null : `ready-${i}`)}
                                            className="flex justify-between items-center w-full py-3 text-left font-bold text-lg text-gray-900 uppercase tracking-tight hover:text-accent-green transition-colors"
                                        >
                                            {item.q}
                                            <span className="text-xl">{openFaq === `ready-${i}` ? '−' : '+'}</span>
                                        </button>
                                        <div className={`overflow-hidden transition-all duration-300 ${openFaq === `ready-${i}` ? 'max-h-40 opacity-100 pb-4' : 'max-h-0 opacity-0'} text-gray-700 leading-relaxed text-base`}>
                                            {item.a}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column - Images */}
                        <div className="w-full lg:w-1/2">
                            <div className="bg-white rounded-[40px] md:rounded-[60px] overflow-hidden shadow-2xl p-8 md:p-12 lg:p-16 mb-8 relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <img
                                    src={product.image}
                                    alt="Ready Product"
                                    className="w-full h-auto object-contain drop-shadow-3xl relative z-10 transition-transform duration-700 group-hover:scale-105"
                                />

                                {/* Thumbnails */}
                                <div className="flex gap-4 justify-center mt-12 relative z-10">
                                    {[1, 2, 3, 4, 5].map((_, i) => (
                                        <div key={i} className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl border-2 transition-all cursor-pointer hover:border-accent-green hover:scale-110 ${i === 0 ? 'border-accent-green bg-white' : 'border-black/5 bg-gray-50 opacity-40 hover:opacity-100'}`}>
                                            <img src={product.image} className="w-full h-full object-contain p-2" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Disclaimers */}
                            <div className="mt-12 space-y-6 px-4">
                                <p className="text-xs text-gray-500 italic leading-relaxed">
                                    *Results vary by individual. Based on clinical data and internal patient surveys. Customer results have not been independently verified. Price shown with 3 month shipping option.
                                </p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Prescription products require an online consultation with a healthcare provider. The featured products are compounded using FDA-approved active ingredients.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* SECTION FOOTER - Trust Bar Deleted */}
            </section>




            {/* BENEFITS SECTION: Exceed Expectations (Signature Series Style) */}
            <section className="bg-[#0A0A0A] text-white py-24 md:py-40 px-6 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-green/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Header with Crown Icon */}
                    <div className="benefits-header text-center mb-24 md:mb-32">
                        <div className="flex justify-center mb-8">
                            <svg width="48" height="36" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-yellow-400">
                                <path d="M24 0L31.5 12L48 9L39 36H9L0 9L16.5 12L24 0Z" fill="currentColor" />
                            </svg>
                        </div>
                        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] mb-4">
                            Exceed <br /> <span className="text-yellow-400">Expectations</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed italic font-serif">
                            {hairLossIds.includes(productId)
                                ? "Experience clinical-grade hair restoration powered by advanced DHT blocking and follicle stimulation."
                                : sexualHealthIds.includes(productId)
                                    ? "Rekindle intimacy with medical-grade performance protocols designed for modern life."
                                    : "Experience medical-grade weight loss powered by precise compounding and hormonal mastery."}
                        </p>
                    </div>

                    {/* Main Pill-Shaped Feature Cards */}
                    <div className="benefits-container space-y-12 md:space-y-20 relative">
                        {/* Scroll Indicator (Vertical text) */}
                        <div className="hidden lg:block absolute right-[-60px] top-1/2 -translate-y-1/2 vertical-text">
                            <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 flex items-center gap-4">
                                Scroll Down <div className="w-1 h-12 bg-gray-800 relative overflow-hidden"><div className="absolute inset-0 bg-yellow-400 animate-scroll-line"></div></div>
                            </span>
                        </div>

                        {product.benefits.map((b, i) => (
                            <div key={i} className="benefit-card flex flex-col lg:flex-row items-stretch gap-0 group min-h-[400px]">
                                {/* The Image Side (Left) */}
                                <div className="bg-[#1A1A1A] rounded-t-[60px] lg:rounded-t-none lg:rounded-l-[100px] w-full lg:w-5/12 border-b lg:border-b-0 lg:border-r border-white/5 relative overflow-hidden p-0 h-[300px] lg:h-auto">
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
                                <div className="bg-[#151515] rounded-b-[60px] lg:rounded-b-none lg:rounded-r-[100px] p-8 md:p-12 lg:p-16 flex-1 flex flex-col justify-center border-t lg:border-t-0 border-white/5 shadow-2xl relative overflow-hidden transition-colors duration-500 group-hover:bg-[#1a1a1a]">
                                    {/* Moved Title/Phase Header */}
                                    <div className="flex flex-col items-start gap-4 mb-8 relative z-10">
                                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-[0.9] transition-colors" style={{ color: b.color }}>
                                            {b.title}
                                        </h3>
                                    </div>

                                    <div className="absolute top-0 right-0 w-32 h-32 blur-[100px] opacity-20 pointer-events-none" style={{ backgroundColor: b.color }}></div>

                                    <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-light mb-8 relative z-10">
                                        {b.desc}
                                    </p>
                                    <div className="flex gap-4 relative z-10">
                                        <div className="w-16 h-1.5" style={{ backgroundColor: b.color }}></div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Precision Standard</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Signature Banner - EXCEED EXPECTATIONS CARD */}
                <div className="signature-banner mt-40 bg-yellow-400 rounded-[60px] overflow-hidden p-12 md:p-20 flex flex-col lg:flex-row items-center gap-16 relative shadow-[0_50px_100px_-20px_rgba(255,222,89,0.3)]">
                    <div className="w-full lg:w-7/12 relative z-10">
                        <h3 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter leading-[0.85] mb-8">
                            The <br /> Signature <br /> Series
                        </h3>

                        <p className="text-black/80 text-lg md:text-xl font-medium mb-12 leading-snug max-w-lg">
                            Our Signature Series represents a <span className="text-black font-extrabold">new era of clinical care</span>. <br /> Combining high-grade compounding with personalized protocols.
                        </p>

                        <Link to="/qualify" className="bg-black text-yellow-400 px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl text-lg transform hover:scale-105 inline-block">
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

                {/* SECTION FOOTER - Signature Line */}
                {/* SECTION FOOTER - Signature Line Deleted */}
            </section>


            {/* INGREDIENTS SECTION */}
            <section className="ingredients-section py-20 md:py-32 px-6 bg-[#F0F2EB]">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-16 items-center">
                    <div className="w-full md:w-1/2">
                        <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-6 leading-none">
                            The <span className="text-accent-green">Science</span> <br /> Inside
                        </h3>
                        <p className="text-xl text-gray-600 leading-relaxed font-medium">Compounded for maximum efficacy. We use only high-grade ingredients to ensure safety and results.</p>
                    </div>
                    <div className="w-full md:w-1/2 space-y-6">
                        {product.ingredients.map((ing, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-lg shadow-black/5 border border-black/5 hover:border-accent-green transition-colors">
                                <h4 className="text-2xl font-bold uppercase mb-2 text-bg-primary">{ing.name}</h4>
                                <p className="text-gray-600">{ing.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="how-it-works-section py-20 md:py-32 px-6 bg-white">
                <div className="max-w-5xl mx-auto">
                    <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-20 text-center">How It Works</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>

                        {product.howItWorks.map((step, i) => (
                            <div key={i} className="bg-white p-8 md:p-12 border border-black/5 rounded-3xl shadow-xl text-center">
                                <div className="text-6xl font-black text-gray-100 mb-6">{step.id}</div>
                                <h4 className="text-2xl font-bold uppercase mb-4">{step.title}</h4>
                                <p className="text-gray-600 leading-relaxed text-lg">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* GET STARTED SLIDER - BLOG STYLE TEMPLATE */}
            <section className="getting-started-section py-24 md:py-40 bg-[#F9F8F4] overflow-hidden">
                <div className="max-w-[1400px] mx-auto px-6">
                    <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
                        <div className="max-w-3xl">
                            <h2 className="text-5xl md:text-7xl font-black text-bg-primary uppercase tracking-tighter leading-[0.85] mb-8">
                                Getting started
                            </h2>
                            <div className="space-y-6">
                                <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed">
                                    All medical assessments and prescriptions from GLP-GLOW Health are administered by physicians and pharmacists licensed in the United States.
                                </p>
                                <p className="text-gray-500 text-lg font-medium leading-relaxed">
                                    Prescription products require an online consultation with a healthcare provider.
                                </p>
                                <div className="pt-4">
                                    <Link to="/qualify" className="bg-bg-primary text-white px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-accent-green hover:text-bg-primary transition-all shadow-xl text-lg transform hover:scale-105 inline-block">
                                        Get started
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Scroll Area */}
                    <div className="get-started-container flex gap-8 overflow-x-auto pb-12 snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style dangerouslySetInnerHTML={{ __html: `.snap-x::-webkit-scrollbar { display: none; }` }} />
                        {getStartedSteps.map((step, i) => (
                            <div key={i} className="get-started-card min-w-[320px] md:min-w-[420px] bg-white rounded-[40px] overflow-hidden shadow-xl shadow-black/5 snap-start group">
                                <div className="h-[280px] overflow-hidden relative">
                                    <img src={step.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={step.title} />
                                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-bg-primary">Step 0{i + 1}</div>
                                </div>
                                <div className="p-10 bg-[#E2E6DD] min-h-[180px]">
                                    <h3 className="text-2xl md:text-3xl font-black text-bg-primary uppercase tracking-tight mb-4 leading-none">{step.title}</h3>
                                    <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* CTA BANNER - Reordered */}
            <div className="py-24 md:py-32 bg-bg-primary text-white text-center px-6">
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 leading-none">Ready for <br /><span className="text-accent-green">Results?</span></h2>
                <Link to="/qualify" className="bg-white text-bg-primary px-12 py-5 rounded-full font-bold uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl text-xl inline-block">
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
                                    className="flex justify-between w-full text-left font-bold text-lg md:text-xl p-4 hover:text-accent-green transition-colors gap-4">
                                    {faq.q}
                                    <span className="flex-shrink-0 text-accent-green text-2xl">{openFaq === i ? '−' : '+'}</span>
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="p-4 pt-0 text-gray-600 text-base md:text-lg">{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* SECTION FOOTER */}

                </div>
            </section>

            <Footer />
        </div >
    );
};

export default ProductDetails;
