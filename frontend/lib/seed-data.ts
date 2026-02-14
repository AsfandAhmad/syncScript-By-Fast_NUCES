import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

// UUIDs for demo data
const DEMO_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const DEMO_USER_ID_2 = '550e8400-e29b-41d4-a716-446655440002';
const DEMO_USER_ID_3 = '550e8400-e29b-41d4-a716-446655440003';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Create vaults
    console.log('📦 Creating vaults...');
    const vaults = await supabase
      .from('vaults')
      .insert([
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Research Paper Archive',
          description: 'Collection of research papers and articles',
          owner_id: DEMO_USER_ID,
          is_archived: false,
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          name: 'Business Documents',
          description: 'Important business and legal documents',
          owner_id: DEMO_USER_ID,
          is_archived: false,
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          name: 'Learning Resources',
          description: 'Educational materials and tutorials',
          owner_id: DEMO_USER_ID_2,
          is_archived: false,
        },
      ])
      .select();

    if (vaults.error) {
      console.error('❌ Error creating vaults:', vaults.error);
      return;
    }
    console.log('✅ Created 3 vaults');

    // 2. Add vault members
    console.log('👥 Adding vault members...');
    const members = await supabase
      .from('vault_members')
      .insert([
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          user_id: DEMO_USER_ID,
          role: 'owner',
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174002',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          user_id: DEMO_USER_ID_3,
          role: 'contributor',
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174004',
          vault_id: '123e4567-e89b-12d3-a456-426614174002',
          user_id: DEMO_USER_ID,
          role: 'owner',
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174005',
          vault_id: '123e4567-e89b-12d3-a456-426614174003',
          user_id: DEMO_USER_ID_2,
          role: 'owner',
        },
      ])
      .select();

    if (members.error) {
      console.error('❌ Error adding members:', members.error);
      return;
    }
    console.log('✅ Added 4 vault members');

    // 3. Add sources
    console.log('📄 Adding sources...');
    const sources = await supabase
      .from('sources')
      .insert([
        {
          id: '323e4567-e89b-12d3-a456-426614174001',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          url: 'https://arxiv.org/pdf/2301.00123.pdf',
          title: 'Deep Learning Survey 2023',
          metadata: { type: 'pdf', pages: 45, published: '2023-01-15' },
          created_by: DEMO_USER_ID,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174002',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          url: 'https://example.com/article/ai-ethics',
          title: 'AI Ethics in Modern Applications',
          metadata: { type: 'article', word_count: 3500, published: '2023-06-20' },
          created_by: DEMO_USER_ID_3,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174003',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          url: 'https://github.com/example/ml-repo',
          title: 'Machine Learning Repository',
          metadata: { type: 'code', stars: 250, language: 'Python' },
          created_by: DEMO_USER_ID,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174004',
          vault_id: '123e4567-e89b-12d3-a456-426614174002',
          url: 'https://example.com/contract.pdf',
          title: 'Service Agreement 2024',
          metadata: { type: 'legal', pages: 15, version: '2.1' },
          created_by: DEMO_USER_ID,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174005',
          vault_id: '123e4567-e89b-12d3-a456-426614174002',
          url: 'https://example.com/financial-report.xlsx',
          title: 'Q4 Financial Report',
          metadata: { type: 'spreadsheet', sheets: 5, format: 'xlsx' },
          created_by: DEMO_USER_ID,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174006',
          vault_id: '123e4567-e89b-12d3-a456-426614174003',
          url: 'https://www.coursera.org/learn/python',
          title: 'Python for Everybody Course',
          metadata: { type: 'course', duration: '40 hours', platform: 'Coursera' },
          created_by: DEMO_USER_ID_2,
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174007',
          vault_id: '123e4567-e89b-12d3-a456-426614174003',
          url: 'https://example.com/tutorial/react-hooks',
          title: 'React Hooks Tutorial',
          metadata: { type: 'tutorial', language: 'JavaScript', updated: '2023-12-01' },
          created_by: DEMO_USER_ID_2,
        },
      ])
      .select();

    if (sources.error) {
      console.error('❌ Error adding sources:', sources.error);
      return;
    }
    console.log('✅ Added 7 sources');

    // 4. Add annotations
    console.log('💬 Adding annotations...');
    const annotations = await supabase
      .from('annotations')
      .insert([
        {
          id: '423e4567-e89b-12d3-a456-426614174001',
          source_id: '323e4567-e89b-12d3-a456-426614174001',
          content: 'Important: Chapter 3 discusses transformer architecture in detail. Key concepts for implementation.',
          created_by: DEMO_USER_ID,
        },
        {
          id: '423e4567-e89b-12d3-a456-426614174002',
          source_id: '323e4567-e89b-12d3-a456-426614174001',
          content: 'Figure 5 shows performance comparison. Reference for benchmarking.',
          created_by: DEMO_USER_ID_3,
        },
        {
          id: '423e4567-e89b-12d3-a456-426614174003',
          source_id: '323e4567-e89b-12d3-a456-426614174002',
          content: 'Relevant for our bias mitigation strategy. See section 4.2.',
          created_by: DEMO_USER_ID,
        },
        {
          id: '423e4567-e89b-12d3-a456-426614174004',
          source_id: '323e4567-e89b-12d3-a456-426614174004',
          content: 'Need legal review of Section 7 regarding liability. Schedule meeting.',
          created_by: DEMO_USER_ID,
        },
        {
          id: '423e4567-e89b-12d3-a456-426614174005',
          source_id: '323e4567-e89b-12d3-a456-426614174006',
          content: 'Great beginner course. Complete modules 1-3 first.',
          created_by: DEMO_USER_ID_2,
        },
      ])
      .select();

    if (annotations.error) {
      console.error('❌ Error adding annotations:', annotations.error);
      return;
    }
    console.log('✅ Added 5 annotations');

    // 5. Add files
    console.log('📁 Adding files...');
    const files = await supabase
      .from('files')
      .insert([
        {
          id: '523e4567-e89b-12d3-a456-426614174001',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          file_url: 'https://bucket.supabase.co/research-2023.pdf',
          file_name: 'research-2023.pdf',
          file_size: 4521098,
          checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          uploaded_by: DEMO_USER_ID,
        },
        {
          id: '523e4567-e89b-12d3-a456-426614174002',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          file_url: 'https://bucket.supabase.co/notes-ai-ethics.docx',
          file_name: 'notes-ai-ethics.docx',
          file_size: 256340,
          checksum: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
          uploaded_by: DEMO_USER_ID_3,
        },
        {
          id: '523e4567-e89b-12d3-a456-426614174003',
          vault_id: '123e4567-e89b-12d3-a456-426614174002',
          file_url: 'https://bucket.supabase.co/contract-signed.pdf',
          file_name: 'contract-signed.pdf',
          file_size: 892134,
          checksum: 'b3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          uploaded_by: DEMO_USER_ID,
        },
        {
          id: '523e4567-e89b-12d3-a456-426614174004',
          vault_id: '123e4567-e89b-12d3-a456-426614174002',
          file_url: 'https://bucket.supabase.co/q4-report.xlsx',
          file_name: 'q4-report.xlsx',
          file_size: 1234567,
          checksum: 'c4b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          uploaded_by: DEMO_USER_ID,
        },
        {
          id: '523e4567-e89b-12d3-a456-426614174005',
          vault_id: '123e4567-e89b-12d3-a456-426614174003',
          file_url: 'https://bucket.supabase.co/python-notes.txt',
          file_name: 'python-notes.txt',
          file_size: 45670,
          checksum: 'd5b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          uploaded_by: DEMO_USER_ID_2,
        },
      ])
      .select();

    if (files.error) {
      console.error('❌ Error adding files:', files.error);
      return;
    }
    console.log('✅ Added 5 files');

    // 6. Add activity logs
    console.log('📊 Adding activity logs...');
    const activities = await supabase
      .from('activity_logs')
      .insert([
        {
          id: '623e4567-e89b-12d3-a456-426614174001',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          action_type: 'vault_created',
          actor_id: DEMO_USER_ID,
          metadata: { name: 'Research Paper Archive' },
        },
        {
          id: '623e4567-e89b-12d3-a456-426614174002',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          action_type: 'source_added',
          actor_id: DEMO_USER_ID,
          metadata: { source_id: '323e4567-e89b-12d3-a456-426614174001', title: 'Deep Learning Survey 2023' },
        },
        {
          id: '623e4567-e89b-12d3-a456-426614174003',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          action_type: 'member_added',
          actor_id: DEMO_USER_ID,
          metadata: { user_id: DEMO_USER_ID_3, role: 'contributor' },
        },
        {
          id: '623e4567-e89b-12d3-a456-426614174004',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          action_type: 'annotation_added',
          actor_id: DEMO_USER_ID,
          metadata: { source_id: '323e4567-e89b-12d3-a456-426614174001', content: 'Important: Chapter 3...' },
        },
        {
          id: '623e4567-e89b-12d3-a456-426614174005',
          vault_id: '123e4567-e89b-12d3-a456-426614174001',
          action_type: 'file_uploaded',
          actor_id: DEMO_USER_ID,
          metadata: { file_name: 'research-2023.pdf', file_size: 4521098 },
        },
        {
          id: '623e4567-e89b-12d3-a456-426614174006',
          vault_id: '123e4567-e89b-12d3-a456-426614174002',
          action_type: 'vault_created',
          actor_id: DEMO_USER_ID,
          metadata: { name: 'Business Documents' },
        },
        {
          id: '623e4567-e89b-12d3-a456-426614174007',
          vault_id: '123e4567-e89b-12d3-a456-426614174002',
          action_type: 'source_added',
          actor_id: DEMO_USER_ID,
          metadata: { source_id: '323e4567-e89b-12d3-a456-426614174004', title: 'Service Agreement 2024' },
        },
        {
          id: '623e4567-e89b-12d3-a456-426614174008',
          vault_id: '123e4567-e89b-12d3-a456-426614174003',
          action_type: 'vault_created',
          actor_id: DEMO_USER_ID_2,
          metadata: { name: 'Learning Resources' },
        },
        {
          id: '623e4567-e89b-12d3-a456-426614174009',
          vault_id: '123e4567-e89b-12d3-a456-426614174003',
          action_type: 'source_added',
          actor_id: DEMO_USER_ID_2,
          metadata: { source_id: '323e4567-e89b-12d3-a456-426614174006', title: 'Python for Everybody Course' },
        },
        {
          id: '623e4567-e89b-12d3-a456-426614174010',
          vault_id: '123e4567-e89b-12d3-a456-426614174003',
          action_type: 'annotation_added',
          actor_id: DEMO_USER_ID_2,
          metadata: { source_id: '323e4567-e89b-12d3-a456-426614174006', content: 'Great beginner course...' },
        },
      ])
      .select();

    if (activities.error) {
      console.error('❌ Error adding activity logs:', activities.error);
      return;
    }
    console.log('✅ Added 10 activity logs');

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   • 3 Vaults');
    console.log('   • 4 Vault Members');
    console.log('   • 7 Sources');
    console.log('   • 5 Annotations');
    console.log('   • 5 Files');
    console.log('   • 10 Activity Logs');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
