import { createClient } from '@/lib/supabase/server';
import { getSessionProfile } from '@/lib/auth/session';
import { UserRoleSelect } from '@/components/admin/UserRoleSelect';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Manage users | The Regency' };

export default async function AdminUsersPage() {
  const [supabase, viewer] = [createClient(), await getSessionProfile()];
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const canManageRoles = viewer?.role === 'super_admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-pub-cream">Users</h1>
        {!canManageRoles && (
          <p className="text-sm text-pub-muted">Only super admins can change roles — you have view access.</p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-pub-wood-light/30">
        <table className="w-full text-left text-sm">
          <thead className="bg-pub-surface2 text-xs uppercase tracking-wide text-pub-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((user) => (
              <tr key={user.id} className="border-t border-pub-wood-light/20">
                <td className="px-4 py-3 text-pub-cream">{user.full_name}</td>
                <td className="px-4 py-3 text-pub-muted">{user.email}</td>
                <td className="px-4 py-3 text-pub-muted">
                  {new Date(user.created_at).toLocaleDateString('en-GB')}
                </td>
                <td className="px-4 py-3">
                  {canManageRoles ? (
                    <UserRoleSelect userId={user.id} currentRole={user.role} />
                  ) : (
                    <Badge variant="muted">{user.role.replace('_', ' ')}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
