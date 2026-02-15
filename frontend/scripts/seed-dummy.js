const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ntzetlkjlmpyqdezpuau.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50emV0bGtqbG1weXFkZXpwdWF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk5OTU2OCwiZXhwIjoyMDg2NTc1NTY4fQ.3hbSL554QR-WzSVWPT-uhEBnFvfcMAAKaqtAk5zNjs0'
);

// Existing users (exact UUIDs from Supabase auth)
const users = {
  asad:    'f550da58-ded1-4c3f-95b9-45f619338a97',
  taha_r:  '2192d33a-ff82-415b-95b1-7b2c8b64f98c',
  raza:    '93f4f06f-db07-469b-ab13-d0e1ae098fb9',
  taha:    'e8e90c75-28b1-4c0e-99f2-abcbaa21d25a',
  eve:     '8a6b8b64-bf29-45bd-a54e-fd0ba2ee77f3',
  diana:   '12dece2d-3bc4-4a7b-93e0-fbd5d665ac1d',
  charlie: '181675c1-26e2-4d9b-bafd-61f4e8103af1',
  bob:     '82c12b99-b3da-4a24-ba84-10f24b24a89d',
  alice:   'f216f525-88b2-4710-86e4-00792e9adc5b',
  asad2:   'e0083723-c100-4b84-8b97-39569008cbb7',
  asfand:  '14ae4c2e-1bd2-470e-ad76-12b7bcf9e2ed',
  user2:   '5c3d2cc0-4455-42f1-ba0d-8aa5e6aa901b',
  testuser:'f0aecca7-a84b-4bf0-8b7e-e39918ffab40',
  user1:   '064736ef-0e58-4783-b59f-3b185a5504d9',
  asfand2: '1faa8a16-aa83-4065-8efb-64836a586843',
};

// ── NEW VAULTS ──────────────────────────────────────────────
const newVaults = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    name: 'Deep Learning Fundamentals',
    description: 'Comprehensive collection of deep learning research papers, lecture notes, and implementations covering CNNs, RNNs, Transformers, and GANs.',
    owner_id: users.asfand,
    is_public: true,
    is_archived: false,
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    name: 'Software Engineering Best Practices',
    description: 'Design patterns, clean code principles, CI/CD pipelines, and agile methodologies for modern software development teams.',
    owner_id: users.asad,
    is_public: true,
    is_archived: false,
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    name: 'Natural Language Processing',
    description: 'NLP research including BERT, GPT architectures, sentiment analysis, named entity recognition, and text generation techniques.',
    owner_id: users.taha,
    is_public: true,
    is_archived: false,
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    name: 'Cloud Computing & DevOps',
    description: 'AWS, Azure, GCP architectures, Kubernetes orchestration, Terraform IaC, and microservices deployment strategies.',
    owner_id: users.bob,
    is_public: true,
    is_archived: false,
  },
  {
    id: '20000000-0000-0000-0000-000000000005',
    name: 'Cybersecurity Research',
    description: 'Penetration testing methodologies, zero-day vulnerability analysis, cryptographic protocols, and network security frameworks.',
    owner_id: users.diana,
    is_public: true,
    is_archived: false,
  },
  {
    id: '20000000-0000-0000-0000-000000000006',
    name: 'Data Science Portfolio',
    description: 'End-to-end data science projects including EDA, feature engineering, model training, and deployment with real-world datasets.',
    owner_id: users.eve,
    is_public: true,
    is_archived: false,
  },
  {
    id: '20000000-0000-0000-0000-000000000007',
    name: 'Computer Vision Lab',
    description: 'Object detection, image segmentation, pose estimation, and visual SLAM research papers and implementation notebooks.',
    owner_id: users.charlie,
    is_public: true,
    is_archived: false,
  },
  {
    id: '20000000-0000-0000-0000-000000000008',
    name: 'Database Systems Design',
    description: 'Relational and NoSQL database internals, query optimization, indexing strategies, distributed transactions, and CAP theorem analysis.',
    owner_id: users.taha_r,
    is_public: true,
    is_archived: false,
  },
  {
    id: '20000000-0000-0000-0000-000000000009',
    name: 'Blockchain & Web3 Development',
    description: 'Smart contract development, DeFi protocols, consensus mechanisms, Solidity patterns, and decentralized application architectures.',
    owner_id: users.raza,
    is_public: true,
    is_archived: false,
  },
  {
    id: '20000000-0000-0000-0000-000000000010',
    name: 'Human-Computer Interaction',
    description: 'UX research methods, accessibility standards, user testing frameworks, cognitive load theory, and interface design heuristics.',
    owner_id: users.alice,
    is_public: true,
    is_archived: false,
  },
];

