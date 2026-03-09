
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rnbypyjumcnyauydityt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNueWF1eWRpdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjA0OTQsImV4cCI6MjA4NDk5NjQ5NH0.xmipr_Qbnfj-X0eitRlc-uCdcI-CcaztovtecJWpp78';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Marketing Rep Network Check ---');

    // 1. Find all roles to see what's there
    const { data: allRoles } = await supabase.from('user_roles').select('*');
    const roleCounts = allRoles?.reduce((acc, r) => { acc[r.role] = (acc[r.role] || 0) + 1; return acc; }, {});
    console.log('Role counts:', roleCounts);

    // 2. Find a marketing rep
    const rep = allRoles?.find(r => r.role === 'marketing_rep');
    if (!rep) {
        console.log('No marketing reps found in user_roles table.');
        return;
    }

    console.log(`Checking Rep: ${rep.user_id} (${rep.role})`);

    // 3. Find doctors added by this rep
    const { data: doctors } = await supabase.from('user_roles').select('user_id').eq('added_by', rep.user_id);
    console.log(`Doctors added by this rep: ${doctors?.length || 0}`);
    const doctorIds = doctors?.map(d => d.user_id) || [];
    console.log('Doctor IDs:', doctorIds);

    if (doctorIds.length > 0) {
        // 4. Find submissions assigned to these doctors
        const { data: subs } = await supabase.from('form_submissions').select('id, assigned_provider_id, approval_status').in('assigned_provider_id', doctorIds);
        console.log(`Submissions assigned to these doctors: ${subs?.length || 0}`);
        const approvedSubs = subs?.filter(s => s.approval_status === 'approved') || [];
        console.log(`Approved submissions: ${approvedSubs.length}`);
        const approvedSubIds = approvedSubs.map(s => s.id);

        // 5. Find orders linked to these submissions
        if (approvedSubIds.length > 0) {
            const { data: ordersBySub } = await supabase.from('orders').select('id, form_submission_id, drug_price, amount').in('form_submission_id', approvedSubIds);
            console.log(`Orders found via form_submission_id: ${ordersBySub?.length || 0}`);
        }

        // 6. Find orders linked via approving_provider_id directly
        const { data: ordersByProv } = await supabase.from('orders').select('id, approving_provider_id, drug_price, amount').in('approving_provider_id', doctorIds);
        console.log(`Orders found via approving_provider_id: ${ordersByProv?.length || 0}`);
    }
}

check();
