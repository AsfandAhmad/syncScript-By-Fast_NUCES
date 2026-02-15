import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

// Demo users to create
const DEMO_USERS = [
  { email: 'alice@example.com', password: 'Password123!', name: 'Alice Johnson' },
  { email: 'bob@example.com', password: 'Password123!', name: 'Bob Smith' },
  { email: 'charlie@example.com', password: 'Password123!', name: 'Charlie Brown' },
  { email: 'diana@example.com', password: 'Password123!', name: 'Diana Prince' },
  { email: 'eve@example.com', password: 'Password123!', name: 'Eve Davis' },
];

let userIds: string[] = [];

export async function seedDatabase() {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    console.log('='.repeat(60));

    // Step 0: Ensure is_public column exists (migration 005)
    console.log('\n🔧 Ensuring is_public column exists on vaults table...');
    try {
      // Try a query that references is_public – if it fails, the column doesn't exist
      const { error: colCheck } = await supabase
        .from('vaults')
        .select('is_public')
        .limit(1);

      if (colCheck && colCheck.message?.includes('is_public')) {
        // Column doesn't exist – add it via the Supabase SQL API
        console.log('   ⚠️  is_public column missing – adding via SQL API...');
        const sqlRes = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });
        // Fall back: try inserting with is_public and let Supabase handle it
        // The column may need to be added manually if this approach doesn't work
        console.log('   ℹ️  If seeding fails, run this SQL in Supabase SQL Editor:');
        console.log('   ALTER TABLE vaults ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;');
      } else {
        console.log('   ✅ is_public column already exists');
      }
    } catch {
      console.log('   ℹ️  Column check skipped – will attempt insert with is_public');
    }

    // Step 1: Create demo users
    console.log('\n👤 Creating demo users...');
    for (const user of DEMO_USERS) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
        },
      });

      if (error) {
        // User might already exist
        console.log(`   ℹ️  User ${user.email} may already exist, fetching...`);
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === user.email);
        if (existingUser) {
          userIds.push(existingUser.id);
          console.log(`   ✅ Found existing user: ${user.name} (${user.email})`);
        }
      } else if (data.user) {
        userIds.push(data.user.id);
        console.log(`   ✅ Created user: ${user.name} (${user.email})`);
      }
    }

    if (userIds.length < 5) {
      console.error('❌ Failed to create/find all required users');
      return;
    }

    const [ALICE_ID, BOB_ID, CHARLIE_ID, DIANA_ID, EVE_ID] = userIds;
    console.log(`\n✅ All ${userIds.length} users ready`);

    // Step 2: Create vaults (covering all cases)
    console.log('\n📦 Creating vaults...');
    const vaultsData = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'AI Research Hub',
        description: 'Comprehensive collection of AI and ML research papers',
        owner_id: ALICE_ID,
        is_archived: false,
        is_public: true,
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        name: 'Business Strategy Docs',
        description: 'Strategic planning documents and market analysis',
        owner_id: ALICE_ID,
        is_archived: false,
        is_public: false,
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        name: 'Web Dev Resources',
        description: 'Tutorials, documentation, and code samples',
        owner_id: BOB_ID,
        is_archived: false,
        is_public: true,
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        name: 'Archived Project 2023',
        description: 'Old project files - archived for reference',
        owner_id: CHARLIE_ID,
        is_archived: true, // CASE: Archived vault
        is_public: false,
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        name: 'Personal Knowledge Base',
        description: 'Private collection with no additional members',
        owner_id: DIANA_ID,
        is_archived: false, // CASE: Vault with only owner
        is_public: false,
      },
      {
        id: '10000000-0000-0000-0000-000000000006',
        name: 'Team Collaboration Space',
        description: 'Shared workspace for the entire team',
        owner_id: EVE_ID,
        is_archived: false, // CASE: Vault with all users
        is_public: true,
      },
      // ── New public vaults for dashboard discovery ──
      {
        id: '10000000-0000-0000-0000-000000000007',
        name: 'Open Source Study Group',
        description: 'Community-driven collection of open source project analyses and best practices',
        owner_id: BOB_ID,
        is_archived: false,
        is_public: true,
      },
      {
        id: '10000000-0000-0000-0000-000000000008',
        name: 'Data Science Bootcamp',
        description: 'Curated resources for learning data science — from statistics to deep learning',
        owner_id: CHARLIE_ID,
        is_archived: false,
        is_public: true,
      },
      {
        id: '10000000-0000-0000-0000-000000000009',
        name: 'UX Design Patterns',
        description: 'Research papers and case studies on modern UX/UI design patterns',
        owner_id: DIANA_ID,
        is_archived: false,
        is_public: true,
      },
      {
        id: '10000000-0000-0000-0000-000000000010',
        name: 'Cybersecurity Reading List',
        description: 'Essential papers and articles on network security, cryptography, and threat analysis',
        owner_id: EVE_ID,
        is_archived: false,
        is_public: true,
      },
    ];

    const vaults = await supabase.from('vaults').insert(vaultsData).select();

    if (vaults.error) {
      console.error('❌ Error creating vaults:', vaults.error);
      return;
    }
    console.log(`✅ Created ${vaults.data?.length} vaults`);

    // Step 3: Add vault members (covering all role combinations)
    console.log('\n👥 Adding vault members...');
    const membersData = [
      // Vault 1: AI Research Hub - Multiple members, different roles
      { vault_id: '10000000-0000-0000-0000-000000000001', user_id: ALICE_ID, role: 'owner' },
      { vault_id: '10000000-0000-0000-0000-000000000001', user_id: BOB_ID, role: 'contributor' },
      { vault_id: '10000000-0000-0000-0000-000000000001', user_id: CHARLIE_ID, role: 'viewer' },
      
      // Vault 2: Business Strategy - Owner + contributor
      { vault_id: '10000000-0000-0000-0000-000000000002', user_id: ALICE_ID, role: 'owner' },
      { vault_id: '10000000-0000-0000-0000-000000000002', user_id: EVE_ID, role: 'contributor' },
      
      // Vault 3: Web Dev - Owner + viewer
      { vault_id: '10000000-0000-0000-0000-000000000003', user_id: BOB_ID, role: 'owner' },
      { vault_id: '10000000-0000-0000-0000-000000000003', user_id: DIANA_ID, role: 'viewer' },
      
      // Vault 4: Archived - Owner only
      { vault_id: '10000000-0000-0000-0000-000000000004', user_id: CHARLIE_ID, role: 'owner' },
      
      // Vault 5: Personal - Owner only
      { vault_id: '10000000-0000-0000-0000-000000000005', user_id: DIANA_ID, role: 'owner' },
      
      // Vault 6: Team Collaboration - All users with mixed roles
      { vault_id: '10000000-0000-0000-0000-000000000006', user_id: EVE_ID, role: 'owner' },
      { vault_id: '10000000-0000-0000-0000-000000000006', user_id: ALICE_ID, role: 'contributor' },
      { vault_id: '10000000-0000-0000-0000-000000000006', user_id: BOB_ID, role: 'contributor' },
      { vault_id: '10000000-0000-0000-0000-000000000006', user_id: CHARLIE_ID, role: 'viewer' },
      { vault_id: '10000000-0000-0000-0000-000000000006', user_id: DIANA_ID, role: 'viewer' },

      // Vault 7: Open Source Study Group (public) - Owner + 1 contributor
      { vault_id: '10000000-0000-0000-0000-000000000007', user_id: BOB_ID, role: 'owner' },
      { vault_id: '10000000-0000-0000-0000-000000000007', user_id: ALICE_ID, role: 'contributor' },

      // Vault 8: Data Science Bootcamp (public) - Owner + 2 viewers
      { vault_id: '10000000-0000-0000-0000-000000000008', user_id: CHARLIE_ID, role: 'owner' },
      { vault_id: '10000000-0000-0000-0000-000000000008', user_id: EVE_ID, role: 'viewer' },
      { vault_id: '10000000-0000-0000-0000-000000000008', user_id: DIANA_ID, role: 'viewer' },

      // Vault 9: UX Design Patterns (public) - Owner only
      { vault_id: '10000000-0000-0000-0000-000000000009', user_id: DIANA_ID, role: 'owner' },

      // Vault 10: Cybersecurity Reading List (public) - Owner + 1 contributor
      { vault_id: '10000000-0000-0000-0000-000000000010', user_id: EVE_ID, role: 'owner' },
      { vault_id: '10000000-0000-0000-0000-000000000010', user_id: BOB_ID, role: 'contributor' },
    ];

    const members = await supabase.from('vault_members').insert(membersData).select();

    if (members.error) {
      console.error('❌ Error adding members:', members.error);
      return;
    }
    console.log(`✅ Added ${members.data?.length} vault members`);

    // Step 4: Add sources (varied content types)
    console.log('\n📄 Adding sources...');
    const sourcesData = [
      // Vault 1: AI Research Hub
      {
        id: '20000000-0000-0000-0000-000000000001',
        vault_id: '10000000-0000-0000-0000-000000000001',
        url: 'https://arxiv.org/pdf/2301.00123.pdf',
        title: 'Attention Is All You Need - Transformer Architecture',
        metadata: { type: 'pdf', pages: 15, year: 2017, citations: 50000 },
        created_by: ALICE_ID,
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        vault_id: '10000000-0000-0000-0000-000000000001',
        url: 'https://openai.com/research/gpt-4',
        title: 'GPT-4 Technical Report',
        metadata: { type: 'article', word_count: 8000, published: '2023-03-14' },
        created_by: BOB_ID, // CASE: Added by contributor
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        vault_id: '10000000-0000-0000-0000-000000000001',
        url: 'https://github.com/karpathy/nanoGPT',
        title: 'NanoGPT - Minimal GPT Implementation',
        metadata: { type: 'code', stars: 25000, language: 'Python' },
        created_by: ALICE_ID,
      },
      
      // Vault 2: Business Strategy
      {
        id: '20000000-0000-0000-0000-000000000004',
        vault_id: '10000000-0000-0000-0000-000000000002',
        url: 'https://www.mckinsey.com/strategy-report-2024.pdf',
        title: 'Digital Transformation Strategy 2024',
        metadata: { type: 'report', pages: 50, category: 'consulting' },
        created_by: ALICE_ID,
      },
      {
        id: '20000000-0000-0000-0000-000000000005',
        vault_id: '10000000-0000-0000-0000-000000000002',
        url: 'https://example.com/market-analysis-q4.xlsx',
        title: 'Q4 2024 Market Analysis',
        metadata: { type: 'spreadsheet', sheets: 8, size: '2.5MB' },
        created_by: EVE_ID, // CASE: Added by contributor
      },
      
      // Vault 3: Web Dev Resources
      {
        id: '20000000-0000-0000-0000-000000000006',
        vault_id: '10000000-0000-0000-0000-000000000003',
        url: 'https://react.dev/learn',
        title: 'Official React Documentation',
        metadata: { type: 'documentation', version: '18.2', framework: 'React' },
        created_by: BOB_ID,
      },
      {
        id: '20000000-0000-0000-0000-000000000007',
        vault_id: '10000000-0000-0000-0000-000000000003',
        url: 'https://www.youtube.com/watch?v=nextjs-tutorial',
        title: 'Next.js 14 Complete Tutorial',
        metadata: { type: 'video', duration: '3:45:00', views: 500000 },
        created_by: BOB_ID,
      },
      
      // Vault 4: Archived (still has sources)
      {
        id: '20000000-0000-0000-0000-000000000008',
        vault_id: '10000000-0000-0000-0000-000000000004',
        url: 'https://legacy-project.com/specs.pdf',
        title: 'Legacy Project Specifications',
        metadata: { type: 'pdf', year: 2023, status: 'archived' },
        created_by: CHARLIE_ID,
      },
      
      // Vault 5: Personal - Multiple sources by owner
      {
        id: '20000000-0000-0000-0000-000000000009',
        vault_id: '10000000-0000-0000-0000-000000000005',
        url: 'https://medium.com/personal-blog-post',
        title: 'My Thoughts on System Design',
        metadata: { type: 'blog', word_count: 2000 },
        created_by: DIANA_ID,
      },
      {
        id: '20000000-0000-0000-0000-000000000010',
        vault_id: '10000000-0000-0000-0000-000000000005',
        url: 'https://example.com/reading-list.html',
        title: 'Books to Read in 2026',
        metadata: { type: 'list', items: 25 },
        created_by: DIANA_ID,
      },
      
      // Vault 6: Team Collaboration - Various contributors
      {
        id: '20000000-0000-0000-0000-000000000011',
        vault_id: '10000000-0000-0000-0000-000000000006',
        url: 'https://confluence.company.com/project-plan',
        title: 'Q1 2026 Project Roadmap',
        metadata: { type: 'wiki', last_updated: '2026-01-15' },
        created_by: EVE_ID,
      },
      {
        id: '20000000-0000-0000-0000-000000000012',
        vault_id: '10000000-0000-0000-0000-000000000006',
        url: 'https://figma.com/design-system',
        title: 'Company Design System v2',
        metadata: { type: 'design', tool: 'Figma', components: 150 },
        created_by: ALICE_ID,
      },

      // ── Public vault sources ──

      // Vault 7: Open Source Study Group
      {
        id: '20000000-0000-0000-0000-000000000013',
        vault_id: '10000000-0000-0000-0000-000000000007',
        url: 'https://github.com/torvalds/linux',
        title: 'Linux Kernel - Architecture Overview',
        metadata: { type: 'code', stars: 170000, language: 'C' },
        created_by: BOB_ID,
      },
      {
        id: '20000000-0000-0000-0000-000000000014',
        vault_id: '10000000-0000-0000-0000-000000000007',
        url: 'https://opensource.guide/how-to-contribute/',
        title: 'How to Contribute to Open Source',
        metadata: { type: 'guide', word_count: 3500 },
        created_by: ALICE_ID,
      },

      // Vault 8: Data Science Bootcamp
      {
        id: '20000000-0000-0000-0000-000000000015',
        vault_id: '10000000-0000-0000-0000-000000000008',
        url: 'https://www.kaggle.com/learn/intro-to-machine-learning',
        title: 'Kaggle - Intro to Machine Learning',
        metadata: { type: 'course', lessons: 7, difficulty: 'beginner' },
        created_by: CHARLIE_ID,
      },
      {
        id: '20000000-0000-0000-0000-000000000016',
        vault_id: '10000000-0000-0000-0000-000000000008',
        url: 'https://arxiv.org/abs/1706.03762',
        title: 'Statistical Learning Theory - Core Concepts',
        metadata: { type: 'pdf', pages: 42, year: 2022 },
        created_by: CHARLIE_ID,
      },

      // Vault 9: UX Design Patterns
      {
        id: '20000000-0000-0000-0000-000000000017',
        vault_id: '10000000-0000-0000-0000-000000000009',
        url: 'https://www.nngroup.com/articles/ten-usability-heuristics/',
        title: 'Nielsen\'s 10 Usability Heuristics',
        metadata: { type: 'article', word_count: 4200, year: 2020 },
        created_by: DIANA_ID,
      },
      {
        id: '20000000-0000-0000-0000-000000000018',
        vault_id: '10000000-0000-0000-0000-000000000009',
        url: 'https://lawsofux.com/',
        title: 'Laws of UX - A Collection of Design Principles',
        metadata: { type: 'reference', principles: 21 },
        created_by: DIANA_ID,
      },

      // Vault 10: Cybersecurity Reading List
      {
        id: '20000000-0000-0000-0000-000000000019',
        vault_id: '10000000-0000-0000-0000-000000000010',
        url: 'https://owasp.org/www-project-top-ten/',
        title: 'OWASP Top 10 Web Application Security Risks',
        metadata: { type: 'reference', last_updated: '2025-09', category: 'web-security' },
        created_by: EVE_ID,
      },
      {
        id: '20000000-0000-0000-0000-000000000020',
        vault_id: '10000000-0000-0000-0000-000000000010',
        url: 'https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final',
        title: 'NIST Security and Privacy Controls Framework',
        metadata: { type: 'framework', pages: 492, revision: 5 },
        created_by: BOB_ID,
      },
    ];

    const sources = await supabase.from('sources').insert(sourcesData).select();

    if (sources.error) {
      console.error('❌ Error adding sources:', sources.error);
      return;
    }
    console.log(`✅ Added ${sources.data?.length} sources`);

    // Step 5: Add annotations (varied authors and lengths)
    console.log('\n💬 Adding annotations...');
    const annotationsData = [
      // Source 1: Multiple annotations
      {
        source_id: '20000000-0000-0000-0000-000000000001',
        content: 'Section 3.1 explains multi-head attention mechanism. Critical for understanding transformers!',
        created_by: ALICE_ID,
      },
      {
        source_id: '20000000-0000-0000-0000-000000000001',
        content: 'The positional encoding formula is on page 6. Need to review this for implementation.',
        created_by: BOB_ID, // CASE: Contributor adds annotation
      },
      {
        source_id: '20000000-0000-0000-0000-000000000001',
        content: 'Figure 1 architecture diagram is very helpful for visualization.',
        created_by: CHARLIE_ID, // CASE: Viewer cannot actually add annotations (will test RLS)
      },
      
      // Source 2: Long detailed annotation
      {
        source_id: '20000000-0000-0000-0000-000000000002',
        content: `Comprehensive analysis of GPT-4 capabilities:
        
1. Multimodal understanding (text + images)
2. Improved reasoning and problem-solving
3. Better instruction following
4. Reduced hallucinations compared to GPT-3.5

Key limitations mentioned:
- Still not 100% reliable for critical applications
- Can exhibit biases from training data
- Requires careful prompt engineering

Action items:
- Test GPT-4 API for our use case
- Compare with open-source alternatives
- Evaluate cost vs performance`,
        created_by: ALICE_ID,
      },
      
      // Source 3: Code-related annotation
      {
        source_id: '20000000-0000-0000-0000-000000000003',
        content: 'Check out train.py line 250 - elegant implementation of the training loop. Could adapt this for our project.',
        created_by: BOB_ID,
      },
      
      // Source 4: Business annotation
      {
        source_id: '20000000-0000-0000-0000-000000000004',
        content: 'Page 12: ROI projections look promising. Need to present this to stakeholders next week.',
        created_by: ALICE_ID,
      },
      {
        source_id: '20000000-0000-0000-0000-000000000004',
        content: 'Important: Section 5 risk assessment requires legal review before proceeding.',
        created_by: EVE_ID,
      },
      
      // Source 6: Tutorial annotation
      {
        source_id: '20000000-0000-0000-0000-000000000006',
        content: 'The hooks section is particularly well-explained. Bookmark for team training.',
        created_by: BOB_ID,
      },
      
      // Source 9: Personal note
      {
        source_id: '20000000-0000-0000-0000-000000000009',
        content: 'Remember to expand the section on microservices patterns.',
        created_by: DIANA_ID,
      },
      
      // Source 11: Team collaboration annotation
      {
        source_id: '20000000-0000-0000-0000-000000000011',
        content: 'Q1 priorities look good, but we should add buffer time for testing phase.',
        created_by: ALICE_ID,
      },
      {
        source_id: '20000000-0000-0000-0000-000000000011',
        content: 'Agreed with Alice. Also need to consider holiday schedule in February.',
        created_by: BOB_ID,
      },

      // ── Public vault annotations ──

      // Open Source Study Group
      {
        source_id: '20000000-0000-0000-0000-000000000013',
        content: 'The kernel module system is a great example of plugin architecture. Worth studying for our own projects.',
        created_by: BOB_ID,
      },
      {
        source_id: '20000000-0000-0000-0000-000000000014',
        content: 'Step 3 about finding good first issues is the most actionable advice here.',
        created_by: ALICE_ID,
      },

      // Data Science Bootcamp
      {
        source_id: '20000000-0000-0000-0000-000000000015',
        content: 'Great starting point for beginners. The decision tree section is especially clear.',
        created_by: CHARLIE_ID,
      },
      {
        source_id: '20000000-0000-0000-0000-000000000016',
        content: 'Theorem 4.2 on bias-variance tradeoff is essential. Make sure to understand the proof.',
        created_by: EVE_ID,
      },

      // UX Design Patterns
      {
        source_id: '20000000-0000-0000-0000-000000000017',
        content: 'Heuristic #1 (Visibility of System Status) applies directly to our loading states.',
        created_by: DIANA_ID,
      },

      // Cybersecurity
      {
        source_id: '20000000-0000-0000-0000-000000000019',
        content: 'Injection attacks are still #1 in 2025. We need to audit all our API endpoints.',
        created_by: EVE_ID,
      },
      {
        source_id: '20000000-0000-0000-0000-000000000020',
        content: 'Section AC-2 on account management is relevant for our auth implementation.',
        created_by: BOB_ID,
      },
    ];

    const annotations = await supabase.from('annotations').insert(annotationsData).select();

    if (annotations.error) {
      console.error('❌ Error adding annotations:', annotations.error);
      return;
    }
    console.log(`✅ Added ${annotations.data?.length} annotations`);

    // Step 6: Add files (varied types and sizes)
    console.log('\n📁 Adding files...');
    const filesData = [
      // Vault 1: AI Research Hub
      {
        vault_id: '10000000-0000-0000-0000-000000000001',
        file_url: 'https://storage.supabase.co/vault1/transformer-paper.pdf',
        file_name: 'transformer-paper.pdf',
        file_size: 4521098,
        checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploaded_by: ALICE_ID,
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000001',
        file_url: 'https://storage.supabase.co/vault1/ml-notes.docx',
        file_name: 'ml-notes.docx',
        file_size: 256340,
        checksum: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
        uploaded_by: BOB_ID, // CASE: Contributor uploads
      },
      
      // Vault 2: Business Strategy
      {
        vault_id: '10000000-0000-0000-0000-000000000002',
        file_url: 'https://storage.supabase.co/vault2/strategy-deck.pptx',
        file_name: 'Q4-strategy-deck.pptx',
        file_size: 8921340,
        checksum: 'b3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploaded_by: ALICE_ID,
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000002',
        file_url: 'https://storage.supabase.co/vault2/financial-report.xlsx',
        file_name: 'financial-report-2024.xlsx',
        file_size: 2234567,
        checksum: 'c4b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploaded_by: EVE_ID,
      },
      
      // Vault 3: Web Dev Resources
      {
        vault_id: '10000000-0000-0000-0000-000000000003',
        file_url: 'https://storage.supabase.co/vault3/react-cheatsheet.pdf',
        file_name: 'react-hooks-cheatsheet.pdf',
        file_size: 567890,
        checksum: 'd5b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploaded_by: BOB_ID,
      },
      
      // Vault 4: Archived - Small file
      {
        vault_id: '10000000-0000-0000-0000-000000000004',
        file_url: 'https://storage.supabase.co/vault4/old-specs.txt',
        file_name: 'project-specs-2023.txt',
        file_size: 45670,
        checksum: 'e6b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploaded_by: CHARLIE_ID,
      },
      
      // Vault 5: Personal - Image file
      {
        vault_id: '10000000-0000-0000-0000-000000000005',
        file_url: 'https://storage.supabase.co/vault5/architecture-diagram.png',
        file_name: 'system-architecture-v2.png',
        file_size: 1234560,
        checksum: 'f7b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploaded_by: DIANA_ID,
      },
      
      // Vault 6: Team Collaboration - Multiple files
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        file_url: 'https://storage.supabase.co/vault6/meeting-notes.md',
        file_name: 'team-meeting-2026-02-10.md',
        file_size: 34567,
        checksum: 'g8b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploaded_by: EVE_ID,
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        file_url: 'https://storage.supabase.co/vault6/design-assets.zip',
        file_name: 'ui-assets-bundle.zip',
        file_size: 15678900,
        checksum: 'h9b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploaded_by: ALICE_ID,
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        file_url: 'https://storage.supabase.co/vault6/api-docs.pdf',
        file_name: 'api-documentation-v3.pdf',
        file_size: 3456789,
        checksum: 'i0b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploaded_by: BOB_ID,
      },
    ];

    const files = await supabase.from('files').insert(filesData).select();

    if (files.error) {
      console.error('❌ Error adding files:', files.error);
      return;
    }
    console.log(`✅ Added ${files.data?.length} files`);

    // Step 7: Add activity logs (comprehensive audit trail)
    console.log('\n📊 Adding activity logs...');
    const activityLogsData = [
      // Vault 1 activities
      {
        vault_id: '10000000-0000-0000-0000-000000000001',
        action_type: 'vault_created',
        actor_id: ALICE_ID,
        metadata: { vault_name: 'AI Research Hub' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000001',
        action_type: 'member_added',
        actor_id: ALICE_ID,
        metadata: { added_user: 'Bob Smith', role: 'contributor' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000001',
        action_type: 'member_added',
        actor_id: ALICE_ID,
        metadata: { added_user: 'Charlie Brown', role: 'viewer' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000001',
        action_type: 'source_added',
        actor_id: ALICE_ID,
        metadata: { source_title: 'Transformer Architecture', url: 'https://arxiv.org/pdf/2301.00123.pdf' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000001',
        action_type: 'annotation_added',
        actor_id: ALICE_ID,
        metadata: { source_title: 'Transformer Architecture', preview: 'Section 3.1 explains...' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000001',
        action_type: 'file_uploaded',
        actor_id: ALICE_ID,
        metadata: { file_name: 'transformer-paper.pdf', file_size: 4521098 },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000001',
        action_type: 'source_added',
        actor_id: BOB_ID,
        metadata: { source_title: 'GPT-4 Technical Report', url: 'https://openai.com/research/gpt-4' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000001',
        action_type: 'annotation_added',
        actor_id: BOB_ID,
        metadata: { source_title: 'Transformer Architecture', preview: 'The positional encoding...' },
      },
      
      // Vault 2 activities
      {
        vault_id: '10000000-0000-0000-0000-000000000002',
        action_type: 'vault_created',
        actor_id: ALICE_ID,
        metadata: { vault_name: 'Business Strategy Docs' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000002',
        action_type: 'member_added',
        actor_id: ALICE_ID,
        metadata: { added_user: 'Eve Davis', role: 'contributor' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000002',
        action_type: 'source_added',
        actor_id: ALICE_ID,
        metadata: { source_title: 'Digital Transformation Strategy 2024' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000002',
        action_type: 'file_uploaded',
        actor_id: ALICE_ID,
        metadata: { file_name: 'Q4-strategy-deck.pptx', file_size: 8921340 },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000002',
        action_type: 'annotation_added',
        actor_id: EVE_ID,
        metadata: { source_title: 'Digital Transformation Strategy 2024', preview: 'Important: Section 5 risk...' },
      },
      
      // Vault 3 activities
      {
        vault_id: '10000000-0000-0000-0000-000000000003',
        action_type: 'vault_created',
        actor_id: BOB_ID,
        metadata: { vault_name: 'Web Dev Resources' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000003',
        action_type: 'source_added',
        actor_id: BOB_ID,
        metadata: { source_title: 'Official React Documentation' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000003',
        action_type: 'file_uploaded',
        actor_id: BOB_ID,
        metadata: { file_name: 'react-hooks-cheatsheet.pdf', file_size: 567890 },
      },
      
      // Vault 4 activities (archived vault)
      {
        vault_id: '10000000-0000-0000-0000-000000000004',
        action_type: 'vault_created',
        actor_id: CHARLIE_ID,
        metadata: { vault_name: 'Archived Project 2023' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000004',
        action_type: 'source_added',
        actor_id: CHARLIE_ID,
        metadata: { source_title: 'Legacy Project Specifications' },
      },
      
      // Vault 5 activities (personal vault)
      {
        vault_id: '10000000-0000-0000-0000-000000000005',
        action_type: 'vault_created',
        actor_id: DIANA_ID,
        metadata: { vault_name: 'Personal Knowledge Base' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000005',
        action_type: 'source_added',
        actor_id: DIANA_ID,
        metadata: { source_title: 'My Thoughts on System Design' },
      },
      
      // Vault 6 activities (team vault with lots of activity)
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        action_type: 'vault_created',
        actor_id: EVE_ID,
        metadata: { vault_name: 'Team Collaboration Space' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        action_type: 'member_added',
        actor_id: EVE_ID,
        metadata: { added_user: 'Alice Johnson', role: 'contributor' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        action_type: 'member_added',
        actor_id: EVE_ID,
        metadata: { added_user: 'Bob Smith', role: 'contributor' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        action_type: 'source_added',
        actor_id: EVE_ID,
        metadata: { source_title: 'Q1 2026 Project Roadmap' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        action_type: 'source_added',
        actor_id: ALICE_ID,
        metadata: { source_title: 'Company Design System v2' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        action_type: 'file_uploaded',
        actor_id: EVE_ID,
        metadata: { file_name: 'team-meeting-2026-02-10.md', file_size: 34567 },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        action_type: 'file_uploaded',
        actor_id: ALICE_ID,
        metadata: { file_name: 'ui-assets-bundle.zip', file_size: 15678900 },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        action_type: 'annotation_added',
        actor_id: ALICE_ID,
        metadata: { source_title: 'Q1 2026 Project Roadmap', preview: 'Q1 priorities look good...' },
      },
      {
        vault_id: '10000000-0000-0000-0000-000000000006',
        action_type: 'annotation_added',
        actor_id: BOB_ID,
        metadata: { source_title: 'Q1 2026 Project Roadmap', preview: 'Agreed with Alice...' },
      },
    ];

    const activityLogs = await supabase.from('activity_logs').insert(activityLogsData).select();

    if (activityLogs.error) {
      console.error('❌ Error adding activity logs:', activityLogs.error);
      return;
    }
    console.log(`✅ Added ${activityLogs.data?.length} activity logs`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${userIds.length} Demo Users`);
    console.log(`   • ${vaults.data?.length} Vaults (including 1 archived)`);
    console.log(`   • ${members.data?.length} Vault Members (owners, contributors, viewers)`);
    console.log(`   • ${sources.data?.length} Sources (varied content types)`);
    console.log(`   • ${annotations.data?.length} Annotations (different authors)`);
    console.log(`   • ${files.data?.length} Files (different formats and sizes)`);
    console.log(`   • ${activityLogs.data?.length} Activity Logs\n`);
    
    console.log('🔑 Demo User Credentials:');
    DEMO_USERS.forEach(user => {
      console.log(`   • ${user.email} / ${user.password}`);
    });
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default seedDatabase;
