'use client';

import { useEffect, useMemo, useState } from 'react';
import { isDreamVacationRankExcluded } from '@/lib/dream-vacation';
import { getSiteRegion, hasSiteRegion } from '@/lib/site-order';

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

type ViewMode = 'buy' | 'sell' | 'both';

type SecretPreviewClientProps = {
  initialView: ViewMode;
};

const GIFT_CARD_NAMES = {
  lotte: '롯데 상품권',
  shinsegae: '신세계 상품권',
  hyundai: '현대 상품권',
} as const;

const EXCLUDED_COMPARE_SITES = ['맥스솔루션', '기프너스', 'VIP상품권', '더세일상품권'];

const isExcludedCompareSite = (siteName: string) =>
  EXCLUDED_COMPARE_SITES.some((excluded) => siteName.includes(excluded));

const VIEW_LABELS: Record<ViewMode, string> = {
  buy: '매입가',
  sell: '판매가',
  both: '같이 보기',
};

const VIEW_META: Record<ViewMode, { subtitle: string; helper: string }> = {
  buy: { subtitle: '고객이 팔 때', helper: '우리에게 판매할 때 비교하는 값' },
  sell: { subtitle: '고객이 살 때', helper: '고객이 구매할 때 비교하는 값' },
  both: { subtitle: '매입·판매·차액', helper: '매입가 기준 정렬 및 판매가/차액 비교' },
};

