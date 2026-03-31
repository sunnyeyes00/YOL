import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bfcmypnrzvxiwvqcdtoo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmY215cG5yenZ4aXd2cWNkdG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODA2MjAsImV4cCI6MjA5MDU1NjYyMH0.qcfK3OfjKsjnaBv9S-FjLRxP7zfqkHTgwrPxxjTH6XI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
