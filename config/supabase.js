import { createClient } from '@supabase/supabase-js'
import { SUPABASE } from './env.js';

export const supabase = createClient(
  SUPABASE.URL, 
  SUPABASE.KEY,
)