import { NextResponse } from 'next/server';
import db, { hasSupabaseConfig } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const client = db;
    if (!hasSupabaseConfig || !client) {
      return NextResponse.json({ success: true, history: [] });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const days = parseInt(searchParams.get('days') || '30', 10);

    let query = client.from('price_history')
      .select('*')
      .order('date', { ascending: true })
      .limit(days * 3); // up to 3 types per day

    if (type !== 'all') {
      query = query.eq('gift_card_type', type);
    }

    const { data: history, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      history: history || []
    });
  } catch (error) {
    console.error('Failed to fetch history API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
