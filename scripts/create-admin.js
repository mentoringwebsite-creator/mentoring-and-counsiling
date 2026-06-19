const { createClient } = require('@supabase/supabase-js');

const fs = require('fs');
const path = require('path');

let supabaseUrl = process.env.SUPABASE_URL;
let supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim();
          if (key === 'SUPABASE_URL' || key === 'NEXT_PUBLIC_SUPABASE_URL') {
            supabaseUrl = val;
          }
          if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
            supabaseServiceRoleKey = val;
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading .env.local:', e);
  }
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Set them before running or ensure .env.local is in the root directory.');
  process.exit(1);
}


const adminEmail = 'mentoringwebsite47@gmail.com';
const adminPassword = 'website@123';
const adminName = 'Portal Admin';

async function main() {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  let userId;

  console.log(`Creating Supabase auth user for ${adminEmail}...`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  });

  if (authError) {
    if (authError.message.includes('already exists') || authError.message.includes('already been registered')) {
      console.warn('Auth user already exists. Locating user ID...');
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('Unable to list users:', listError.message);
        process.exit(1);
      }
      const existingUser = users?.users?.find((user) => user.email === adminEmail);
      if (!existingUser || !existingUser.id) {
        console.error('Admin auth user exists but could not be located.');
        process.exit(1);
      }
      userId = existingUser.id;
      console.log(`Found existing user ID: ${userId}`);

      console.log(`Resetting password and user metadata to role=admin for existing user ID ${userId}...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: adminPassword,
        user_metadata: { role: 'admin' },
        email_confirm: true
      });

      if (updateError) {
        console.error('Failed to reset auth user credentials:', updateError.message);
        process.exit(1);
      }
      console.log('Auth credentials reset successfully.');
    } else {
      console.error('Failed to create auth user:', authError.message);
      process.exit(1);
    }
  } else {
    userId = authData?.user?.id;
    console.log(`Created new auth user with ID: ${userId}`);
  }

  await ensureAdminProfile(userId);
}

async function ensureAdminProfile(userId) {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  console.log(`Creating or updating admin profile row for user_id ${userId}...`);
  const { error } = await supabase.from('users').upsert(
    {
      id: userId,
      email: adminEmail,
      name: adminName,
      role: 'admin',
      status: 'Approved',
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Failed to create/update admin profile:', error.message);
    process.exit(1);
  }

  console.log('Admin login credentials set successfully:');
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log('Admin account is Approved and ready to login at /admin/login.');
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
