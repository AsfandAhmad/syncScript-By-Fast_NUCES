# 🚀 SyncScript — Collaborative Knowledge Vault for Researchers

> GitHub for academic research — a secure, real-time, citation-aware platform for storing, annotating, and sharing research materials.

---

# 📌 Project Overview

SyncScript is a web application designed to solve the fragmentation problem researchers face when collaborating on academic work. Currently, researchers juggle multiple disconnected tools:

- **Google Docs** for writing papers, but lacks version control and structured citations.  
- **GitHub** for versioning code but is not tailored for academic research artifacts like PDFs or citations.  
- **Zotero / Mendeley** for citation management, but poor integration with live collaboration or PDFs.  
- **Email / Drive** for sharing files, which becomes chaotic with multiple collaborators.  
- **Local PDFs** stored on personal devices, leading to duplication and loss of traceability.

**SyncScript consolidates all these workflows into one secure, centralized, real-time platform** with structured annotations, citation management, role-based access control, and immutable activity logs.

---

# 1️⃣ Executive Summary

SyncScript enables researchers to:

- **Create private or shared vaults** to organize research materials.  
- **Upload PDFs securely** into private storage with immutable metadata.  
- **Annotate PDFs collaboratively** with real-time updates visible to all members.  
- **Add sources and auto-generate citations** in APA, MLA, and BibTeX formats.  
- **Track every action** through immutable activity logs.  
- **Collaborate in real time**, with conflict handling and optimistic UI updates.  
- **Export citations** for integration into papers.  

The system is **hackathon-optimized**, built with fully free-tier services to allow rapid deployment without cost.

---

# 2️⃣ Problem Statement

Researchers currently face:

- Fragmented tools for writing, collaboration, and versioning.  
- No structured version control for PDFs or research artifacts.  
- Lack of collaborative annotation and real-time updates.  
- Manual and error-prone citation management.  
- No centralized, traceable repository for research materials.  
- Difficulty in sharing research securely with collaborators.  

There is no **GitHub-style workflow for academic research materials**.

---

# 3️⃣ Vision & Goals

## Vision

To become the **GitHub for academic research**, where knowledge is structured, traceable, and collaborative.

## Primary Goals (MVP)

- Enable users to create **research vaults** to organize projects.  
- Allow **secure PDF upload and storage** with immutable metadata.  
- Provide **real-time collaborative annotation** on PDFs.  
- **Auto-generate citations** from DOI or URL automatically.  
- Maintain **role-based access control** for vault members.  
- **Track all actions** in immutable activity logs.  
- Enable **citation export** for integration with papers.

---

# 4️⃣ Target Users

- **Research Students**: Collaboration on theses, project papers, group assignments.  
- **Academic Authors**: Centralized citation and research material management.  
- **Research Teams**: Traceable contributions, shared vaults, activity history.

---

# 5️⃣ Scope Definition

## In Scope (Hackathon MVP)

- Authentication and session management.  
- Vault creation and management.  
- Role assignment (Owner, Contributor, Viewer).  
- PDF file upload and storage.  
- Collaborative annotation system.  
- Source management and auto-citation.  
- Real-time collaboration updates.  
- Immutable activity logging.  
- Citation export (APA / BibTeX).  
- Deployment to free-tier platforms (Vercel + Supabase).

## Out of Scope (Future Enhancements)

- AI-powered summarization of research.  
- Semantic search across vaults.  
- Version diff viewer for PDF or annotations.  
- LaTeX editor integration.  
- Offline sync functionality.

---

# 6️⃣ Tech Stack

**Frontend:**

- Next.js (React-based framework for fast, SEO-friendly pages)  
- Tailwind CSS for rapid, responsive UI  
- Supabase JS SDK to communicate with backend services  

**Backend / Serverless Platform:**

- Supabase (PostgreSQL database with Row Level Security)  
- JWT-based authentication  
- Storage for PDFs (private buckets)  
- Realtime updates via WebSockets  
- Edge Functions for auto-citation (fetching metadata from CrossRef and formatting via citation-js)  

**Deployment:**

- Frontend: Vercel (free tier)  
- Backend: Supabase managed services (DB + storage + Realtime)  

**Cost:** Fully free-tier deployment for hackathon-ready MVP.

---

# 7️⃣ System Architecture (Descriptive)

The architecture is **serverless, secure, and optimized for hackathon speed**:

1. **User Interaction:** Users log in via Next.js frontend, authenticate using Supabase Auth (JWT).  
2. **Vault Operations:** Users create vaults, invite members, and manage roles. All vault access is checked at the **database layer via Row Level Security (RLS)**.  
3. **PDF Uploads:** Files are uploaded to Supabase Storage in a private bucket. Signed URLs provide secure access. Each file has **immutable metadata** (version, hash).  
4. **Annotations:** Users annotate PDFs. Annotations are linked to file ID and position metadata. Real-time updates are propagated to all connected collaborators.  
5. **Sources & Citations:** Users can add DOI/URL sources. Edge Functions fetch metadata from CrossRef and generate structured APA/MLA/BibTeX citations.  
6. **Realtime Collaboration:** Supabase Realtime channels notify all subscribed clients of changes to vaults, annotations, sources, and member roles.  
7. **Activity Logging:** Every user action is recorded in immutable logs for audit and traceability.  

