import supabase from '../supabase-client';
import { File as DBFile, ApiResponse } from '../database.types';

/**
 * File Management Services
 * Handles PDF uploads, checksums, and secure signed URLs
 */

export const fileService = {
  /**
   * Calculate SHA-256 checksum for file integrity verification
   * Uses browser-native crypto.subtle API
   */
  async calculateChecksum(file: globalThis.File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Get all files in a vault
   */
  async getFilesByVault(vaultId: string): Promise<ApiResponse<DBFile[]>> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message, status: 'error' };
      }

      return { data: data || [], error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    vaultId: string,
    file: globalThis.File,
    checksum: string
  ): Promise<ApiResponse<DBFile>> {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        return { data: null, error: 'User not authenticated', status: 'error' };
      }

      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${vaultId}/${timestamp}-${file.name}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vault-files')
        .upload(fileName, file);

      if (uploadError) {
        return { data: null, error: uploadError.message, status: 'error' };
      }

      // Get public URL for the file
      const { data: urlData } = supabase.storage
        .from('vault-files')
        .getPublicUrl(fileName);

      // Create file record in database
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

      // Log activity
      await supabase.from('activity_logs').insert({
        vault_id: vaultId,
        action_type: 'file_uploaded',
        actor_id: user.user.id,
        metadata: {
          file_id: fileRecord.id,
          file_name: file.name,
          file_size: file.size,
        },
      });

      return { data: fileRecord, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Generate a signed URL for secure file access
   */
  async getSignedUrl(vaultId: string, fileName: string, expiresIn: number = 3600) {
    try {
      const { data } = await supabase.storage
        .from('vault-files')
        .createSignedUrl(`${vaultId}/${fileName}`, expiresIn);

      return { url: data?.signedUrl, error: null, status: 'success' };
    } catch (err) {
      return { url: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Delete a file from storage and database
   */
  async deleteFile(fileId: string, vaultId: string, fileName: string): Promise<ApiResponse<null>> {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('vault-files')
        .remove([`${vaultId}/${fileName}`]);

      if (storageError) {
        return { data: null, error: storageError.message, status: 'error' };
      }

      // Delete from database
      const { error: dbError } = await supabase.from('files').delete().eq('id', fileId);

      if (dbError) {
        return { data: null, error: dbError.message, status: 'error' };
      }

      // Log activity
      const { data: user } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        vault_id: vaultId,
        action_type: 'file_deleted',
        actor_id: user.user?.id,
        metadata: { file_id: fileId, file_name: fileName },
      });

      return { data: null, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },

  /**
   * Verify file checksum for integrity
   */
  async verifyChecksum(fileId: string, checksum: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: file } = await supabase
        .from('files')
        .select('checksum')
        .eq('id', fileId)
        .single();

      if (!file) {
        return { data: null, error: 'File not found', status: 'error' };
      }

      const isValid = file.checksum === checksum;
      return { data: isValid, error: null, status: 'success' };
    } catch (err) {
      return { data: null, error: String(err), status: 'error' };
    }
  },
};
