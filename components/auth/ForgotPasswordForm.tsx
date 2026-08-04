'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { RequestPasswordResetSchema, type RequestPasswordResetInput } from '@/lib/validation/auth';
import { requestPasswordReset } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetInput>({ resolver: zodResolver(RequestPasswordResetSchema) });

  async function onSubmit(data: RequestPasswordResetInput) {
    setSubmitting(true);
    await requestPasswordReset(data);
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-pub-cream">
        If an account exists for that email, we&apos;ve sent a password reset link. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" size="lg" isLoading={submitting}>
        Send reset link
      </Button>
    </form>
  );
}
