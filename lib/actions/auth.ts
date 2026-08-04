'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  SignUpSchema,
  SignInSchema,
  RequestPasswordResetSchema,
  UpdatePasswordSchema,
  type SignUpInput,
  type SignInInput,
  type RequestPasswordResetInput,
  type UpdatePasswordInput,
} from '@/lib/validation/auth';

type ActionResult = { success: true } | { success: false; error: string };

/**
 * Registers a new account. The `handle_new_user()` Postgres trigger
 * (02-database-schema.sql) creates the matching `profiles` and
 * `notification_preferences` rows automatically — nothing to do here
 * beyond calling Supabase Auth. Supabase sends the verification email.
 */
export async function signUp(input: SignUpInput): Promise<ActionResult> {
  const parsed = SignUpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const origin = headers().get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL;
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/verify-email/success`,
    },
  });

  if (error) {
    // Don't leak whether an email already exists in the system — return a
    // generic message either way to avoid account enumeration.
    return {
      success: false,
      error: 'Could not create account. If you already have one, try signing in instead.',
    };
  }

  return { success: true };
}

export async function signIn(input: SignInInput): Promise<ActionResult> {
  const parsed = SignInSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: 'Incorrect email or password.' };
  }

  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function requestPasswordReset(
  input: RequestPasswordResetInput
): Promise<ActionResult> {
  const parsed = RequestPasswordResetSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const origin = headers().get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL;
  const supabase = createClient();

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Always return success — confirms nothing about whether the email
  // exists, same account-enumeration protection as signUp().
  return { success: true };
}

export async function updatePassword(input: UpdatePasswordInput): Promise<ActionResult> {
  const parsed = UpdatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { success: false, error: 'Could not update password. Try requesting a new reset link.' };
  }

  return { success: true };
}
