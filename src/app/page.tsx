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
  shinsegae: '신세계 상품권',
  lotte: '롯데 상품권',
  hyundai: '현대 상품권'
};

export default function Home() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/prices');
        const data = await res.json();
        if (data.success) {
          setPrices(data.prices);
          if (data.lastCrawledAt) {
            setLastUpdate(new Date(data.lastCrawledAt).toLocaleString('ko-KR'));
          }
        }
      } catch (err) {
        console.error('Failed to fetch prices', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    
    // 5분마다 갱신
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>Loading...</div>;
  }

  // 각 상품권 종류별 가장 높은 매입가(최저 할인율) 찾기
  const bestPrices = {
    shinsegae: Math.max(...prices.filter(p => p.gift_card_type === 'shinsegae').map(p => p.buy_price), 0),
    lotte: Math.max(...prices.filter(p => p.gift_card_type === 'lotte').map(p => p.buy_price), 0),
    hyundai: Math.max(...prices.filter(p => p.gift_card_type === 'hyundai').map(p => p.buy_price), 0),
  };

  // 렌더링용 사이트 목록 추출
  const siteNames = Array.from(new Set(prices.map(p => p.site_name)));

  // 각 사이트별로 전체 상품권 중 베스트 가격을 몇 개나 가지고 있는지 카운트
  const siteBestCount: Record<string, number> = {};
  prices.forEach(p => {
    const type = p.gift_card_type as keyof typeof bestPrices;
    if (p.buy_price === bestPrices[type]) {
      siteBestCount[p.site_name] = (siteBestCount[p.site_name] || 0) + 1;
    }
  });

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
      <div className="meta-info" style={{ textAlign: 'right', marginBottom: '1rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'flex-end', gap: '8px', color: 'var(--text-secondary)' }}>
        {lastUpdate && <span>마지막 업데이트: {lastUpdate}</span>}
        {lastUpdate && <span>|</span>}
        <span>크롤링 주기: 10분</span>
      </div>

      <section className="best-cards">
        {(Object.keys(GIFT_CARD_NAMES) as Array<keyof typeof GIFT_CARD_NAMES>).map(type => {
          const typePrices = prices.filter(p => p.gift_card_type === type);
          if (typePrices.length === 0) return null;
          
          const best = typePrices.reduce((prev, curr) => {
            if (curr.buy_price > prev.buy_price) return curr;
            if (curr.buy_price === prev.buy_price) {
              const prevCount = siteBestCount[prev.site_name] || 0;
              const currCount = siteBestCount[curr.site_name] || 0;
              return currCount > prevCount ? curr : prev;
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

      <section className="table-container">
        <table>
          <thead>
            <tr>
              <th>상품권 샵</th>
              <th>신세계 (10만원권)</th>
              <th>롯데 (10만원권)</th>
              <th>현대 (10만원권)</th>
            </tr>
          </thead>
          <tbody>
            {siteNames.map(site => {
              const url = siteDataMap[site]['shinsegae']?.site_url || siteDataMap[site]['lotte']?.site_url || siteDataMap[site]['hyundai']?.site_url;
              return (
                <tr key={site}>
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
                  {(['shinsegae', 'lotte', 'hyundai'] as const).map(type => {
                    const priceData = siteDataMap[site][type];
                    const isBest = priceData && priceData.buy_price === bestPrices[type];
                    
                    return (
                      <td key={type} className={isBest ? 'highlight price-cell' : 'price-cell'}>
                        {priceData ? (
                          <>
                            <span className="price-value">{priceData.buy_price.toLocaleString()}원</span>
                            <span className="price-rate">({priceData.buy_rate}%)</span>
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

      <footer>
        <p>
          made by <a href="https://github.com/krazyeom" target="_blank" rel="noreferrer">krazyeom</a> | 그래염 @ <a href="https://cafe.naver.com/hexenyang" target="_blank" rel="noreferrer">LTC</a>
        </p>
      </footer>
    </div>
  );
}