export default function SecretPricePreviewClient({ initialView }: SecretPreviewClientProps) {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [view, setView] = useState<ViewMode>(initialView);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

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
    const interval = setInterval(fetchPrices, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const buyBestPrices = useMemo(() => ({
    shinsegae: Math.max(...prices.filter((p) => p.gift_card_type === 'shinsegae' && !isExcludedCompareSite(p.site_name) && !isDreamVacationRankExcluded(p.site_name)).map((p) => p.buy_price), 0),
    lotte: Math.max(...prices.filter((p) => p.gift_card_type === 'lotte' && !isExcludedCompareSite(p.site_name) && !isDreamVacationRankExcluded(p.site_name)).map((p) => p.buy_price), 0),
    hyundai: Math.max(...prices.filter((p) => p.gift_card_type === 'hyundai' && !isExcludedCompareSite(p.site_name) && !isDreamVacationRankExcluded(p.site_name)).map((p) => p.buy_price), 0),
  }), [prices]);

  const sellBestPrices = useMemo(() => {
    const getMinSellPrice = (type: 'shinsegae' | 'lotte' | 'hyundai') => {
      const valid = prices
        .filter((p) => p.gift_card_type === type && !isExcludedCompareSite(p.site_name) && !isDreamVacationRankExcluded(p.site_name) && typeof p.sell_price === 'number' && p.sell_price > 0)
        .map((p) => p.sell_price as number);
      return valid.length > 0 ? Math.min(...valid) : 0;
    };

    return {
      shinsegae: getMinSellPrice('shinsegae'),
      lotte: getMinSellPrice('lotte'),
      hyundai: getMinSellPrice('hyundai'),
    };
  }, [prices]);

  const bestPrices = view === 'sell' ? sellBestPrices : buyBestPrices;

  const siteNames = useMemo(() => {
    const names = Array.from(new Set(prices.map((p) => p.site_name)));
    const siteBestCount: Record<string, number> = {};
    const siteComparableSumPrice: Record<string, number> = {};
    const siteComparableCount: Record<string, number> = {};

    prices.forEach((p) => {
      if (isExcludedCompareSite(p.site_name) || isDreamVacationRankExcluded(p.site_name)) return;
      const metric = view === 'sell' ? (p.sell_price ?? 0) : p.buy_price;
      if (metric <= 0) return;

      siteComparableSumPrice[p.site_name] = (siteComparableSumPrice[p.site_name] || 0) + metric;
      siteComparableCount[p.site_name] = (siteComparableCount[p.site_name] || 0) + 1;

      const type = p.gift_card_type as keyof typeof bestPrices;
      if (bestPrices[type] > 0 && metric === bestPrices[type]) {
        siteBestCount[p.site_name] = (siteBestCount[p.site_name] || 0) + 1;
      }
    });

    names.sort((a, b) => {
      const excludedA = isExcludedCompareSite(a) || isDreamVacationRankExcluded(a);
      const excludedB = isExcludedCompareSite(b) || isDreamVacationRankExcluded(b);
      if (excludedA !== excludedB) return excludedA ? 1 : -1;

      const regionA = getSiteRegion(a);
      const regionB = getSiteRegion(b);
      const hasRegionA = hasSiteRegion(a);
      const hasRegionB = hasSiteRegion(b);
      if (hasRegionA !== hasRegionB) return hasRegionA ? 1 : -1;
      if (hasRegionA && hasRegionB && regionA !== regionB) {
        return regionA!.localeCompare(regionB!, 'ko-KR');
      }

      const countA = siteBestCount[a] || 0;
      const countB = siteBestCount[b] || 0;
      if (countB !== countA) return countB - countA;

      if (a === '하이티켓') return -1;
      if (b === '하이티켓') return 1;

      const sumA = siteComparableSumPrice[a] || 0;
      const sumB = siteComparableSumPrice[b] || 0;
      if (view === 'buy') {
        if (sumB !== sumA) return sumB - sumA;
      } else {
        const validA = siteComparableCount[a] || 0;
        const validB = siteComparableCount[b] || 0;
        if (validA !== validB) return validB - validA;
        if (validA > 0 && sumA !== sumB) return sumA - sumB;
      }

      return a.localeCompare(b, 'ko-KR');
    });

    if (!names.includes('베스트상품권')) {
      names.push('베스트상품권');
    }

    return names;
  }, [bestPrices, prices, view]);

  const siteDataMap = useMemo(() => {
    const map: Record<string, Partial<Record<keyof typeof GIFT_CARD_NAMES, PriceData>>> = {};
    siteNames.forEach((site) => {
      map[site] = {};
      prices.filter((p) => p.site_name === site).forEach((p) => {
        map[site][p.gift_card_type] = p;
      });
    });
    return map;
  }, [prices, siteNames]);

  const hasSellData = prices.some((p) => typeof p.sell_price === 'number' && p.sell_price > 0);

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>Loading...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      <section className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.08em' }}>
              SECRET PREVIEW
            </div>
            <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.4rem' }}>판매가 미리보기 탭</h1>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              메인에는 아직 올리지 않는 실험용 페이지입니다. <code>/secret?view=sell</code> 로 바로 판매가 탭을 열 수 있어요.
            </p>
          </div>
          {lastUpdate && (
            <div style={{ fontSize: '0.85rem', color: '#ffffff', textAlign: 'right' }}>
              마지막 업데이트<br />
              <strong style={{ color: '#ffffff' }}>{lastUpdate}</strong>
            </div>
          )}
        </div>
      </section>

      <section className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {(Object.keys(GIFT_CARD_NAMES) as Array<keyof typeof GIFT_CARD_NAMES>).map((type) => {
            const best = bestPrices[type];
            return (
              <div key={type} style={{ padding: '1rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>{GIFT_CARD_NAMES[type]}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{best > 0 ? `${best.toLocaleString()}원` : '-'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {view === 'buy' ? '매입가 기준 최고가' : view === 'sell' ? '판매가 기준 최저가' : '매입가 기준 최고가'}
                </div>
              </div>
            );
          })}
        </div>

        {view === 'sell' && !hasSellData && (
          <div style={{ marginTop: '1rem', padding: '0.9rem 1rem', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', lineHeight: 1.6 }}>
            아직 판매가 데이터가 들어오지 않았습니다. 이 탭은 레이아웃 확인용 비밀 미리보기로 먼저 열어두었습니다.
          </div>
        )}
      </section>

      <section className="card" style={{ padding: '0.35rem 0.7rem 0.3rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.85rem', borderBottom: '1px solid var(--border-color)', flex: '0 0 auto' }}>
            {(['buy', 'sell'] as ViewMode[]).map((mode) => {
              const active = view === mode;
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
                  }}
                >
                  <span style={{ fontSize: '0.81rem', lineHeight: 1.05 }}>{VIEW_LABELS[mode]}</span>
                  <span style={{ display: 'block', marginTop: '0.06rem', fontSize: '0.61rem', lineHeight: 1.05, opacity: active ? 1 : 0.7 }}>
                    {VIEW_META[mode].subtitle}
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
        </div>
      </section>

      <section className="table-container">
        <table style={{ minWidth: view === 'both' ? '600px' : undefined }}>
          <thead>
            <tr>
              <th style={{ width: view === 'both' ? '25%' : undefined }}>상품권 샵</th>
              <th style={{ width: view === 'both' ? '25%' : undefined }}>롯데<span className="hide-mobile"> (10만원권)</span></th>
              <th style={{ width: view === 'both' ? '25%' : undefined }}>신세계<span className="hide-mobile"> (10만원권)</span></th>
              <th style={{ width: view === 'both' ? '25%' : undefined }}>현대<span className="hide-mobile"> (10만원권)</span></th>
            </tr>
          </thead>
          <tbody>
            {siteNames.map((site) => {
              const url = site === '베스트상품권'
                ? 'https://bestgiftcard.kr/'
                : (siteDataMap[site]?.shinsegae?.site_url || siteDataMap[site]?.lotte?.site_url || siteDataMap[site]?.hyundai?.site_url || '#');

              return (
                <tr key={site}>
                  <td>
                    <a href={url} target="_blank" rel="noreferrer" className="site-link">
                      {site}
                    </a>
                  </td>
                  {(['lotte', 'shinsegae', 'hyundai'] as const).map((type) => {
                    const priceData = siteDataMap[site]?.[type];
                    const value = (view === 'sell' ? priceData?.sell_price : priceData?.buy_price) ?? null;
                    const rate = (view === 'sell' ? priceData?.sell_rate : priceData?.buy_rate) ?? null;
                    const isBest = value !== null && value > 0 && value === bestPrices[type];

                    if (view === 'both') {
                      if (!priceData || !priceData.buy_price) {
                        return (
                          <td key={type} className="price-cell">
                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                          </td>
                        );
                      }

                      const hasSell = typeof priceData.sell_price === 'number' && priceData.sell_price > 0;
                      const diff = hasSell ? (priceData.sell_price! - priceData.buy_price) : null;
                      const rateDiff = hasSell && priceData.sell_rate !== null && priceData.sell_rate !== undefined
                        ? Math.round((priceData.buy_rate - priceData.sell_rate) * 100) / 100
                        : diff !== null ? Math.round((diff / (priceData.denomination || 100000)) * 10000) / 100 : null;

                      return (
                        <td key={type} className={isBest ? 'highlight price-cell' : 'price-cell'} style={{ verticalAlign: 'top', padding: '0.6rem 0.55rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.18rem', textAlign: 'left', minWidth: '105px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>매입</span>
                              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isBest ? 'var(--highlight-text)' : 'var(--text-primary)' }}>
                                {priceData.buy_price.toLocaleString()}원
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '3px' }}>
                                  ({priceData.buy_rate}%)
                                </span>
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>판매</span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: hasSell ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {hasSell ? (
                                  <>
                                    {priceData.sell_price!.toLocaleString()}원
                                    {priceData.sell_rate !== null && priceData.sell_rate !== undefined && (
                                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '3px' }}>
                                        ({priceData.sell_rate}%)
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  '-'
                                )}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: '0.18rem', marginTop: '0.04rem' }}>
                              <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>차액</span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: hasSell ? '#38bdf8' : 'var(--text-secondary)' }}>
                                {hasSell && diff !== null ? (
                                  <>
                                    {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()}원
                                    {rateDiff !== null && (
                                      <span style={{ fontSize: '0.68rem', marginLeft: '3px', opacity: 0.9 }}>
                                        ({rateDiff > 0 ? `+${rateDiff}` : rateDiff}%p)
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  '-'
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                      );
                    }

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
