import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/vaults
 * Get all vaults for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: vaults, error } = await supabase
      .from('vaults')
      .select('*')
      .or(`owner_id.eq.${user.id},vault_members.user_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ vaults });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * POST /api/vaults
 * Create a new vault
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Vault name is required' },
        { status: 400 }
      );
    }

    const { data: vault, error } = await supabase
      .from('vaults')
      .insert({
        name,
        description,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Add creator as owner in vault_members
    await supabase.from('vault_members').insert({
      vault_id: vault.id,
      user_id: user.id,
      role: 'owner',
    });

    return NextResponse.json({ vault }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
