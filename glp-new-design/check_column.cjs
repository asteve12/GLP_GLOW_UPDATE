
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://rnbypyjumcfyitoypivp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYnlweWp1bWNmeWl0b3lwaXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjM4MDkzNSwiZXhwIjoyMDUxOTU2OTM1fQ.M_sEFOo7ExXCqyLBpHVvl00Kr3ycpluAhbeQE69E'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
    // Try to update a dummy row with the new column name to see if it errors
    const { error } = await supabase.from('form_submissions').update({ assigned_provider_id: null }).eq('id', '00000000-0000-0000-0000-000000000000')
    if (error && error.message.includes('column "assigned_provider_id" of relation "form_submissions" does not exist')) {
        console.log('COLUMN_MISSING')
    } else if (error) {
        console.log('COLUMN_EXISTS_OR_OTHER_ERROR:', error.message)
    } else {
        console.log('COLUMN_EXISTS')
    }
}

checkColumns()
