import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function VerifyEmailSuccessPage() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Email verified</CardTitle>
          <CardDescription>Your account is ready. Sign in to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={buttonVariants({ size: 'lg' })}>
            Sign in
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
