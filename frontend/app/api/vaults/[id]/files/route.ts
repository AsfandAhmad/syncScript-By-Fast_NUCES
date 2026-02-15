import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAuthUser, unauthorizedResponse } from '@/lib/api-auth';

/**
 * GET /api/vaults/[id]/files – list files for a vault
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const { id: vaultId } = await params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * POST /api/vaults/[id]/files – upload file to storage + create DB record
 * Accepts multipart/form-data with fields: file, checksum
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const { id: vaultId } = await params;
    const supabase = createServerSupabaseClient();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const checksum = (formData.get('checksum') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine subfolder based on file type
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const pdfExtensions = ['pdf'];
    const folder = pdfExtensions.includes(ext) ? 'pdfs' : 'docs';

    // Upload to Supabase Storage using service_role (bypasses storage RLS)
    // Path: {vaultId}/pdfs/{timestamp}-{name} or {vaultId}/docs/{timestamp}-{name}
    const timestamp = Date.now();
    const storagePath = `${vaultId}/${folder}/${timestamp}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('vault-files')
      .upload(storagePath, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Save file record in DB
    const { data, error } = await supabase
      .from('files')
      .insert({
        vault_id: vaultId,
        file_url: storagePath,
        file_name: file.name,
        file_size: file.size,
        checksum,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) {
      // Cleanup: remove the uploaded file if DB insert fails
      await supabase.storage.from('vault-files').remove([storagePath]);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      vault_id: vaultId,
      action_type: 'file_uploaded',
      actor_id: user.id,
      metadata: { file_id: data.id, file_name: file.name, file_size: file.size },
    });

    // Notify vault members (excluding the uploader)
    const { data: members } = await supabase.from('vault_members').select('user_id').eq('vault_id', vaultId);
    if (members && members.length > 0) {
      const notifRows = members
        .filter((m) => m.user_id !== user.id)
        .map((m) => ({
          user_id: m.user_id,
          vault_id: vaultId,
          type: 'file_uploaded',
          title: 'New file uploaded',
          message: `"${file.name}" was uploaded`,
          metadata: { vault_id: vaultId, file_id: data.id, file_name: file.name },
        }));
      if (notifRows.length > 0) {
        try { await supabase.from('notifications').insert(notifRows); } catch { /* table may not exist */ }
      }
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * DELETE /api/vaults/[id]/files?fileId=xxx&storagePath=xxx
 * Deletes from both storage and DB
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthUser(request);
    if (authError || !user) {
      return unauthorizedResponse(authError || undefined);
    }

    const { id: vaultId } = await params;
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const storagePath = searchParams.get('storagePath');

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    // Remove from storage if path is provided
    if (storagePath) {
      await supabase.storage.from('vault-files').remove([storagePath]);
    }

    // Remove DB record
    const { error } = await supabase.from('files').delete().eq('id', fileId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      vault_id: vaultId,
      action_type: 'file_deleted',
      actor_id: user.id,
      metadata: { file_id: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
