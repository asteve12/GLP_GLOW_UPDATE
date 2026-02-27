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
            type: 'multiselect',
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
            isStep19: true,
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
            ]
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
            id: 'pcp_labs',
            title: 'Primary Care & Labs',
            question: 'Have you seen your primary care provider and/or did lab testing in the past 12 months?',
            type: 'choice',
            options: ['Yes', 'No'],
            isStep23: true
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
            type: 'info',
            content: 'The following questions are for female patients only. If you are male, you may skip these.',
            condition: (data) => data.sex !== 'female' && data.assigned_sex_intake !== 'female'
        },
        {
            id: 'female_reproduction',
            title: 'Female-Specific Considerations',
            question: 'Are you pregnant, planning pregnancy, or breastfeeding?',
            type: 'choice',
            options: ['No', 'Yes – cannot use finasteride'],
            condition: (data) => data.sex === 'female' || data.assigned_sex_intake === 'female'
        },
        {
            id: 'female_contraception',
            title: 'Female-Specific Considerations',
            question: 'If premenopausal, are you using reliable contraception?',
            type: 'choice',
            options: ['Yes', 'No – finasteride cannot be prescribed'],
            condition: (data) => data.sex === 'female' || data.assigned_sex_intake === 'female'
        },
        {
            id: 'pcos_hormonal',
            title: 'Female-Specific Considerations',
            question: 'Have you been diagnosed with PCOS or other hormonal disorders?',
            type: 'choice',
            options: ['No', 'Yes'],
            condition: (data) => data.sex === 'female' || data.assigned_sex_intake === 'female'
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
            type: 'multiselect',
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
        { id: 'phys_activity', title: 'Activity Level', question: 'Activity level?', type: 'choice', options: ['Sedentary', 'Somewhat', 'Active', 'Athletic', 'Biohacker'] },
        { id: 'height_longevity', title: 'Biometrics', question: 'Height?', type: 'text' },
        { id: 'weight_longevity', title: 'Biometrics', question: 'Weight?', type: 'text' },
        { id: 'med_conditions_longevity', title: 'Health Status', question: 'Medical conditions?', type: 'multiselect', options: ['None', 'Diabetes', 'HTN', 'Heart', 'Thyroid', 'Asthma', 'Anxiety', 'HIV', 'Kidney', 'Cancer', 'Other'] },
        { id: 'kidney_status', title: 'Organ Health', question: 'Kidney problems?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'liver_status', title: 'Organ Health', question: 'Liver problems?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'heart_pumping_status', title: 'Organ Health', question: 'Heart pumping problems?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'smoking_status_long', title: 'Habits', question: 'Smoking?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'family_hx_long', title: 'Family History', question: 'Family history?', type: 'multiselect', options: ['Cancer', 'Heart', 'Dementia', 'Diabetes', 'BP', 'Cholesterol', 'None'] },
        { id: 'surgery_hx_long', title: 'Surgical History', question: 'Surgeries?', type: 'multiselect', options: ['None', 'Back/Neck', 'Heart', 'Prostate', 'Hysterectomy', 'Gallbladder', 'Appendix', 'Other'] },
        { id: 'has_pcp_long', title: 'Care Network', question: 'Primary care provider?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'routine_physical_hx', title: 'Care Network', question: 'Check-up last 3 years?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'longevity_importance', title: 'Motivation', question: 'Longevity importance?', type: 'choice', options: ['None', 'Little', 'Some', 'Moderate', 'Significant'] },
        { id: 'meds_list_long', title: 'Medications', question: 'Medications list?', type: 'text' },
        { id: 'allergies_list_long', title: 'Allergies', question: 'Allergies list?', type: 'text' },
        { id: 'personal_cancer_hx', title: 'Oncology', question: 'Personal cancer history?', type: 'choice', options: ['Yes', 'No'], details: true },
        { id: 'family_cancer_hx_long', title: 'Oncology', question: 'Family cancer history?', type: 'choice', options: ['Yes', 'No'], details: true },
        { id: 'adverse_situations', title: 'Safety Screening', question: 'Adverse situations?', type: 'multiselect', options: ['Hypersensitivity', 'Fatigue', 'Vision loss', 'Confusion', 'Uncontrolled illness', 'Psychiatric', 'None'] },
        { id: 'nad_prev_use', title: 'Experience', question: 'NAD+ experience?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'self_injection_hx', title: 'Experience', question: 'Self-injection experience?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'nad_comfort_drawing', title: 'Experience', question: 'Comfortable injecting?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'anything_else_long', title: 'Final Review', question: 'Anything else?', type: 'choice', options: ['Yes', 'No'], details: true }
    ]
};
