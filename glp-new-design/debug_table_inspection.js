import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnbypyjumcnyauydityt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNueWF1eWRpdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjA0OTQsImV4cCI6MjA4NDk5NjQ5NH0.xmipr_Qbnfj-X0eitRlc-uCdcI-CcaztovtecJWpp78'

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable() {
    console.log('Inspecting raw submissions table data...');

    // 1. Get raw count
    const { count, error: errCnt } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true });

    if (errCnt) console.error('Error getting count:', errCnt);
    else console.log(`TOTAL RECORDS in form_submissions: ${count}`);

    // 2. Get status breakdown
    const { data: rawData, error: errRaw } = await supabase
        .from('form_submissions')
        .select('approval_status, assigned_provider_id')
        .limit(20);

    if (errRaw) console.error('Error fetching data:', errRaw);
    else {
        console.log('Status breakdown of sample records:', rawData.reduce((acc, row) => {
            const key = `${row.approval_status} (Assigned? ${!!row.assigned_provider_id})`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {}));
        console.log('Sample dump:', rawData);
    }
}

inspectTable();
