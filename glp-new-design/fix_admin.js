const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\DELL\\Desktop\\glp-new-design\\src\\components\\AdminDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix Filter Tabs Badge Color in ClinicalQueue
// Change bg-white text-black to bg-accent-green text-black for active tab
// Change bg-white/20 text-white to bg-white/10 text-white/70 for inactive
content = content.replace(
    /text-black'\s+:\s+'bg-white\/20 text-white'/g,
    "text-black' : 'bg-white/10 text-white/70'"
);
content = content.replace(
    /filter === cat\.id\s+\?\s+'bg-white/g,
    "filter === cat.id ? 'bg-accent-green"
);

// 2. Fix text-[#1a1a1a] to text-white (case insensitive)
content = content.replace(/text-\[#1a1a1a\]/g, 'text-white');

// 3. Fix DOB, Height, Weight formatting in info fallbacks
// In SubmissionModal, improve date_of_birth fallback
content = content.replace(
    /value=\{formData\.date_of_birth \|\| intake\.date_of_birth \|\| \(intake\.eligibility && intake\.eligibility\.dob\) \|\| intake\.dob\}/,
    `value={formData.date_of_birth || 
        (typeof intake.dob === 'object' ? \`\${intake.dob.month}/\${intake.dob.day}/\${intake.dob.year}\` : intake.dob) || 
        (typeof intake.date_of_birth === 'object' ? \`\${intake.date_of_birth.month}/\${intake.date_of_birth.day}/\${intake.date_of_birth.year}\` : intake.date_of_birth) ||
        (intake.eligibility && (typeof intake.eligibility.dob === 'object' ? \`\${intake.eligibility.dob.month}/\${intake.eligibility.dob.day}/\${intake.eligibility.dob.year}\` : intake.eligibility.dob)) ||
        formData.dob}`
);

// 4. Improve Height fallback
content = content.replace(
    /\(intake\.height \|\| \(intake\.height_feet && intake\.height_inches \? \`\\\$\{intake\.height_feet\}'\\\$\{intake\.height_inches\}\\"\` : null\) \|\| \(intake\.bmi_height_feet && intake\.bmi_height_inches \? \`\\\$\{intake\.bmi_height_feet\}'\\\$\{intake\.bmi_height_inches\}\\"\` : null\) \|\| 'N\/A'\)/,
    `(intake.height || 
    (intake.height_feet && intake.height_inches ? \`\${intake.height_feet}'\${intake.height_inches}"\` : null) || 
    (intake.bmi_height_feet && intake.bmi_height_inches ? \`\${intake.bmi_height_feet}'\${intake.bmi_height_inches}"\` : null) || 
    (intake.bmi_height ? intake.bmi_height : null) ||
    'N/A')`
);

// 5. Fix View Buttons Visibility (Lab Results)
// Change bg-accent-black/10 to bg-accent-green/10 and text-white to text-accent-green
content = content.replace(
    /bg-accent-black\/10 border-accent-black\/20 rounded-lg text-\[10px\] font-black uppercase tracking-widest text-white hover:bg-accent-black/g,
    'bg-accent-green/10 border-accent-green/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent-green hover:bg-accent-green hover:text-black'
);

// 6. Fix ID View Buttons Visibility
content = content.replace(
    /bg-accent-black text-white border border-accent-black\/20 rounded-lg text-\[10px\] font-black uppercase tracking-widest hover:bg-white/g,
    'bg-accent-green text-black border border-accent-green/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white'
);

// 7. Remove "Selected Medication" and "Other Health Goals" from the intake questions loop
// We can add a filter to the questions array before mapping
content = content.replace(
    /return questions\.map\(\(q\) => \{/g,
    `return questions
        .filter(q => q.id !== 'other_health_goals' && q.id !== 'selected_medication' && q.id !== 'medication_preference')
        .map((q) => {`
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated AdminDashboard.jsx');
