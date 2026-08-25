import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: items, error } = await supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Share API error:', error);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    return NextResponse.json({ items });
  } catch (err) {
    console.error('Share API exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
