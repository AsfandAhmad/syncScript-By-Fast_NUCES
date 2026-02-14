import supabase from '@/lib/supabase-client';
import { ApiResponse, Notification } from '@/lib/database.types';

export const notificationService = {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<ApiResponse<Notification[]>> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return { data: null, error: 'Not authenticated', status: 'error' };
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        data: data as Notification[],
        error: null,
        status: 'success',
      };
    } catch (error: any) {
      return { data: null, error: error.message, status: 'error' };
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<ApiResponse<number>> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return { data: null, error: 'Not authenticated', status: 'error' };
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.user.id)
        .eq('is_read', false);

      if (error) throw error;

      return { data: count || 0, error: null, status: 'success' };
    } catch (error: any) {
      return { data: null, error: error.message, status: 'error' };
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return { data: null, error: null, status: 'success' };
    } catch (error: any) {
      return { data: null, error: error.message, status: 'error' };
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<null>> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        return { data: null, error: 'Not authenticated', status: 'error' };
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userData.user.id)
        .eq('is_read', false);

      if (error) throw error;

      return { data: null, error: null, status: 'success' };
    } catch (error: any) {
      return { data: null, error: error.message, status: 'error' };
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return { data: null, error: null, status: 'success' };
    } catch (error: any) {
      return { data: null, error: error.message, status: 'error' };
    }
  },

  /**
   * Subscribe to real-time notification updates
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): () => void {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
