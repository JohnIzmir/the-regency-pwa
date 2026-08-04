'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSuperAdmin } from '@/lib/auth/session';
import { UpdateUserRoleSchema, type UpdateUserRoleInput } from '@/lib/validation/events';

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Grants/revokes admin access. Deliberately restricted to super_admin —
 * an editor or admin should never be able to promote themselves or
 * anyone else. Enforced both here and by the admin_accounts_write RLS
 * policy (is_super_admin check) in 02-database-schema.sql.
 */
export async function updateUserRole(input: UpdateUserRoleInput): Promise<ActionResult> {
  const actor = await requireSuperAdmin();
  const parsed = UpdateUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' };
  }
  if (parsed.data.userId === actor.id && parsed.data.role !== 'super_admin') {
    return { success: false, error: "You can't demote your own account." };
  }

  const supabase = createClient();

  // Keep profiles.role and admin_accounts in sync: profiles.role is what
  // RLS's is_admin()/is_super_admin() helpers check indirectly via the
  // admin_accounts table, but the UI also reads profiles.role directly
  // for display, so both must agree.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: parsed.data.role })
    .eq('id', parsed.data.userId);

  if (profileError) {
    return { success: false, error: 'Could not update role.' };
  }

  if (parsed.data.role === 'user') {
    await supabase
      .from('admin_accounts')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', parsed.data.userId);
  } else {
    await supabase.from('admin_accounts').upsert({
      id: parsed.data.userId,
      role: parsed.data.role,
      granted_by: actor.id,
      granted_at: new Date().toISOString(),
      revoked_at: null,
    });
  }

  revalidatePath('/admin/users');
  return { success: true };
}
