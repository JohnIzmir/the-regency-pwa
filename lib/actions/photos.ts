'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/session';
import { ModeratePhotoSchema, type ModeratePhotoInput } from '@/lib/validation/events';

type ActionResult = { success: true } | { success: false; error: string };

export async function moderatePhoto(input: ModeratePhotoInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = ModeratePhotoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' };
  }
  if (parsed.data.decision === 'rejected' && !parsed.data.rejectionReason) {
    return { success: false, error: 'Give a reason so the uploader understands why it was rejected.' };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('photos')
    .update({
      status: parsed.data.decision,
      moderated_by: admin.id,
      moderated_at: new Date().toISOString(),
      rejection_reason: parsed.data.decision === 'rejected' ? parsed.data.rejectionReason : null,
    })
    .eq('id', parsed.data.photoId);

  if (error) {
    return { success: false, error: 'Could not update photo status.' };
  }

  revalidatePath('/admin/gallery');
  revalidatePath('/gallery');
  return { success: true };
}

/**
 * Admin-only hard delete — removes both the storage object and the row.
 * Regular users can never delete a photo once uploaded (spec requirement);
 * this is the only deletion path in the whole app.
 */
export async function deletePhoto(photoId: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createClient();

  const { data: photo } = await supabase
    .from('photos')
    .select('storage_path, thumbnail_path')
    .eq('id', photoId)
    .single();

  if (!photo) return { success: false, error: 'Photo not found.' };

  // Storage deletion uses the service-role client because the
  // gallery-photos bucket's RLS only grants the uploader read/insert —
  // admin delete rights are enforced here in application code, backed by
  // the fact this Server Action itself is gated by requireAdmin() above.
  const serviceClient = createServiceRoleClient();
  await serviceClient.storage.from('gallery-photos').remove([photo.storage_path, photo.thumbnail_path]);

  const { error } = await supabase.from('photos').delete().eq('id', photoId);
  if (error) {
    return { success: false, error: 'Could not delete photo record.' };
  }

  revalidatePath('/admin/gallery');
  revalidatePath('/gallery');
  return { success: true };
}
