# 🔬 SyncScript - Collaborative Research & Citation Engine

**A modern, full-stack web application for collaborative research management with real-time updates and automatic citations.**

[![Next.js](https://img.shields.io/badge/Next.js-14+-black)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3+-06B6D4)](https://tailwindcss.com)

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Setup Guides](#-setup-guides)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## ✨ Features

### 🏠 Vault Management
- Create and manage research projects (vaults)
- Invite collaborators with role-based access
- Owner/Contributor/Viewer permissions
- Complete audit trail of all actions

### 📚 Source Management
- Add research sources with URLs
- Automatic metadata extraction from CrossRef
- Generate citations in APA/MLA/Chicago formats
- Version tracking for conflict resolution
- Duplicate source prevention per vault

### 📝 Annotations
- Create notes and highlights on sources
- Real-time annotation updates
- Version tracking for edits
- User attribution

### 📄 File Management
- Upload and store PDF documents
- SHA-256 checksum verification
- Secure signed URL access
- Integration with sources

### 🔄 Real-Time Collaboration
- Live updates when team members make changes
- See activity feed in real-time
- Multi-user awareness
- WebSocket-based via Supabase Realtime

### 🔐 Security
- Row-Level Security (RLS) at database level
- JWT-based authentication
- Role-based access control
- Secure file storage with signed URLs
- Encrypted connections (HTTPS)

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account (free)

### 1. Clone & Setup
```bash
# Clone project
git clone https://github.com/yourusername/syncscript.git
cd syncscript

# Install dependencies
npm install
cd frontend && npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy credentials from Settings → API

### 3. Apply Migrations
1. Go to Supabase SQL Editor
2. Run `supabase/migrations/001_init_schema.sql`
3. Run `supabase/migrations/002_enable_rls.sql`

### 4. Configure Environment
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 5. Deploy Functions
```bash
npm install -g supabase
supabase login
cd supabase
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy auto-citation
supabase functions deploy activity-logger
```

### 6. Run Locally
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

**→ For detailed setup, see [QUICK_START.md](./QUICK_START.md)**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  Next.js 14 + React 19 + Tailwind CSS + shadcn/ui      │
│  ├── Pages: Login, Dashboard, Vault, Settings           │
│  ├── Components: VaultCard, SourceList, Annotations    │
│  └── Hooks: useAuth, useRealtime, useVault            │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────────┐
│                   API Layer                              │
│  Next.js API Routes + TypeScript Services               │
│  ├── /api/auth        - Authentication                  │
│  ├── /api/vaults      - Vault management                │
│  ├── /api/sources     - Source management               │
│  └── /api/citation    - Citation generation             │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────────┐
│              Supabase Backend Layer                      │
│  ├── PostgreSQL Database (6 tables with RLS)            │
│  ├── Auth (JWT + Email/OAuth)                           │
│  ├── Realtime (WebSocket subscriptions)                 │
│  ├── Storage (PDF bucket with policies)                 │
│  └── Edge Functions (Auto-citation, Activity logging)   │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
syncscript/
├── frontend/                          # Next.js application
│   ├── app/
│   │   ├── api/                       # API routes
│   │   │   ├── auth/
│   │   │   ├── vaults/
│   │   │   └── citation/
│   │   ├── dashboard/                 # Main app
│   │   ├── login/                     # Auth pages
│   │   ├── vault/[id]/                # Vault detail
│   │   └── globals.css
│   ├── components/                    # React components
│   │   ├── ui/                        # shadcn/ui components
│   │   ├── vault-card.tsx
│   │   ├── source-list.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── supabase-client.ts         # Client SDK
│   │   ├── supabase-server.ts         # Server SDK
│   │   ├── database.types.ts          # TypeScript types
│   │   └── services/                  # Business logic
│   │       ├── vault.service.ts
│   │       ├── source.service.ts
│   │       ├── file.service.ts
│   │       └── realtime.service.ts
│   ├── hooks/                         # React hooks
│   │   ├── use-auth.ts
│   │   ├── use-realtime.ts
│   │   └── use-mobile.tsx
│   └── package.json
│
├── supabase/                          # Backend infrastructure
│   ├── migrations/                    # Database migrations
│   │   ├── 001_init_schema.sql        # Tables & indexes
│   │   └── 002_enable_rls.sql         # Security policies
│   ├── functions/                     # Edge Functions
│   │   ├── auto-citation/             # Citation generation
│   │   └── activity-logger/           # Activity logging
│   ├── config.json
│   ├── supabase.json
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── backend/                           # Optional serverless functions
│   └── (Use Supabase Edge Functions)
│
├── QUICK_START.md                     # 15-minute setup
├── INTEGRATION_GUIDE.md               # Complete setup
├── DEPLOYMENT_GUIDE.md                # Production deployment
├── SETUP_CHECKLIST.md                 # Verification checklist
├── IMPLEMENTATION_SUMMARY.md          # What's implemented
└── README.md                          # This file
```

---

## 🛠️ Setup Guides

### For Quick Setup (15 minutes)
→ **[QUICK_START.md](./QUICK_START.md)**
- Step-by-step setup
- Quick test procedures
- Common issues

### For Complete Integration (1-2 hours)
→ **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)**
- Detailed Supabase configuration
- Database schema explanation
- API documentation
- Troubleshooting guide

### For Production Deployment
→ **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**
- 7-phase deployment process
- Environment configuration
- Security checklist
- Performance optimization
- Monitoring setup

### For Verification
→ **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)**
- Pre-deployment checks
- Integration testing
- Security verification

