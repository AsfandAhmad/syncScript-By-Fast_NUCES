import supabase from '../supabase-client';
import type { Notification, NotificationType, ApiResponse } from '../database.types';

export const notificationService = {
  /**
   * Create a notification for a single user
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata: Record<string, any> = {}
  ): Promise<ApiResponse<Notification>> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        vault_id: metadata.vault_id || null,
        type,
        title,
        message,
        metadata,
      })
      .select()
      .single();

    if (error) return { data: null, error: error.message, status: 'error' };
    return { data, error: null, status: 'success' };
  },

  /**
   * Notify all vault members except the actor
   */
  async notifyVaultMembers(
    vaultId: string,
    excludeUserId: string,
    type: NotificationType,
    title: string,
    message: string,
    extraMeta: Record<string, any> = {}
  ): Promise<void> {
    // Fetch all members of the vault
    const { data: members } = await supabase
      .from('vault_members')
      .select('user_id')
      .eq('vault_id', vaultId);

    if (!members || members.length === 0) return;

    const rows = members
      .filter((m) => m.user_id !== excludeUserId)
      .map((m) => ({
        user_id: m.user_id,
        vault_id: vaultId,
        type,
        title,
        message,
        metadata: { vault_id: vaultId, ...extraMeta },
      }));

    if (rows.length === 0) return;

    await supabase.from('notifications').insert(rows);
  },

  /**
   * Get notifications for the current user (most recent first)
   */
  async getNotifications(
    limit = 30
  ): Promise<ApiResponse<Notification[]>> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return { data: null, error: error.message, status: 'error' };
    return { data: data as Notification[], error: null, status: 'success' };
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    if (error) return 0;
    return count || 0;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<null>> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) return { data: null, error: error.message, status: 'error' };
    return { data: null, error: null, status: 'success' };
  },

  /**
   * Mark all notifications as read for the current user
   */
  async markAllAsRead(): Promise<ApiResponse<null>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated', status: 'error' };

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) return { data: null, error: error.message, status: 'error' };
    return { data: null, error: null, status: 'success' };
  },

  /**
   * Delete a single notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<null>> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) return { data: null, error: error.message, status: 'error' };
    return { data: null, error: null, status: 'success' };
  },
};
