const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rnbypyjumcnyauydityt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNueWF1eWRpdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjA0OTQsImV4cCI6MjA4NDk5NjQ5NH0.xmipr_Qbnfj-X0eitRlc-uCdcI-CcaztovtecJWpp78'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
    console.log('--- checking profiles columns ---')
    const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1)
    if (pError) console.error('Profiles Error:', pError.message)
    else console.log('Profiles Columns:', Object.keys(pData[0] || {}))

    console.log('--- checking provider_profiles columns ---')
    const { data: ppData, error: ppError } = await supabase.from('provider_profiles').select('*').limit(1)
    if (ppError) console.error('Provider Profiles Error:', ppError.message)
    else console.log('Provider Profiles Columns:', Object.keys(ppData[0] || {}))
}

checkColumns()
