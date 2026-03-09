import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnbypyjumcnyauydityt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNueWF1eWRpdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjA0OTQsImV4cCI6MjA4NDk5NjQ5NH0.xmipr_Qbnfj-X0eitRlc-uCdcI-CcaztovtecJWpp78'

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOtherTables() {
    console.log('Connectivity check: checking user_roles Table count...');
    const { count, error } = await supabase.from('user_roles').select('*', { count: 'exact', head: true });
    if (error) console.error('Error user_roles:', error);
    else console.log(`Total user_roles: ${count}`);

    const { count: c2, error: e2 } = await supabase.from('waitlist').select('*', { count: 'exact', head: true });
    if (e2) console.error('Error waitlist:', e2);
    else console.log(`Total waitlist: ${c2}`);
}

checkOtherTables();
