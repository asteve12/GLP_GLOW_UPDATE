import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnbypyjumcnyauydityt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNueWF1eWRpdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjA0OTQsImV4cCI6MjA4NDk5NjQ5NH0.xmipr_Qbnfj-X0eitRlc-uCdcI-CcaztovtecJWpp78'

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubmissions() {
    const { data, error } = await supabase
        .from('form_submissions')
        .select('id, approval_status, assigned_provider_id')
        .eq('approval_status', 'pending');

    if (error) {
        console.error('Error fetching submissions:', error);
    } else {
        console.log('Pending Submissions:', data);
        if (data.length > 0) {
            const counts = data.reduce((acc, sub) => {
                const prov = sub.assigned_provider_id || 'unassigned';
                acc[prov] = (acc[prov] || 0) + 1;
                return acc;
            }, {});
            console.log('Assignment counts:', counts);
        }
    }
}

checkSubmissions();
