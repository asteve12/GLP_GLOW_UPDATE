const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rnbypyjumcnyauydityt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNueWF1eWRpdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjA0OTQsImV4cCI6MjA4NDk5NjQ5NH0.xmipr_Qbnfj-X0eitRlc-uCdcI-CcaztovtecJWpp78'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnostic() {
    console.log('--- Supabase Diagnostic ---')

    try {
        const { data: roles, error: roleError } = await supabase.from('user_roles').select('*').limit(5)
        if (roleError) console.error('user_roles Error:', roleError.message)
        else console.log('user_roles Sample Count:', roles?.length || 0)

        const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, first_name').limit(5)
        if (profileError) console.error('profiles Error:', profileError.message)
        else console.log('profiles Sample:', profiles)

        const { count, error: countError } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        if (countError) console.error('profiles Count Error:', countError.message)
        else console.log('Total Profiles:', count)

        const { data: userRoles, error: urError } = await supabase.from('user_roles').select('role').limit(20)
        if (!urError) {
            const rolesList = [...new Set(userRoles.map(r => r.role))];
            console.log('Distinct Roles Found:', rolesList);
        }
    } catch (e) {
        console.error('Runtime Error:', e.message)
    }
}

diagnostic()
