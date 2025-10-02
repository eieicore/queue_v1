import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../config/constants';

const supabaseUrl = API_CONFIG.SUPABASE_URL;
const supabaseAnonKey = API_CONFIG.API_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
