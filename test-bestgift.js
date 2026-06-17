const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
  });
  const page = await browser.newPage();
  console.log('Navigating...');
  await page.goto('https://bestgiftcard.kr/', { waitUntil: 'networkidle2' });
  console.log('Navigated. Waiting for 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page text snapshot length:', text.length);
  console.log('Text preview:', text.substring(0, 500));
  
  // Save screenshot
  await page.screenshot({ path: '/home/krazyeom/dev/sangse/screenshot.png' });
  console.log('Screenshot saved to screenshot.png');
  
  await browser.close();
})();
