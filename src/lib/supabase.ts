import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yisnyqrztkwxqnvslmqr.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpc255cXJ6dGt3eHFudnNsbXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTc2NjYsImV4cCI6MjA5MjA3MzY2Nn0.eboOYd1XrRgeut3O9aMCjbGXg19jrOQBM32nqyCyY_E';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
