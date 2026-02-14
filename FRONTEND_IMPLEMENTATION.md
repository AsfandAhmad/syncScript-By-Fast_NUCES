# SyncScript Frontend Implementation

## Overview

SyncScript is a collaborative research and citation engine built with Next.js 14+, React 19+, and Supabase. This document covers the frontend implementation with a complete UI layer integrated with the Supabase backend services.

## Project Structure

```
frontend/
├── app/
│   ├── login/                      # Authentication login page
│   ├── signup/                     # User registration page
│   ├── forgot-password/            # Password reset page
│   ├── settings/                   # User account settings
│   ├── dashboard/                  # Main dashboard with vault list
│   ├── vault/
│   │   └── [id]/                   # Vault detail page with sources
│   └── layout.tsx                  # Root layout
├── components/
│   ├── vault-card.tsx              # Vault card component
│   ├── file-uploader.tsx           # File upload with drag-drop
│   ├── activity-feed.tsx           # Activity log display
│   ├── annotation-item.tsx         # Annotation display
│   ├── pdf-preview.tsx             # PDF viewer
│   ├── source-item.tsx             # Source list item
│   └── ui/                         # shadcn/ui components
├── hooks/
│   ├── use-auth.ts                 # Authentication hook
│   └── use-realtime.ts             # Real-time data hooks
├── lib/
│   ├── services/
│   │   ├── vault.service.ts        # Vault operations
│   │   ├── source.service.ts       # Source operations
│   │   ├── file.service.ts         # File upload/storage
│   │   ├── source.annotation.service.ts  # Annotations
│   │   └── realtime.service.ts     # WebSocket subscriptions
│   ├── database.types.ts           # Database type definitions
│   ├── supabase-client.ts          # Supabase client
│   ├── types.ts                    # UI type definitions
│   └── utils.ts                    # Utility functions
└── styles/
    └── globals.css                 # Global styles
```

## Pages Implementation

### 1. Login Page (`/login`)
- Email/password authentication
- Integration with `useAuth().signIn()`
- Error handling and loading states
- Link to signup page
- Forgot password link

**Key Features:**
- Form validation
- Error alerts
- Loading spinner
- Redirect to dashboard on success
- Demo credentials display

### 2. Signup Page (`/signup`)
- Two-step registration flow
- Email validation
- Password strength requirements (min 8 chars)
- Password confirmation matching
- Integration with `useAuth().signUp()`

**Key Features:**
- Email input validation
- Password match verification
- Confirmation message
- Redirect to login after success
- Error handling

### 3. Dashboard Page (`/dashboard`)
- List all user's vaults
- Create new vault form
- Search functionality (optional enhancement)
- Vault cards with quick actions
- User greeting with email

**Key Features:**
- Real-time vault loading via `vaultService.getAllVaults()`
- Vault creation with validation
- Vault deletion with confirmation
- Loading skeleton states
- Empty state messaging
- Sign out functionality

**Services Used:**
- `vaultService.getAllVaults()`
- `vaultService.createVault()`
- `vaultService.deleteVault()`

### 4. Vault Detail Page (`/vault/[id]`)
- List sources in vault
- Add new sources (URL or file upload)
- File uploader with drag-drop
- Source card list with metadata
- Delete sources
- Navigation back to dashboard

**Key Features:**
- Dynamic source loading
- URL validation
- File upload with checksum
- Source deletion
- Loading and error states
- Quick navigation to source details

**Services Used:**
- `vaultService.getVaultById()`
- `sourceService.getSourcesByVault()`
- `sourceService.createSource()`
- `sourceService.deleteSource()`
- `fileService.uploadFile()`

### 5. Settings Page (`/settings`)
- User profile information
- Display name editing
- Email display (read-only)
- Password change link
- Account security section
- Sign out functionality

**Key Features:**
- Profile update form
- Account creation date display
- Security recommendations
- Navigation to password reset
- Sign out button

### 6. Forgot Password Page (`/forgot-password`)
- Email input for password reset
- Confirmation message
- Link back to login
- Integration with `useAuth().resetPassword()`

**Key Features:**
- Email validation
- Loading state
- Success confirmation
- Error handling

## Components

### VaultCard (`components/vault-card.tsx`)
Displays individual vault information in a grid.

**Props:**
- `vault: Vault` - Vault data
- `onClick?: () => void` - Card click handler
- `onDelete?: () => void` - Delete button handler

### FileUploader (`components/file-uploader.tsx`)
Drag-and-drop file upload with validation.

**Props:**
- `vaultId: string` - Associated vault ID
- `onUploadComplete?: (filename: string) => void` - Upload completion callback

**Features:**
- Drag-and-drop support
- File input selection
- Automatic checksum calculation
- Progress indication
- Error handling

### ActivityFeed (`components/activity-feed.tsx`)
Displays activity log items with icons and timestamps.

