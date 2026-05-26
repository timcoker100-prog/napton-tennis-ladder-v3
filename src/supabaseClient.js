import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fblxqfzzgbxtaswedstv.supabase.co'

const supabaseAnonKey = 'sb_publishable_JNyEBIHboU5ICUekFCSUjQ_aTbFNd0r'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)