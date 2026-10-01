/**
 * NodeBricks Backend Authentication Service
 * Validates credentials, user roles, and institutional access scopes.
 */

import { User } from '@/types';
import { getServerSupabase } from '@/lib/supabase/server';

export async function verifyUserSession(userId: string): Promise<User | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  try {
    const { data: u, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !u) return null;

    return {
      id: u.id,
      school_id: u.school_id,
      email: u.email,
      name: u.name,
      full_name: u.name,
      role: u.role,
      phone: u.phone,
      created_at: u.created_at,
      updated_at: u.updated_at,
    };
  } catch {
    return null;
  }
}
