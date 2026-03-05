
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rnbypyjumcnyauydityt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNueWF1eWRpdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjA0OTQsImV4cCI6MjA4NDk5NjQ5NH0.xmipr_Qbnfj-X0eitRlc-uCdcI-CcaztovtecJWpp78'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
    console.log('--- checking form_submissions columns ---')
    const { data, error } = await supabase.from('form_submissions').select('*').limit(1)
    if (error) console.error('Error:', error.message)
    else console.log('Columns:', Object.keys(data[0] || {}))
}

checkColumns()
