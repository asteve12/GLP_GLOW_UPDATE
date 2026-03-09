import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnbypyjumcnyauydityt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNueWF1eWRpdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjA0OTQsImV4cCI6MjA4NDk5NjQ5NH0.xmipr_Qbnfj-X0eitRlc-uCdcI-CcaztovtecJWpp78'

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllSubmissions() {
    const { data, error } = await supabase
        .from('form_submissions')
        .select('id, approval_status, assigned_provider_id')
        .limit(10);

    if (error) {
        console.error('Error fetching submissions:', error);
    } else {
        console.log('Sample Submissions:', data);
        const statusMap = data.reduce((acc, sub) => {
            acc[sub.approval_status] = (acc[sub.approval_status] || 0) + 1;
            return acc;
        }, {});
        console.log('Status breakdown:', statusMap);
    }
}

checkAllSubmissions();
