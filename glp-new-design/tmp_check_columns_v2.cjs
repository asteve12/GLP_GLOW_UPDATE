const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  const commonNames = ['provider_id', 'user_id', 'staff_id', 'id', 'month', 'year', 'status']
  const results = {}
  
  for (const name of commonNames) {
    const { error } = await supabase.from('provider_statements').select(name).limit(1)
    if (error) {
      results[name] = 'missing'
    } else {
      results[name] = 'exists'
    }
  }
  
  console.log(JSON.stringify(results, null, 2))
}

checkColumns()
