export const categoryQuestions = {
    'weight-loss': {
        title: 'Weight Loss Transformation',
        question: ['What do you want to', 'accomplish?'],
        stat: {
            pct: '92%',
            text: 'of patients achieve sustainable metabolic',
            highlight: 'results*',
            image: null, // Will be handled in component
            disclaimer: '*Based on a survey of 114 active uGLOWMD patients, conducted in May 2025.',
            reviews: [
                { name: "Sarah M.", result: "Lost 45lbs", text: "Confidence restored. More energy than ever before." },
                { name: "Michael K.", result: "Down 32lbs", text: "The hunger noise just disappeared. Life-changing." },
                { name: "Jessica R.", result: "Lost 50lbs", text: "I finally feel like myself again. Pure metabolic freedom." }
            ]
        },
        improvements: [
            { id: 'lose-weight', name: 'Lose Weight', desc: 'Targeted fat reduction and clinical weight management protocols.' },
            { id: 'general-health', name: 'Improve my general physical health', desc: 'Optimize metabolic function and overall wellness levels.' },
            { id: 'health-condition', name: 'Improve another health condition', desc: 'Clinical support for weight-related health improvements.' },
            { id: 'confidence', name: 'Increase confidence about my appearance', desc: 'Feel better in your skin with visible body composition changes.' },
            { id: 'energy', name: 'Increase energy for activities I enjoy', desc: 'Boost mitochondrial function and daily vitality levels.' },
            { id: 'other-goal', name: 'I have another goal not listed above', desc: 'Customized approach for your specific health journey.' }
        ]
    },
    'hair-restoration': {
        title: 'Advanced Hair Restoration',
        question: ['What motivates your interest in professional', 'hair restoration?'],
        stat: {
            pct: '88%',
            text: 'of users report significant clinical density',
            highlight: 'improvement*',
            image: null,
            disclaimer: '*Based on a survey of 114 active uGLOWMD patients, conducted in May 2025.',
            reviews: [
                { name: "James T.", result: "Fuller Hair", text: "No more hats. Scalp looks amazing and dense." },
                { name: "David S.", result: "Visible Growth", text: "Started seeing results in just 3 months. Incredible." },
                { name: "Mark H.", result: "Density Restore", text: "Follicles are reactivated and thickening every week." }
            ]
        },
        improvements: [
            { id: 'density', name: 'Critical Density Restoration', desc: 'Reverse thinning and miniaturization across the scalp.' },
            { id: 'recession', name: 'Advanced Frontal Recession', desc: 'Targeting the hairline and temples with precision growth stimulants.' },
            { id: 'scalp', name: 'Scalp Biome Optimization', desc: 'Create the ideal environment for healthy follicle production.' },
            { id: 'rebirth', name: 'Precision Follicle Rebirth', desc: 'Activate dormant follicles using medical-grade growth factors.' }
        ]
    },
    'sexual-health': {
        title: 'Sexual Health Engineering',
        question: ['What brings you to seek clinical-grade', 'performance support?'],
        stat: {
            pct: '85%',
            text: 'of men feel more confident in their',
            highlight: 'performance*',
            image: null,
            disclaimer: '*Based on a survey of 114 active uGLOWMD patients, conducted in May 2025.',
            reviews: [
                { name: "Robert L.", result: "Peak Mastery", text: "Life changed. Improved intimacy and absolute confidence." },
                { name: "Andrew C.", result: "Vitality Boost", text: "Performance levels I haven't seen since my early 20s." },
                { name: "Steve B.", result: "Daily Surge", text: "Precision protocols that actually deliver on the promise." }
            ]
        },
        improvements: [
            { id: 'performance', name: 'Peak Performance Engineering', desc: 'Optimize blood flow and physiological responsiveness.' },
            { id: 'libido', name: 'Sub-Cellular Libido Boost', desc: 'Harness neuro-peptides to enhance desire and mental drive.' },
            { id: 'sensitivity', name: 'Intimacy Sensitivity', desc: 'Heighten physical sensation and connection during intimacy.' },
            { id: 'stamina', name: 'Sustained Stamina Protocols', desc: 'Extended duration support for confidence without compromise.' }
        ]
    },
    'longevity': {
        title: 'Longevity & Cellular Science',
        question: ['What motivates your interest in advanced', 'longevity science?'],
        stat: {
            pct: '94%',
            text: 'of users report enhanced cellular',
            highlight: 'vitality*',
            image: null,
            disclaimer: '*Based on a survey of 114 active uGLOWMD patients, conducted in May 2025.',
            reviews: [
                { name: "Elena G.", result: "Optimal Vitality", text: "Feeling 20 again. Energy levels skyrocketed instantly." },
                { name: "Frank P.", result: "Cellular Renew", text: "Mental clarity and physical surge are undeniable." },
                { name: "Sophia W.", result: "Age Defy", text: "The anti-aging science that finally makes sense." }
            ]
        },
        improvements: [
            { id: 'age-dec', name: 'Biological Age Deceleration', desc: 'Targeting aging at the cellular level with NAD+ and sirtuin activators.' },
            { id: 'energy', name: 'Mitochondrial Energy Surge', desc: 'Refresh your body\'s "batteries" for sustained physical vitality.' },
            { id: 'dna', name: 'DNA Structural Integrity', desc: 'Protective protocols to preserve genetic health and cellular repair.' },
            { id: 'cognitive', name: 'Cognitive Neuro-Precision', desc: 'Enhance mental clarity, focus, and long-term brain health.' }
        ]
    },
    'testosterone': {
        title: 'Testosterone Health Assessment',
        question: ['What is your primary goal for', 'testosterone therapy?'],
        stat: {
            pct: '89%',
            text: 'of patients report improved energy and',
            highlight: 'vitality*',
            image: null,
            disclaimer: '*Based on a survey of 114 active uGLOWMD patients, conducted in May 2025.',
            reviews: [
                { name: "Marcus T.", result: "Energy Restored", text: "Levels optimized. Feeling stronger and sharper every day." },
                { name: "Daniel R.", result: "Muscle Gain", text: "Physical performance is back to peak. Clinical precision delivered." },
                { name: "Carlos M.", result: "Libido Boost", text: "Confidence and vitality fully restored. Remarkable results." }
            ]
        },
        improvements: [
            { id: 'energy', name: 'Increase daily energy and reduce fatigue', desc: 'Restore optimal hormone levels for sustained daily vitality.' },
            { id: 'muscle', name: 'Improve muscle strength and physical performance', desc: 'Support lean mass, strength, and athletic recovery.' },
            { id: 'sexual', name: 'Support sexual health and libido', desc: 'Optimize hormonal balance for sexual function and desire.' },
            { id: 'mood', name: 'Enhance mood, motivation, or mental clarity', desc: 'Testosterone supports cognitive sharpness and emotional balance.' },
            { id: 'wellness', name: 'Support overall wellness and healthy aging', desc: 'Long-term hormonal health for sustained vitality and longevity.' }
        ]
    },
    'repair-healing': {
        title: 'Repair & Strength Healing',
        question: ['What is your primary goal for', 'peptide therapy?'],
        stat: {
            pct: '91%',
            text: 'of patients report improved recovery and',
            highlight: 'mobility*',
            image: null,
            disclaimer: '*Based on a survey of 114 active uGLOWMD patients, conducted in May 2025.',
            reviews: [
                { name: "James K.", result: "Full Recovery", text: "Back to training in half the time. BPC-157 is extraordinary." },
                { name: "Maria L.", result: "Pain Free", text: "Joint pain gone in weeks. Mobility completely restored." },
                { name: "Tom R.", result: "Peak Performance", text: "Tendon healed. Performance back at 100%." }
            ]
        },
        improvements: [
            { id: 'recovery', name: 'Accelerate recovery from sports or musculoskeletal injuries', desc: 'Targeted peptide support for faster healing at the cellular level.' },
            { id: 'pain', name: 'Reduce joint or tendon pain and inflammation', desc: 'BPC-157 and TB-500 modulate inflammation for lasting relief.' },
            { id: 'mobility', name: 'Improve mobility, flexibility, and range of motion', desc: 'Restore functional movement through tissue repair protocols.' },
            { id: 'tissue', name: 'Support soft tissue, ligament, or tendon integrity', desc: 'Long-term structural support for connective tissue health.' },
            { id: 'prevention', name: 'Enhance overall injury prevention and physical performance', desc: 'Proactive peptide strategy for athletes and active individuals.' }
        ]
    },
    'skin-care': {
        title: 'Precision Skin Care Assessment',
        question: ['What are your primary', 'skin care goals?'],
        stat: {
            pct: '95%',
            text: 'of users report visible skin',
            highlight: 'improvement*',
            image: null,
            disclaimer: '*Based on a survey of 114 active uGLOWMD patients, conducted in May 2025.',
            reviews: [
                { name: "Emily S.", result: "Radiant Skin", text: "My dark spots have faded significantly in just 8 weeks." },
                { name: "John D.", result: "Clear Complexion", text: "Finally an acne treatment that works without irritation." },
                { name: "Sarah L.", result: "Youthful Glow", text: "The anti-aging cream is a literal fountain of youth." }
            ]
        },
        improvements: [
            { id: 'anti-aging', name: 'Anti-Aging & Wrinkles', desc: 'Reduce fine lines and restore youthful elasticity.' },
            { id: 'pigmentation', name: 'Pigmentation & Dark Spots', desc: 'Even out skin tone and fade stubborn sun damage.' },
            { id: 'acne', name: 'Acne & Breakouts', desc: 'Clear active acne and prevent future congestion.' },
            { id: 'redness', name: 'Redness & Rosacea', desc: 'Calm sensitive skin and reduce visible flushing.' }
        ]
    }
};

