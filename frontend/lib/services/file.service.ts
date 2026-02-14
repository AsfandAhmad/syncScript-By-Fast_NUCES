import supabase from '../supabase-client';
import { FileRecord, ApiResponse } from '../database.types';

export const fileService = {
  async getFilesByVault(vaultId: string): Promise<ApiResponse<FileRecord[]>> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message, status: 'error' };
      return { data: data || [], error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  async uploadFile(
    vaultId: string,
    file: File,
    checksum: string
  ): Promise<ApiResponse<FileRecord>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: 'User not authenticated', status: 'error' };
      }

      const timestamp = Date.now();
      const fileName = `${vaultId}/${timestamp}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('vault-files')
        .upload(fileName, file);

      if (uploadError) {
        return { data: null, error: uploadError.message, status: 'error' };
      }

      const { data: urlData } = supabase.storage
        .from('vault-files')
        .getPublicUrl(fileName);

      const { data: fileRecord, error: dbError } = await supabase
        .from('files')
        .insert({
          vault_id: vaultId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          checksum,
          uploaded_by: user.user.id,
        })
        .select()
        .single();

      if (dbError) {
        return { data: null, error: dbError.message, status: 'error' };
      }

      await supabase.from('activity_logs').insert({
        vault_id: vaultId,
        action_type: 'file_uploaded',
        actor_id: user.user.id,
        metadata: { file_id: fileRecord.id, file_name: file.name, file_size: file.size },
      });

      return { data: fileRecord, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  async deleteFile(fileId: string, vaultId: string, storagePath: string): Promise<ApiResponse<null>> {
    try {
      await supabase.storage.from('vault-files').remove([storagePath]);
      const { error } = await supabase.from('files').delete().eq('id', fileId);
      if (error) return { data: null, error: error.message, status: 'error' };

      const { data: user } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        vault_id: vaultId,
        action_type: 'file_deleted',
        actor_id: user.user?.id,
        metadata: { file_id: fileId },
      });

      return { data: null, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  async getSignedUrl(storagePath: string, expiresIn: number = 3600) {
    try {
      const { data } = await supabase.storage
        .from('vault-files')
        .createSignedUrl(storagePath, expiresIn);
      return { url: data?.signedUrl || null, error: null };
    } catch (err) {
      return { url: null, error: String(err) };
    }
  },
};
