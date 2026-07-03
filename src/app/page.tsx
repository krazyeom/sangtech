'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PriceData {
  id: number;
  site_name: string;
  site_url: string;
  gift_card_type: 'shinsegae' | 'hyundai' | 'lotte';
  denomination: number;
  buy_price: number;
  buy_rate: number;
}

const GIFT_CARD_NAMES = {
  lotte: '롯데 상품권',
  shinsegae: '신세계 상품권',
  hyundai: '현대 상품권'
};

const EXCLUDED_COMPARE_SITES = ['맥스솔루션', '도전상품권', '기프너스', 'VIP상품권'];

const isExcludedCompareSite = (siteName: string) =>
  EXCLUDED_COMPARE_SITES.some((excluded) => siteName.includes(excluded));

export default function Home() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isUpdateDelayed, setIsUpdateDelayed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/prices');
        const data = await res.json();
        if (data.success) {
          setPrices(data.prices);
          if (data.lastCrawledAt) {
            const crawledDate = new Date(data.lastCrawledAt);
            setLastUpdate(crawledDate.toLocaleString('ko-KR'));
            
            const diffMs = Date.now() - crawledDate.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            setIsUpdateDelayed(diffMins >= 5);
          }
        }
      } catch (err) {
        console.error('Failed to fetch prices', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    
    // 30초마다 갱신 (자동 리프레시)
    const interval = setInterval(fetchPrices, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>Loading...</div>;
  }

  // 각 상품권 종류별 가장 높은 매입가(비교 제외 업체는 제외)
  const bestPrices = {
    shinsegae: Math.max(...prices.filter(p => p.gift_card_type === 'shinsegae' && !isExcludedCompareSite(p.site_name)).map(p => p.buy_price), 0),
    lotte: Math.max(...prices.filter(p => p.gift_card_type === 'lotte' && !isExcludedCompareSite(p.site_name)).map(p => p.buy_price), 0),
    hyundai: Math.max(...prices.filter(p => p.gift_card_type === 'hyundai' && !isExcludedCompareSite(p.site_name)).map(p => p.buy_price), 0),
  };

  // 렌더링용 사이트 목록 추출
  let siteNames = Array.from(new Set(prices.map(p => p.site_name)));

  // 각 사이트별로 전체 상품권 중 베스트 가격을 몇 개나 가지고 있는지 카운트, 그리고 3종류 총합 계산
  const siteBestCount: Record<string, number> = {};
  const siteComparableSumPrice: Record<string, number> = {};

  prices.forEach(p => {
    if (isExcludedCompareSite(p.site_name)) return;

    // 비교 대상 업체만 총합과 베스트 카운트에 포함
    siteComparableSumPrice[p.site_name] = (siteComparableSumPrice[p.site_name] || 0) + p.buy_price;

    const type = p.gift_card_type as keyof typeof bestPrices;
    if (p.buy_price === bestPrices[type]) {
      siteBestCount[p.site_name] = (siteBestCount[p.site_name] || 0) + 1;
    }
  });

  // 사이트 목록 정렬 (비교 대상 우선 -> 베스트 가격 보유 개수 -> 3종류 총합 -> 이름 가나다순)
  siteNames.sort((a, b) => {
    const isExcludedA = isExcludedCompareSite(a);
    const isExcludedB = isExcludedCompareSite(b);
    if (isExcludedA !== isExcludedB) return isExcludedA ? 1 : -1;

    // 1순위: 최고가 보유 개수
    const countA = siteBestCount[a] || 0;
    const countB = siteBestCount[b] || 0;
    if (countB !== countA) return countB - countA;
    
    // 2순위: 동점일 경우 하이티켓 최우선
    if (a === '하이티켓') return -1;
    if (b === '하이티켓') return 1;

    // 3순위: 전체 상품권 매입가 합계
    const sumA = siteComparableSumPrice[a] || 0;
    const sumB = siteComparableSumPrice[b] || 0;
    if (sumB !== sumA) return sumB - sumA;
    
    // 4순위: 이름순
    return a.localeCompare(b, 'ko-KR');
  });

  // 크롤링에 실패해 DB에 없는 '베스트상품권'을 테이블 최하단에 수동으로 추가 (클릭 이동용)
  if (!siteNames.includes('베스트상품권')) {
    siteNames.push('베스트상품권');
  }

  // 사이트별 데이터를 맵으로 구성
  const siteDataMap: Record<string, Record<string, PriceData>> = {};
  siteNames.forEach(site => {
    siteDataMap[site] = {};
    prices.filter(p => p.site_name === site).forEach(p => {
      siteDataMap[site][p.gift_card_type] = p;
    });
  });

  return (
    <div className="container">
      <section className="best-cards">
        {(Object.keys(GIFT_CARD_NAMES) as Array<keyof typeof GIFT_CARD_NAMES>).map(type => {
          const typePrices = prices.filter(p => p.gift_card_type === type && !isExcludedCompareSite(p.site_name));
          if (typePrices.length === 0) return null;
          
          const best = typePrices.reduce((prev, curr) => {
            if (curr.buy_price > prev.buy_price) return curr;
            if (curr.buy_price === prev.buy_price) {
              // 동점 시 하이티켓 무조건 우선
              if (curr.site_name === '하이티켓') return curr;
              if (prev.site_name === '하이티켓') return prev;

              // tie-breaker: check global tie-breaker counts
              const pCount = siteBestCount[prev.site_name] || 0;
              const cCount = siteBestCount[curr.site_name] || 0;
              if (cCount > pCount) return curr;
              if (cCount === pCount) {
                const pSum = siteComparableSumPrice[prev.site_name] || 0;
                const cSum = siteComparableSumPrice[curr.site_name] || 0;
                if (cSum > pSum) return curr;
              }
            }
            return prev;
          });

          return (
            <div className="card" key={type}>
              <h3 className="card-title">{GIFT_CARD_NAMES[type]} 베스트</h3>
              <div className="card-content">
                <div>
                  <div className="best-price">{best.buy_price.toLocaleString()}원</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{best.buy_rate}% 할인율</div>
                </div>
                <div className="best-site">
                  <a href={best.site_url} target="_blank" rel="noreferrer" className="site-link">
                    {best.site_name} ↗
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {lastUpdate && (
        <div style={{ textAlign: 'right', marginBottom: '0.8rem', fontSize: '0.85rem', color: isUpdateDelayed ? '#ef4444' : 'var(--text-secondary)' }}>
          마지막 업데이트: {lastUpdate} (총 {siteNames.length}개 업체 지원)
          {isUpdateDelayed && <span style={{ marginLeft: '6px', fontWeight: 'bold' }}>⚠️ 5분 이상 경과 (시세 지연)</span>}
        </div>
      )}

      <section className="table-container">
        <table>
          <thead>
            <tr>
              <th>상품권 샵</th>
              <th>롯데<span className="hide-mobile"> (10만원권)</span></th>
              <th>신세계<span className="hide-mobile"> (10만원권)</span></th>
              <th>현대<span className="hide-mobile"> (10만원권)</span></th>
            </tr>
          </thead>
          <tbody>
            {siteNames.map(site => {
              const url = site === '베스트상품권' 
                ? 'https://bestgiftcard.kr/' 
                : (siteDataMap[site]['shinsegae']?.site_url || siteDataMap[site]['lotte']?.site_url || siteDataMap[site]['hyundai']?.site_url);
              return (
                <tr key={site} className={site === '맥스솔루션(안양)' ? 'row-maxsolution' : site === '도전상품권(삼성)' ? 'row-dojeon' : ''}>
                  <td>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className={`site-link ${siteBestCount[site] ? `best-count-${siteBestCount[site]}` : ''}`}
                    >
                      {site}
                    </a>
                  </td>
                  {(['lotte', 'shinsegae', 'hyundai'] as const).map(type => {
                    const priceData = siteDataMap[site][type];
                    const isBest = priceData && priceData.buy_price === bestPrices[type];
                    
                    return (
                      <td key={type} className={isBest ? 'highlight price-cell' : 'price-cell'}>
                        {priceData ? (
                          <>
                            <span className="price-value">{priceData.buy_price.toLocaleString()}원</span>
                            <span className="price-rate">
                              ({priceData.buy_rate}%)
                              {!isBest && (() => {
                                const diff = priceData.buy_price - bestPrices[type];
                                const color = diff > 0 ? '#ef4444' : '#3b82f6';
                                return <span style={{ color }}>({diff.toLocaleString()})</span>;
                              })()}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
