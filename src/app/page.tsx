'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface PriceData {
  id: number;
  site_name: string;
  site_url: string;
  gift_card_type: 'shinsegae' | 'hyundai' | 'lotte';
  denomination: number;
  buy_price: number;
  buy_rate: number;
  sell_price?: number | null;
  sell_rate?: number | null;
}

const GIFT_CARD_NAMES = {
  lotte: '롯데 상품권',
  shinsegae: '신세계 상품권',
  hyundai: '현대 상품권'
};

const EXCLUDED_COMPARE_SITES = ['맥스솔루션', '도전상품권', '기프너스', 'VIP상품권', '더세일상품권'];

const isExcludedCompareSite = (siteName: string) =>
  EXCLUDED_COMPARE_SITES.some((excluded) => siteName.includes(excluded));

type ViewMode = 'buy' | 'sell';

const VIEW_META: Record<ViewMode, { title: string; subtitle: string; helper: string }> = {
  buy: {
    title: '매입가',
    subtitle: '고객이 팔 때',
    helper: '우리에게 판매할 때 비교하는 값',
  },
  sell: {
    title: '판매가',
    subtitle: '고객이 살 때',
    helper: '고객이 구매할 때 비교하는 값',
  },
};

export default function Home() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isUpdateDelayed, setIsUpdateDelayed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('buy');

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

  const bestPrices = useMemo(() => ({
    shinsegae: Math.max(...prices.filter(p => p.gift_card_type === 'shinsegae' && !isExcludedCompareSite(p.site_name)).map(p => p.buy_price), 0),
    lotte: Math.max(...prices.filter(p => p.gift_card_type === 'lotte' && !isExcludedCompareSite(p.site_name)).map(p => p.buy_price), 0),
    hyundai: Math.max(...prices.filter(p => p.gift_card_type === 'hyundai' && !isExcludedCompareSite(p.site_name)).map(p => p.buy_price), 0),
  }), [prices]);

  const sellBestPrices = useMemo(() => ({
    shinsegae: Math.max(...prices.filter(p => p.gift_card_type === 'shinsegae' && !isExcludedCompareSite(p.site_name) && typeof p.sell_price === 'number').map(p => p.sell_price as number), 0),
    lotte: Math.max(...prices.filter(p => p.gift_card_type === 'lotte' && !isExcludedCompareSite(p.site_name) && typeof p.sell_price === 'number').map(p => p.sell_price as number), 0),
    hyundai: Math.max(...prices.filter(p => p.gift_card_type === 'hyundai' && !isExcludedCompareSite(p.site_name) && typeof p.sell_price === 'number').map(p => p.sell_price as number), 0),
  }), [prices]);

  const activeBestPrices = view === 'buy' ? bestPrices : sellBestPrices;

  // 렌더링용 사이트 목록 추출
  let siteNames = Array.from(new Set(prices.map(p => p.site_name)));

  // 각 사이트별로 전체 상품권 중 베스트 가격을 몇 개나 가지고 있는지 카운트, 그리고 3종류 총합 계산
  const siteBestCount: Record<string, number> = {};
  const siteComparableSumPrice: Record<string, number> = {};

  prices.forEach(p => {
    if (isExcludedCompareSite(p.site_name)) return;

    const metric = view === 'buy' ? p.buy_price : (p.sell_price ?? 0);
    if (metric <= 0) return;

    // 비교 대상 업체만 총합과 베스트 카운트에 포함
    siteComparableSumPrice[p.site_name] = (siteComparableSumPrice[p.site_name] || 0) + metric;

    const type = p.gift_card_type as keyof typeof activeBestPrices;
    if (metric === activeBestPrices[type]) {
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

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>Loading...</div>;
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
          
          const activeBest = typePrices.reduce((prev, curr) => {
            const prevMetric = view === 'buy' ? prev.buy_price : (prev.sell_price ?? 0);
            const currMetric = view === 'buy' ? curr.buy_price : (curr.sell_price ?? 0);
            if (currMetric > prevMetric) return curr;
            if (currMetric === prevMetric) {
              if (curr.site_name === '하이티켓') return curr;
              if (prev.site_name === '하이티켓') return prev;

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
                  {view === 'buy' ? (
                    <>
                      <div className="best-price">{activeBest.buy_price.toLocaleString()}원</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{activeBest.buy_rate}% 할인율</div>
                    </>
                  ) : (
                    <>
                      <div className="best-price">{typeof activeBest.sell_price === 'number' ? activeBest.sell_price.toLocaleString() : '-'}원</div>
                      <div style={{ color: 'var(--text-secondary)' }}>판매가 기준 최고가{typeof activeBest.sell_rate === 'number' ? ` · ${activeBest.sell_rate}%` : ''}</div>
                    </>
                  )}
                </div>
                <div className="best-site">
                  <a href={activeBest.site_url} target="_blank" rel="noreferrer" className="site-link">
                    {activeBest.site_name} ↗
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <div style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 600, lineHeight: 1.45, textAlign: 'left', marginBottom: '0.45rem' }}>
        * 주의 * 상품권 특성상 실시간으로 시세가 변동될 수 있으며, 가격을 가져오는 과정에서 오류가 발생할 수 있으니 방문 직전 반드시 각 사이트에서 최종적으로 다시 확인하시기 바랍니다. 문제 발생 시 상품권 업체와 SangTech는 책임지지 않으며, 전적으로 판매 당사자의 책임입니다.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem', flexWrap: 'nowrap', marginBottom: '0.3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', flex: '0 0 auto', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.1rem' }}>
          {(['buy', 'sell'] as ViewMode[]).map((mode) => {
            const active = view === mode;
            const meta = VIEW_META[mode];
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => setView(mode)}
                style={{
                  position: 'relative',
                  border: 'none',
                  background: 'transparent',
                  color: active ? '#2563eb' : 'var(--text-secondary)',
                  padding: '0.1rem 0 0.34rem',
                  cursor: 'pointer',
                  fontWeight: active ? 800 : 700,
                  transition: 'color 0.16s ease',
                  whiteSpace: 'nowrap',
                  flex: '0 0 auto',
                }}
              >
                <span style={{ fontSize: '0.81rem', lineHeight: 1.05 }}>{meta.title}</span>
                <span style={{ display: 'block', marginTop: '0.06rem', fontSize: '0.61rem', lineHeight: 1.05, opacity: active ? 1 : 0.7 }}>
                  {meta.subtitle}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: '-1px',
                    height: '2px',
                    borderRadius: '999px',
                    background: active ? '#2563eb' : 'transparent',
                  }}
                />
              </button>
            );
          })}
        </div>
        <div style={{ flex: '1 1 auto', minWidth: 0, fontSize: '0.68rem', color: isUpdateDelayed ? '#ef4444' : '#ffffff', fontWeight: 600, lineHeight: 1.45, textAlign: 'right', paddingTop: '0.14rem' }}>
          마지막 업데이트: {lastUpdate ? lastUpdate : '로딩 중'}
          {isUpdateDelayed && <span style={{ marginLeft: '6px', fontWeight: 'bold' }}>⚠️ 5분 이상 경과 (시세 지연)</span>}
        </div>
      </div>

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
                <tr
                  key={site}
                  className={site === '맥스솔루션(안양)'
                    ? 'row-maxsolution'
                    : site === '도전상품권(삼성)'
                      ? 'row-dojeon'
                      : site === '더세일상품권(삼성동)'
                        ? 'row-thesale'
                        : ''}
                >
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
                    const value = view === 'buy' ? priceData?.buy_price : priceData?.sell_price ?? null;
                    const rate = view === 'buy' ? priceData?.buy_rate : priceData?.sell_rate ?? null;
                    const isBest = value !== null && value === activeBestPrices[type];
                    
                    return (
                      <td key={type} className={isBest ? 'highlight price-cell' : 'price-cell'}>
                        {value ? (
                          <>
                            <span className="price-value">{value.toLocaleString()}원</span>
                            <span className="price-rate">{rate !== null ? `(${rate}%)` : ''}</span>
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
