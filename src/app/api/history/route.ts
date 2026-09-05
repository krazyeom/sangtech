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
    const daysParam = searchParams.get('days');
    const range = searchParams.get('range') || (daysParam ? 'days' : '30d');

    let query = client.from('price_history')
      .select('*')
      .order('date', { ascending: true });

    if (range === 'days' && daysParam) {
      const days = parseInt(daysParam, 10);
      if (!Number.isNaN(days) && days > 0) {
        const now = new Date(Date.now() + (9 * 60 * 60 * 1000));
        now.setUTCDate(now.getUTCDate() - (days - 1));
        const cutoff = now.toISOString().split('T')[0];
        query = query.gte('date', cutoff);
      }
    } else if (range !== 'all') {
      const daysMap: Record<string, number> = {
        '30d': 30,
        '60d': 60,
        '90d': 90,
        '180d': 180,
        '365d': 365,
      };
      const days = daysMap[range];
      if (days) {
        const now = new Date(Date.now() + (9 * 60 * 60 * 1000));
        now.setUTCDate(now.getUTCDate() - (days - 1));
        const cutoff = now.toISOString().split('T')[0];
        query = query.gte('date', cutoff);
      }
    }

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
