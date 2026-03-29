import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ftthcuxanlmtceaqbibe.supabase.co' 
const supabaseKey = 'sb_publishable_6p10ePOy526knLFn1q4T6w_AwkXPtj5'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: window.sessionStorage, 
    persistSession: true,
    detectSessionInUrl: true
  }
});