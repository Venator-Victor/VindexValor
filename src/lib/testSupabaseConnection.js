import { supabase } from './customSupabaseClient';

/**
 * Utility to test the Supabase connection and authentication status.
 * Safe to call from the client application.
 */
export async function testConnection() {
  console.log('Testing Supabase Connection...');
  const results = {
    connected: false,
    authStatus: null,
    dbAccess: false,
    errors: []
  };

  try {
    // 1. Test Authentication
    console.log('Checking Auth Status...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      results.errors.push(`Auth Error: ${authError.message}`);
    } else {
      results.authStatus = session ? 'Authenticated' : 'Not Authenticated';
      console.log(`Auth Status: ${results.authStatus}`);
    }

    // 2. Test Basic Database Access
    // Will attempt to read 1 row from 'configuracoes' (usually has wide access or RLS for users)
    console.log('Testing Database Read Access...');
    const { error: dbError } = await supabase
      .from('configuracoes')
      .select('id')
      .limit(1);

    if (dbError) {
      results.errors.push(`DB Access Error: ${dbError.message}`);
    } else {
      results.dbAccess = true;
      console.log('Database Access: OK');
    }

    // Overall Status
    results.connected = !authError;
    
    console.log('Connection Test Results:', results);
    return results;

  } catch (err) {
    console.error('Unexpected error during connection test:', err);
    results.errors.push(err.message);
    return results;
  }
}