import { crawlGogoExchange } from './src/lib/crawlers/gogoexchange';

async function run() {
  console.log('--- 고고상품권 파싱 ---');
  const result = await crawlGogoExchange();
  console.log(result.prices);
}

run();
