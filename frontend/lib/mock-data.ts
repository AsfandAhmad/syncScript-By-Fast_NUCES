import type {
  Vault,
  VaultFile,
  Annotation,
  Source,
  ActivityItem,
  VaultMember,
} from "./types"

export const currentUser: VaultMember = {
  id: "u1",
  name: "Dr. Jane Smith",
  email: "jane@university.edu",
  role: "owner",
  avatarFallback: "JS",
}

export const vaults: Vault[] = [
  {
    id: "v1",
    title: "Neural Network Architectures for NLP",
    description:
      "Systematic review of transformer-based models and their applications in natural language processing tasks.",
    members: [
      { id: "u1", name: "Dr. Jane Smith", email: "jane@uni.edu", role: "owner", avatarFallback: "JS" },
      { id: "u2", name: "Prof. Alan Turing", email: "alan@uni.edu", role: "editor", avatarFallback: "AT" },
      { id: "u3", name: "Dr. Maria Lopez", email: "maria@uni.edu", role: "reviewer", avatarFallback: "ML" },
    ],
    fileCount: 24,
    annotationCount: 87,
    lastActivity: "2 hours ago",
    status: "active",
  },
  {
    id: "v2",
    title: "Climate Impact on Marine Biodiversity",
    description:
      "Multi-year study analyzing the effects of rising ocean temperatures on coral reef ecosystems.",
    members: [
      { id: "u1", name: "Dr. Jane Smith", email: "jane@uni.edu", role: "editor", avatarFallback: "JS" },
      { id: "u4", name: "Dr. Wei Zhang", email: "wei@uni.edu", role: "owner", avatarFallback: "WZ" },
    ],
    fileCount: 18,
    annotationCount: 42,
    lastActivity: "5 hours ago",
    status: "active",
  },
  {
    id: "v3",
    title: "Quantum Computing Error Correction",
    description:
      "Research into fault-tolerant quantum computing methods using surface codes and topological approaches.",
    members: [
      { id: "u1", name: "Dr. Jane Smith", email: "jane@uni.edu", role: "reviewer", avatarFallback: "JS" },
      { id: "u5", name: "Dr. Priya Patel", email: "priya@uni.edu", role: "owner", avatarFallback: "PP" },
      { id: "u6", name: "Dr. Tomás Ruiz", email: "tomas@uni.edu", role: "editor", avatarFallback: "TR" },
      { id: "u7", name: "Li Chen", email: "li@uni.edu", role: "viewer", avatarFallback: "LC" },
    ],
    fileCount: 31,
    annotationCount: 106,
    lastActivity: "1 day ago",
    status: "active",
  },
  {
    id: "v4",
    title: "Ethics in AI-Assisted Diagnostics",
    description:
      "Examining ethical frameworks for deploying machine learning models in clinical decision support systems.",
    members: [
      { id: "u1", name: "Dr. Jane Smith", email: "jane@uni.edu", role: "owner", avatarFallback: "JS" },
      { id: "u8", name: "Dr. Amara Obi", email: "amara@uni.edu", role: "editor", avatarFallback: "AO" },
    ],
    fileCount: 12,
    annotationCount: 28,
    lastActivity: "3 days ago",
    status: "active",
  },
  {
    id: "v5",
    title: "Historical Linguistics Dataset (Archived)",
    description:
      "Archived project on Proto-Indo-European phonological reconstruction.",
    members: [
      { id: "u1", name: "Dr. Jane Smith", email: "jane@uni.edu", role: "viewer", avatarFallback: "JS" },
    ],
    fileCount: 8,
    annotationCount: 15,
    lastActivity: "2 months ago",
    status: "archived",
  },
]

export const vaultFiles: VaultFile[] = [
  { id: "f1", name: "transformer_survey_v3.pdf", type: "pdf", size: "4.2 MB", uploadedBy: "Dr. Jane Smith", uploadedAt: "2 hours ago" },
  { id: "f2", name: "attention_mechanisms.pdf", type: "pdf", size: "2.8 MB", uploadedBy: "Prof. Alan Turing", uploadedAt: "5 hours ago" },
  { id: "f3", name: "benchmark_results.csv", type: "csv", size: "1.1 MB", uploadedBy: "Dr. Maria Lopez", uploadedAt: "1 day ago" },
  { id: "f4", name: "methodology_draft.docx", type: "docx", size: "890 KB", uploadedBy: "Dr. Jane Smith", uploadedAt: "2 days ago" },
  { id: "f5", name: "bert_analysis.pdf", type: "pdf", size: "3.5 MB", uploadedBy: "Prof. Alan Turing", uploadedAt: "3 days ago" },
  { id: "f6", name: "figure_comparisons.pdf", type: "pdf", size: "6.1 MB", uploadedBy: "Dr. Maria Lopez", uploadedAt: "4 days ago" },
  { id: "f7", name: "related_work_notes.docx", type: "docx", size: "420 KB", uploadedBy: "Dr. Jane Smith", uploadedAt: "1 week ago" },
]

