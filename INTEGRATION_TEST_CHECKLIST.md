# Integration Test Checklist

## User Journey 1: New User Onboarding
- [ ] Sign up with email/password
- [ ] Verify redirect to dashboard
- [ ] Create first vault (name + description)
- [ ] Add a source (URL + title)
- [ ] Add an annotation to the source
- [ ] Upload a file to the vault
- [ ] Invite a member (by user ID + role)

## User Journey 2: Collaborator Workflow
- [ ] Receive notification when added to vault
- [ ] View vault as contributor
- [ ] Add a source (allowed)
- [ ] Add annotation (allowed)
- [ ] Upload file (allowed)
- [ ] Cannot delete vault (button hidden)
- [ ] Cannot manage members (button hidden)

## User Journey 3: Viewer Workflow
- [ ] View vault as viewer
- [ ] Cannot add sources (button hidden)
- [ ] Cannot add annotations (form hidden)
- [ ] Cannot upload files (uploader hidden)
- [ ] Can view all sources and annotations
- [ ] Can download files (but not delete)

## Real-Time Sync
- [ ] Source added by User A appears for User B instantly
- [ ] File uploaded by User A appears in User B's file list
- [ ] Notification appears in real-time for vault events
- [ ] Connection status banner shows when disconnected

## Notification System
- [ ] Notifications appear when: member added, source added, file uploaded, annotation added
- [ ] Unread count badge updates correctly
- [ ] Mark individual notification as read
- [ ] Mark all as read
- [ ] Click notification navigates to vault
- [ ] Real-time notification delivery

## Role-Based Access Control
- [ ] Owner: full access (edit, delete, manage members, settings)
- [ ] Contributor: create/edit content (no vault management)
- [ ] Viewer: read-only (download allowed, no mutations)
- [ ] Role badge displays correctly

## File Management
- [ ] File validation rejects oversized files (>50MB)
- [ ] File validation rejects unsupported types
- [ ] Upload progress bar works
- [ ] File type icons display correctly (PDF, image, spreadsheet, generic)
- [ ] Click file to preview (images/PDFs inline)
- [ ] Download button works
- [ ] Delete button only visible with permission

## Forms & Validation
- [ ] Add source: URL required, title optional, zod validation
- [ ] Edit source: pre-fills values, version displayed
- [ ] Create vault: name required, description optional
- [ ] Edit vault: pre-fills values
- [ ] Vault settings: archive/unarchive toggle, delete with confirmation
- [ ] All confirmation dialogs work for destructive actions

## Edge Cases
- [ ] Very long vault names truncate properly
- [ ] Empty states show for all list views
- [ ] Special characters in URLs handled
- [ ] Slow network: loading states appear
- [ ] Disconnection: warning banner shows
- [ ] Error boundary catches render errors

## Responsive Design
- [ ] Dashboard: cards stack on mobile
- [ ] Vault detail: tabs scrollable on mobile
- [ ] Forms: full-width on mobile
- [ ] Notification popover: works on mobile
- [ ] Settings page: proper spacing on all screens
