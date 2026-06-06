// ==UserScript==
// @name Mileage Analyzer
// @match https://m.gmarket.co.kr/vi/product/*
// @grant none
// ==/UserScript==

(function () {
    'use strict';

    document.getElementById('mileage-analyzer-btn')?.remove();

    const btn = document.createElement('button');
    btn.id = 'mileage-analyzer-btn';
    btn.textContent = '현재 상품 마일리지 분석하기';

    Object.assign(btn.style, {
        position: 'fixed',
        left: '0',
        bottom: '100px',
        width: '100%',
        height: '50px',
        zIndex: '999999',
        border: '0',
        background: '#1976d2',
        color: '#fff',
        fontSize: '18px',
        fontWeight: '700',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.2)'
    });

    document.body.appendChild(btn);

    const format = n => Math.round(n).toLocaleString('ko-KR');

    function detectProduct() {
        const title =
            document.querySelector('meta[property="og:title"]')?.content ||
            document.title;

        if (/북앤라이프|도서문화상품권/i.test(title)) {
            return '북앤라이프';
        }

        if (/컬쳐랜드|문화상품권/i.test(title)) {
            return '컬쳐랜드';
        }

        if (/롯데/i.test(title)) {
            return '롯데';
        }

        if (/현대/i.test(title)) {
            return '현대';
        }

        if (/신세계|이마트/i.test(title)) {
            return '신세계';
        }

        return null;
    }

    function detectFaceValue() {
        const title =
            document.querySelector('meta[property="og:title"]')?.content ||
            document.title;

        const match = title.match(/(\d+)\s*만원/);

        if (match) {
            return Number(match[1]) * 10000;
        }

        return 100000;
    }

    function detectSalePrice() {
        const el = document.querySelector(
            '.box__price-discount .gds-fw-bold'
        );

        if (!el) {
            return null;
        }

        return Number(
            el.textContent.replace(/[^\d]/g, '')
        );
    }

    async function getMarketInfo(product) {

        if (product === '북앤라이프') {
            return {
                siteName: '마일캐시',
                buyPrice: 92000,
                buyRate: 8.0
            };
        }

        if (product === '컬쳐랜드') {
            return {
                siteName: '마일캐시',
                buyPrice: 92000,
                buyRate: 8.0
            };
        }

        const json = await fetch(
            'https://sangse-drab.vercel.app/api/best-all'
        ).then(r => r.json());

        if (!json?.success || !json?.data) {
            throw new Error('시세 정보를 가져오지 못했습니다.');
        }

        switch (product) {
            case '신세계':
                return json.data.shinsegae;

            case '롯데':
                return json.data.lotte;

            case '현대':
                return json.data.hyundai;

            default:
                throw new Error('지원하지 않는 상품권입니다.');
        }
    }

    btn.onclick = async () => {
        try {

            const product = detectProduct();

            if (!product) {
                alert('상품권 종류를 찾을 수 없습니다.');
                return;
            }

            const info = await getMarketInfo(product);

            const faceValue = detectFaceValue();

            let salePrice = detectSalePrice();

            if (!salePrice) {
                salePrice = Number(
                    prompt('판매가를 입력하세요', '')
                );

                if (!salePrice) {
                    return;
                }
            }

            const refundAmount =
                faceValue * (info.buyPrice / 100000);

            const actualCost =
                salePrice - refundAmount;

            const mile1000 =
                Math.floor(salePrice / 1000);

            const mile1500_1 =
                Math.floor(salePrice / 1500);

            const mile1500_2 =
                mile1500_1 * 2;

            const unit1000 =
                mile1000 > 0
                    ? actualCost / mile1000
                    : 0;

            const unit1500_1 =
                mile1500_1 > 0
                    ? actualCost / mile1500_1
                    : 0;

            const unit1500_2 =
                mile1500_2 > 0
                    ? actualCost / mile1500_2
                    : 0;

            const result = [
                '마일리지 분석 결과',
                '',
                `감지된 상품: [ ${product} ]`,
                `매입처: ${info.siteName}`,
                `적용 수수료: ${info.buyRate}%`,
                '',
                `액면가: ${format(faceValue)}원`,
                `판매가: ${format(salePrice)}원`,
                `환급 예상액: ${format(refundAmount)}원`,
                `실 발생비용: ${format(actualCost)}원`,
                '',
                '• 마일리지 적립 및 단가',
                '',
                '[1000원당 1마일]',
                `적립: ${format(mile1000)}M (단가: ${unit1000.toFixed(2)}원)`,
                '',
                '[1500원당 1마일]',
                `적립: ${format(mile1500_1)}M (단가: ${unit1500_1.toFixed(2)}원)`,
                '',
                '[1500원당 2마일]',
                `적립: ${format(mile1500_2)}M (단가: ${unit1500_2.toFixed(2)}원)`
            ].join('\n');

            alert(result);

        } catch (e) {
            console.error(e);
            alert(`오류: ${e.message}`);
        }
    };
})();
