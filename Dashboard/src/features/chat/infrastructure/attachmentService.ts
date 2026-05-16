import { supabase } from '@shared/services/api/supabaseClient';

const WALL_ATTACHMENTS_BUCKET = 'wall-attachments';
const DM_ATTACHMENTS_BUCKET = 'dm-attachments';

type UploadResult =
  | { success: true; storagePath: string }
  | { success: false; error: string };

export async function uploadToSupabase(file: File, groupId: string): Promise<UploadResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase no está configurado. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY al .env.',
    };
  }

  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${groupId}/${Date.now()}_${sanitized}`;

  const { data, error } = await supabase.storage.from(WALL_ATTACHMENTS_BUCKET).upload(path, file);

  if (error) return { success: false, error: error.message };
  return { success: true, storagePath: data.path };
}

export async function uploadDmToSupabase(
  file: File,
  conversationId: string,
): Promise<UploadResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase no está configurado. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY al .env.',
    };
  }

  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${conversationId}/${Date.now()}_${sanitized}`;

  const { data, error } = await supabase.storage.from(DM_ATTACHMENTS_BUCKET).upload(path, file);

  if (error) return { success: false, error: error.message };
  return { success: true, storagePath: data.path };
}
