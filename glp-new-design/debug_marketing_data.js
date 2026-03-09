
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    console.log('--- Inspecting User Roles ---');
    const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*');
    if (rolesError) console.error('Roles error:', rolesError);
    else {
        console.log(`Total roles: ${roles.length}`);
        const addedByCounts = roles.reduce((acc, r) => {
            acc[r.added_by] = (acc[r.added_by] || 0) + 1;
            return acc;
        }, {});
        console.log('Roles by added_by:', addedByCounts);
    }

    console.log('\n--- Inspecting Marketing Reps ---');
    const reps = roles?.filter(r => r.role === 'marketing_rep');
    console.log('Marketing Reps found:', reps?.length);
    reps?.forEach(r => console.log(`Rep UID: ${r.user_id}`));

    console.log('\n--- Inspecting Orders ---');
    const { data: orders, error: ordersError } = await supabase.from('orders').select('id, form_submission_id, drug_price, amount').limit(5);
    console.log('Sample orders:', orders);
}

inspect();
