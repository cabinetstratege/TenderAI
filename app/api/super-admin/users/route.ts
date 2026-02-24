import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

const superRoles = ['superuser', 'super_user', 'super_admin', 'superadmin'];

export async function GET(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase service key missing' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return NextResponse.json({ error: 'Authorization token manquant' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
  }

  const role = (user.app_metadata as Record<string, string> | undefined)?.role;
  if (!role || !superRoles.includes(role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select(
      'id, company_name, specialization, cpv_codes, negative_keywords, target_departments, subscription_status',
    );

  if (profileError) {
    return NextResponse.json({ error: 'Lecture profils impossible' }, { status: 500 });
  }

  const { data: interactions, error: interactionsError } = await supabaseAdmin
    .from('user_interactions')
    .select('user_id');

  if (interactionsError) {
    return NextResponse.json({ error: 'Lecture activité impossible' }, { status: 500 });
  }

  const interactionCountByUser = new Map<string, number>();
  interactions?.forEach((row: { user_id: string }) => {
    interactionCountByUser.set(row.user_id, (interactionCountByUser.get(row.user_id) || 0) + 1);
  });

  const users = (profiles || []).map((p: any) => ({
    id: p.id as string,
    companyName: (p.company_name as string) || 'N/A',
    specialization: (p.specialization as string) || '',
    subscriptionStatus: (p.subscription_status as string) || 'Trial',
    interactionsCount: interactionCountByUser.get(p.id) || 0,
  }));

  const summary = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.subscriptionStatus === 'Active').length,
    interactionsTotal: interactions?.length || 0,
  };

  return NextResponse.json({ users, summary });
}