export const intakeQuestions = {
    'weight-loss': [
        {
            id: 'allergies',
            title: 'Allergies',
            question: 'Type all the allergies you have, if more than one allergy, use a common (,). Include allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Enter "No" if you have no allergies.',
            type: 'text',
            placeholder: 'Type your allergies here...'
        },
        {
            id: 'current_meds',
            title: 'Current Medications',
            question: 'Are you currently taking any of the following medications?',
            type: 'multiselect',
            options: [
                'A GLP-1 agonist such as (but not limited to) Semaglutide, Tirzepatide, exenatide, liraglutide',
                'Metformin',
                'SGLT2 inhibitors – empagliflozin, canagliflozin',
                'Sulfonylureas such as (but not limited to) glipizide (Glucotrol), glimepiride (Amaryl), glyburide',
                'Meglitinides – repaglinide, nateglinide',
                'Insulin',
                'Alpha-glucosidase inhibitors – acarbose',
                'Thiazolidinediones – pioglitazone',
                'Warfarin (also called Jantoven or Coumadin) - a blood thinner that usually requires regular lab testing',
                'Diuretics such as (but not limited to) furosemide (Lasix), bumetanide (Bumex), Hydrochlorothiazide/HCTZ',
                'Selective Serotonin Reuptake Inhibitor (SSRI) such as (but not limited to) citalopram (Celexa), fluoxetine (Prozac), escitalopram (Lexapro)',
                'Monoamine Oxidase Inhibitor (MAOI) such as (but not limited to) phenelzine (Nardil), selegiline (Emsam)',
                'Opioids such as Oxycontin, Oxycodone, Vicodin, Percocet, Norco (hydrocodone), Dilaudid (hydromorphone), Methadone, Suboxone',
                'None of the above'
            ]
        },
        {
            id: 'diabetes',
            title: 'Diabetes Conditions',
            question: 'Do you currently have any of these conditions?',
            type: 'choice',
            options: [
                'Diabetes requiring insulin',
                'Diabetes not requiring insulin',
                'Prediabetes (also called insulin resistance)',
                'None of these conditions apply to me'
            ]
        },
        {
            id: 'heart_conditions',
            title: 'Heart Conditions',
            question: 'Do you currently have, or have you ever been diagnosed with, any of the following heart or heart-related conditions?',
            type: 'multiselect',
            options: [
                'Atrial fibrillation or flutter',
                'Tachycardia (episode of rapid heart rate)',
                'Heart failure',
                'Heart disease, stroke, or peripheral vascular disease',
                'Prolonged QT interval',
                'Other heart rhythm issue or ECG abnormalities',
                'Hypertension (high blood pressure)',
                'Hyperlipidemia (high cholesterol)',
                'Hypertriglyceridemia (high triglycerides)',
                'No, I have not been diagnosed with any of these heart conditions'
            ]
        },
        {
            id: 'hormone_conditions',
            title: 'Hormone, Kidney, or Liver Conditions',
            question: 'Do you currently have, or have you ever been diagnosed with, any of these hormone, kidney, or liver conditions?',
            type: 'multiselect',
            options: [
                'Multiple Endocrine Neoplasia syndrome type 2 (MEN2)',
                'Chronic kidney disease',
                'Fatty liver disease (NAFLD or NASH)',
                'Kidney stones',
                'Liver cirrhosis or end-stage liver disease',
                'Hypothyroidism (low functioning thyroid)',
                'Hyperthyroidism (high thyroid function)',
                'Graves disease',
                'Other thyroid issues',
                'Syndrome of inappropriate antidiuretic hormone (SIADH)',
                'No, I have not been diagnosed with any of these conditions'
            ]
        },
        {
            id: 'gi_conditions',
            title: 'Gastrointestinal Conditions',
            question: 'Do you currently have, or have a history of, any of these gastrointestinal conditions or procedures?',
            type: 'multiselect',
            options: [
                'Bariatric surgery',
                'Pancreatitis',
                'History of delayed gastric emptying or gastroparesis',
                'Gallstones or other gallbladder disease',
                'GERD / Acid Reflux',
                'No, I do not have a history of any of these conditions or procedures'
            ]
        },
        {
            id: 'mental_health',
            title: 'Mental Health Conditions',
            question: 'Do you have a history of any of the following mental health conditions?',
            type: 'multiselect',
            options: [
                'Anxiety',
                'Bipolar disease',
                'Borderline personality disorder',
                'Depression',
                'Psychiatric hospitalization within the last 12 months',
                'Schizophrenia',
                'No, I have not been diagnosed with any of these conditions'
            ]
        },
        {
            id: 'cancer_history',
            title: 'Cancer History',
            question: 'Have you or a family member ever been diagnosed with cancer?',
            type: 'choice',
            options: [
                'Yes, I have or have had cancer',
                'Yes, I have a family member who has had cancer',
                'No, neither I nor a family member has had cancer'
            ]
        },
        {
            id: 'additional_conditions',
            title: 'Additional Conditions',
            question: 'Do you currently have, or have you ever been diagnosed with, any of these additional following conditions?',
            type: 'multiselect',
            options: [
                'Chronic candidiasis (fungal infections)',
                'Eating disorder',
                'Glaucoma',
                'Gout',
                'Heavy alcohol use (more than 15-20 drinks per week)',
                'History of seizures',
                'Lymphedema or chronic lower extremity swelling where other causes have been ruled out',
                'Metabolic syndrome',
                'Migraine headaches',
                'Obstructive sleep apnea',
                'Opioid use disorder',
                'Osteoarthritis',
                'Tinea infections (skin folds)',
                'No, I have not been diagnosed with any of these conditions'
            ]
        },
        {
            id: 'pcp_labs',
            title: 'Primary Care & Labs',
            question: 'Have you seen your primary care provider and/or did lab testing in the past 12 months?',
            type: 'choice',
            options: ['Yes', 'No'],
            isStep23: true
        },
        {
            id: 'quote3',
            title: 'Metabolic Science',
            type: 'info',
            content: '“GLP‑1 receptor agonists not only promote significant reductions in body fat and body mass index, but they also preferentially decrease visceral adipose tissue while preserving lean body mass, maintain or increase resting energy expenditure, and improve overall metabolic health in both diabetic and non‑diabetic populations.”',
            footer: 'Reference (APA): Bhandarkar, A., Bhat, S., & Kapoor, N. (2025). Effect of GLP‑1 receptor agonists on body composition. Current Opinion in Endocrinology, Diabetes and Obesity, 32(6), 279–285. https://pubmed.ncbi.nlm.nih.gov/41076575/'
        },
        {
            id: 'weight_impact',
            title: 'Weight Impact',
            question: 'How does weight impact your current living?',
            type: 'multiselect',
            options: [
                'I don\'t feel like myself',
                'I lack confidence in my appearance',
                'I\'m not able to do physical activities I enjoy',
                'I\'m not able to complete my daily activities I need to accomplish (e.g., errands and hubbies)',
                'I don\'t have enough energy',
                'I feel stressed',
                'I\'m not able to wear clothes that I want',
                'I feel judged by others',
                'None of the above'
            ]
        },
        {
            id: 'past_weightloss_methods',
            title: 'Past Weight Loss Methods',
            question: 'Select any method of weight loss you have tried in the past.',
            type: 'multiselect',
            options: [
                'Exercise',
                'Low-calorie diet',
                'Specialized diet (e.g., Paleo, Atkins, Keto, Ornish)',
                'Meal replacements',
                'Commercial weight loss plan (e.g., Weight Watchers, Jenny Craig)',
                'Healthcare provider or dietitian prescribed weight loss program',
                'Weight loss supplements or over-the-counter products',
                'Nutritional supplements',
                'Prescription weight loss medication',
                'Nutritional consultation',
                'Other',
                'I have not tried any method of weight loss in the past'
            ]
        },
        {
            id: 'past_rx_weightloss',
            title: 'Past Prescription Medications',
            question: 'Which of the following prescription weight loss medications have you tried in the past?',
            type: 'multiselect',
            options: [
                'Semaglutide (Wegovy/Ozempic)',
                'Tirzepatide (Zepbound/Mounjaro)',
                'Retatruide',
                'Liraglutide (Saxenda)',
                'Orlistat (Xenical, Alli)',
                'Phentermine (Adipex, Lomaira, Fen-Phen)',
                'Phentermine-Topiramate (Qsymia)',
                'Bupropion-Naltrexone (Contrave)',
                'Metformin',
                'Diethylpropion (Tenuate)',
                'Lorcaserin (Belviq)',
                'Phendimetrazine (Bontril)',
                'Benzphetamine (Didrex)',
                'Hydrogel compound (Plenity)',
                'Other',
                'None'
            ],
            isStep19: true
        },
        {
            id: 'other_meds',
            title: 'Other Medications',
            question: 'Search and select any medications, vitamins, dietary supplements, and topical creams you are currently taking or using. Include prescription and over-the-counter medications, herbs, minerals, inhalers, injections, and medication implants or patches. Enter "No" if not applicable.',
            type: 'text'
        },
        {
            id: 'ethnicity',
            title: 'Race/Ethnicity',
            question: 'How would you describe yourself?',
            subtext: 'Knowing your race and/or ethnic background helps us work toward improving equally accessible, high-quality care for everyone on our platform. However, you are not required to provide this information, and it won\'t impact your treatment if you don\'t.',
            isOptional: true,
            type: 'multiselect',
            options: [
                'White',
                'Hispanic or Latino',
                'Black or African American',
                'Native American or American Indian',
                'Asian / Pacific Islander',
                'Other',
                'I prefer not to answer'
            ]
        },
        {
            id: 'other_health_goals',
            title: 'Other Health Goals',
            question: 'What other health goals are on your mind?',
            type: 'multiselect',
            options: [
                'Hair loss',
                'Stronger erections',
                'Climax control',
                'Longevity',
                'Testosterone',
                'Estradiol',
                'Skincare',
                'Repair & Heal teared Ligaments',
                'Lab Testing',
                'None of the above'
            ]
        },
        {
            id: 'additional_health_info',
            title: 'Additional Health Information',
            question: 'BEFORE WE WRAP UP: Is there anything else you want your healthcare provider to know about your health? Include any additional details about the conditions you\'ve already reported.',
            type: 'choice',
            options: ['Yes', 'No'],
            details: true
        }
    ],
    'hair-restoration': [
        {
            id: 'allergies',
            title: 'Allergies',
            question: 'Type all the allergies you have, if more than one allergy, use a common (,). Include allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Enter "No" if you have no allergies.',
            type: 'text',
            placeholder: 'Type your allergies here...'
        },
        {
            id: 'current_medications',
            title: 'Current Medications',
            question: 'Are you currently taking any of the following medications?',
            type: 'multiselect',
            options: [
                'A GLP-1 agonist such as (but not limited to) Semaglutide, Tirzepatide, exenatide, liraglutide',
                'Metformin',
                'SGLT2 inhibitors – empagliflozin, canagliflozin',
                'Sulfonylureas such as (but not limited to) glipizide (Glucotrol), glimepiride (Amaryl), glyburide',
                'Meglitinides – repaglinide, nateglinide',
                'Insulin',
                'Alpha-glucosidase inhibitors – acarbose',
                'Thiazolidinediones – pioglitazone',
                'Warfarin (also called Jantoven or Coumadin) - a blood thinner that usually requires regular lab testing',
                'Diuretics such as (but not limited to) furosemide (Lasix), bumetanide (Bumex), Hydrochlorothiazide/HCTZ',
                'Selective Serotonin Reuptake Inhibitor (SSRI) such as (but not limited to) citalopram (Celexa), fluoxetine (Prozac), escitalopram (Lexapro)',
                'Monoamine Oxidase Inhibitor (MAOI) such as (but not limited to) phenelzine (Nardil), selegiline (Emsam)',
                'Opioids such as Oxycontin, Oxycodone, Vicodin, Percocet, Norco (hydrocodone), Dilaudid (hydromorphone), Methadone, Suboxone',
                'Blood thinners (warfarin, apixaban, etc.)',
                'Antihypertensives',
                'Hormone therapies (testosterone, DHT blockers)',
                'Minoxidil topical treatments',
                'Finasteride or other 5-alpha-reductase inhibitors',
                'Other medication(s)',
                'None of the above'
            ]
        },
        {
            id: 'hair_loss_duration',
            title: 'Hair Loss History',
            question: 'How long have you experienced noticeable hair loss?',
            type: 'choice',
            options: ['Less than 6 months', '6–12 months', '1–3 years', 'More than 3 years']
        },
        {
            id: 'hair_thinning_location',
            title: 'Hair Loss History',
            question: 'Where is hair thinning most prominent?',
            type: 'multiselect',
            options: ['Hairline / temples', 'Crown / vertex', 'Diffuse thinning / overall scalp']
        },
        {
            id: 'hair_loss_progression',
            title: 'Hair Loss History',
            question: 'How fast is hair loss progressing?',
            type: 'choice',
            options: ['Very slow', 'Gradual', 'Rapid']
        },
        {
            id: 'miniaturization',
            title: 'Hair Loss History',
            question: 'Have you noticed miniaturized (thinner) hairs over time?',
            type: 'choice',
            options: ['No', 'Mild', 'Moderate', 'Severe']
        },
        {
            id: 'prev_treatments',
            title: 'Previous Treatments',
            question: 'Have you used any hair loss treatments before?',
            type: 'multiselect',
            options: ['No', 'Topical minoxidil', 'Oral finasteride / dutasteride', 'Other prescription treatments', 'OTC / natural treatments']
        },
        {
            id: 'prev_treatment_efficacy',
            title: 'Previous Treatments',
            question: 'How effective were previous treatments?',
            type: 'choice',
            options: ['No effect', 'Mild improvement', 'Moderate improvement', 'Significant improvement'],
            condition: (data) => data.prev_treatments && !data.prev_treatments.includes('No')
        },
        {
            id: 'prev_treatment_side_effects',
            title: 'Previous Treatments',
            question: 'Any side effects from previous treatments?',
            type: 'choice',
            options: ['None', 'Mild (scalp irritation, itching)', 'Moderate (sexual side effects, dizziness)', 'Severe (discontinued treatment)'],
            condition: (data) => data.prev_treatments && !data.prev_treatments.includes('No')
        },
        {
            id: 'medication_review_subset',
            title: 'Medication Review',
            question: 'Select all current medications:',
            type: 'multiselect',
            options: [
                'Blood thinners (warfarin, apixaban, etc.)',
                'Antihypertensives',
                'Hormone therapies (testosterone, DHT blockers)',
                'Minoxidil topical treatments',
                'Finasteride or other 5-alpha-reductase inhibitors',
                'None of the above'
            ]
        },
        {
            id: 'liver_disease',
            title: 'Health Conditions',
            question: 'History of liver disease?',
            type: 'choice',
            options: ['No', 'Mild / controlled', 'Moderate / monitored', 'Severe']
        },
        {
            id: 'kidney_disease',
            title: 'Health Conditions',
            question: 'History of kidney disease?',
            type: 'choice',
            options: ['No', 'Mild / controlled', 'Moderate / monitored', 'Severe']
        },
        {
            id: 'cv_disease',
            title: 'Health Conditions',
            question: 'Cardiovascular disease (heart attack, stroke, angina)?',
            type: 'choice',
            options: ['No', 'Stable', 'Unstable / worsening']
        },
        {
            id: 'prostate_hormone_disease',
            title: 'Health Conditions',
            question: 'Prostate disease (men) / hormone-sensitive conditions (women)?',
            type: 'choice',
            options: ['No', 'Stable', 'Active / untreated']
        },
        {
            id: 'mental_health_status',
            title: 'Health Conditions',
            question: 'Mental health conditions (depression, anxiety)?',
            type: 'choice',
            options: ['No', 'Yes, well controlled', 'Yes, not well controlled']
        },
        {
            id: 'female_considerations_intro',
            title: 'Female-Specific Considerations',
            question: 'The following questions are for female patients only. If you are male, you may skip these.',
            type: 'choice',
            options: ['Answer Questions', 'Skip']
        },
        {
            id: 'female_reproduction',
            title: 'Female-Specific Considerations',
            question: 'Are you pregnant, planning pregnancy, or breastfeeding?',
            type: 'choice',
            options: ['No', 'Yes – cannot use finasteride'],
            condition: (data) => data.female_considerations_intro === 'Answer Questions'
        },
        {
            id: 'female_contraception',
            title: 'Female-Specific Considerations',
            question: 'If premenopausal, are you using reliable contraception?',
            type: 'choice',
            options: ['Yes', 'No – finasteride cannot be prescribed'],
            condition: (data) => data.female_considerations_intro === 'Answer Questions'
        },
        {
            id: 'pcos_hormonal',
            title: 'Female-Specific Considerations',
            question: 'Have you been diagnosed with PCOS or other hormonal disorders?',
            type: 'choice',
            options: ['No', 'Yes'],
            condition: (data) => data.female_considerations_intro === 'Answer Questions'
        },
        {
            id: 'tobacco_nicotine',
            title: 'Lifestyle Factors',
            question: 'Tobacco / nicotine use?',
            type: 'choice',
            options: ['Never', 'Former', 'Current']
        },
        {
            id: 'alcohol_consumption',
            title: 'Lifestyle Factors',
            question: 'Alcohol consumption?',
            type: 'choice',
            options: ['Rarely / never', '1–3 drinks/week', '4–10 drinks/week', '>10 drinks/week']
        },
        {
            id: 'recreational_drug_use',
            title: 'Lifestyle Factors',
            question: 'Recreational drug use?',
            type: 'choice',
            options: ['No', 'Occasionally', 'Regularly']
        },
        {
            id: 'family_history',
            title: 'Lifestyle Factors',
            question: 'Family history of hair loss?',
            type: 'choice',
            options: ['No', 'Father', 'Mother', 'Siblings']
        },
        {
            id: 'scalp_images',
            title: 'Scalp Image Upload',
            question: 'Upload clear images of your scalp for evaluation:',
            subtext: 'Front hairline, Crown / vertex, Top / mid scalp. Optional: side views. Multiple Photos accepted; max 6. Accepted formats: JPG, PNG, PDF',
            type: 'file',
            maxFiles: 6
        }
    ],
    'sexual-health': [
        {
            id: 'allergies',
            title: 'Allergies',
            question: 'Type all allergies you have, if more than one allergy, use a common (,). Include allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Enter \"No\" if you have no allergies.',
            type: 'text',
            placeholder: 'List your allergies here...'
        },
        {
            id: 'current_medications',
            title: 'Current Medications',
            question: 'Are you currently taking any of the following medications?',
            type: 'multiselect',
            options: [
                'A GLP-1 agonist such as (but not limited to) Semaglutide, Tirzepatide, exenatide, liraglutide',
                'Metformin',
                'SGLT2 inhibitors – empagliflozin, canagliflozin',
                'Sulfonylureas such as (but not limited to) glipizide (Glucotrol), glimepiride (Amaryl), glyburide',
                'Meglitinides – repaglinide, nateglinide',
                'Insulin',
                'Alpha-glucosidase inhibitors – acarbose',
                'Thiazolidinediones – pioglitazone',
                'Warfarin (also called Jantoven or Coumadin) - a blood thinner that usually requires regular lab testing',
                'Diuretics such as (but not limited to) furosemide (Lasix), bumetanide (Bumex), Hydrochlorothiazide/HCTZ',
                'Selective Serotonin Reuptake Inhibitor (SSRI) such as (but not limited to) citalopram (Celexa), fluoxetine (Prozac), escitalopram (Lexapro)',
                'Monoamine Oxidase Inhibitor (MAOI) such as (but not limited to) phenelzine (Nardil), selegiline (Emsam)',
                'Opioids such as Oxycontin, Oxycodone, Vicodin, Percocet, Norco (hydrocodone), Dilaudid (hydromorphone), Methadone, Suboxone',
                'None of the above'
            ]
        },
        {
            id: 'ed_duration',
            title: 'ED Assessment',
            question: 'How long have you experienced difficulty achieving or maintaining an erection?',
            type: 'choice',
            options: ['Less than 3 months', '3–12 months', '1–3 years', 'More than 3 years']
        },
        {
            id: 'ed_frequency',
            title: 'ED Assessment',
            question: 'How often does the issue occur?',
            type: 'choice',
            options: ['Rarely', 'Occasionally', 'Most of the time', 'Every time']
        },
        {
            id: 'morning_erections',
            title: 'ED Assessment',
            question: 'Are you able to achieve erections during sleep or upon waking?',
            type: 'choice',
            options: ['Yes, regularly', 'Sometimes', 'Rarely', 'Never']
        },
        {
            id: 'prior_ed_medication',
            title: 'Treatment History',
            question: 'Have you previously used prescription ED medication?',
            type: 'choice',
            options: ['No', 'Yes – effective with no side effects', 'Yes – effective with mild side effects', 'Yes – ineffective', 'Yes – discontinued due to side effects']
        },
        {
            id: 'priapism',
            title: 'Medical Screening',
            question: 'Have you ever had an erection lasting longer than 4 hours?',
            type: 'choice',
            options: ['No', 'Yes']
        },
        {
            id: 'penile_pain',
            title: 'Medical Screening',
            question: 'Do you experience penile pain during erections?',
            type: 'choice',
            options: ['No', 'Mild', 'Moderate', 'Severe']
        },
        {
            id: 'heart_disease',
            title: 'Cardiovascular Screening',
            question: 'Have you ever been diagnosed with heart disease?',
            type: 'choice',
            options: ['No', 'Yes – stable', 'Yes – unstable or worsening']
        },
        {
            id: 'heart_attack_stroke',
            title: 'Cardiovascular History',
            question: 'History of heart attack or stroke?',
            type: 'choice',
            options: ['No', 'Yes – more than 6 months ago', 'Yes – within the past 6 months']
        },
        {
            id: 'chest_pain_exertion',
            title: 'Cardiovascular Screening',
            question: 'Do you experience chest pain with exertion?',
            type: 'choice',
            options: ['No', 'Rarely', 'Frequently']
        },
        {
            id: 'sexual_activity_restricted',
            title: 'Cardiovascular Screening',
            question: 'Have you been told to avoid sexual activity due to heart risk?',
            type: 'choice',
            options: ['No', 'Yes']
        },
        {
            id: 'exercise_tolerance',
            title: 'Cardiovascular Screening',
            question: 'Can you climb two flights of stairs without chest pain or severe shortness of breath?',
            type: 'choice',
            options: ['Yes', 'No', 'Unsure']
        },
        {
            id: 'blood_pressure',
            title: 'Cardiovascular Screening',
            question: 'Do you have high blood pressure?',
            type: 'choice',
            options: ['No', 'Yes – controlled', 'Yes – uncontrolled']
        },
        {
            id: 'low_blood_pressure',
            title: 'Cardiovascular Screening',
            question: 'Do you have low blood pressure or frequent dizziness/fainting?',
            type: 'choice',
            options: ['No', 'Yes']
        },
        {
            id: 'nitrate_medications',
            title: 'Medication Interactions',
            question: 'Do you take nitrate medications (nitroglycerin, isosorbide)?',
            type: 'choice',
            options: ['No', 'Yes']
        },
        {
            id: 'recreational_nitrates',
            title: 'Medication Interactions',
            question: 'Do you use recreational nitrates ("poppers")?',
            type: 'choice',
            options: ['No', 'Yes']
        },
        {
            id: 'riociguat',
            title: 'Medication Interactions',
            question: 'Do you take riociguat?',
            type: 'choice',
            options: ['No', 'Yes']
        },
        {
            id: 'alpha_blockers',
            title: 'Medication Interactions',
            question: 'Do you take alpha-blockers (tamsulosin, doxazosin, terazosin, alfuzosin)?',
            type: 'choice',
            options: ['No', 'Yes – stable dose', 'Yes – recently started or adjusted']
        },
        {
            id: 'bp_medications',
            title: 'Medication Interactions',
            question: 'Are you taking blood pressure medications?',
            type: 'choice',
            options: ['No', 'Yes – 1 medication', 'Yes – 2 or more medications']
        },
        {
            id: 'cyp3a4_inhibitors',
            title: 'Medication Interactions',
            question: 'Are you taking strong CYP3A4 inhibitors (ketoconazole, itraconazole, clarithromycin, ritonavir)?',
            type: 'choice',
            options: ['No', 'Yes', 'Unsure']
        },
        {
            id: 'blood_thinners',
            title: 'Medication Interactions',
            question: 'Are you taking blood thinners?',
            type: 'choice',
            options: ['No', 'Yes']
        },
        {
            id: 'other_ed_treatments',
            title: 'Current Treatments',
            question: 'Are you currently using any other erectile dysfunction treatments?',
            type: 'choice',
            options: ['No', 'Yes – oral medication', 'Yes – injection therapy', 'Yes – other']
        },
        {
            id: 'diabetes_history',
            title: 'Metabolic Screening',
            question: 'Have you ever been diagnosed with diabetes or abnormal blood sugar levels by a healthcare provider? Please select the option that most accurately reflects your condition:',
            type: 'choice',
            options: [
                'No, I have never been diagnosed with diabetes or prediabetes',
                'Yes – Prediabetes (elevated blood sugar but not diagnosed as diabetes)',
                'Yes – Type 1 diabetes',
                'Yes – Type 2 diabetes',
                'Yes – Gestational diabetes (history only)'
            ]
        },
        {
            id: 'kidney_function',
            title: 'Renal Screening',
            question: 'Have you ever been told your kidney function is reduced?',
            type: 'choice',
            options: ['Never', 'Identified on routine lab testing', 'Managed by a nephrologist', 'History of dialysis']
        },
        {
            id: 'liver_health',
            title: 'Hepatic Screening',
            question: 'Which statement best describes your liver health?',
            type: 'choice',
            options: ['No known liver condition', 'Fatty liver disease', 'Chronic viral hepatitis', 'Cirrhosis']
        },
        {
            id: 'mental_health_treatment',
            title: 'Mental Health Screening',
            question: 'Are you currently being treated for depression, anxiety, or another mental health condition?',
            type: 'choice',
            options: ['No', 'Yes, stable on treatment', 'Yes, symptoms not well controlled']
        },
        {
            id: 'alcohol_consumption',
            title: 'Lifestyle Assessment',
            question: 'How often do you consume alcohol?',
            type: 'choice',
            options: ['Rarely or never', '1–3 drinks per week', '4–10 drinks per week', 'More than 10 drinks per week']
        },
        {
            id: 'tobacco_use',
            title: 'Lifestyle Assessment',
            question: 'Do you use tobacco or nicotine products?',
            type: 'choice',
            options: ['Never', 'Former user', 'Current user']
        },
        {
            id: 'recreational_drug_use',
            title: 'Lifestyle Assessment',
            question: 'Do you use recreational drugs?',
            type: 'choice',
            options: ['No', 'Occasionally', 'Regularly']
        },
        {
            id: 'side_effects_ack_1',
            title: 'Treatment Consent',
            question: 'I understand this medication may cause side effects such as headache, flushing, nasal congestion, indigestion, muscle or back discomfort.',
            type: 'choice',
            options: ['Agree']
        },
        {
            id: 'side_effects_ack_2',
            title: 'Treatment Consent',
            question: 'I understand this medication may cause side effects of lower blood pressure and dizziness or fainting.',
            type: 'choice',
            options: ['Agree']
        }
    ],
    'longevity': [
        // Step 5 – Allergies
        {
            id: 'allergies_long',
            title: 'Allergies',
            question: 'Type all the allergies you have, if more than one allergy, use a comma (,). Include allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Enter "No" if you have no allergies.',
            type: 'text',
            placeholder: 'e.g. Penicillin, Shellfish, Latex… or "No"'
        },
        // Step 6 – Current Medications
        {
            id: 'current_meds_long',
            title: 'Current Medications',
            question: 'Are you currently taking any of the following medications?',
            type: 'multiselect',
            options: [
                'A GLP-1 agonist such as (but not limited to) Semaglutide, Tirzepatide, exenatide, liraglutide',
                'Metformin',
                'SGLT2 inhibitors – empagliflozin, canagliflozin',
                'Sulfonylureas such as (but not limited to) glipizide (Glucotrol), glimepiride (Amaryl), glyburide',
                'Meglitinides – repaglinide, nateglinide',
                'Insulin',
                'Alpha-glucosidase inhibitors – acarbose',
                'Thiazolidinediones – pioglitazone',
                'Warfarin (also called Jantoven or Coumadin) - a blood thinner that usually requires regular lab testing',
                'Diuretics such as (but not limited to) furosemide (Lasix), bumetanide (Bumex), Hydrochlorothiazide/HCTZ',
                'Selective Serotonin Reuptake Inhibitor (SSRI) such as (but not limited to) citalopram (Celexa), fluoxetine (Prozac), escitalopram (Lexapro)',
                'Monoamine Oxidase Inhibitor (MAOI) such as (but not limited to) phenelzine (Nardil), selegiline (Emsam)',
                'Opioids such as Oxycontin, Oxycodone, Vicodin, Percocet, Norco (hydrocodone), Dilaudid (hydromorphone), Methadone, Suboxone',
                'Blood thinners (warfarin, apixaban, etc.)',
                'Antihypertensives',
                'Hormone therapies (testosterone, DHT blockers)',
                'Minoxidil topical treatments',
                'Finasteride or other 5-alpha-reductase inhibitors',
                'Other medication(s)',
                'None of the above'
            ]
        },
        // Step 7 – Therapy History
        {
            id: 'nad_therapy_history',
            title: 'Therapy History',
            question: 'Have you ever used NAD+ therapy before?',
            type: 'choice',
            options: [
                'I have never used any NAD+',
                'I have used NAD+ spray only',
                'I have used NAD+ subcutaneous injections'
            ]
        },
        {
            id: 'nad_therapy_effectiveness',
            title: 'Prior Therapy – Effectiveness',
            question: 'How effective was your prior therapy in achieving your wellness goals?',
            type: 'choice',
            condition: (data) => data.nad_therapy_history && data.nad_therapy_history !== 'I have never used any NAD+',
            options: [
                'I did not notice any improvement in energy or vitality',
                'I noticed mild improvements, but goals were partially achieved',
                'I noticed moderate improvements that helped daily function',
                'I noticed significant improvements and felt clearly better'
            ]
        },
        {
            id: 'nad_therapy_side_effects',
            title: 'Prior Therapy – Side Effects',
            question: 'Did you experience side effects from prior therapy?',
            type: 'choice',
            condition: (data) => data.nad_therapy_history && data.nad_therapy_history !== 'I have never used any NAD+',
            options: [
                'No side effects at all',
                'Mild effects such as temporary flushing, slight headache, or minor nausea',
                'Moderate effects such as dizziness or fatigue lasting a few hours',
                'Severe effects that required stopping the therapy'
            ]
        },
        // Glutathione Therapy History
        {
            id: 'glutathione_therapy_history',
            title: 'Therapy History',
            question: 'Have you ever used Glutathione therapy before?',
            type: 'choice',
            options: [
                'I have never used any Glutathione',
                'I have used Glutathione subcutaneous injections',
                'I have received Glutathione (IM) injections at a healthcare facility'
            ]
        },
        {
            id: 'glutathione_therapy_effectiveness',
            title: 'Prior Glutathione Therapy – Effectiveness',
            question: 'How effective was your prior therapy in achieving your wellness goals?',
            type: 'choice',
            condition: (data) => data.glutathione_therapy_history && data.glutathione_therapy_history !== 'I have never used any Glutathione',
            options: [
                'I did not notice any improvement in energy or vitality',
                'I noticed mild improvements, but goals were partially achieved',
                'I noticed moderate improvements that helped daily function',
                'I noticed significant improvements and felt clearly better'
            ]
        },
        {
            id: 'glutathione_therapy_side_effects',
            title: 'Prior Glutathione Therapy – Side Effects',
            question: 'Did you experience side effects from prior therapy?',
            type: 'choice',
            condition: (data) => data.glutathione_therapy_history && data.glutathione_therapy_history !== 'I have never used any Glutathione',
            options: [
                'No side effects at all',
                'Mild effects such as temporary flushing, slight headache, or minor nausea',
                'Moderate effects such as dizziness or fatigue lasting a few hours',
                'Severe effects that required stopping the therapy'
            ]
        },
        // Step 8 – Health Conditions
        {
            id: 'liver_health_long',
            title: 'Health Conditions',
            question: 'How would you describe your liver health?',
            type: 'choice',
            options: [
                'Normal liver function with no known issues',
                'Mild liver condition monitored by a healthcare provider',
                'Moderate liver condition requiring regular checkups',
                'Severe liver disease limiting safe medication use'
            ]
        },
        {
            id: 'kidney_health_long',
            title: 'Health Conditions',
            question: 'How would you describe your kidney function?',
            type: 'choice',
            options: [
                'Normal kidney function with no known issues',
                'Mild kidney impairment monitored by a healthcare provider',
                'Moderate kidney impairment requiring lab monitoring',
                'Severe kidney disease or dialysis-dependent'
            ]
        },
        {
            id: 'cardiovascular_health_long',
            title: 'Health Conditions',
            question: 'How would you describe your cardiovascular health?',
            type: 'choice',
            options: [
                'No cardiovascular issues',
                'Stable heart or blood vessel conditions under medical supervision',
                'History of heart attack, stroke, or unstable angina'
            ]
        },
        {
            id: 'metabolic_health_long',
            title: 'Health Conditions',
            question: 'How would you describe your metabolic health (blood sugar or diabetes)?',
            type: 'choice',
            options: [
                'Normal blood sugar with no history of diabetes',
                'Prediabetes or slightly elevated blood sugar',
                'Type 1 diabetes managed under medical supervision',
                'Type 2 diabetes – well controlled',
                'Type 2 diabetes – poorly controlled'
            ]
        },
        {
            id: 'autoimmune_long',
            title: 'Health Conditions',
            question: 'Do you have autoimmune or chronic inflammatory conditions?',
            type: 'choice',
            options: [
                'No autoimmune or chronic inflammation',
                'Mild autoimmune condition that is well-controlled',
                'Active or uncontrolled autoimmune disease'
            ]
        },
        // Step 9 – Medication & Supplement Review
        {
            id: 'meds_supplements_long',
            title: 'Medication & Supplement Review',
            question: 'Which of the following best describes your current regular medications or supplements?',
            type: 'multiselect',
            options: [
                'I do not take any medications or supplements',
                'I take blood thinners such as warfarin or apixaban',
                'I take blood pressure medications',
                'I take diabetes medications including insulin, metformin, or GLP-1 agonists',
                'I take antioxidant supplements such as NAC, vitamin C, or alpha-lipoic acid',
                'I take hormone therapy such as testosterone, estrogen, or thyroid medications'
            ]
        },
        // Step 10 – Lifestyle & Habits
        {
            id: 'exercise_freq_long',
            title: 'Lifestyle & Habits',
            question: 'How frequently do you exercise?',
            type: 'choice',
            options: [
                'Rarely or never',
                '1–2 times per week',
                '3–5 times per week',
                'Daily or almost daily'
            ]
        },
        {
            id: 'sleep_quality_long',
            title: 'Lifestyle & Habits',
            question: 'How would you describe your sleep quality?',
            type: 'choice',
            options: [
                'Poor, less than 5 hours per night',
                'Fair, 5–6 hours per night',
                'Good, 7–8 hours per night',
                'Excellent, more than 8 hours per night'
            ]
        },
        {
            id: 'alcohol_long',
            title: 'Lifestyle & Habits',
            question: 'How often do you consume alcohol?',
            type: 'choice',
            options: [
                'Rarely or never',
                '1–3 drinks per week',
                '4–10 drinks per week',
                'More than 10 drinks per week'
            ]
        },
        {
            id: 'tobacco_long',
            title: 'Lifestyle & Habits',
            question: 'Do you use tobacco or nicotine?',
            type: 'choice',
            options: ['Never used', 'Former user', 'Current user']
        },
        {
            id: 'recreational_drugs_long',
            title: 'Lifestyle & Habits',
            question: 'Do you use recreational drugs?',
            type: 'choice',
            options: ['Never', 'Occasionally', 'Regularly']
        },
        // Step 11 – Side Effects & Consent
        {
            id: 'nad_consent_long',
            title: 'Side Effects & Consent',
            question: 'I understand NAD+ therapy may cause temporary flushing, dizziness, headache, or fatigue.',
            type: 'choice',
            options: ['Agree']
        }
    ],
    'testosterone': [
        // Step 6 – Allergies
        {
            id: 'allergies_test',
            title: 'Allergies',
            question: 'Type all the allergies you have, if more than one allergy, use a comma (,). Include allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Enter "No" if you have no allergies.',
            type: 'text',
            placeholder: 'e.g. Penicillin, Shellfish, Latex… or "No"'
        },
        // Step 7 – Current Medications
        {
            id: 'current_meds_test',
            title: 'Current Medications',
            question: 'Are you currently taking any of the following medications?',
            type: 'multiselect',
            options: [
                'A GLP-1 agonist such as (but not limited to) Semaglutide, Tirzepatide, exenatide, liraglutide',
                'Metformin',
                'SGLT2 inhibitors – empagliflozin, canagliflozin',
                'Sulfonylureas such as (but not limited to) glipizide (Glucotrol), glimepiride (Amaryl), glyburide',
                'Meglitinides – repaglinide, nateglinide',
                'Insulin',
                'Alpha-glucosidase inhibitors – acarbose',
                'Thiazolidinediones – pioglitazone',
                'Warfarin (also called Jantoven or Coumadin) - a blood thinner that usually requires regular lab testing',
                'Diuretics such as (but not limited to) furosemide (Lasix), bumetanide (Bumex), Hydrochlorothiazide/HCTZ',
                'Selective Serotonin Reuptake Inhibitor (SSRI) such as (but not limited to) citalopram (Celexa), fluoxetine (Prozac), escitalopram (Lexapro)',
                'Monoamine Oxidase Inhibitor (MAOI) such as (but not limited to) phenelzine (Nardil), selegiline (Emsam)',
                'Opioids such as Oxycontin, Oxycodone, Vicodin, Percocet, Norco (hydrocodone), Dilaudid (hydromorphone), Methadone, Suboxone',
                'Blood thinners (warfarin, apixaban, etc.)',
                'Antihypertensives',
                'Hormone therapies (testosterone, DHT blockers)',
                'Minoxidil topical treatments',
                'Finasteride or other 5-alpha-reductase inhibitors',
                'Other medication(s)',
                'None of the above'
            ]
        },
        // Step 8 – Prior Therapy History
        {
            id: 'test_therapy_history',
            title: 'Prior Therapy History',
            question: 'Have you previously used testosterone therapy?',
            type: 'choice',
            options: [
                'No, I have never used testosterone therapy',
                'I have used topical gels or creams and monitored my hormone levels',
                'I have used intramuscular injections under a provider\'s supervision',
                'I have used subcutaneous injections for hormone replacement therapy'
            ]
        },
        {
            id: 'test_therapy_effectiveness',
            title: 'Prior Therapy – Effectiveness',
            question: 'How effective was prior therapy in achieving your wellness goals?',
            type: 'choice',
            condition: (data) => data.test_therapy_history && data.test_therapy_history !== 'No, I have never used testosterone therapy',
            options: [
                'Did not notice any measurable improvement in energy, mood, or sexual health',
                'Achieved mild improvement, with partial benefit in one or more areas',
                'Achieved moderate improvement, noticeable in energy, strength, or focus',
                'Achieved significant improvement, with clear changes in multiple wellness areas'
            ]
        },
        {
            id: 'test_therapy_side_effects',
            title: 'Prior Therapy – Side Effects',
            question: 'Have you experienced side effects from prior testosterone therapy?',
            type: 'choice',
            condition: (data) => data.test_therapy_history && data.test_therapy_history !== 'No, I have never used testosterone therapy',
            options: [
                'No side effects, therapy was well-tolerated',
                'Mild acne, minor mood changes, or transient fatigue',
                'Moderate changes such as elevated hematocrit, persistent acne, or water retention',
                'Severe effects including cardiovascular symptoms, liver concerns, or therapy discontinuation'
            ]
        },
        // Step 8b – Prior Hormone Therapy History
        {
            id: 'hormone_therapy_history',
            title: 'Prior Hormone Therapy History',
            question: 'Have you previously used estrogen or other hormone therapies?',
            type: 'choice',
            options: [
                'No, I have never used hormone therapy',
                'I have used oral estrogen formulations in the past',
                'I have used transdermal patches or gels',
                'I have used vaginal estrogen preparations',
                'I have used compounded or other hormone therapies'
            ]
        },
        {
            id: 'hormone_therapy_effectiveness',
            title: 'Prior Hormone Therapy – Effectiveness',
            question: 'How effective was prior therapy in achieving your wellness goals?',
            type: 'choice',
            condition: (data) => data.hormone_therapy_history && data.hormone_therapy_history !== 'No, I have never used hormone therapy',
            options: [
                'Did not notice any improvement in symptoms or quality of life',
                'Achieved mild improvement, noticeable in some symptoms only',
                'Achieved moderate improvement, noticeable in multiple areas',
                'Achieved significant improvement, with strong symptom relief and functional benefits'
            ]
        },
        {
            id: 'hormone_therapy_side_effects',
            title: 'Prior Hormone Therapy – Side Effects',
            question: 'Have you experienced side effects from prior hormone therapy?',
            type: 'choice',
            condition: (data) => data.hormone_therapy_history && data.hormone_therapy_history !== 'No, I have never used hormone therapy',
            options: [
                'No side effects',
                'Mild symptoms such as breast tenderness, bloating, or mild nausea',
                'Moderate effects such as persistent headaches, weight changes, or fluid retention',
                'Severe effects such as abnormal bleeding, thromboembolic events, or therapy discontinuation'
            ]
        },
        // Step 9 – Health Conditions

        {
            id: 'cardiovascular_test',
            title: 'Health Conditions',
            question: 'How would you describe your cardiovascular health?',
            type: 'choice',
            options: [
                'No history of heart disease or vascular issues',
                'Stable cardiovascular condition managed by a healthcare provider',
                'History of heart attack, stroke, or unstable angina requiring ongoing supervision'
            ]
        },
        {
            id: 'liver_test',
            title: 'Health Conditions',
            question: 'How would you describe your liver health?',
            type: 'choice',
            options: [
                'Healthy liver with no history of disease',
                'Mild liver conditions monitored with routine blood tests',
                'Moderate or severe liver disease requiring frequent evaluation'
            ]
        },
        {
            id: 'kidney_test',
            title: 'Health Conditions',
            question: 'How would you describe your kidney health?',
            type: 'choice',
            options: [
                'Normal kidney function with no medical intervention required',
                'Mild kidney impairment under medical supervision',
                'Moderate or severe kidney impairment requiring close monitoring'
            ]
        },
        {
            id: 'prostate_breast_test',
            title: 'Health Conditions',
            question: 'Do you have a history of prostate disease, breast disease, or hormone-sensitive tumors?',
            type: 'choice',
            options: [
                'No history of any hormone-sensitive or breast/prostate conditions',
                'Benign conditions monitored by a provider (e.g., BPH, fibroadenoma)',
                'History of active or treated hormone-sensitive cancer'
            ]
        },
        {
            id: 'polycythemia_test',
            title: 'Health Conditions',
            question: 'Do you have elevated red blood cell counts (polycythemia)?',
            type: 'choice',
            options: [
                'No history of high hematocrit or red blood cell levels',
                'Mildly elevated counts monitored by a healthcare provider',
                'Significantly elevated counts requiring active management'
            ]
        },
        {
            id: 'diabetes_test',
            title: 'Health Conditions',
            question: 'Do you have diabetes or metabolic syndrome?',
            type: 'choice',
            options: [
                'No history of diabetes or elevated blood sugar',
                'Prediabetes or mildly elevated blood sugar levels managed by lifestyle changes',
                'Type 1 or Type 2 diabetes that is well-controlled with medication',
                'Type 2 diabetes that is poorly controlled'
            ]
        },
        // Step 10 – Lifestyle & Habits
        {
            id: 'exercise_test',
            title: 'Lifestyle & Habits',
            question: 'How frequently do you engage in physical activity?',
            type: 'choice',
            options: [
                'Rarely or never, sedentary lifestyle',
                '1–2 times per week, light activity',
                '3–5 times per week, moderate activity',
                'Daily or almost daily, intense activity'
            ]
        },
        {
            id: 'sleep_test',
            title: 'Lifestyle & Habits',
            question: 'How would you describe your sleep quality?',
            type: 'choice',
            options: [
                'Poor, less than 5 hours per night',
                'Fair, 5–6 hours per night',
                'Good, 7–8 hours per night',
                'Excellent, more than 8 hours per night'
            ]
        },
        {
            id: 'alcohol_test',
            title: 'Lifestyle & Habits',
            question: 'How often do you consume alcohol?',
            type: 'choice',
            options: [
                'Rarely or never',
                '1–3 drinks per week',
                '4–10 drinks per week',
                'More than 10 drinks per week'
            ]
        },
        {
            id: 'tobacco_test',
            title: 'Lifestyle & Habits',
            question: 'Do you use tobacco or nicotine products?',
            type: 'choice',
            options: ['Never', 'Former user', 'Current user']
        },
        {
            id: 'recreational_drugs_test',
            title: 'Lifestyle & Habits',
            question: 'Do you use recreational drugs?',
            type: 'choice',
            options: ['Never', 'Occasionally', 'Regularly']
        },
        // Step 11 – Side Effects & Consent
        {
            id: 'test_consent_1',
            title: 'Side Effects & Consent',
            question: 'I understand testosterone therapy may cause mild acne, hair changes, or mood alterations.',
            type: 'choice',
            options: ['Agree']
        },
        {
            id: 'test_consent_2',
            title: 'Side Effects & Consent',
            question: 'I understand therapy may increase red blood cell count, affect cholesterol, and require lab monitoring.',
            type: 'choice',
            options: ['Agree']
        },
        // Estradiol Therapy Consents
        {
            id: 'estradiol_consent_1',
            title: 'Side Effects & Consent',
            question: 'I understand estradiol therapy may cause mild breast tenderness, bloating, nausea, or headaches.',
            type: 'choice',
            options: ['Agree']
        },
        {
            id: 'estradiol_consent_2',
            title: 'Side Effects & Consent',
            question: 'I understand estradiol therapy may increase risk of blood clots, affect liver function, and require lab monitoring.',
            type: 'choice',
            options: ['Agree']
        },
        {
            id: 'estradiol_consent_3',
            title: 'Side Effects & Consent',
            question: 'I consent to telehealth evaluation, lab review if required, and optional image uploads for monitoring therapy.',
            type: 'choice',
            options: ['Agree']
        }
    ],
    'repair-healing': [
        // Step 6 – Allergies
        {
            id: 'allergies_repair',
            title: 'Allergies',
            question: 'Type all the allergies you have, if more than one allergy, use a comma (,). Include allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Enter "No" if you have no allergies.',
            type: 'text',
            placeholder: 'e.g. Penicillin, Shellfish, Latex… or "No"'
        },
        // Step 7 – Current Medications
        {
            id: 'current_meds_repair',
            title: 'Current Medications',
            question: 'Are you currently taking any of the following medications?',
            type: 'multiselect',
            options: [
                'A GLP-1 agonist such as (but not limited to) Semaglutide, Tirzepatide, exenatide, liraglutide',
                'Metformin',
                'SGLT2 inhibitors – empagliflozin, canagliflozin',
                'Sulfonylureas such as (but not limited to) glipizide (Glucotrol), glimepiride (Amaryl), glyburide',
                'Meglitinides – repaglinide, nateglinide',
                'Insulin',
                'Alpha-glucosidase inhibitors – acarbose',
                'Thiazolidinediones – pioglitazone',
                'Warfarin (also called Jantoven or Coumadin) - a blood thinner that usually requires regular lab testing',
                'Diuretics such as (but not limited to) furosemide (Lasix), bumetanide (Bumex), Hydrochlorothiazide/HCTZ',
                'Selective Serotonin Reuptake Inhibitor (SSRI) such as (but not limited to) citalopram (Celexa), fluoxetine (Prozac), escitalopram (Lexapro)',
                'Monoamine Oxidase Inhibitor (MAOI) such as (but not limited to) phenelzine (Nardil), selegiline (Emsam)',
                'Opioids such as Oxycontin, Oxycodone, Vicodin, Percocet, Norco (hydrocodone), Dilaudid (hydromorphone), Methadone, Suboxone',
                'Blood thinners (warfarin, apixaban, etc.)',
                'Antihypertensives',
                'Hormone therapies (testosterone, DHT blockers)',
                'Minoxidil topical treatments',
                'Finasteride or other 5-alpha-reductase inhibitors',
                'Other medication(s)',
                'None of the above'
            ]
        },
        // Step 8 – Prior Therapy History
        {
            id: 'peptide_therapy_history',
            title: 'Prior Therapy History',
            question: 'Have you previously used peptide therapy or similar regenerative treatments?',
            type: 'choice',
            options: [
                'No, I have never used peptides or regenerative injections',
                'I have used BPC-157 injections under medical supervision',
                'I have used TB-500 injections under medical supervision',
                'I have used other regenerative therapies (PRP, stem cells, growth factors)'
            ]
        },
        {
            id: 'peptide_therapy_effectiveness',
            title: 'Prior Therapy – Effectiveness',
            question: 'How effective was prior therapy in achieving your goals?',
            type: 'choice',
            condition: (data) => data.peptide_therapy_history && data.peptide_therapy_history !== 'No, I have never used peptides or regenerative injections',
            options: [
                'No noticeable improvement in recovery, pain, or mobility',
                'Mild improvement, partial relief of symptoms',
                'Moderate improvement, noticeable gains in mobility, pain reduction, or tissue healing',
                'Significant improvement, strong functional gains and symptom relief'
            ]
        },
        {
            id: 'peptide_therapy_side_effects',
            title: 'Prior Therapy – Side Effects',
            question: 'Have you experienced side effects from prior peptide or injection therapy?',
            type: 'choice',
            condition: (data) => data.peptide_therapy_history && data.peptide_therapy_history !== 'No, I have never used peptides or regenerative injections',
            options: [
                'No side effects, therapy well tolerated',
                'Mild pain, swelling, or redness at injection sites',
                'Moderate bruising, temporary fatigue, or mild headache',
                'Severe reaction requiring discontinuation or medical attention'
            ]
        },
        // Step 9 – Health Conditions / Safety Assessment
        {
            id: 'cardiovascular_repair',
            title: 'Health Conditions',
            question: 'How would you describe your cardiovascular health?',
            type: 'choice',
            options: [
                'Healthy with no history of heart disease',
                'Stable cardiovascular condition monitored by a provider',
                'History of heart attack, stroke, or significant cardiovascular events'
            ]
        },
        {
            id: 'bleeding_repair',
            title: 'Health Conditions',
            question: 'Do you have a history of bleeding disorders or anticoagulant use?',
            type: 'choice',
            options: [
                'No history or medications',
                'Mild bleeding tendency or occasional use of blood thinners',
                'Major clotting or bleeding disorder requiring ongoing management'
            ]
        },
        {
            id: 'kidney_liver_repair',
            title: 'Health Conditions',
            question: 'Do you have any chronic kidney or liver disease?',
            type: 'choice',
            options: [
                'No history of kidney or liver issues',
                'Mild kidney or liver condition monitored by a provider',
                'Moderate or severe kidney or liver disease requiring specialist management'
            ]
        },
        {
            id: 'autoimmune_repair',
            title: 'Health Conditions',
            question: 'Do you have autoimmune or inflammatory conditions?',
            type: 'choice',
            options: [
                'None',
                'Mild or well-controlled autoimmune condition (e.g., RA, psoriasis)',
                'Active or severe autoimmune disease requiring ongoing therapy'
            ]
        },
        {
            id: 'diabetes_repair',
            title: 'Health Conditions',
            question: 'Do you have diabetes or metabolic syndrome?',
            type: 'choice',
            options: [
                'No history',
                'Prediabetes or controlled diabetes',
                'Uncontrolled diabetes'
            ]
        },
        {
            id: 'cancer_repair',
            title: 'Health Conditions',
            question: 'Do you have a history of cancer or hormone-sensitive tumors?',
            type: 'choice',
            options: [
                'No history',
                'Benign tumors monitored by provider',
                'Active or treated malignancy'
            ]
        },
        // Step 10 – Lifestyle & Habits
        {
            id: 'exercise_repair',
            title: 'Lifestyle & Habits',
            question: 'How frequently do you engage in physical activity?',
            type: 'choice',
            options: [
                'Rarely or never',
                '1–2 times per week, light activity',
                '3–5 times per week, moderate activity',
                'Daily or almost daily, intense activity'
            ]
        },
        {
            id: 'sleep_repair',
            title: 'Lifestyle & Habits',
            question: 'How would you describe your sleep quality?',
            type: 'choice',
            options: [
                'Poor, less than 5 hours per night',
                'Fair, 5–6 hours per night',
                'Good, 7–8 hours per night',
                'Excellent, more than 8 hours per night'
            ]
        },
        {
            id: 'alcohol_repair',
            title: 'Lifestyle & Habits',
            question: 'How often do you consume alcohol?',
            type: 'choice',
            options: [
                'Rarely or never',
                '1–3 drinks per week',
                '4–10 drinks per week',
                'More than 10 drinks per week'
            ]
        },
        {
            id: 'tobacco_repair',
            title: 'Lifestyle & Habits',
            question: 'Do you use tobacco or nicotine products?',
            type: 'choice',
            options: ['Never', 'Former user', 'Current user']
        },
        {
            id: 'recreational_drugs_repair',
            title: 'Lifestyle & Habits',
            question: 'Do you use recreational drugs?',
            type: 'choice',
            options: ['Never', 'Occasionally', 'Regularly']
        },
        // Step 11 – Side Effects & Consent
        {
            id: 'repair_consent_1',
            title: 'Side Effects & Consent',
            question: 'I understand BPC-157 or TB-500 therapy may cause mild injection site discomfort, redness, or swelling.',
            type: 'choice',
            options: ['Agree']
        },
        {
            id: 'repair_consent_2',
            title: 'Side Effects & Consent',
            question: 'I understand therapy may have unknown systemic effects and requires monitoring for safety.',
            type: 'choice',
            options: ['Agree']
        },
        {
            id: 'repair_consent_3',
            title: 'Side Effects & Consent',
            question: 'I consent to telehealth evaluation for therapy.',
            type: 'choice',
            options: ['Agree']
        }
    ],
    'skin-care': [
        {
            id: 'allergies',
            title: 'Allergies',
            question: 'Type all the allergies you have, if more than one allergy, use a common (,). Include allergies to prescription or over-the-counter medicines, herbs, vitamins, supplements, food, dyes, or anything else. Enter "No" if you have no allergies.',
            type: 'text',
            placeholder: 'Type your allergies here...'
        },
        {
            id: 'current_meds',
            title: 'Current Medications',
            question: 'Are you currently taking any prescription or over-the-counter medications, vitamins, or supplements? Enter "No" if not applicable.',
            type: 'text',
            placeholder: 'Type your current medications here...'
        },
        {
            id: 'skin_photos',
            title: 'Skin Photo Upload',
            question: 'Upload clear images of your face or target areas for evaluation:',
            subtext: 'Multiple Photos accepted; max 6. Accepted formats: JPG, PNG, PDF',
            type: 'file',
            maxFiles: 6
        },
        {
            id: 'photo_details',
            title: 'Photo Details',
            question: 'Please provide any additional details about the pictures you uploaded or your skin concerns.',
            type: 'text',
            placeholder: 'Additional details here...'
        }
    ]
};

