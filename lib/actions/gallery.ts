'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireUser, AuthError } from '@/lib/auth/session';
import { UploadPhotoSchema, ReportPhotoSchema, type UploadPhotoInput, type ReportPhotoInput } from '@/lib/validation/photos';

type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

/**
 * These actions are reachable from fully public pages (gallery, event
 * detail) by signed-out visitors, unlike the admin actions which sit
 * behind requireAdminOrRedirect() at the layout level. requireUser()
 * throws for a signed-out caller, so every action here catches that
 * specific AuthError and turns it into a normal {success:false} result
 * instead of letting it blow up as an unhandled Server Action error.
 */
function authErrorResult<T>(error: unknown): ActionResult<T> {
  if (error instanceof AuthError) {
    return { success: false, error: 'Sign in to do that.' };
  }
  throw error;
}

/**
 * Creates the `photos` row after the browser has already uploaded the
 * (client-compressed) original + thumbnail directly to the private
 * gallery-photos bucket. Splitting it this way — direct-to-storage
 * upload, then a small metadata-only Server Action — keeps image bytes
 * off the Next.js server entirely, avoiding Vercel's serverless request
 * body limits and the need for a native image library like `sharp` in
 * the server runtime. Compression/resizing happens client-side in
 * components/gallery/UploadDropzone.tsx via <canvas>.
 */
export async function createPhotoRecord(input: UploadPhotoInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = UploadPhotoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid upload.' };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('photos')
      .insert({
        uploader_id: user.id,
        event_id: parsed.data.eventId ?? null,
        storage_path: parsed.data.storagePath,
        thumbnail_path: parsed.data.thumbnailPath,
        caption: parsed.data.caption ?? null,
        width: parsed.data.width ?? null,
        height: parsed.data.height ?? null,
        file_size_bytes: parsed.data.fileSizeBytes ?? null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !data) {
      return { success: false, error: 'Could not save photo. Try again.' };
    }

    revalidatePath('/admin/gallery');
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return authErrorResult(error);
  }
}

export async function toggleLike(photoId: string): Promise<ActionResult<{ liked: boolean }>> {
  try {
    const user = await requireUser();
    const supabase = createClient();

    const { data: existing } = await supabase
      .from('photo_likes')
      .select('id')
      .eq('photo_id', photoId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('photo_likes').delete().eq('id', existing.id);
      if (error) return { success: false, error: 'Could not unlike.' };
      revalidatePath('/gallery');
      return { success: true, data: { liked: false } };
    }

    const { error } = await supabase.from('photo_likes').insert({ photo_id: photoId, user_id: user.id });
    if (error) return { success: false, error: 'Could not like.' };

    revalidatePath('/gallery');
    return { success: true, data: { liked: true } };
  } catch (error) {
    return authErrorResult(error);
  }
}

export async function reportPhoto(input: ReportPhotoInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = ReportPhotoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid report.' };
    }

    const supabase = createClient();
    const { error } = await supabase.from('photo_reports').insert({
      photo_id: parsed.data.photoId,
      reporter_id: user.id,
      reason: parsed.data.reason,
    });

    if (error) return { success: false, error: 'Could not submit report.' };
    return { success: true, data: undefined };
  } catch (error) {
    return authErrorResult(error);
  }
}

export async function toggleFavourite(eventId: string): Promise<ActionResult<{ favourited: boolean }>> {
  try {
    const user = await requireUser();
    const supabase = createClient();

    const { data: existing } = await supabase
      .from('favourites')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('favourites').delete().eq('id', existing.id);
      if (error) return { success: false, error: 'Could not remove favourite.' };
      revalidatePath('/favourites');
      return { success: true, data: { favourited: false } };
    }

    const { error } = await supabase.from('favourites').insert({ event_id: eventId, user_id: user.id });
    if (error) return { success: false, error: 'Could not save favourite.' };

    revalidatePath('/favourites');
    return { success: true, data: { favourited: true } };
  } catch (error) {
    return authErrorResult(error);
  }
}
