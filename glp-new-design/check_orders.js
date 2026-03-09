import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rnbypyjumcnyauydityt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNueWF1eWRpdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjA0OTQsImV4cCI6MjA4NDk5NjQ5NH0.xmipr_Qbnfj-X0eitRlc-uCdcI-CcaztovtecJWpp78'

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
    console.log('Counting orders...');
    const { count, error } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total orders:', count);
    }

    const { data: latest } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
    console.log('Latest orders:', latest);
}

checkOrders();
