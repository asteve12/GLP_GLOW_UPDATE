import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnbypyjumcnyauydityt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNueWF1eWRpdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjA0OTQsImV4cCI6MjA4NDk5NjQ5NH0.xmipr_Qbnfj-X0eitRlc-uCdcI-CcaztovtecJWpp78'

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_ID = '37b838fd-35a0-42f7-8b96-e821fee34873';

async function verifyData() {
    console.log(`Checking data for Provider ID: ${TARGET_ID}`);

    // 1. Check if ANY rows exist for this provider
    const { data: allAssigned, error: err1 } = await supabase
        .from('form_submissions')
        .select('id, approval_status, assigned_provider_id')
        .eq('assigned_provider_id', TARGET_ID);

    if (err1) console.error('Error 1:', err1);
    else console.log(`Total rows assigned to this ID (any status): ${allAssigned?.length || 0}`, allAssigned);

    // 2. Check for 'pending' specific
    const { data: pendingAssigned, error: err2 } = await supabase
        .from('form_submissions')
        .select('id, approval_status, assigned_provider_id')
        .eq('assigned_provider_id', TARGET_ID)
        .eq('approval_status', 'pending');

    if (err2) console.error('Error 2:', err2);
    else console.log(`Total 'pending' rows assigned to this ID: ${pendingAssigned?.length || 0}`, pendingAssigned);

    // 3. Just list a few pending ones generally to see what IDs are actually there
    const { data: generalPending, error: err3 } = await supabase
        .from('form_submissions')
        .select('id, approval_status, assigned_provider_id')
        .eq('approval_status', 'pending')
        .limit(5);

    if (err3) console.error('Error 3:', err3);
    else console.log('General pending samples (to see valid provider IDs):', generalPending);
}

verifyData();
