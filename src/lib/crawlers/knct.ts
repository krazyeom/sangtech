import Tesseract from 'tesseract.js';
import { CrawlResult, PriceInfo } from '../types';
import axios from 'axios';
import sharp from 'sharp';

function extractRate(line: string): number | null {
  const pctIndex = line.indexOf('%');
  if (pctIndex === -1) return null;

  const strBeforePct = line.substring(Math.max(0, pctIndex - 20), pctIndex);
  const match = strBeforePct.match(/([0-9]+)$/);
  if (!match) return null;
  
  const digits = match[1];
  
  for (let len = 3; len >= 2; len--) {
      for (let start = 0; start <= digits.length - (len * 2 + 1); start++) {
          const r1 = digits.substring(start, start + len);
          const r2 = digits.substring(start + len + 1, start + len + 1 + len);
          
          const num1 = parseInt(r1, 10);
          const num2 = parseInt(r2, 10);
          
          if (num1 >= 20 && num1 <= 500 && num2 >= 20 && num2 <= 500) {
              return len === 2 ? num1 / 10 : num1 / 100;
          }
      }
  }
  return null;
}

export async function crawlKnct(): Promise<CrawlResult> {
  const url = 'https://knct.shop/priceall/';
  const prices: PriceInfo[] = [];

  try {
    const imageUrl = 'http://knct.shop/price/price.jpg';
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');

    const worker = await Tesseract.createWorker('eng');
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_WORD,
      tessedit_char_whitelist: '0123456789,',
    });
    
    const regions = [
      { type: 'hyundai', rect: { left: 252, top: 153, width: 180, height: 70 } },
      { type: 'shinsegae', rect: { left: 252, top: 362, width: 180, height: 70 } },
      { type: 'lotte', rect: { left: 252, top: 471, width: 180, height: 70 } }
    ];

    for (const region of regions) {
      const croppedBuffer = await sharp(imageBuffer)
        .extract(region.rect)
        .resize({ width: 720 })
        .grayscale()
        .normalize()
        .sharpen()
        .threshold(170)
        .toBuffer();

      const { data } = await worker.recognize(croppedBuffer);
      const rawText = data.text;
      
      const cleaned = rawText.replace(/[^\d]/g, '');
      if (cleaned.length >= 5) {
        // Extract the first 5 digits representing the price (e.g. 96600)
        const buyPrice = parseInt(cleaned.substring(0, 5), 10);
        
        if (buyPrice > 10000 && buyPrice <= 100000) {
          const buyRate = Math.round(((100000 - buyPrice) / 100000) * 100 * 100) / 100;
          
          if (buyRate <= 5) {
            prices.push({
              giftCardType: region.type as 'hyundai' | 'shinsegae' | 'lotte',
              denomination: 100000,
              buyPrice,
              buyRate
            });
          } else {
            console.warn(`[knct] Discount rate > 5% for ${region.type}. buyRate: ${buyRate}`);
          }
        } else {
          console.warn(`[knct] Extracted price abnormal for ${region.type}. buyPrice: ${buyPrice}`);
        }
      } else {
        console.warn(`[knct] Failed to extract price for ${region.type}. Raw text: ${rawText}`);
      }
    }
    
    await worker.terminate();
  } catch (error) {
    console.error('Error in crawlKnct (OCR):', error);
  }

  return {
    siteName: '도전상품권(삼성)',
    siteUrl: url,
    timestamp: new Date(),
    prices
  };
}
