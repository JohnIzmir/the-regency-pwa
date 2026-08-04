import { z } from 'zod';

export const UploadPhotoSchema = z.object({
  storagePath: z.string().min(1),
  thumbnailPath: z.string().min(1),
  caption: z.string().trim().max(300).optional().nullable(),
  eventId: z.string().uuid().optional().nullable(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  fileSizeBytes: z.number().int().positive().optional().nullable(),
});
export type UploadPhotoInput = z.infer<typeof UploadPhotoSchema>;

export const ReportPhotoSchema = z.object({
  photoId: z.string().uuid(),
  reason: z.string().trim().min(3, 'Tell us why you are reporting this photo.').max(300),
});
export type ReportPhotoInput = z.infer<typeof ReportPhotoSchema>;
