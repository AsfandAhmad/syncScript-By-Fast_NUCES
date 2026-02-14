-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID REFERENCES vaults(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications (via service role or triggers)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function to create notification for vault members
CREATE OR REPLACE FUNCTION notify_vault_members()
RETURNS TRIGGER AS $$
DECLARE
  member RECORD;
  vault_name TEXT;
BEGIN
  -- Get vault name
  SELECT name INTO vault_name FROM vaults WHERE id = NEW.vault_id;
  
  -- Notify all members except the actor
  FOR member IN 
    SELECT user_id FROM vault_members 
    WHERE vault_id = NEW.vault_id AND user_id != NEW.actor_id
  LOOP
    INSERT INTO notifications (user_id, vault_id, type, title, message, metadata)
    VALUES (
      member.user_id,
      NEW.vault_id,
      NEW.action_type,
      CASE 
        WHEN NEW.action_type LIKE 'source_%' THEN 'Source Activity'
        WHEN NEW.action_type LIKE 'annotation_%' THEN 'Annotation Activity'
        WHEN NEW.action_type LIKE 'file_%' THEN 'File Activity'
        WHEN NEW.action_type LIKE 'member_%' THEN 'Member Activity'
        ELSE 'Activity'
      END,
      'Activity in vault "' || COALESCE(vault_name, 'Unknown') || '"',
      NEW.metadata
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create notifications on activity log inserts
CREATE TRIGGER on_activity_log_insert
  AFTER INSERT ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION notify_vault_members();