### For Implementation Details
→ **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)**
- What's been implemented
- Features checklist
- Technology stack
- Next steps

---

## 📚 API Documentation

### Authentication
```typescript
// Sign up
const { data } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Sign in
const { data } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
await supabase.auth.signOut();
```

### Vault Management
```typescript
// Get all vaults
const { data: vaults } = await supabase
  .from('vaults')
  .select('*')
  .order('created_at', { ascending: false });

// Create vault
const { data: vault } = await supabase
  .from('vaults')
  .insert({ name: 'Research Project 1', owner_id: userId })
  .select()
  .single();

// Add member
const { data: member } = await supabase
  .from('vault_members')
  .insert({ vault_id: vaultId, user_id: userId, role: 'contributor' })
  .select()
  .single();
```

### Source Management
```typescript
// Get sources (paginated)
const { data: sources } = await supabase
  .from('sources')
  .select('*')
  .eq('vault_id', vaultId)
  .range(0, 19);

// Create source
const { data: source } = await supabase
  .from('sources')
  .insert({ vault_id: vaultId, url: 'https://...', title: 'Title' })
  .select()
  .single();

// Generate citation
const response = await fetch('/api/citation/generate', {
  method: 'POST',
  body: JSON.stringify({ url: 'https://doi.org/10.1038/...', style: 'apa' })
});
```

### Real-Time Updates
```typescript
// Subscribe to source changes
const subscription = supabase
  .channel(`sources:${vaultId}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'sources', filter: `vault_id=eq.${vaultId}` },
    (payload) => console.log('Update:', payload)
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

**→ For complete API docs, see [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md#step-6-api-endpoints)**

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel deploy --prod
```

### Netlify
1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Self-Hosted
```bash
npm run build
npm start
```

**→ For detailed deployment, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

---

## 🔐 Security

### Implemented
- ✅ Row-Level Security (RLS) at database level
- ✅ JWT-based authentication
- ✅ Role-based access control (Owner/Contributor/Viewer)
- ✅ Service role key isolation
- ✅ Signed URLs for file access
- ✅ SHA-256 checksum verification
- ✅ HTTPS enforcement
- ✅ CORS configuration

### Production Recommendations
- ⚠️ Enable Supabase WAF
- ⚠️ Configure rate limiting
- ⚠️ Set up error monitoring (Sentry)
- ⚠️ Enable database backups
- ⚠️ Monitor activity logs
- ⚠️ Rotate secrets regularly

---

## 📊 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Database Queries | < 200ms | ✅ |
| Page Load | < 3s | ✅ |
| Real-time Updates | < 1s | ✅ |
| File Upload (50MB) | < 30s | ✅ |
| Concurrent Users | 100+ | ✅ |
| Monthly API Calls | 1M+ | ✅ |
| Storage | 1GB+ | ✅ |

---

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](./QUICK_START.md) | 15-minute setup |
| [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) | Complete integration |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Production ready |
| [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) | Verification |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | What's done |
| [supabase/README.md](./supabase/README.md) | Backend docs |

---

## 📞 Support

- **Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Next.js](https://nextjs.org) - React framework
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Tailwind CSS](https://tailwindcss.com) - Utility CSS
- [CrossRef](https://crossref.org) - Citation metadata

---

## 📈 Roadmap

### Phase 1: MVP (Current)
- [x] Vault management
- [x] Source management with auto-citation
- [x] Annotations
- [x] File management
- [x] Real-time collaboration
- [x] Activity logging

### Phase 2: Enhancement
- [ ] Advanced search
- [ ] Citation export (BibTeX, JSON)
- [ ] Email notifications
- [ ] User profiles
- [ ] Advanced filtering

### Phase 3: Scale
- [ ] Mobile app
- [ ] Offline mode
- [ ] Analytics dashboard
- [ ] Team workspaces
- [ ] API for integrations

### Phase 4: Enterprise
- [ ] Single sign-on (SSO)
- [ ] Advanced security
- [ ] Data residency options
- [ ] Compliance certifications
- [ ] Premium support

---

**Status**: ✅ Backend complete | Ready for integration  
**Version**: 1.0.0  
**Last Updated**: February 14, 2026

---

**Start building with [QUICK_START.md](./QUICK_START.md)** 🚀
