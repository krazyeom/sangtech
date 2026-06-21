import * as fs from 'fs';
import * as path from 'path';

function processFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace logic in page.tsx / market-calculator / calculator
    content = content.replace(/!p\.site_name\.includes\('맥스솔루션'\)\s*&&\s*!p\.site_name\.includes\('도전상품권'\)/g, 
        "!p.site_name.includes('맥스솔루션') && !p.site_name.includes('도전상품권') && !p.site_name.includes('기프너스') && !p.site_name.includes('VIP상품권')");
        
    content = content.replace(/p\.site_name\.includes\('맥스솔루션'\)\s*\|\|\s*p\.site_name\.includes\('도전상품권'\)/g, 
        "p.site_name.includes('맥스솔루션') || p.site_name.includes('도전상품권') || p.site_name.includes('기프너스') || p.site_name.includes('VIP상품권')");

    // Replace API routes logic
    content = content.replace(/\.not\('site_name', 'ilike', '%도전상품권%'\)/g, 
        ".not('site_name', 'ilike', '%도전상품권%')\n      .not('site_name', 'ilike', '%기프너스%')\n      .not('site_name', 'ilike', '%VIP상품권%')");

    // Fix some comments
    content = content.replace(/맥스솔루션, 도전상품권은 전체 랭킹 카운트에서 제외/g, '맥스솔루션, 도전상품권, 기프너스, VIP상품권은 전체 랭킹 카운트에서 제외');
    content = content.replace(/\(exclude 맥스솔루션, 도전상품권 from best\)/g, '(exclude 맥스솔루션, 도전상품권, 기프너스, VIP상품권 from best)');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
}

const files = [
    'src/app/page.tsx',
    'src/app/calculator/page.tsx',
    'src/app/market-calculator/page.tsx',
    'src/app/api/best/route.ts',
    'src/app/api/best-all/route.ts',
];

for (const file of files) {
    processFile(path.join(process.cwd(), file));
}
