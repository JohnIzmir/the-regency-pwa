'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { SignUpSchema, type SignUpInput } from '@/lib/validation/auth';
import { signUp } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RegisterForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({ resolver: zodResolver(SignUpSchema) });

  async function onSubmit(data: SignUpInput) {
    setSubmitting(true);
    const result = await signUp(data);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Check your email to verify your account.');
    router.push('/login');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" autoComplete="name" {...register('fullName')} />
        {errors.fullName && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {errors.fullName.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
        {errors.password && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
        <p className="mt-1 text-xs text-pub-muted">
          At least 10 characters, with an uppercase letter, lowercase letter, and number.
        </p>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" size="lg" isLoading={submitting}>
        Create account
      </Button>

      <p className="text-center text-sm text-pub-muted">
        Already registered?{' '}
        <Link href="/login" className="text-pub-gold hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
