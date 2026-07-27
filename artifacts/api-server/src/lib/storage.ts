import { supabaseAdmin } from './supabase';

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export async function ensureAvatarBucket() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = buckets?.some((bucket) => bucket.name === AVATAR_BUCKET);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(AVATAR_BUCKET, {
        public: true,
        allowedMimeTypes,
        fileSizeLimit: MAX_AVATAR_SIZE,
      });
    }
  } catch (error) {
    console.error('Failed to ensure avatar bucket:', error);
  }
}

export function validateAvatarFile(file: Express.Multer.File) {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.');
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error('File too large. Max size is 2MB.');
  }
}

export async function uploadAvatar(userId: string, file: Express.Multer.File) {
  await ensureAvatarBucket();
  validateAvatarFile(file);

  const extension = file.mimetype.split('/')[1] ?? 'png';
  const path = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { url: publicUrlData.publicUrl };
}
