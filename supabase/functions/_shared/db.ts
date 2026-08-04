// Shared Supabase service-role client for Edge Functions. Deno Deploy
// (Supabase Edge Functions runtime) supports npm: specifiers directly —
// no build step, no node_modules, no package.json in this directory.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}
