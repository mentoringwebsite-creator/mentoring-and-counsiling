const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Set them before running:');
  console.error('  SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-service-role-key node scripts/create-admin.js');
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

  console.log(`Creating Supabase auth user for ${adminEmail}...`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.warn('Auth user already exists. Proceeding to ensure admin profile exists.');
    } else {
      console.error('Failed to create auth user:', authError.message);
      process.exit(1);
    }
  }

  const userId = authData?.user?.id;
  if (!userId) {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Unable to determine existing user ID:', listError.message);
      process.exit(1);
    }
    const existingUser = users?.users?.find((user) => user.email === adminEmail);
    if (!existingUser) {
      console.error('Admin auth user exists but could not be located by email.');
      process.exit(1);
    }
    if (!existingUser.id) {
      console.error('Found auth user but no ID is available.');
      process.exit(1);
    }
    console.log(`Found existing user id ${existingUser.id}.`);
    await ensureAdminProfile(existingUser.id);
    return;
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
