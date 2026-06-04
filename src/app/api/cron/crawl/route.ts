import { NextResponse } from 'next/server';
import { crawlAll } from '@/lib/crawlers';
import db from '@/lib/db';

export const dynamic = 'force-dynamic'; // 항상 동적으로 실행되도록 (캐시 방지)

export async function GET(request: Request) {
  try {
    // 0. 클라우드 자동 크롤링 옵션 체크 (Vercel에서 끄고 싶을 때 사용)
    if (process.env.ENABLE_CLOUD_CRAWL !== 'true') {
      console.log('[Cron] Cloud crawling is disabled via ENABLE_CLOUD_CRAWL.');
      return NextResponse.json({ success: false, message: 'Cloud crawling is disabled' }, { status: 200 });
    }

    // 1. 보안 체크 (Vercel Cron 또는 수동 호출 시 인증)
    // 로컬 환경이나 CRON_SECRET이 정의되지 않은 경우 통과 허용, 프로덕션에서는 필수
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Cron] Starting to crawl prices...');
    const results = await crawlAll();

    // Insert용 배열 구성
    const rowsToInsert: any[] = [];
    for (const res of results) {
      for (const p of res.prices) {
        rowsToInsert.push({
          site_name: res.siteName,
          site_url: res.siteUrl,
          gift_card_type: p.giftCardType,
          denomination: p.denomination,
          buy_price: p.buyPrice,
          buy_rate: p.buyRate,
          crawled_at: res.timestamp.toISOString()
        });
      }
    }

    if (rowsToInsert.length > 0) {
      // 2. 과거 데이터 삭제 (id >= 0 조건을 주어 전체 삭제)
      const { error: deleteError } = await db.from('prices').delete().gte('id', 0);
      if (deleteError) {
        console.error('[Cron] Failed to clear old prices:', deleteError);
        throw deleteError;
      }

      // 3. 최신 데이터 삽입
      const { error: insertError } = await db.from('prices').insert(rowsToInsert);
      if (insertError) {
        console.error('[Cron] Failed to insert new prices:', insertError);
        throw insertError;
      }
      
      // 4. 시세 변동 기록 (price_history) 저장
      const today = new Date().toISOString().split('T')[0];
      const types = ['shinsegae', 'lotte', 'hyundai'];
      for (const type of types) {
        const { data: bestPrices } = await db.from('prices')
          .select('*')
          .eq('gift_card_type', type)
          .order('buy_price', { ascending: false })
          .limit(1);
          
        if (bestPrices && bestPrices.length > 0) {
          const best = bestPrices[0];
          const { data: existing } = await db.from('price_history')
            .select('id')
            .eq('date', today)
            .eq('gift_card_type', type)
            .limit(1);
            
          if (existing && existing.length > 0) {
            await db.from('price_history')
              .update({
                best_buy_price: best.buy_price,
                best_buy_rate: best.buy_rate,
                best_site_name: best.site_name
              })
              .eq('id', existing[0].id);
          } else {
            await db.from('price_history')
              .insert({
                date: today,
                gift_card_type: type,
                best_buy_price: best.buy_price,
                best_buy_rate: best.buy_rate,
                best_site_name: best.site_name
              });
          }
        }
      }
    }

    console.log(`[Cron] Successfully updated prices from ${results.length} sites.`);
    return NextResponse.json({ success: true, count: rowsToInsert.length });
  } catch (error) {
    console.error('[Cron] Failed to update DB:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
