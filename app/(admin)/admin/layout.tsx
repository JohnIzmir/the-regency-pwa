import { requireAdminOrRedirect } from '@/lib/auth/session';
import { AdminNav } from '@/components/admin/AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server Component guard — belt and braces alongside middleware.ts.
  // Postgres RLS (is_admin()) is the layer that actually can't be bypassed.
  const profile = await requireAdminOrRedirect();

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-pub-bg">
      <AdminNav userRole={profile.role} />
      <div className="overflow-y-auto p-8">{children}</div>
    </div>
  );
}
