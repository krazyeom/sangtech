import { NextResponse } from 'next/server';
import db, { hasSupabaseConfig } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = db;
    if (!hasSupabaseConfig || !client) {
      return NextResponse.json({ success: true, data: {} });
    }

    const { data: prices, error } = await client.from('prices')
      .select('*')
      .not('site_name', 'ilike', '%맥스솔루션%')
      .not('site_name', 'ilike', '%도전상품권%')
      .not('site_name', 'ilike', '%기프너스%')
      .not('site_name', 'ilike', '%VIP상품권%');

    if (error) throw error;

    if (!prices || prices.length === 0) {
      return NextResponse.json({ success: true, data: {} });
    }

    const types = ['shinsegae', 'lotte', 'hyundai'];
    
    // 1. Find absolute maximum prices for each type
    const absoluteMaxPrices: Record<string, number> = {};
    for (const type of types) {
      const typePrices = prices.filter(p => p.gift_card_type === type);
      if (typePrices.length > 0) {
        absoluteMaxPrices[type] = Math.max(...typePrices.map(p => p.buy_price));
      }
    }

    // 2. Count how many times each site has an absolute max price
    const siteBestCount: Record<string, number> = {};
    prices.forEach(p => {
      const type = p.gift_card_type;
      if (p.buy_price === absoluteMaxPrices[type]) {
        siteBestCount[p.site_name] = (siteBestCount[p.site_name] || 0) + 1;
      }
    });

    const bestPrices: Record<string, any> = {};

    for (const type of types) {
      const typePrices = prices.filter(p => p.gift_card_type === type);
      if (typePrices.length > 0) {
        // Sort descending by buy_price, then descending by siteBestCount
        typePrices.sort((a, b) => {
          if (b.buy_price !== a.buy_price) {
            return b.buy_price - a.buy_price;
          }
          const countA = siteBestCount[a.site_name] || 0;
          const countB = siteBestCount[b.site_name] || 0;
          return countB - countA;
        });
        
        const best = typePrices[0];
        bestPrices[type] = {
          siteName: best.site_name,
          buyPrice: best.buy_price,
          buyRate: best.buy_rate,
          siteUrl: best.site_url
        };
      } else {
        bestPrices[type] = null;
      }
    }

    return NextResponse.json({ success: true, data: bestPrices });
  } catch (error) {
    console.error('Failed to fetch best-all API:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
