import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Audit log | The Regency' };

const ACTION_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'muted'> = {
  INSERT: 'secondary',
  UPDATE: 'default',
  DELETE: 'destructive',
};

export default async function AuditLogPage() {
  const supabase = createClient();
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-pub-cream">Audit log</h1>
        <p className="text-sm text-pub-muted">
          Every create/update/delete on events, photos, news, and admin accounts — written automatically
          by a database trigger, not by application code.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-pub-wood-light/30">
        <table className="w-full text-left text-sm">
          <thead className="bg-pub-surface2 text-xs uppercase tracking-wide text-pub-muted">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Table</th>
              <th className="px-4 py-3">Record</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log) => (
              <tr key={log.id} className="border-t border-pub-wood-light/20">
                <td className="px-4 py-3 text-pub-muted">{new Date(log.created_at).toLocaleString('en-GB')}</td>
                <td className="px-4 py-3 text-pub-cream">
                  {(log.profiles as unknown as { full_name: string } | null)?.full_name ?? 'System'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={ACTION_VARIANT[log.action] ?? 'muted'}>{log.action}</Badge>
                </td>
                <td className="px-4 py-3 text-pub-muted">{log.entity_type}</td>
                <td className="px-4 py-3 font-mono text-xs text-pub-muted">{log.entity_id?.slice(0, 8)}</td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-pub-muted">
                  No activity logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