export const annotations: Annotation[] = [
  {
    id: "a1",
    author: "Dr. Jane Smith",
    authorRole: "owner",
    avatarFallback: "JS",
    content: "This section on multi-head attention needs stronger empirical backing. Consider adding the ablation study from Table 3.",
    page: 4,
    timestamp: "10 min ago",
    highlight: "Multi-head attention allows the model to jointly attend to information from different representation subspaces.",
  },
  {
    id: "a2",
    author: "Prof. Alan Turing",
    authorRole: "editor",
    avatarFallback: "AT",
    content: "Agreed. I have also flagged the computational complexity claims on page 7 for review.",
    page: 4,
    timestamp: "25 min ago",
  },
  {
    id: "a3",
    author: "Dr. Maria Lopez",
    authorRole: "reviewer",
    avatarFallback: "ML",
    content: "The comparison with LSTM baselines in Table 2 looks solid, but we should note the different training data sizes.",
    page: 8,
    timestamp: "1 hour ago",
    highlight: "Our transformer model achieves a BLEU score of 28.4, compared to 25.1 for the BiLSTM baseline.",
  },
  {
    id: "a4",
    author: "Dr. Jane Smith",
    authorRole: "owner",
    avatarFallback: "JS",
    content: "Updated the abstract to reflect the latest results. Please review before submission.",
    page: 1,
    timestamp: "3 hours ago",
  },
]

export const sources: Source[] = [
  {
    id: "s1",
    title: "Attention Is All You Need",
    authors: "Vaswani, A., Shazeer, N., Parmar, N., et al.",
    journal: "Advances in Neural Information Processing Systems",
    year: "2017",
    doi: "10.48550/arXiv.1706.03762",
    format: "APA",
  },
  {
    id: "s2",
    title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    authors: "Devlin, J., Chang, M., Lee, K., Toutanova, K.",
    journal: "Proceedings of NAACL-HLT",
    year: "2019",
    doi: "10.18653/v1/N19-1423",
    format: "APA",
  },
  {
    id: "s3",
    title: "Language Models are Few-Shot Learners",
    authors: "Brown, T., Mann, B., Ryder, N., et al.",
    journal: "Advances in Neural Information Processing Systems",
    year: "2020",
    doi: "10.48550/arXiv.2005.14165",
    format: "APA",
  },
  {
    id: "s4",
    title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale",
    authors: "Dosovitskiy, A., Beyer, L., Kolesnikov, A., et al.",
    journal: "International Conference on Learning Representations",
    year: "2021",
    doi: "10.48550/arXiv.2010.11929",
    format: "APA",
  },
  {
    id: "s5",
    title: "Scaling Laws for Neural Language Models",
    authors: "Kaplan, J., McCandlish, S., Henighan, T., et al.",
    journal: "arXiv preprint",
    year: "2020",
    doi: "10.48550/arXiv.2001.08361",
    format: "APA",
  },
]

export const activityItems: ActivityItem[] = [
  { id: "act1", user: "Dr. Jane Smith", avatarFallback: "JS", action: "added an annotation on", target: "transformer_survey_v3.pdf (p.4)", timestamp: "10 min ago", type: "annotation" },
  { id: "act2", user: "Prof. Alan Turing", avatarFallback: "AT", action: "replied to annotation on", target: "transformer_survey_v3.pdf (p.4)", timestamp: "25 min ago", type: "comment" },
  { id: "act3", user: "Dr. Jane Smith", avatarFallback: "JS", action: "uploaded", target: "transformer_survey_v3.pdf", timestamp: "2 hours ago", type: "upload" },
  { id: "act4", user: "Dr. Maria Lopez", avatarFallback: "ML", action: "added an annotation on", target: "transformer_survey_v3.pdf (p.8)", timestamp: "1 hour ago", type: "annotation" },
  { id: "act5", user: "Prof. Alan Turing", avatarFallback: "AT", action: "uploaded", target: "attention_mechanisms.pdf", timestamp: "5 hours ago", type: "upload" },
  { id: "act6", user: "Dr. Jane Smith", avatarFallback: "JS", action: "added citation", target: "Vaswani et al. (2017)", timestamp: "6 hours ago", type: "citation" },
  { id: "act7", user: "Dr. Maria Lopez", avatarFallback: "ML", action: "uploaded", target: "benchmark_results.csv", timestamp: "1 day ago", type: "upload" },
  { id: "act8", user: "Dr. Jane Smith", avatarFallback: "JS", action: "invited", target: "Dr. Maria Lopez as Reviewer", timestamp: "2 days ago", type: "member" },
]
