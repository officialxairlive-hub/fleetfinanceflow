import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // Initialize Supabase with the SERVICE_ROLE_KEY inside the request handler
  // to avoid build-time errors if the env var is not present during Vercel build.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { email, password, fullName, role = 'mechanic', shopId } = await request.json();

    if (!email || !password || !fullName || !shopId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create the user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUserId = authData.user.id;

    // 2. Create the profile for the new user, linking them to the owner's shop_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        id: newUserId,
        shop_id: shopId,
        role: role,
        full_name: fullName
      }]);

    if (profileError) {
      // Rollback auth user creation if profile fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Create a technician record automatically
    if (role === 'mechanic') {
      const { error: techError } = await supabaseAdmin
        .from('technicians')
        .insert([{
          id: newUserId,
          shop_id: shopId,
          name: fullName.split(' ')[0], // First name or alias
          full_name: fullName,
          role: 'Technician',
          status: 'off'
        }]);
        
      if (techError) {
        console.error("Failed to create technician record (non-fatal):", techError);
      }
    }

    return NextResponse.json({ message: 'Mechanic account created successfully', user: authData.user });
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
