import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gcvhzbhddqymrpxflymz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjdmh6YmhkZHF5bXJweGZseW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODQwMzMsImV4cCI6MjA4MDI2MDAzM30.bkGt5rpT5wy4EwdeKAJxNRlo0BIYHJkCxCO7oREIclU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);