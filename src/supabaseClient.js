import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qwksenkasdqbmeeijkoa.supabase.co'
const supabaseKey = 'sb_publishable_XNhiDOA5ZLa5k-qKWyB91A_2BRivWme'

export const supabase = createClient(supabaseUrl, supabaseKey)
