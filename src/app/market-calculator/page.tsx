'use client';

import { useEffect, useState } from 'react';

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
  hyundai: '현대 상품권',
  lotte: '롯데 상품권'
};

const DENOMINATIONS = [
  { value: 500000, label: '50만원권' },
  { value: 100000, label: '10만원권' },
  { value: 50000, label: '5만원권' }
];

export default function Calculator() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/prices');
        const data = await res.json();
        if (data.success) {
          setPrices(data.prices);
        }
      } catch (err) {
        console.error('Failed to fetch prices', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, []);

  // 정렬 로직 (page.tsx와 동일)
  const bestPrices = {
    shinsegae: Math.max(...prices.filter(p => p.gift_card_type === 'shinsegae').map(p => p.buy_price), 0),
    lotte: Math.max(...prices.filter(p => p.gift_card_type === 'lotte').map(p => p.buy_price), 0),
    hyundai: Math.max(...prices.filter(p => p.gift_card_type === 'hyundai').map(p => p.buy_price), 0),
  };

  const recommendedBestPrices = {
    shinsegae: Math.max(...prices.filter(p => p.gift_card_type === 'shinsegae' && p.site_name !== '맥스솔루션').map(p => p.buy_price), 0),
    lotte: Math.max(...prices.filter(p => p.gift_card_type === 'lotte' && p.site_name !== '맥스솔루션').map(p => p.buy_price), 0),
    hyundai: Math.max(...prices.filter(p => p.gift_card_type === 'hyundai' && p.site_name !== '맥스솔루션').map(p => p.buy_price), 0),
  };

  let siteNames = Array.from(new Set(prices.map(p => p.site_name)));
  const siteBestCount: Record<string, number> = {};
  const siteSumPrice: Record<string, number> = {};

  prices.forEach(p => {
    siteSumPrice[p.site_name] = (siteSumPrice[p.site_name] || 0) + p.buy_price;
    if (p.site_name === '맥스솔루션') return;
    const type = p.gift_card_type as keyof typeof bestPrices;
    if (p.buy_price === bestPrices[type] || p.buy_price === recommendedBestPrices[type]) {
      siteBestCount[p.site_name] = (siteBestCount[p.site_name] || 0) + 1;
    }
  });

  siteNames.sort((a, b) => {
    const countA = siteBestCount[a] || 0;
    const countB = siteBestCount[b] || 0;
    if (countB !== countA) return countB - countA;
    const sumA = siteSumPrice[a] || 0;
    const sumB = siteSumPrice[b] || 0;
    if (sumB !== sumA) return sumB - sumA;
    return a.localeCompare(b, 'ko-KR');
  });

  if (!siteNames.includes('베스트상품권')) {
    siteNames.push('베스트상품권');
  }

  const siteDataMap: Record<string, Record<string, PriceData>> = {};
  siteNames.forEach(site => {
    siteDataMap[site] = {};
    prices.filter(p => p.site_name === site).forEach(p => {
      siteDataMap[site][p.gift_card_type] = p;
    });
  });

  useEffect(() => {
    if (siteNames.length > 0 && !selectedSite) {
      setSelectedSite(siteNames[0]);
    }
  }, [siteNames, selectedSite]);

  const handleCountChange = (type: string, denom: number, value: string) => {
    const num = parseInt(value, 10);
    setCounts(prev => ({
      ...prev,
      [`${type}-${denom}`]: isNaN(num) || num < 0 ? 0 : num
    }));
  };

  let totalFaceValue = 0;
  let totalPayout = 0;

  if (selectedSite && siteDataMap[selectedSite]) {
    (Object.keys(GIFT_CARD_NAMES) as Array<keyof typeof GIFT_CARD_NAMES>).forEach(type => {
      const priceData = siteDataMap[selectedSite][type];
      const rate = priceData ? priceData.buy_price / 100000 : 0;

      DENOMINATIONS.forEach(denom => {
        const count = counts[`${type}-${denom.value}`] || 0;
        const faceValue = count * denom.value;
        totalFaceValue += faceValue;
        totalPayout += faceValue * rate;
      });
    });
  }

  const totalDiscount = totalFaceValue - totalPayout;

  if (loading) {
    return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;
  }

  const hasData = siteDataMap[selectedSite] && Object.keys(siteDataMap[selectedSite]).length > 0;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <header>
        <div className="logo">
          <h1>시세 계산기</h1>
        </div>
      </header>
      
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '700' }}>1. 샵 선택</h2>
        <select 
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '1rem', background: 'var(--card-bg)', color: 'var(--text-primary)', outline: 'none' }}
        >
          {siteNames.map(site => (
            <option key={site} value={site}>{site}</option>
          ))}
        </select>
        {!hasData && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#e53935' }}>
            ※ 해당 샵의 실시간 시세 데이터가 없어 결과가 0원으로 계산됩니다.
          </p>
        )}
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '700' }}>2. 보유 수량 입력</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {(Object.keys(GIFT_CARD_NAMES) as Array<keyof typeof GIFT_CARD_NAMES>).map(type => (
            <div key={type}>
              <h3 style={{ marginBottom: '0.8rem', color: 'var(--primary-color)', fontSize: '1rem', fontWeight: '600' }}>{GIFT_CARD_NAMES[type]}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.8rem' }}>
                {DENOMINATIONS.map(denom => (
                  <div key={denom.value}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      {denom.label}
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      value={counts[`${type}-${denom.value}`] || ''}
                      onChange={(e) => handleCountChange(type, denom.value, e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--background)', color: 'var(--text-primary)', textAlign: 'right', fontSize: '1rem', outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card highlight" style={{ padding: '2rem', position: 'sticky', bottom: '20px', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '700', textAlign: 'center' }}>계산 결과</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>총 액면가</span>
          <span style={{ fontWeight: '600' }}>{totalFaceValue.toLocaleString()} 원</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', fontSize: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>할인 금액 (수수료)</span>
          <span style={{ color: '#e53935' }}>- {Math.round(totalDiscount).toLocaleString()} 원</span>
        </div>
        
        <div style={{ height: '1px', background: 'var(--border-color)', margin: '1rem 0' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1.2rem' }}>최종 매입가</span>
          <span style={{ fontWeight: '800', color: 'var(--primary-color)', fontSize: '1.5rem' }}>{Math.round(totalPayout).toLocaleString()} 원</span>
        </div>
      </div>

    </div>
  );
}
