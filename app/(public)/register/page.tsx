import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Create account | The Regency' };

export default function RegisterPage() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Upload photos, save favourite events, and get notified about what&apos;s on.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </main>
  );
}
