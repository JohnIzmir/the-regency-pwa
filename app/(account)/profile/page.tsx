import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Your profile | The Regency' };

export default async function ProfilePage() {
  const profile = await requireUser();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-pub-cream">Your profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>{profile.full_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-pub-cream">
          <p>{profile.email}</p>
          <p className="text-pub-muted">
            Member since {new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
          {profile.role !== 'user' && <Badge variant="secondary">{profile.role.replace('_', ' ')}</Badge>}
        </CardContent>
      </Card>
    </div>
  );
}
