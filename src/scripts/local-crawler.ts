import { config } from 'dotenv';
import path from 'path';
import ws from 'ws';

// Polyfill WebSocket for Supabase in Node.js < 22 environments
(global as any).WebSocket = ws;

// MUST happen before DB connection
config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const { crawlAll } = await import('../lib/crawlers');
  const db = (await import('../lib/db')).default;

  console.log(`[Local Crawler] Starting crawl at ${new Date().toLocaleString()}`);
  
  try {
    const results = await crawlAll();
    console.log(`[Local Crawler] Fetched data for ${results.length} sites.`);

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
      const { error: deleteError } = await db.from('prices').delete().gte('id', 0);
      if (deleteError) {
        console.error('[Local Crawler] Failed to clear old prices:', deleteError);
        throw deleteError;
      }

      const { error: insertError } = await db.from('prices').insert(rowsToInsert);
      if (insertError) {
        console.error('[Local Crawler] Failed to insert new prices:', insertError);
        throw insertError;
      }
      
      // Get today's date in KST (UTC+9)
      const now = new Date();
      const kstTime = now.getTime() + (9 * 60 * 60 * 1000);
      const today = new Date(kstTime).toISOString().split('T')[0];
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
      
      console.log(`[Local Crawler] Successfully updated ${rowsToInsert.length} prices to Supabase.`);
    } else {
      console.log('[Local Crawler] No prices found to insert.');
    }
  } catch (error) {
    console.error('[Local Crawler] Error during crawl:', error);
  } finally {
    console.log('[Local Crawler] Job finished.\n');
    process.exit(0);
  }
}

main();
