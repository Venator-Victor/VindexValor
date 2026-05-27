import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxfvayyapmmoaumiyrka.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4ZnZheXlhcG1tb2F1bWl5cmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTkxMTgsImV4cCI6MjA4NTAzNTExOH0.x_QSBh5pciEJdMyZPROnF7Iw2jEl_IxVzv7Q6amgtRg';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
