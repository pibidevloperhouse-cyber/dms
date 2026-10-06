import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log("Checking if business owner exists...");
  
  const { data: existing, error: findError } = await supabaseAdmin
    .from('businessowners_users')
    .select('*')
    .eq('email', 'owner@pibivdr.com')
    .single();

  if (existing) {
    console.log("Business owner already exists in database:", existing);
    return;
  }

  console.log("Business owner not found. Creating...");
  
  const { data, error } = await supabaseAdmin
    .from('businessowners_users')
    .insert([
      {
        email: 'owner@pibivdr.com',
        password: 'superadmin123',
        name: 'PiBi Owner',
        role: 'business_owner'
      }
    ])
    .select();

  if (error) {
    console.error("Error creating business owner:", error);
  } else {
    console.log("Successfully created business owner:", data);
  }
}

seed();
