export const categoryQuestions = {
    'weight-loss': {
        title: 'Weight Loss Transformation',
        question: ['What do you want to', 'accomplish?'],
        stat: {
            pct: '92%',
            text: 'of patients achieve sustainable metabolic',
            highlight: 'results*',
            image: null, // Will be handled in component
            disclaimer: '*Based on a survey of 114 active GLP-GLOW patients, conducted in May 2025.',
            reviews: [
                { name: "Sarah M.", result: "Lost 45lbs", text: "Confidence restored. More energy than ever before." },
                { name: "Michael K.", result: "Down 32lbs", text: "The hunger noise just disappeared. Life-changing." },
                { name: "Jessica R.", result: "Lost 50lbs", text: "I finally feel like myself again. Pure metabolic freedom." }
            ]
        },
        improvements: [
            { id: 'lose-weight', name: 'Lose weight', desc: 'Targeted fat reduction and clinical weight management protocols.' },
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
            disclaimer: '*Based on a survey of 114 active GLP-GLOW patients, conducted in May 2025.',
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
            disclaimer: '*Based on a survey of 114 active GLP-GLOW patients, conducted in May 2025.',
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
            disclaimer: '*Based on a survey of 114 active GLP-GLOW patients, conducted in May 2025.',
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
        { id: 'heart', title: 'Heart Conditions', question: 'Have you been diagnosed with any heart conditions?', type: 'multiselect', options: ['Atrial fibrillation or flutter', 'Tachycardia (Rapid Heart Rate)', 'Heart failure', 'Heart disease, stroke, or Peripheral Vascular Disease', 'Prolonged QT interval', 'Electrocardiogram (ECG) abnormalities', 'Hypertension', 'Hyperlipidemia', 'Hypertriglyceridemia', 'No, I have not been diagnosed with any'] },
        { id: 'afib_follow', title: 'Atrial Fibrillation Follow-Up', question: 'Has there been a medication change for Atrial fibrillation or flutter in the past year?', type: 'choice', options: ['Yes', 'No'], condition: (data) => data.heart?.includes('Atrial fibrillation or flutter') },
        { id: 'hormone', title: 'Clinical History', question: 'History of any of the following?', type: 'multiselect', options: ['Multiple Endocrine Neoplasia type 2 (MEN2)', 'Chronic kidney disease', 'Fatty liver', 'Thyroid issues', 'Pancreatitis', 'None'] },
        { id: 'cancer', title: 'Cancer History', question: 'Have you or a family member had cancer?', type: 'choice', options: ['Yes', 'No'], details: true },
        { id: 'diabetes', title: 'Diabetes', question: 'What is your current diabetes status?', type: 'choice', options: ['Diabetes requiring insulin', 'Diabetes not requiring insulin', 'Prediabetes', 'None'] },
        { id: 'gi', title: 'Gastrointestinal Conditions', question: 'Have you experienced any of these Gastrointestinal (GI) conditions?', type: 'multiselect', options: ['Bariatric surgery', 'Pancreatitis', 'Gastroparesis', 'Gallstones', 'Gastroesophageal Reflux Disease (GERD)', 'None'] },
        { id: 'mental', title: 'Mental Health', question: 'Diagnosed with any of the following?', type: 'multiselect', options: ['Anxiety', 'Bipolar', 'Depression', 'Schizophrenia', 'None'] },
        { id: 'anxiety_sev', title: 'Anxiety Severity', question: 'Rate your anxiety severity:', type: 'choice', options: ['None', 'Mild', 'Moderate', 'Severe'], condition: (data) => data.mental?.includes('Anxiety') },
        { id: 'additional', title: 'Additional Conditions', question: 'Any other conditions?', type: 'multiselect', options: ['Eating disorder', 'Glaucoma', 'Sleep apnea', 'Migraines', 'None'] },
        { id: 'qol_rate', title: 'Quality of Life', question: 'Rate this statement: "My weight is negatively impacting my quality of life"', type: 'choice', options: ['Strongly Agree', 'Agree', 'Neutral', 'Disagree'] },
        { id: 'qol_details', title: 'Impact Details', question: 'Because of my weight...', type: 'multiselect', options: ['I lack confidence', "I can't do activities I love", "I feel physically restricted", "Other"] },
        { id: 'allergies', title: 'Allergies', question: 'List all allergies (medications, food, env):', type: 'text', placeholder: 'Enter all known allergies...' },
        {
            id: 'current_meds',
            title: 'Current Medications',
            question: 'Are you currently taking any of the following medications?',
            type: 'multiselect',
            options: [
                'A GLP-1 agonist such as (but not limited to) semaglutide, tirzepatide (Zepbound/Mounjaro), exenatide, liraglutide',
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
            ],
            upload: true,
            details: true
        },
        { id: 'supplements', title: 'Other Medications', question: 'List vitamins, supplements, or topical creams:', type: 'text' },
        { id: 'past_methods', title: 'Past Weight Loss', question: 'What methods have you tried in the past?', type: 'multiselect', options: ['Intensity Exercise', 'Strict Diet', 'Commercial Plans', 'Natural Supplements', 'None'] },
        { id: 'past_rx', title: 'Past Prescription Medications', question: 'Have you used prescription weight loss medications before?', type: 'multiselect', options: ['Semaglutide', 'Tirzepatide', 'Phentermine', 'Metformin', 'None'] },
        { id: 'ethnicity', title: 'Race/Ethnicity', question: 'How do you self-identify (Optional)?', type: 'choice', options: ['White', 'Hispanic', 'Black', 'Asian', 'Other', 'Prefer not to say'] },
        { id: 'other_goals', title: 'Other Health Goals', question: 'Interested in other health optimizations?', type: 'multiselect', options: ['Hair loss', 'Stronger erections', 'Longevity', 'Skincare', 'None'] },
        { id: 'additional_info', title: 'Additional Information', question: 'Anything else for the provider to know?', type: 'choice', options: ['Yes', 'No'], details: true }
    ],
    'hair-restoration': [
        { id: 'hair_loss_goals', title: 'Hair Restoration', question: 'Which best represents your hair loss and goals?', type: 'choice', options: ['Receding hairline, want to slow its progress', 'Experiencing hair loss, exploring options', 'Experiencing hair loss, ready to start treatment ASAP', 'No hair loss yet, want to get ahead of it', 'None of the above'] },
        { id: 'hair_loss_location', title: 'Hair Restoration', question: 'Where are you noticing changes to your hair?', type: 'choice', options: ['Along the hairline', 'At the top', 'All over'] },
        { id: 'hair_loss_amount', title: 'Hair Restoration', question: 'How much hair have you lost?', type: 'choice', options: ['It’s obvious to everyone', 'Some–Those close to me notice', 'A little—Only I notice'] },
        { id: 'hair_loss_timeline', title: 'Hair Restoration', question: 'When did you start noticing changes to your hair?', type: 'choice', options: ['Over a year ago', 'In the past year', 'In the past few months', 'Not sure'] },
        { id: 'hair_hopes', title: 'Hair Restoration', question: 'With treatment, what results are you hoping for?', type: 'multiselect', options: ['A stronger, defined hairline', 'Visibly thicker, fuller hair', 'More scalp coverage', 'Keep the hair I have', 'All of the above'] },
        { id: 'hair_type', title: 'Hair Restoration', question: 'What’s your hair type?', type: 'choice', options: ['Straight or wavy', 'Curly or coily', 'Textured or processed', 'I don’t have hair'] },
        { id: 'hair_length', title: 'Hair Restoration', question: 'How long is your hair?', type: 'choice', options: ['Buzzed, shaved, or bald', 'Short', 'Medium', 'Long'] },
        { id: 'lifestyle_intro', title: 'Lifestyle Factors', type: 'info', content: 'Next, let’s talk about lifestyle factors.' },
        { id: 'hair_family', title: 'Family History', question: 'Does hair loss run in your family?', type: 'choice', options: ['Yes', 'No', 'Not sure'] },
        { id: 'hair_stress', title: 'Stress & Lifestyle', question: 'How often do you tend to experience stress?', type: 'choice', options: ['All the time', 'Sometimes', 'Rarely', 'Not sure'] },
        { id: 'hair_info_factors', title: 'Root Causes', type: 'info', content: 'Factors like aging, family history, and stress can cause hair shedding and thinning.' },
        { id: 'hair_styling', title: 'Hair Styling', question: 'How do you style your hair?', type: 'choice', options: ['No styling', 'Products', 'I usually wear a hat', 'Protective styles'] },
        { id: 'hair_time', title: 'Daily Routine', question: 'How much time do you spend on your hair every day?', type: 'choice', options: ['Less than 5 minutes', '5-10 minutes', '10+ minutes'] }
    ],
    'sexual-health': [
        { id: 'ed_boost', title: 'Sexual Health', question: 'What bedroom boost are you looking for?', type: 'choice', options: ['Getting hard and staying hard', 'Delaying climax', 'Both'] },
        { id: 'ed_onset', title: 'Sexual Health', question: 'When did you start noticing your symptoms?', type: 'choice', options: ['Just recently', 'Several months ago', 'A year ago or more'] },
        { id: 'ed_symptoms', title: 'Symptoms', question: 'Which symptoms have you experienced? (Select all that apply)', type: 'multiselect', options: ['Having trouble getting hard', 'Struggling to last long in bed', 'Not being able to satisfy my partner'] },
        { id: 'ed_alone_info', title: 'Perspective', type: 'info', content: "You're not alone. ED is estimated to affect about 30 million men in the U.S." },
        { id: 'ed_freq', title: 'Frequency', question: 'How often have you experienced these symptoms?', type: 'choice', options: ['Just once', 'A few times', 'Always'] },
        { id: 'ed_approach', title: 'Treatment Approach', question: 'How would you like to approach treatment options?', type: 'choice', options: ['I have a specific treatment in mind', 'I\'d like a recommendation'], details: true },
        { id: 'habits_intro', title: 'Lifestyle', type: 'info', content: "Now, we'll continue by getting to know more about your habits and lifestyle." },
        { id: 'rel_status', title: 'Relationship', question: 'Which best describes your current relationship status?', type: 'choice', options: ['Single', 'In a relationship', 'Married', 'It\'s complicated'] },
        { id: 'sex_time_pref', title: 'Preferences', question: 'When are you typically most interested in having sex?', type: 'choice', options: ['Morning', 'Nighttime', 'Whenever the time is right'] },
        { id: 'energy_levels', title: 'Daily Energy', question: 'How satisfied are you with your daily energy levels?', type: 'choice', options: ['I\'m very satisfied', 'I\'m satisfied, but my energy could improve', 'I\'m not satisfied at all'] },
        { id: 'phys_perf', title: 'Physical Performance', question: 'Are you satisfied with your physical performance?', type: 'choice', options: ['I\'m very satisfied', 'I\'m satisfied, but I can improve', 'I\'m not satisfied and would like to improve'] },
        { id: 'nutrition_status', title: 'Nutrition', question: 'Do you feel like you get enough essential vitamins and nutrients?', type: 'choice', options: ['Yes', 'Yes, multivitamin', 'No'] },
        { id: 'who_treatment', title: 'Patient Info', question: 'Is this treatment for you or someone else?', type: 'choice', options: ['Myself', 'Someone else'] },
        { id: 'perf_goals', title: 'Optimization', question: 'What sexual performance improvements are you looking for?', type: 'multiselect', options: ['Make it easier to get erections', 'Get stronger erections', 'Maintain erections', 'Control over ejaculation', 'Last longer'] },
        { id: 'hard_difficulty', title: 'Assessment', question: 'How often do you have difficulty getting or staying as hard as you want?', type: 'choice', options: ['Never', 'Rarely', 'Sometimes', 'Often or always'] },
        { id: 'perf_desc_sh', title: 'Assessment', question: 'Which of the following best describes your sexual performance?', type: 'choice', options: ['Difficulty getting hard', 'Difficulty staying hard', 'Both'] },
        { id: 'onset_type', title: 'Clinical History', question: 'Which of the following best describes how this started?', type: 'choice', options: ['Suddenly', 'Gradually worsened over time'] },
        { id: 'hardness_masturbate', title: 'Erection Quality', question: 'During masturbation, how would you rate the typical hardness of your erection?', type: 'choice', options: ['Does not enlarge', 'Larger, not hard', 'Hard, not for penetration', 'Hard enough for penetration', 'Completely hard', 'Don\'t masturbate'] },
        { id: 'hardness_partner', title: 'Erection Quality', question: 'With a sexual partner, how would you rate the typical hardness of your erection?', type: 'choice', options: ['Does not enlarge', 'Larger, not hard', 'Hard, not for penetration', 'Hard enough for penetration', 'Completely hard', 'No partner'] },
        { id: 'past_rx_erection', title: 'Medical History', question: 'Have you ever taken prescription medication to help improve your erections?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'past_meds_list', title: 'Medical History', question: 'Which medications have you used?', type: 'multiselect', options: ['Sildenafil', 'Tadalafil - daily', 'Tadalafil - PRN', 'Vardenafil', 'Avanafil', 'Other'], condition: (data) => data.past_rx_erection === 'Yes', details: true },
        { id: 'assigned_sex_intake', title: 'Biometrics', question: 'What was your sex assigned at birth?', type: 'choice', options: ['Male', 'Female'] },
        { id: 'height_intake', title: 'Biometrics', question: 'What is your height?', type: 'text' },
        { id: 'weight_intake', title: 'Biometrics', question: 'What is your weight?', type: 'text' },
        { id: 'low_t_check', title: 'Clinical Signs', question: 'Do you have any of the following symptoms?', type: 'multiselect', options: ['Low energy', 'Low motivation', 'Endurance', 'Strength', 'Sleepiness', 'None'] },
        { id: 'cardio_capacity', title: 'Physical Screening', question: 'Are you able to climb 2 flights of stairs?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'fainting_check', title: 'Physical Screening', question: 'Experienced fainting last 6 months?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'symptom_detail_sh', title: 'Detail Entry', question: 'Explain symptoms in detail.', type: 'text' },
        { id: 'med_diagnostics_sh', title: 'Clinical History', question: 'Diagnosed with any of these?', type: 'multiselect', options: ['BP/Diabetes/Cholesterol', 'Blood/Immune', 'GI/Liver', 'Kidney', 'Circulation', 'Eye', 'Penis/Prostate', 'Brain/Nerve', 'Other', 'None'] },
        { id: 'urology_hx_sh', title: 'Clinical History', question: 'Experienced which urology conditions?', type: 'choice', options: ['Prostate', 'Penis', 'Other'], condition: (data) => data.med_diagnostics_sh?.includes('Penis or prostate conditions') },
        { id: 'mental_health_dx_sh', title: 'Mental Health', question: 'Mental health diagnosis?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'mental_health_list_sh', title: 'Mental Health', question: 'Which conditions?', type: 'multiselect', options: ['Depression', 'Anxiety', 'Bipolar', 'Schizophrenia', 'Panic', 'Other'], condition: (data) => data.mental_health_dx_sh === 'Yes' },
        { id: 'heart_condition_dx_sh', title: 'Cardiovascular', question: 'Any heart conditions?', type: 'multiselect', options: ['ICD', 'Pacemaker', 'HF', 'HA', 'CAD', 'Bypass/Stent', 'IHSS', 'Long QT', 'Afib', 'SVT', 'Valve issues', 'Other', 'None'] },
        { id: 'other_medical_sh_sh', title: 'Clinical History', question: 'Other medical conditions?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'mental_health_meds_sh', title: 'Medications', question: 'Mental health meds?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'other_rx_vits_sh', title: 'Medications', question: 'Other meds/vitamins?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'cholesterol_meds_sh', title: 'Medications', question: 'Cholesterol meds?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'cardio_meds_list_sh', title: 'Safety Screening', question: 'Heart/BP/Urology meds?', type: 'multiselect', options: ['Nitroglycerin', 'Isosorbide', 'Nitric Oxide', 'Alpha blockers', 'Riociguat', 'Amiodarone', 'Nifedipine', 'Aspirin', 'Plavix', 'Coumadin', 'DOACs', 'None'] },
        { id: 'other_critical_meds_sh', title: 'Safety Screening', question: 'Taking any of these?', type: 'multiselect', options: ['Sumatriptan/Triptans', 'ADHD meds', 'Opioids', 'Tramadol', 'Trazodone', 'None'] },
        { id: 'allergies_sh_sh', title: 'Allergies', question: 'Allergies?', type: 'multiselect', options: ['Meds', 'Food', 'None'] },
        { id: 'surgery_hx_sh', title: 'Intake', question: 'Surgeries?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'bp_check_hx_sh', title: 'Vital Signs', question: 'BP check last 6 months?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'bp_top_sh', title: 'Vital Signs', question: 'Top number?', type: 'choice', options: ['Low', 'Normal', 'Elevated', 'High', 'Don\'t remember'] },
        { id: 'bp_bottom_sh', title: 'Vital Signs', question: 'Bottom number?', type: 'choice', options: ['Low', 'Normal', 'Elevated', 'High', 'Don\'t remember'] },
        { id: 'smoking_hx_sh', title: 'Lifestyle', question: 'Smoking?', type: 'choice', options: ['Current', 'Quit', 'Never'] },
        { id: 'recreational_sh', title: 'Lifestyle', question: 'Recreational drugs?', type: 'multiselect', options: ['Poppers', 'Cocaine', 'Kratom', 'Meth', 'MDMA', 'Opioids', 'Other', 'None'] },
        { id: 'hair_interest_sh_sh', title: 'Optimization', question: 'Thicker hair interest?', type: 'choice', options: ['Yes', 'No'] },
        { id: 'health_areas_sh', title: 'Optimization', question: 'Other areas?', type: 'multiselect', options: ['Testosterone', 'Weight loss', 'Cholesterol', 'Multivitamin', 'Sleep', 'Mental health', 'None'] }
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
