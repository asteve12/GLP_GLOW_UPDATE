
const { createClient } = require('@supabase/supabase-js');
const s = createClient('https://rnbypyjumcnyauydityt.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNueWF1eWRpdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMDg1NTIsImV4cCI6MjA1NjY4NDU1Mn0.S-xXCqyLBpHVvl00Kr3ycpluFcfpj9SuWUWIdm06eCs');

s.from('user_roles').select('role').then(({ data, error }) => {
    if (error) console.error(error);
    const counts = data.reduce((acc, r) => { acc[r.role] = (acc[r.role] || 0) + 1; return acc; }, {});
    console.log('Role counts:', counts);
});