// ── VAULT MEMBERS ───────────────────────────────────────────
const newMembers = [
  // Deep Learning vault - owner + 4 members
  { vault_id: '20000000-0000-0000-0000-000000000001', user_id: users.asfand, role: 'owner' },
  { vault_id: '20000000-0000-0000-0000-000000000001', user_id: users.taha, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000001', user_id: users.bob, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000001', user_id: users.alice, role: 'viewer' },
  { vault_id: '20000000-0000-0000-0000-000000000001', user_id: users.asad, role: 'viewer' },

  // Software Engineering vault
  { vault_id: '20000000-0000-0000-0000-000000000002', user_id: users.asad, role: 'owner' },
  { vault_id: '20000000-0000-0000-0000-000000000002', user_id: users.asfand, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000002', user_id: users.charlie, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000002', user_id: users.diana, role: 'viewer' },

  // NLP vault
  { vault_id: '20000000-0000-0000-0000-000000000003', user_id: users.taha, role: 'owner' },
  { vault_id: '20000000-0000-0000-0000-000000000003', user_id: users.asfand, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000003', user_id: users.eve, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000003', user_id: users.asad, role: 'viewer' },
  { vault_id: '20000000-0000-0000-0000-000000000003', user_id: users.raza, role: 'viewer' },

  // Cloud Computing vault
  { vault_id: '20000000-0000-0000-0000-000000000004', user_id: users.bob, role: 'owner' },
  { vault_id: '20000000-0000-0000-0000-000000000004', user_id: users.asad, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000004', user_id: users.taha_r, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000004', user_id: users.diana, role: 'viewer' },

  // Cybersecurity vault
  { vault_id: '20000000-0000-0000-0000-000000000005', user_id: users.diana, role: 'owner' },
  { vault_id: '20000000-0000-0000-0000-000000000005', user_id: users.charlie, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000005', user_id: users.bob, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000005', user_id: users.raza, role: 'viewer' },

  // Data Science vault
  { vault_id: '20000000-0000-0000-0000-000000000006', user_id: users.eve, role: 'owner' },
  { vault_id: '20000000-0000-0000-0000-000000000006', user_id: users.alice, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000006', user_id: users.taha, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000006', user_id: users.asfand, role: 'viewer' },

  // Computer Vision vault
  { vault_id: '20000000-0000-0000-0000-000000000007', user_id: users.charlie, role: 'owner' },
  { vault_id: '20000000-0000-0000-0000-000000000007', user_id: users.asfand, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000007', user_id: users.eve, role: 'viewer' },
  { vault_id: '20000000-0000-0000-0000-000000000007', user_id: users.taha, role: 'viewer' },

  // Database Systems vault
  { vault_id: '20000000-0000-0000-0000-000000000008', user_id: users.taha_r, role: 'owner' },
  { vault_id: '20000000-0000-0000-0000-000000000008', user_id: users.bob, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000008', user_id: users.alice, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000008', user_id: users.asad, role: 'viewer' },

  // Blockchain vault
  { vault_id: '20000000-0000-0000-0000-000000000009', user_id: users.raza, role: 'owner' },
  { vault_id: '20000000-0000-0000-0000-000000000009', user_id: users.diana, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000009', user_id: users.taha_r, role: 'viewer' },

  // HCI vault
  { vault_id: '20000000-0000-0000-0000-000000000010', user_id: users.alice, role: 'owner' },
  { vault_id: '20000000-0000-0000-0000-000000000010', user_id: users.eve, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000010', user_id: users.diana, role: 'contributor' },
  { vault_id: '20000000-0000-0000-0000-000000000010', user_id: users.charlie, role: 'viewer' },
];

// ── SOURCES ─────────────────────────────────────────────────
const newSources = [
  // Deep Learning vault
  { vault_id: '20000000-0000-0000-0000-000000000001', url: 'https://arxiv.org/abs/1706.03762', title: 'Attention Is All You Need (2017)', metadata: { author: 'Vaswani et al.', year: 2017, type: 'paper' }, created_by: users.asfand },
  { vault_id: '20000000-0000-0000-0000-000000000001', url: 'https://arxiv.org/abs/1512.03385', title: 'Deep Residual Learning for Image Recognition', metadata: { author: 'He et al.', year: 2015, type: 'paper' }, created_by: users.taha },
  { vault_id: '20000000-0000-0000-0000-000000000001', url: 'https://arxiv.org/abs/1406.2661', title: 'Generative Adversarial Networks', metadata: { author: 'Goodfellow et al.', year: 2014, type: 'paper' }, created_by: users.asfand },
  { vault_id: '20000000-0000-0000-0000-000000000001', url: 'https://cs231n.stanford.edu/', title: 'Stanford CS231n: CNNs for Visual Recognition', metadata: { type: 'course' }, created_by: users.bob },

  // Software Engineering vault
  { vault_id: '20000000-0000-0000-0000-000000000002', url: 'https://refactoring.guru/design-patterns', title: 'Design Patterns - Refactoring Guru', metadata: { type: 'reference' }, created_by: users.asad },
  { vault_id: '20000000-0000-0000-0000-000000000002', url: 'https://martinfowler.com/articles/microservices.html', title: 'Microservices Architecture by Martin Fowler', metadata: { author: 'Martin Fowler', type: 'article' }, created_by: users.asfand },
  { vault_id: '20000000-0000-0000-0000-000000000002', url: 'https://12factor.net/', title: 'The Twelve-Factor App', metadata: { type: 'methodology' }, created_by: users.asad },
  { vault_id: '20000000-0000-0000-0000-000000000002', url: 'https://semver.org/', title: 'Semantic Versioning 2.0.0', metadata: { type: 'standard' }, created_by: users.charlie },

  // NLP vault
  { vault_id: '20000000-0000-0000-0000-000000000003', url: 'https://arxiv.org/abs/1810.04805', title: 'BERT: Pre-training of Deep Bidirectional Transformers', metadata: { author: 'Devlin et al.', year: 2018, type: 'paper' }, created_by: users.taha },
  { vault_id: '20000000-0000-0000-0000-000000000003', url: 'https://arxiv.org/abs/2005.14165', title: 'Language Models are Few-Shot Learners (GPT-3)', metadata: { author: 'Brown et al.', year: 2020, type: 'paper' }, created_by: users.asfand },
  { vault_id: '20000000-0000-0000-0000-000000000003', url: 'https://huggingface.co/docs/transformers', title: 'HuggingFace Transformers Documentation', metadata: { type: 'documentation' }, created_by: users.eve },
  { vault_id: '20000000-0000-0000-0000-000000000003', url: 'https://arxiv.org/abs/2302.13971', title: 'LLaMA: Open and Efficient Foundation Language Models', metadata: { author: 'Touvron et al.', year: 2023, type: 'paper' }, created_by: users.taha },

  // Cloud Computing vault
  { vault_id: '20000000-0000-0000-0000-000000000004', url: 'https://kubernetes.io/docs/', title: 'Kubernetes Official Documentation', metadata: { type: 'documentation' }, created_by: users.bob },
  { vault_id: '20000000-0000-0000-0000-000000000004', url: 'https://www.terraform.io/docs', title: 'Terraform by HashiCorp - IaC Guide', metadata: { type: 'documentation' }, created_by: users.asad },
  { vault_id: '20000000-0000-0000-0000-000000000004', url: 'https://aws.amazon.com/architecture/well-architected/', title: 'AWS Well-Architected Framework', metadata: { type: 'framework' }, created_by: users.taha_r },

  // Cybersecurity vault
  { vault_id: '20000000-0000-0000-0000-000000000005', url: 'https://owasp.org/www-project-top-ten/', title: 'OWASP Top 10 Web Security Risks', metadata: { type: 'standard', year: 2021 }, created_by: users.diana },
  { vault_id: '20000000-0000-0000-0000-000000000005', url: 'https://attack.mitre.org/', title: 'MITRE ATT&CK Framework', metadata: { type: 'framework' }, created_by: users.charlie },
  { vault_id: '20000000-0000-0000-0000-000000000005', url: 'https://nvd.nist.gov/', title: 'National Vulnerability Database (NVD)', metadata: { type: 'database' }, created_by: users.diana },
  { vault_id: '20000000-0000-0000-0000-000000000005', url: 'https://arxiv.org/abs/2301.04321', title: 'A Survey on Zero-Day Vulnerability Detection', metadata: { type: 'paper', year: 2023 }, created_by: users.bob },

  // Data Science vault
  { vault_id: '20000000-0000-0000-0000-000000000006', url: 'https://kaggle.com/competitions', title: 'Kaggle Competition Strategies & Solutions', metadata: { type: 'resource' }, created_by: users.eve },
  { vault_id: '20000000-0000-0000-0000-000000000006', url: 'https://pandas.pydata.org/docs/', title: 'Pandas Documentation - Data Manipulation', metadata: { type: 'documentation' }, created_by: users.alice },
  { vault_id: '20000000-0000-0000-0000-000000000006', url: 'https://scikit-learn.org/stable/', title: 'Scikit-learn: Machine Learning in Python', metadata: { type: 'documentation' }, created_by: users.taha },

  // Computer Vision vault
  { vault_id: '20000000-0000-0000-0000-000000000007', url: 'https://arxiv.org/abs/1506.01497', title: 'Faster R-CNN: Real-Time Object Detection', metadata: { author: 'Ren et al.', year: 2015, type: 'paper' }, created_by: users.charlie },
  { vault_id: '20000000-0000-0000-0000-000000000007', url: 'https://arxiv.org/abs/2010.11929', title: 'An Image is Worth 16x16 Words: ViT', metadata: { author: 'Dosovitskiy et al.', year: 2020, type: 'paper' }, created_by: users.asfand },
  { vault_id: '20000000-0000-0000-0000-000000000007', url: 'https://arxiv.org/abs/1505.04597', title: 'U-Net: CNNs for Biomedical Image Segmentation', metadata: { author: 'Ronneberger et al.', year: 2015, type: 'paper' }, created_by: users.charlie },

  // Database Systems vault
  { vault_id: '20000000-0000-0000-0000-000000000008', url: 'https://use-the-index-luke.com/', title: 'Use The Index, Luke - SQL Indexing Guide', metadata: { type: 'tutorial' }, created_by: users.taha_r },
  { vault_id: '20000000-0000-0000-0000-000000000008', url: 'https://arxiv.org/abs/1201.0490', title: 'CAP Twelve Years Later: How the Rules Have Changed', metadata: { author: 'Eric Brewer', year: 2012, type: 'paper' }, created_by: users.bob },
  { vault_id: '20000000-0000-0000-0000-000000000008', url: 'https://www.postgresql.org/docs/current/mvcc.html', title: 'PostgreSQL MVCC Concurrency Control', metadata: { type: 'documentation' }, created_by: users.alice },

  // Blockchain vault
  { vault_id: '20000000-0000-0000-0000-000000000009', url: 'https://ethereum.org/en/developers/docs/', title: 'Ethereum Developer Documentation', metadata: { type: 'documentation' }, created_by: users.raza },
  { vault_id: '20000000-0000-0000-0000-000000000009', url: 'https://docs.soliditylang.org/', title: 'Solidity Language Documentation', metadata: { type: 'documentation' }, created_by: users.raza },
  { vault_id: '20000000-0000-0000-0000-000000000009', url: 'https://bitcoin.org/bitcoin.pdf', title: 'Bitcoin: A Peer-to-Peer Electronic Cash System', metadata: { author: 'Satoshi Nakamoto', year: 2008, type: 'paper' }, created_by: users.diana },

  // HCI vault
  { vault_id: '20000000-0000-0000-0000-000000000010', url: 'https://www.nngroup.com/articles/ten-usability-heuristics/', title: "Nielsen's 10 Usability Heuristics", metadata: { author: 'Jakob Nielsen', type: 'article' }, created_by: users.alice },
  { vault_id: '20000000-0000-0000-0000-000000000010', url: 'https://www.w3.org/WAI/WCAG21/quickref/', title: 'WCAG 2.1 Quick Reference - Accessibility', metadata: { type: 'standard' }, created_by: users.eve },
  { vault_id: '20000000-0000-0000-0000-000000000010', url: 'https://lawsofux.com/', title: 'Laws of UX - Design Psychology Principles', metadata: { type: 'resource' }, created_by: users.diana },
];

// ── FILES ───────────────────────────────────────────────────
const newFiles = [
  // Deep Learning vault
  { vault_id: '20000000-0000-0000-0000-000000000001', file_name: 'attention-is-all-you-need.pdf', file_url: 'vault-files/20000001/attention.pdf', file_size: 2145302, uploaded_by: users.asfand },
  { vault_id: '20000000-0000-0000-0000-000000000001', file_name: 'resnet-paper.pdf', file_url: 'vault-files/20000001/resnet.pdf', file_size: 1832456, uploaded_by: users.taha },
  { vault_id: '20000000-0000-0000-0000-000000000001', file_name: 'deep-learning-lecture-notes.pdf', file_url: 'vault-files/20000001/dl-notes.pdf', file_size: 4521000, uploaded_by: users.bob },
  { vault_id: '20000000-0000-0000-0000-000000000001', file_name: 'gan-tutorial-notebook.pdf', file_url: 'vault-files/20000001/gan-tutorial.pdf', file_size: 987654, uploaded_by: users.asfand },

  // Software Engineering vault
  { vault_id: '20000000-0000-0000-0000-000000000002', file_name: 'clean-code-summary.pdf', file_url: 'vault-files/20000002/clean-code.pdf', file_size: 1234567, uploaded_by: users.asad },
  { vault_id: '20000000-0000-0000-0000-000000000002', file_name: 'system-design-interview.pdf', file_url: 'vault-files/20000002/system-design.pdf', file_size: 3456789, uploaded_by: users.asfand },
  { vault_id: '20000000-0000-0000-0000-000000000002', file_name: 'ci-cd-pipeline-guide.pdf', file_url: 'vault-files/20000002/cicd.pdf', file_size: 876543, uploaded_by: users.charlie },

  // NLP vault
  { vault_id: '20000000-0000-0000-0000-000000000003', file_name: 'bert-paper-annotated.pdf', file_url: 'vault-files/20000003/bert.pdf', file_size: 1567890, uploaded_by: users.taha },
  { vault_id: '20000000-0000-0000-0000-000000000003', file_name: 'llm-survey-2024.pdf', file_url: 'vault-files/20000003/llm-survey.pdf', file_size: 5678901, uploaded_by: users.asfand },
  { vault_id: '20000000-0000-0000-0000-000000000003', file_name: 'tokenization-strategies.pdf', file_url: 'vault-files/20000003/tokenization.pdf', file_size: 432100, uploaded_by: users.eve },
  { vault_id: '20000000-0000-0000-0000-000000000003', file_name: 'prompt-engineering-guide.pdf', file_url: 'vault-files/20000003/prompt-eng.pdf', file_size: 234567, uploaded_by: users.taha },

  // Cloud Computing vault
  { vault_id: '20000000-0000-0000-0000-000000000004', file_name: 'kubernetes-architecture.pdf', file_url: 'vault-files/20000004/k8s-arch.pdf', file_size: 2345678, uploaded_by: users.bob },
  { vault_id: '20000000-0000-0000-0000-000000000004', file_name: 'terraform-best-practices.pdf', file_url: 'vault-files/20000004/terraform.pdf', file_size: 1456789, uploaded_by: users.asad },
  { vault_id: '20000000-0000-0000-0000-000000000004', file_name: 'aws-solutions-architect-notes.pdf', file_url: 'vault-files/20000004/aws-sa.pdf', file_size: 3890123, uploaded_by: users.taha_r },

  // Cybersecurity vault
  { vault_id: '20000000-0000-0000-0000-000000000005', file_name: 'owasp-testing-guide-v4.pdf', file_url: 'vault-files/20000005/owasp.pdf', file_size: 4567890, uploaded_by: users.diana },
  { vault_id: '20000000-0000-0000-0000-000000000005', file_name: 'penetration-testing-methodology.pdf', file_url: 'vault-files/20000005/pentest.pdf', file_size: 2678901, uploaded_by: users.charlie },
  { vault_id: '20000000-0000-0000-0000-000000000005', file_name: 'network-security-checklist.pdf', file_url: 'vault-files/20000005/net-sec.pdf', file_size: 345678, uploaded_by: users.bob },

  // Data Science vault
  { vault_id: '20000000-0000-0000-0000-000000000006', file_name: 'eda-titanic-dataset.pdf', file_url: 'vault-files/20000006/eda-titanic.pdf', file_size: 1789012, uploaded_by: users.eve },
  { vault_id: '20000000-0000-0000-0000-000000000006', file_name: 'feature-engineering-handbook.pdf', file_url: 'vault-files/20000006/feature-eng.pdf', file_size: 2890123, uploaded_by: users.alice },
  { vault_id: '20000000-0000-0000-0000-000000000006', file_name: 'statistical-analysis-notes.pdf', file_url: 'vault-files/20000006/stats-notes.pdf', file_size: 1234000, uploaded_by: users.taha },

  // Computer Vision vault
  { vault_id: '20000000-0000-0000-0000-000000000007', file_name: 'faster-rcnn-implementation.pdf', file_url: 'vault-files/20000007/faster-rcnn.pdf', file_size: 2345000, uploaded_by: users.charlie },
  { vault_id: '20000000-0000-0000-0000-000000000007', file_name: 'yolov8-comparison-study.pdf', file_url: 'vault-files/20000007/yolov8.pdf', file_size: 1567000, uploaded_by: users.asfand },
  { vault_id: '20000000-0000-0000-0000-000000000007', file_name: 'image-augmentation-techniques.pdf', file_url: 'vault-files/20000007/augmentation.pdf', file_size: 890123, uploaded_by: users.charlie },

  // Database Systems vault
  { vault_id: '20000000-0000-0000-0000-000000000008', file_name: 'database-internals-notes.pdf', file_url: 'vault-files/20000008/db-internals.pdf', file_size: 3456000, uploaded_by: users.taha_r },
  { vault_id: '20000000-0000-0000-0000-000000000008', file_name: 'query-optimization-guide.pdf', file_url: 'vault-files/20000008/query-opt.pdf', file_size: 1678000, uploaded_by: users.bob },

  // Blockchain vault
  { vault_id: '20000000-0000-0000-0000-000000000009', file_name: 'ethereum-whitepaper.pdf', file_url: 'vault-files/20000009/eth-whitepaper.pdf', file_size: 2345678, uploaded_by: users.raza },
  { vault_id: '20000000-0000-0000-0000-000000000009', file_name: 'smart-contract-security-audit.pdf', file_url: 'vault-files/20000009/sc-audit.pdf', file_size: 1890123, uploaded_by: users.diana },

  // HCI vault
  { vault_id: '20000000-0000-0000-0000-000000000010', file_name: 'ux-research-methods.pdf', file_url: 'vault-files/20000010/ux-methods.pdf', file_size: 2123456, uploaded_by: users.alice },
  { vault_id: '20000000-0000-0000-0000-000000000010', file_name: 'accessibility-audit-report.pdf', file_url: 'vault-files/20000010/a11y-audit.pdf', file_size: 1345678, uploaded_by: users.eve },
  { vault_id: '20000000-0000-0000-0000-000000000010', file_name: 'cognitive-load-theory.pdf', file_url: 'vault-files/20000010/cog-load.pdf', file_size: 987654, uploaded_by: users.diana },
];

// ── ANNOTATIONS (will reference inserted source IDs) ────────
// We'll create annotations after sources are inserted

function makeAnnotations(sourceRows) {
  // Map sources by title for easy lookup
  const byTitle = {};
  sourceRows.forEach(s => { byTitle[s.title] = s.id; });

  return [
    // Deep Learning
    { source_id: byTitle['Attention Is All You Need (2017)'], content: 'The self-attention mechanism computes compatibility between all pairs of positions in a sequence. Key insight: attention weights allow the model to focus on relevant parts regardless of distance. Multi-head attention projects queries, keys, and values into different subspaces.', created_by: users.asfand },
    { source_id: byTitle['Deep Residual Learning for Image Recognition'], content: 'Skip connections solve the vanishing gradient problem in very deep networks. ResNet-152 achieves 3.57% top-5 error on ImageNet. The residual learning framework lets layers learn residual functions F(x) = H(x) - x rather than the full mapping H(x).', created_by: users.taha },
    { source_id: byTitle['Generative Adversarial Networks'], content: 'Two-player minimax game: Generator G tries to produce realistic samples while Discriminator D tries to distinguish real from fake. Training instability is a known challenge - techniques like Wasserstein loss and spectral normalization help.', created_by: users.asfand },
    { source_id: byTitle['Stanford CS231n: CNNs for Visual Recognition'], content: 'Lecture 5 on backpropagation is particularly insightful. The computational graph approach makes gradient computation intuitive. Batch normalization (Lecture 7) is essential for training deep networks efficiently.', created_by: users.bob },

    // Software Engineering
    { source_id: byTitle['Design Patterns - Refactoring Guru'], content: 'The Strategy pattern is especially useful in our current project for swapping authentication providers. Observer pattern maps well to our real-time notification system. Consider using Factory Method for creating different vault types.', created_by: users.asad },
    { source_id: byTitle['Microservices Architecture by Martin Fowler'], content: 'Key takeaway: start with a monolith and extract microservices only when clear boundaries emerge. The "distributed monolith" anti-pattern occurs when services are tightly coupled. Our API gateway should handle cross-cutting concerns.', created_by: users.asfand },
    { source_id: byTitle['The Twelve-Factor App'], content: 'Factor III (Config) - store config in environment variables, not in code. Factor VI (Processes) - execute the app as stateless processes. Factor XI (Logs) - treat logs as event streams. All directly applicable to our Supabase + Next.js architecture.', created_by: users.asad },

    // NLP
    { source_id: byTitle['BERT: Pre-training of Deep Bidirectional Transformers'], content: 'Masked Language Modeling (MLM) randomly masks 15% of tokens and predicts them. Next Sentence Prediction (NSP) was later found to be less important. Fine-tuning on downstream tasks requires minimal architecture changes - just add a classification head.', created_by: users.taha },
    { source_id: byTitle['Language Models are Few-Shot Learners (GPT-3)'], content: '175 billion parameters trained on ~300B tokens. In-context learning emerges at scale without gradient updates. Few-shot performance approaches fine-tuned models on many benchmarks. The scaling laws paper (Kaplan et al.) predicted this.', created_by: users.asfand },
    { source_id: byTitle['HuggingFace Transformers Documentation'], content: 'The pipeline API makes it trivial to use pre-trained models. AutoModel and AutoTokenizer classes handle model-specific details. For our project, we should use the text-generation pipeline with temperature control for citation generation.', created_by: users.eve },
    { source_id: byTitle['LLaMA: Open and Efficient Foundation Language Models'], content: 'LLaMA-13B outperforms GPT-3 (175B) on most benchmarks despite being 10x smaller. Uses RMSNorm instead of LayerNorm, SwiGLU activation, and rotary positional embeddings. Training on 1T tokens for the 7B model, 1.4T for 65B.', created_by: users.taha },

    // Cloud Computing
    { source_id: byTitle['Kubernetes Official Documentation'], content: 'Pod affinity rules help co-locate related services. HorizontalPodAutoscaler should target 70% CPU utilization for web services. Use PodDisruptionBudgets for graceful rolling updates. Our staging cluster needs at least 3 nodes for HA.', created_by: users.bob },
    { source_id: byTitle['Terraform by HashiCorp - IaC Guide'], content: 'Use remote state with S3 + DynamoDB locking for team collaboration. Module composition pattern: network module → compute module → app module. The lifecycle meta-argument create_before_destroy prevents downtime during updates.', created_by: users.asad },

    // Cybersecurity
    { source_id: byTitle['OWASP Top 10 Web Security Risks'], content: 'A01:2021 Broken Access Control moved to #1 from #5. Our Supabase RLS policies cover most cases but we need to audit API routes that bypass RLS. A03:2021 Injection - parameterized queries in Supabase client handle SQL injection. Need to review XSS in markdown rendering.', created_by: users.diana },
    { source_id: byTitle['MITRE ATT&CK Framework'], content: 'Initial Access techniques T1190 (Exploit Public-Facing Application) and T1078 (Valid Accounts) are most relevant to our SaaS app. Our logging covers Execution and Persistence but we lack detection for Lateral Movement within the platform.', created_by: users.charlie },
    { source_id: byTitle['A Survey on Zero-Day Vulnerability Detection'], content: 'Fuzzing-based approaches (AFL, libFuzzer) catch ~60% of memory corruption bugs. Static analysis (CodeQL, Semgrep) complements runtime detection. ML-based detection shows promise but has high false positive rates (15-30%). Hybrid approaches recommended.', created_by: users.bob },

    // Data Science
    { source_id: byTitle['Kaggle Competition Strategies & Solutions'], content: 'Top competitors consistently use: 1) Extensive EDA before modeling, 2) Feature engineering > model selection, 3) Ensemble methods (stacking, blending), 4) Careful cross-validation to prevent leakage. CatBoost outperforms XGBoost on datasets with many categorical features.', created_by: users.eve },
    { source_id: byTitle['Pandas Documentation - Data Manipulation'], content: 'Use .pipe() for method chaining to keep transformations readable. GroupBy + transform is more efficient than apply for many operations. The query() method supports string expressions which are more readable for complex filters.', created_by: users.alice },

    // Computer Vision
    { source_id: byTitle['Faster R-CNN: Real-Time Object Detection'], content: 'Region Proposal Network (RPN) shares conv features with detection network, making proposals "almost cost-free". Anchor boxes at 3 scales and 3 aspect ratios. Non-maximum suppression with IoU threshold 0.7. Our implementation should start with a ResNet-50 FPN backbone.', created_by: users.charlie },
    { source_id: byTitle['An Image is Worth 16x16 Words: ViT'], content: 'Vision Transformer splits image into fixed-size patches (16x16), linearly embeds them, adds position embeddings, and processes through standard transformer encoder. Requires large-scale pre-training (ImageNet-21k or JFT-300M) to outperform CNNs. DeiT shows data-efficient training is possible.', created_by: users.asfand },

    // Database Systems
    { source_id: byTitle['Use The Index, Luke - SQL Indexing Guide'], content: 'B-tree indexes are optimal for range queries and equality. Composite indexes: put the most selective column first. Covering indexes avoid table lookups entirely. Our vault search query needs a composite index on (is_public, created_at DESC) for the dashboard.', created_by: users.taha_r },
    { source_id: byTitle['CAP Twelve Years Later: How the Rules Have Changed'], content: 'Modern distributed systems can provide both consistency and availability for most operations. Partitions are rare - when they occur, choose between C and A based on the specific operation. Supabase (PostgreSQL) is CP by default. Our real-time subscriptions need eventual consistency handling.', created_by: users.bob },
    { source_id: byTitle['PostgreSQL MVCC Concurrency Control'], content: 'Each transaction sees a snapshot of the database. Dead tuples accumulate - VACUUM is essential. HOT updates avoid creating new index entries when no indexed column changes. Our activity_logs table will benefit from BRIN index on timestamp column.', created_by: users.alice },

    // Blockchain
    { source_id: byTitle['Ethereum Developer Documentation'], content: 'Gas optimization: use calldata instead of memory for read-only function arguments. Storage slots are expensive (20,000 gas for SSTORE). Pack struct members to minimize storage slots. EIP-1559 changed fee mechanism to base fee + priority fee.', created_by: users.raza },
    { source_id: byTitle['Bitcoin: A Peer-to-Peer Electronic Cash System'], content: 'Proof-of-work solves the double-spending problem without a trusted third party. The longest chain represents the most computational work. An attacker needs >50% of network hashrate to rewrite history. Average block time: 10 minutes, difficulty adjusts every 2016 blocks.', created_by: users.diana },

    // HCI
    { source_id: byTitle["Nielsen's 10 Usability Heuristics"], content: 'H1 (Visibility of system status) - our loading states need improvement, especially during vault indexing. H3 (User control and freedom) - need "undo" for annotation deletion. H7 (Flexibility and efficiency) - add keyboard shortcuts for power users.', created_by: users.alice },
    { source_id: byTitle['WCAG 2.1 Quick Reference - Accessibility'], content: 'Level AA compliance required: 1.4.3 contrast ratio minimum 4.5:1 for normal text. 2.1.1 all functionality available via keyboard. 2.4.7 focus indicator visible. Our dark theme needs audit - some text on muted backgrounds fails contrast check.', created_by: users.eve },
    { source_id: byTitle['Laws of UX - Design Psychology Principles'], content: "Fitts's Law: make interactive targets large and close to user's attention. Hick's Law: reduce choices on vault creation form. Miller's Law: group vault members in chunks of 7±2. Jakob's Law: users prefer our app to work like similar tools they already know.", created_by: users.diana },
  ];
}

// ── ACTIVITY LOGS ───────────────────────────────────────────
function makeActivityLogs() {
  const logs = [];
  const now = Date.now();
  const hour = 3600000;
  const day = 86400000;

  const actions = [
    // Deep Learning vault - recent activity
    { vault_id: '20000000-0000-0000-0000-000000000001', action_type: 'vault_created', actor_id: users.asfand, metadata: { vault_name: 'Deep Learning Fundamentals' }, offset: -14 * day },
    { vault_id: '20000000-0000-0000-0000-000000000001', action_type: 'member_added', actor_id: users.asfand, metadata: { member_name: 'Taha', role: 'contributor' }, offset: -14 * day + hour },
    { vault_id: '20000000-0000-0000-0000-000000000001', action_type: 'source_added', actor_id: users.asfand, metadata: { source_title: 'Attention Is All You Need (2017)' }, offset: -13 * day },
    { vault_id: '20000000-0000-0000-0000-000000000001', action_type: 'file_uploaded', actor_id: users.taha, metadata: { file_name: 'resnet-paper.pdf' }, offset: -12 * day },
    { vault_id: '20000000-0000-0000-0000-000000000001', action_type: 'annotation_added', actor_id: users.asfand, metadata: { source_title: 'Attention Is All You Need (2017)' }, offset: -10 * day },
    { vault_id: '20000000-0000-0000-0000-000000000001', action_type: 'member_added', actor_id: users.asfand, metadata: { member_name: 'Bob Smith', role: 'contributor' }, offset: -9 * day },
    { vault_id: '20000000-0000-0000-0000-000000000001', action_type: 'file_uploaded', actor_id: users.bob, metadata: { file_name: 'deep-learning-lecture-notes.pdf' }, offset: -7 * day },
    { vault_id: '20000000-0000-0000-0000-000000000001', action_type: 'annotation_added', actor_id: users.taha, metadata: { source_title: 'Deep Residual Learning' }, offset: -5 * day },
    { vault_id: '20000000-0000-0000-0000-000000000001', action_type: 'source_added', actor_id: users.bob, metadata: { source_title: 'Stanford CS231n' }, offset: -3 * day },
    { vault_id: '20000000-0000-0000-0000-000000000001', action_type: 'file_uploaded', actor_id: users.asfand, metadata: { file_name: 'gan-tutorial-notebook.pdf' }, offset: -1 * day },

    // Software Engineering vault
    { vault_id: '20000000-0000-0000-0000-000000000002', action_type: 'vault_created', actor_id: users.asad, metadata: { vault_name: 'Software Engineering Best Practices' }, offset: -20 * day },
    { vault_id: '20000000-0000-0000-0000-000000000002', action_type: 'source_added', actor_id: users.asad, metadata: { source_title: 'Design Patterns - Refactoring Guru' }, offset: -19 * day },
    { vault_id: '20000000-0000-0000-0000-000000000002', action_type: 'member_added', actor_id: users.asad, metadata: { member_name: 'Asfand Ahmed', role: 'contributor' }, offset: -18 * day },
    { vault_id: '20000000-0000-0000-0000-000000000002', action_type: 'file_uploaded', actor_id: users.asad, metadata: { file_name: 'clean-code-summary.pdf' }, offset: -16 * day },
    { vault_id: '20000000-0000-0000-0000-000000000002', action_type: 'annotation_added', actor_id: users.asfand, metadata: { source_title: 'Microservices Architecture' }, offset: -12 * day },
    { vault_id: '20000000-0000-0000-0000-000000000002', action_type: 'file_uploaded', actor_id: users.asfand, metadata: { file_name: 'system-design-interview.pdf' }, offset: -8 * day },
    { vault_id: '20000000-0000-0000-0000-000000000002', action_type: 'source_added', actor_id: users.charlie, metadata: { source_title: 'Semantic Versioning 2.0.0' }, offset: -4 * day },
    { vault_id: '20000000-0000-0000-0000-000000000002', action_type: 'annotation_added', actor_id: users.asad, metadata: { source_title: 'The Twelve-Factor App' }, offset: -2 * day },

    // NLP vault
    { vault_id: '20000000-0000-0000-0000-000000000003', action_type: 'vault_created', actor_id: users.taha, metadata: { vault_name: 'Natural Language Processing' }, offset: -25 * day },
    { vault_id: '20000000-0000-0000-0000-000000000003', action_type: 'source_added', actor_id: users.taha, metadata: { source_title: 'BERT Paper' }, offset: -24 * day },
    { vault_id: '20000000-0000-0000-0000-000000000003', action_type: 'member_added', actor_id: users.taha, metadata: { member_name: 'Asfand Ahmed', role: 'contributor' }, offset: -23 * day },
    { vault_id: '20000000-0000-0000-0000-000000000003', action_type: 'file_uploaded', actor_id: users.taha, metadata: { file_name: 'bert-paper-annotated.pdf' }, offset: -22 * day },
    { vault_id: '20000000-0000-0000-0000-000000000003', action_type: 'source_added', actor_id: users.asfand, metadata: { source_title: 'GPT-3 Paper' }, offset: -18 * day },
    { vault_id: '20000000-0000-0000-0000-000000000003', action_type: 'annotation_added', actor_id: users.taha, metadata: { source_title: 'BERT' }, offset: -15 * day },
    { vault_id: '20000000-0000-0000-0000-000000000003', action_type: 'file_uploaded', actor_id: users.asfand, metadata: { file_name: 'llm-survey-2024.pdf' }, offset: -10 * day },
    { vault_id: '20000000-0000-0000-0000-000000000003', action_type: 'member_added', actor_id: users.taha, metadata: { member_name: 'Eve Davis', role: 'contributor' }, offset: -8 * day },
    { vault_id: '20000000-0000-0000-0000-000000000003', action_type: 'source_added', actor_id: users.taha, metadata: { source_title: 'LLaMA Paper' }, offset: -5 * day },
    { vault_id: '20000000-0000-0000-0000-000000000003', action_type: 'annotation_added', actor_id: users.asfand, metadata: { source_title: 'GPT-3' }, offset: -2 * day },
    { vault_id: '20000000-0000-0000-0000-000000000003', action_type: 'file_uploaded', actor_id: users.taha, metadata: { file_name: 'prompt-engineering-guide.pdf' }, offset: -6 * hour },

    // Cloud Computing vault
    { vault_id: '20000000-0000-0000-0000-000000000004', action_type: 'vault_created', actor_id: users.bob, metadata: { vault_name: 'Cloud Computing & DevOps' }, offset: -30 * day },
    { vault_id: '20000000-0000-0000-0000-000000000004', action_type: 'source_added', actor_id: users.bob, metadata: { source_title: 'Kubernetes Docs' }, offset: -28 * day },
    { vault_id: '20000000-0000-0000-0000-000000000004', action_type: 'file_uploaded', actor_id: users.bob, metadata: { file_name: 'kubernetes-architecture.pdf' }, offset: -25 * day },
    { vault_id: '20000000-0000-0000-0000-000000000004', action_type: 'member_added', actor_id: users.bob, metadata: { member_name: 'Asad Jafri', role: 'contributor' }, offset: -20 * day },
    { vault_id: '20000000-0000-0000-0000-000000000004', action_type: 'annotation_added', actor_id: users.bob, metadata: { source_title: 'Kubernetes Docs' }, offset: -15 * day },
    { vault_id: '20000000-0000-0000-0000-000000000004', action_type: 'source_added', actor_id: users.asad, metadata: { source_title: 'Terraform Guide' }, offset: -10 * day },
    { vault_id: '20000000-0000-0000-0000-000000000004', action_type: 'file_uploaded', actor_id: users.taha_r, metadata: { file_name: 'aws-solutions-architect-notes.pdf' }, offset: -3 * day },

    // Cybersecurity vault
    { vault_id: '20000000-0000-0000-0000-000000000005', action_type: 'vault_created', actor_id: users.diana, metadata: { vault_name: 'Cybersecurity Research' }, offset: -18 * day },
    { vault_id: '20000000-0000-0000-0000-000000000005', action_type: 'source_added', actor_id: users.diana, metadata: { source_title: 'OWASP Top 10' }, offset: -17 * day },
    { vault_id: '20000000-0000-0000-0000-000000000005', action_type: 'file_uploaded', actor_id: users.diana, metadata: { file_name: 'owasp-testing-guide-v4.pdf' }, offset: -16 * day },
    { vault_id: '20000000-0000-0000-0000-000000000005', action_type: 'member_added', actor_id: users.diana, metadata: { member_name: 'Charlie Brown', role: 'contributor' }, offset: -14 * day },
    { vault_id: '20000000-0000-0000-0000-000000000005', action_type: 'annotation_added', actor_id: users.diana, metadata: { source_title: 'OWASP Top 10' }, offset: -11 * day },
    { vault_id: '20000000-0000-0000-0000-000000000005', action_type: 'source_added', actor_id: users.charlie, metadata: { source_title: 'MITRE ATT&CK' }, offset: -8 * day },
    { vault_id: '20000000-0000-0000-0000-000000000005', action_type: 'file_uploaded', actor_id: users.charlie, metadata: { file_name: 'penetration-testing-methodology.pdf' }, offset: -5 * day },
    { vault_id: '20000000-0000-0000-0000-000000000005', action_type: 'annotation_added', actor_id: users.charlie, metadata: { source_title: 'MITRE ATT&CK' }, offset: -2 * day },

    // Data Science vault
    { vault_id: '20000000-0000-0000-0000-000000000006', action_type: 'vault_created', actor_id: users.eve, metadata: { vault_name: 'Data Science Portfolio' }, offset: -22 * day },
    { vault_id: '20000000-0000-0000-0000-000000000006', action_type: 'source_added', actor_id: users.eve, metadata: { source_title: 'Kaggle Strategies' }, offset: -21 * day },
    { vault_id: '20000000-0000-0000-0000-000000000006', action_type: 'file_uploaded', actor_id: users.eve, metadata: { file_name: 'eda-titanic-dataset.pdf' }, offset: -20 * day },
    { vault_id: '20000000-0000-0000-0000-000000000006', action_type: 'member_added', actor_id: users.eve, metadata: { member_name: 'Alice Johnson', role: 'contributor' }, offset: -18 * day },
    { vault_id: '20000000-0000-0000-0000-000000000006', action_type: 'annotation_added', actor_id: users.eve, metadata: { source_title: 'Kaggle Strategies' }, offset: -15 * day },
    { vault_id: '20000000-0000-0000-0000-000000000006', action_type: 'file_uploaded', actor_id: users.alice, metadata: { file_name: 'feature-engineering-handbook.pdf' }, offset: -8 * day },
    { vault_id: '20000000-0000-0000-0000-000000000006', action_type: 'source_added', actor_id: users.taha, metadata: { source_title: 'Scikit-learn Docs' }, offset: -4 * day },

    // Computer Vision vault
    { vault_id: '20000000-0000-0000-0000-000000000007', action_type: 'vault_created', actor_id: users.charlie, metadata: { vault_name: 'Computer Vision Lab' }, offset: -16 * day },
    { vault_id: '20000000-0000-0000-0000-000000000007', action_type: 'source_added', actor_id: users.charlie, metadata: { source_title: 'Faster R-CNN Paper' }, offset: -15 * day },
    { vault_id: '20000000-0000-0000-0000-000000000007', action_type: 'file_uploaded', actor_id: users.charlie, metadata: { file_name: 'faster-rcnn-implementation.pdf' }, offset: -14 * day },
    { vault_id: '20000000-0000-0000-0000-000000000007', action_type: 'member_added', actor_id: users.charlie, metadata: { member_name: 'Asfand Ahmed', role: 'contributor' }, offset: -12 * day },
    { vault_id: '20000000-0000-0000-0000-000000000007', action_type: 'source_added', actor_id: users.asfand, metadata: { source_title: 'Vision Transformer (ViT)' }, offset: -9 * day },
    { vault_id: '20000000-0000-0000-0000-000000000007', action_type: 'annotation_added', actor_id: users.charlie, metadata: { source_title: 'Faster R-CNN' }, offset: -6 * day },
    { vault_id: '20000000-0000-0000-0000-000000000007', action_type: 'file_uploaded', actor_id: users.asfand, metadata: { file_name: 'yolov8-comparison-study.pdf' }, offset: -3 * day },

    // Database Systems vault
    { vault_id: '20000000-0000-0000-0000-000000000008', action_type: 'vault_created', actor_id: users.taha_r, metadata: { vault_name: 'Database Systems Design' }, offset: -28 * day },
    { vault_id: '20000000-0000-0000-0000-000000000008', action_type: 'source_added', actor_id: users.taha_r, metadata: { source_title: 'SQL Indexing Guide' }, offset: -26 * day },
    { vault_id: '20000000-0000-0000-0000-000000000008', action_type: 'file_uploaded', actor_id: users.taha_r, metadata: { file_name: 'database-internals-notes.pdf' }, offset: -24 * day },
    { vault_id: '20000000-0000-0000-0000-000000000008', action_type: 'member_added', actor_id: users.taha_r, metadata: { member_name: 'Bob Smith', role: 'contributor' }, offset: -20 * day },
    { vault_id: '20000000-0000-0000-0000-000000000008', action_type: 'annotation_added', actor_id: users.taha_r, metadata: { source_title: 'SQL Indexing' }, offset: -15 * day },
    { vault_id: '20000000-0000-0000-0000-000000000008', action_type: 'source_added', actor_id: users.bob, metadata: { source_title: 'CAP Theorem Paper' }, offset: -10 * day },
    { vault_id: '20000000-0000-0000-0000-000000000008', action_type: 'annotation_added', actor_id: users.bob, metadata: { source_title: 'CAP Theorem' }, offset: -5 * day },

    // Blockchain vault
    { vault_id: '20000000-0000-0000-0000-000000000009', action_type: 'vault_created', actor_id: users.raza, metadata: { vault_name: 'Blockchain & Web3 Development' }, offset: -12 * day },
    { vault_id: '20000000-0000-0000-0000-000000000009', action_type: 'source_added', actor_id: users.raza, metadata: { source_title: 'Ethereum Developer Docs' }, offset: -11 * day },
    { vault_id: '20000000-0000-0000-0000-000000000009', action_type: 'file_uploaded', actor_id: users.raza, metadata: { file_name: 'ethereum-whitepaper.pdf' }, offset: -10 * day },
    { vault_id: '20000000-0000-0000-0000-000000000009', action_type: 'member_added', actor_id: users.raza, metadata: { member_name: 'Diana Prince', role: 'contributor' }, offset: -8 * day },
    { vault_id: '20000000-0000-0000-0000-000000000009', action_type: 'annotation_added', actor_id: users.raza, metadata: { source_title: 'Ethereum Docs' }, offset: -5 * day },
    { vault_id: '20000000-0000-0000-0000-000000000009', action_type: 'source_added', actor_id: users.diana, metadata: { source_title: 'Bitcoin Whitepaper' }, offset: -3 * day },
    { vault_id: '20000000-0000-0000-0000-000000000009', action_type: 'file_uploaded', actor_id: users.diana, metadata: { file_name: 'smart-contract-security-audit.pdf' }, offset: -1 * day },

    // HCI vault
    { vault_id: '20000000-0000-0000-0000-000000000010', action_type: 'vault_created', actor_id: users.alice, metadata: { vault_name: 'Human-Computer Interaction' }, offset: -15 * day },
    { vault_id: '20000000-0000-0000-0000-000000000010', action_type: 'source_added', actor_id: users.alice, metadata: { source_title: "Nielsen's Heuristics" }, offset: -14 * day },
    { vault_id: '20000000-0000-0000-0000-000000000010', action_type: 'member_added', actor_id: users.alice, metadata: { member_name: 'Eve Davis', role: 'contributor' }, offset: -13 * day },
    { vault_id: '20000000-0000-0000-0000-000000000010', action_type: 'file_uploaded', actor_id: users.alice, metadata: { file_name: 'ux-research-methods.pdf' }, offset: -12 * day },
    { vault_id: '20000000-0000-0000-0000-000000000010', action_type: 'source_added', actor_id: users.eve, metadata: { source_title: 'WCAG 2.1 Quick Reference' }, offset: -9 * day },
    { vault_id: '20000000-0000-0000-0000-000000000010', action_type: 'annotation_added', actor_id: users.alice, metadata: { source_title: "Nielsen's Heuristics" }, offset: -6 * day },
    { vault_id: '20000000-0000-0000-0000-000000000010', action_type: 'file_uploaded', actor_id: users.eve, metadata: { file_name: 'accessibility-audit-report.pdf' }, offset: -4 * day },
    { vault_id: '20000000-0000-0000-0000-000000000010', action_type: 'member_added', actor_id: users.alice, metadata: { member_name: 'Diana Prince', role: 'contributor' }, offset: -2 * day },
    { vault_id: '20000000-0000-0000-0000-000000000010', action_type: 'annotation_added', actor_id: users.eve, metadata: { source_title: 'WCAG 2.1' }, offset: -1 * day },
    { vault_id: '20000000-0000-0000-0000-000000000010', action_type: 'file_uploaded', actor_id: users.diana, metadata: { file_name: 'cognitive-load-theory.pdf' }, offset: -3 * hour },
  ];

  return actions.map(a => ({
    vault_id: a.vault_id,
    action_type: a.action_type,
    actor_id: a.actor_id,
    metadata: a.metadata,
    timestamp: new Date(now + a.offset).toISOString(),
  }));
}

// ── MAIN SEED FUNCTION ──────────────────────────────────────
async function seed() {
  console.log('🌱 Starting seed...\n');

  // 1. Insert vaults
  console.log('📦 Inserting 10 vaults...');
  const { data: vaultData, error: vaultErr } = await supabase
    .from('vaults')
    .upsert(newVaults, { onConflict: 'id' })
    .select();
  if (vaultErr) { console.error('Vault error:', vaultErr); return; }
  console.log(`   ✅ ${vaultData.length} vaults inserted\n`);

  // 2. Insert vault members
  console.log('👥 Inserting vault members...');
  const { data: memberData, error: memberErr } = await supabase
    .from('vault_members')
    .upsert(newMembers, { onConflict: 'vault_id,user_id', ignoreDuplicates: true })
    .select();
  if (memberErr) { console.error('Member error:', memberErr); return; }
  console.log(`   ✅ ${memberData?.length || 0} members inserted\n`);

  // 3. Insert sources
  console.log('📄 Inserting sources...');
  const { data: sourceData, error: sourceErr } = await supabase
    .from('sources')
    .insert(newSources)
    .select();
  if (sourceErr) { console.error('Source error:', sourceErr); return; }
  console.log(`   ✅ ${sourceData.length} sources inserted\n`);

  // 4. Insert annotations (need source IDs)
  console.log('📝 Inserting annotations...');
  const annotations = makeAnnotations(sourceData);
  const { data: annotData, error: annotErr } = await supabase
    .from('annotations')
    .insert(annotations)
    .select();
  if (annotErr) { console.error('Annotation error:', annotErr); return; }
  console.log(`   ✅ ${annotData.length} annotations inserted\n`);

  // 5. Insert files
  console.log('📁 Inserting files...');
  const { data: fileData, error: fileErr } = await supabase
    .from('files')
    .insert(newFiles)
    .select();
  if (fileErr) { console.error('File error:', fileErr); return; }
  console.log(`   ✅ ${fileData.length} files inserted\n`);

  // 6. Insert activity logs
  console.log('📊 Inserting activity logs...');
  const activityLogs = makeActivityLogs();
  const { data: actData, error: actErr } = await supabase
    .from('activity_logs')
    .insert(activityLogs)
    .select();
  if (actErr) { console.error('Activity error:', actErr); return; }
  console.log(`   ✅ ${actData.length} activity logs inserted\n`);

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('🎉 SEED COMPLETE!');
  console.log('═══════════════════════════════════════');
  console.log(`  Vaults:      ${vaultData.length}`);
  console.log(`  Members:     ${memberData?.length || 0}`);
  console.log(`  Sources:     ${sourceData.length}`);
  console.log(`  Annotations: ${annotData.length}`);
  console.log(`  Files:       ${fileData.length}`);
  console.log(`  Activities:  ${actData.length}`);
  console.log('═══════════════════════════════════════');
}

seed().catch(console.error);