**Props:**
- `items: ActivityLog[]` - Activity items to display

### Other Components
- `annotation-item.tsx` - Single annotation display
- `pdf-preview.tsx` - PDF viewer
- `source-item.tsx` - Source list item

## Authentication Flow

1. **Login**: User enters email/password → `useAuth().signIn()` → Redirect to `/dashboard`
2. **Signup**: User fills form → `useAuth().signUp()` → Confirmation → Redirect to `/login`
3. **Forgot Password**: User enters email → `useAuth().resetPassword()` → Email sent → Back to login

## Data Flow

### Vault Management
```
Dashboard
  ↓ getAllVaults()
  ├→ Vault List (vaultService.getAllVaults())
  ├→ Create Vault (vaultService.createVault())
  └→ Delete Vault (vaultService.deleteVault())
      ↓ Navigate to
  Vault Detail
    ↓ getVaultById() + getSourcesByVault()
    ├→ Source List
    ├→ Add Source (URL: sourceService.createSource())
    ├→ Upload File (fileService.uploadFile())
    └→ Delete Source (sourceService.deleteSource())
```

### Real-Time Updates
Pages can subscribe to real-time updates using:
- `useRealtimeSources(vaultId)`
- `useRealtimeMembers(vaultId)`
- `useRealtimeActivityLog(vaultId)`
- `useRealtimeAnnotations(sourceId)`

## Styling

- **Framework**: Tailwind CSS 3.3+
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Color Scheme**: Blue/Indigo gradients with gray neutrals

### Key Classes
- `bg-gradient-to-br from-blue-600 to-indigo-600` - Primary gradient
- `hover:shadow-lg transition-shadow` - Interactive elements
- `text-sm font-medium` - Standard text styling

## State Management

Pages use React hooks for local state:
- `useState()` - Form inputs, UI state
- `useEffect()` - Data loading, side effects
- `useRouter()` - Navigation
- `useAuth()` - Authentication context

## Error Handling

All pages include:
- Try-catch blocks for async operations
- Error alerts with user-friendly messages
- Validation before submission
- Loading states during operations

Example:
```tsx
try {
  const result = await serviceMethod();
  if (result.status === 'success') {
    setSuccess(true);
  } else {
    setError(result.error);
  }
} catch (err) {
  setError(String(err));
}
```

## Environment Setup

### Required Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Installation
```bash
npm install
# or
yarn install
```

### Running Development Server
```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` in browser.

## Key Dependencies

- **next**: 14+
- **react**: 19+
- **@supabase/supabase-js**: Latest
- **tailwindcss**: 3.3+
- **lucide-react**: For icons
- **@hookform/resolvers**: For form validation

## Security Considerations

1. **Authentication**
   - Supabase Auth handles JWT tokens
   - useAuth hook manages auth state
   - Protected routes redirect to login

2. **File Uploads**
   - SHA-256 checksum verification
   - Filename validation
   - File size limits (50MB)
   - Secure Supabase Storage with signed URLs

3. **Data Access**
   - RLS policies enforce access control
   - Users can only access their vaults
   - Members can only access shared vaults

4. **Forms**
   - Email validation
   - Password requirements (min 8 chars)
   - CSRF protection via Supabase

## Future Enhancements

### Phase 2 - Advanced Features
- [ ] Source detail page with annotations editor
- [ ] Real-time collaborative annotations
- [ ] Citation generation and formatting
- [ ] Advanced search and filtering
- [ ] Vault member management UI
- [ ] Activity feed with real-time updates
- [ ] PDF annotation overlay
- [ ] Source import from URL metadata

### Phase 3 - Performance
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading for routes
- [ ] Caching strategies
- [ ] Pagination for large datasets

### Phase 4 - User Experience
- [ ] Dark mode support
- [ ] Mobile responsive optimization
- [ ] Accessibility improvements (WCAG 2.1)
- [ ] Keyboard shortcuts
- [ ] Offline mode support

## Testing

Run tests (when implemented):
```bash
npm run test
# or
yarn test
```

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Vercel Deployment
```bash
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Supabase Client Not Initializing**
   - Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Verify environment variables are set

2. **Auth State Not Persisting**
   - Ensure useAuth() is called in a client component
   - Check browser localStorage for session

3. **File Upload Failures**
   - Verify bucket exists and has proper permissions
   - Check file size limits
   - Review Supabase Storage RLS policies

4. **Type Errors**
   - Run `npm run build` to catch all type issues
   - Check imports use database.types for DB types
   - Use types.ts for UI types

## Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check existing issues on GitHub
2. Create new issue with detailed description
3. Contact support team

## Changelog

### v1.0.0 (Current)
- Initial frontend implementation
- Authentication pages (login, signup, forgot password)
- Dashboard with vault management
- Vault detail page with source management
- File uploader with drag-drop
- Settings/profile page
- Integration with all backend services
- Responsive design with Tailwind CSS