**Key Features:**  
- Fully free-tier stack.  
- No server maintenance.  
- All security enforced at the database layer.  
- Minimal DevOps, hackathon-ready workflow.  

---

# 8️⃣ Functional Requirements

**Authentication**

- Email/password login, persistent sessions, secure logout.  

**Vault Management**

- Create, edit, delete vaults (owner only)  
- Invite members, assign roles  
- List all vaults for the user  

**Role-Based Access Control (RBAC)**

| Role        | Permissions |
|------------|------------|
| Owner       | Full control |
| Contributor | Add/edit files, annotations, sources |
| Viewer      | Read-only |

**File Management**

- PDF upload, private storage, signed URL access  
- Immutable metadata: version number, file hash  

**Annotation System**

- Add/edit/delete annotations based on role  
- Store page number, text, position JSON  
- Real-time propagation  

**Source & Citation Management**

- Add DOI/URL sources  
- Fetch metadata using Edge Functions  
- Generate structured APA, MLA, BibTeX citations  

**Real-Time Updates**

- Triggered by annotations, file uploads, source additions, member changes  
- All active users subscribed receive immediate updates  

**Activity Logs (Immutable)**

- Record actor ID, action type, metadata, timestamp  
- No updates or deletions allowed  

**Export Functionality**

- Export citations as BibTeX, APA, or JSON  

---

# 9️⃣ Database Design

**Tables:**  

- `users` — user profiles  
- `vaults` — metadata about vaults  
- `vault_members` — links users to vaults with roles  
- `files` — PDFs with version, hash, and vault reference  
- `annotations` — linked to files and users  
- `sources` — DOI/URL references  
- `activity_logs` — immutable log of all actions  

**Constraints and Security:**

- Foreign keys for data integrity  
- Unique vault-member pairs  
- Role validation constraints  
- Indexed vault_id and file_id  
- RLS policies enforce security at the database level  

---

# 🔟 Real-Time Collaboration Strategy

- Supabase Realtime WebSocket channels propagate changes to all clients in a vault.  
- Optimistic UI ensures minimal latency updates.  
- Conflict resolution: last-write-wins with warning banner for stale data.  

---

# 1️⃣1️⃣ Security Model

- JWT authentication for all requests  
- Row Level Security ensures users only access allowed vaults/files  
- Private storage buckets with signed URL access  
- Immutable activity logs for traceability  

---

# 1️⃣2️⃣ Implementation Task Sequence

**Phase 1 — Setup**

- Create Supabase project, enable Auth, Realtime, storage bucket  
- Deploy database schema, configure RLS policies  

**Phase 2 — Authentication**

- Connect frontend to Supabase  
- Implement login/register UI  
- Protect dashboard routes  

**Phase 3 — Vault System**

- Create vault forms  
- Insert owner in `vault_members`  
- Display vaults in dashboard  

**Phase 4 — File Upload**

- Upload PDFs, store metadata, generate signed URL  
- Render PDF preview  

**Phase 5 — Annotation System**

- Create annotation UI  
- Insert annotations into DB  
- Subscribe to realtime channel  

**Phase 6 — Sources & Auto-Citation**

- Edge Function fetches metadata from CrossRef  
- Format citations using citation-js  
- Store structured citation in DB  
- Display in UI  

**Phase 7 — Activity Logs**

- Insert logs for every action  
- Render activity feed  

**Phase 8 — Export System**

- Generate BibTeX/APA/JSON  
- Enable download  

**Phase 9 — UI Polish**

- Role badges, toast notifications, loading/error states, empty states  

**Phase 10 — Deployment**

- Push frontend to GitHub  
- Deploy on Vercel, set env variables  
- Test RLS in production  
- Final QA  

---

# 1️⃣3️⃣ Testing Checklist

- Owner invites contributor  
- Contributor adds annotation  
- Viewer cannot edit  
- Real-time works across multiple browsers  
- Non-members blocked from PDF access  
- Activity logs recorded accurately  
- Export generates valid BibTeX  

---

# 1️⃣4️⃣ Deployment Plan

- **Frontend:** Vercel free tier  
- **Backend:** Supabase managed  
- Fully serverless, no maintenance required  

---

# 1️⃣5️⃣ Hackathon Evaluation Alignment

| Criteria        | How SyncScript Excels |
|---------------|--------------------|
| Innovation     | GitHub-style workflow for research |
| Technical Depth| RLS + Realtime implementation |
| Security       | Database-level enforcement |
| UX             | Clean, intuitive academic UI |
| Scalability    | Serverless architecture |
| Demo Impact    | Live collaboration and real-time updates |

---

# 1️⃣6️⃣ Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| RLS misconfiguration | Test all policies before production |
| Realtime sync issues | Use vault-specific channels |
| Free-tier limits | Optimize storage and usage |
| Time constraint | Focus on MVP features for hackathon |

---

# 1️⃣7️⃣ Future Roadmap

- AI-powered summaries and insights  
- Citation graph visualization  
- Research similarity detection  
- ORCID integration  
- Version diff viewer  
- Semantic search across vaults  

---

# 1️⃣8️⃣ Conclusion

SyncScript transforms academic collaboration into a:

- Secure  
- Real-time  
- Structured  
- Traceable  
- Deployable  

knowledge vault ecosystem.  
It unifies fragmented tools into **one platform designed for researchers**, making collaboration, annotation, citation, and sharing seamless.
