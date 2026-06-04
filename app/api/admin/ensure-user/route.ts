import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Missing server-side Supabase credentials.' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { id, email, name } = body ?? {};

  if (!id || !email || !name) {
    return NextResponse.json(
      { success: false, message: 'Missing required admin user fields.' },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('users').upsert(
    {
      id,
      email,
      name,
      role: 'admin',
      status: 'Approved'
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('ensure-user error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
