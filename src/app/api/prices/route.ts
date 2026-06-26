import { NextResponse } from 'next/server';
import db, { hasSupabaseConfig } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = db;
    if (!hasSupabaseConfig || !client) {
      return NextResponse.json({ success: true, lastCrawledAt: null, prices: [] });
    }

    const { data: prices, error } = await client.from('prices')
      .select('*')
      .order('gift_card_type', { ascending: true })
      .order('buy_price', { ascending: false });

    if (error) throw error;

    // 마지막 크롤링 시간 찾기
    let lastCrawledAt = null;
    if (prices && prices.length > 0) {
      lastCrawledAt = prices[0].crawled_at;
    }

    return NextResponse.json({
      success: true,
      lastCrawledAt,
      prices: prices || []
    });
  } catch (error) {
    console.error('Failed to fetch prices API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
