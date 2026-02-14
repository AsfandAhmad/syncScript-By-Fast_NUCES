export type Role = "owner" | "editor" | "reviewer" | "viewer"

export interface VaultMember {
  id: string
  name: string
  email: string
  role: Role
  avatarFallback: string
}

export interface VaultFile {
  id: string
  name: string
  type: "pdf" | "docx" | "csv" | "image" | "other"
  size: string
  uploadedBy: string
  uploadedAt: string
}

export interface Annotation {
  id: string
  author: string
  authorRole: Role
  avatarFallback: string
  content: string
  page: number
  timestamp: string
  highlight?: string
}

export interface Source {
  id: string
  title: string
  authors: string
  journal: string
  year: string
  doi: string
  format: "APA" | "MLA" | "Chicago"
}

export interface ActivityItem {
  id: string
  user: string
  avatarFallback: string
  action: string
  target: string
  timestamp: string
  type: "upload" | "annotation" | "comment" | "edit" | "member" | "citation"
}

export interface Vault {
  id: string
  title: string
  description: string
  members: VaultMember[]
  fileCount: number
  annotationCount: number
  lastActivity: string
  status: "active" | "archived"
}
