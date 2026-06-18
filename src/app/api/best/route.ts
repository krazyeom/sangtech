import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Fetch ALL prices to calculate global tie-breakers (exclude 맥스솔루션, 도전상품권 from best)
    const { data: allPrices, error } = await db.from('prices')
      .select('*')
      .neq('site_name', '맥스솔루션')
      .neq('site_name', '도전상품권');

    if (error) throw error;

    if (!allPrices || allPrices.length === 0) {
      return NextResponse.json({ success: true, best: null, allPrices: [] });
    }

    const types = ['shinsegae', 'lotte', 'hyundai'];
    const absoluteMaxPrices: Record<string, number> = {};
    for (const t of types) {
      const typePrices = allPrices.filter(p => p.gift_card_type === t);
      if (typePrices.length > 0) {
        absoluteMaxPrices[t] = Math.max(...typePrices.map(p => p.buy_price));
      }
    }

    const siteBestCount: Record<string, number> = {};
    allPrices.forEach(p => {
      const t = p.gift_card_type;
      if (p.buy_price === absoluteMaxPrices[t]) {
        siteBestCount[p.site_name] = (siteBestCount[p.site_name] || 0) + 1;
      }
    });

    // Filter by requested type if provided
    let prices = type ? allPrices.filter(p => p.gift_card_type === type) : [...allPrices];

    // Sort by buy_price descending, then by siteBestCount descending
    prices.sort((a, b) => {
      if (b.buy_price !== a.buy_price) {
        return b.buy_price - a.buy_price;
      }
      const countA = siteBestCount[a.site_name] || 0;
      const countB = siteBestCount[b.site_name] || 0;
      return countB - countA;
    });

    const bestPrice = prices[0];

    return NextResponse.json({
      success: true,
      best: {
        siteName: bestPrice.site_name,
        buyPrice: bestPrice.buy_price,
        buyRate: bestPrice.buy_rate
      },
      allPrices: prices
    });
  } catch (error) {
    console.error('Failed to fetch best prices API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
