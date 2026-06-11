'use client';

import { useState, useMemo, useEffect } from 'react';
import WheelPicker from '@/components/WheelPicker';
import './calculator.css';

// ===== Data Options =====
const MILE_RATE_OPTIONS = [
  { value: 1000, label: '1,000' },
  { value: 1500, label: '1,500' },
  { value: 2000, label: '2,000' },
  { value: 2500, label: '2,500' },
  { value: 3000, label: '3,000' },
];

const PURCHASE_PRICE_OPTIONS = Array.from({ length: 41 }, (_, i) => {
  const value = 96000 + i * 100;
  return { value, label: value.toLocaleString() };
});

const BUYBACK_PRICE_OPTIONS = Array.from({ length: 71 }, (_, i) => {
  const value = 95000 + i * 50;
  return { value, label: value.toLocaleString() };
});

const FACE_VALUE = 100000;

export default function Home() {
  const [mileRate, setMileRate] = useState(1500);
  const [purchasePrice, setPurchasePrice] = useState(98000);
  const [buybackPrice, setBuybackPrice] = useState(97150);
  const [isDoublePoint, setIsDoublePoint] = useState(false);
  const [selectedCard, setSelectedCard] = useState<'shinsegae' | 'hyundai' | 'lotte'>('shinsegae');
  const [prices, setPrices] = useState<any[]>([]);

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
      }
    };
    fetchPrices();
  }, []);

  const bestPrices = useMemo(() => {
    if (prices.length === 0) return { shinsegae: 97150, lotte: 97150, hyundai: 97150 };
    return {
      shinsegae: Math.max(...prices.filter(p => p.gift_card_type === 'shinsegae' && p.site_name !== '맥스솔루션').map(p => p.buy_price), 97150),
      lotte: Math.max(...prices.filter(p => p.gift_card_type === 'lotte' && p.site_name !== '맥스솔루션').map(p => p.buy_price), 97150),
      hyundai: Math.max(...prices.filter(p => p.gift_card_type === 'hyundai' && p.site_name !== '맥스솔루션').map(p => p.buy_price), 97150),
    };
  }, [prices]);

  useEffect(() => {
    if (prices.length > 0) {
      setBuybackPrice(bestPrices[selectedCard]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices]);

  const handleCardSelect = (card: 'shinsegae' | 'hyundai' | 'lotte') => {
    setSelectedCard(card);
    if (prices.length > 0) {
      setBuybackPrice(bestPrices[card]);
    }
  };

  const results = useMemo(() => {
    let accruedMiles = Math.round(purchasePrice / mileRate);
    if (isDoublePoint) {
      accruedMiles *= 2;
    }
    const loss = purchasePrice - buybackPrice;
    const costPerMile = accruedMiles > 0 ? Math.round(loss / accruedMiles) : 0;
    const deductionPct = ((FACE_VALUE - buybackPrice) / FACE_VALUE) * 100;
    // Round to 2 decimal places for display
    const deductionPctRounded = Math.round(deductionPct * 100) / 100;

    return {
      accruedMiles,
      loss,
      costPerMile,
      deductionPct: deductionPctRounded,
    };
  }, [mileRate, purchasePrice, buybackPrice, isDoublePoint]);

  const lossIsNegative = results.loss < 0;
  const lossIsZero = results.loss === 0;

  return (
    <div className="calc-root calc-body">
    <main className="calc-main-container">

      {/* Card Type Selector */}
      <div className="calc-tab-group calc-animate-in">
        <button 
          onClick={() => handleCardSelect('shinsegae')}
          className={`calc-tab-btn ${selectedCard === 'shinsegae' ? 'active' : ''}`}
        >신세계</button>
        <button 
          onClick={() => handleCardSelect('hyundai')}
          className={`calc-tab-btn ${selectedCard === 'hyundai' ? 'active' : ''}`}
        >현대</button>
        <button 
          onClick={() => handleCardSelect('lotte')}
          className={`calc-tab-btn ${selectedCard === 'lotte' ? 'active' : ''}`}
        >롯데</button>
      </div>


      {/* Summary Bar */}
      <div className="calc-summary-bar calc-animate-in">
        <span>액면가</span>
        <span className="calc-highlight">{FACE_VALUE.toLocaleString()}원</span>
        <span>기준</span>
      </div>

      {/* Picker Section */}
      <div className="calc-picker-row calc-animate-in">
        {/* 금액당 1마일 */}
        <div className="calc-card">
          <div className="calc-card-label">
            <span className="calc-card-label-icon">✈️</span>
            금액당 1마일
          </div>
          <div style={{ marginBottom: '12px' }}>
            <input
              type="number"
              className="calc-manual-input"
              value={mileRate}
              onChange={(e) => setMileRate(Number(e.target.value))}
            />
          </div>
          <WheelPicker
            items={MILE_RATE_OPTIONS}
            selectedValue={mileRate}
            onChange={setMileRate}
            unit="원"
          />
        </div>

        {/* 구입 가격 */}
        <div className="calc-card">
          <div className="calc-card-label">
            <span className="calc-card-label-icon">💳</span>
            구입 가격
          </div>
          <div style={{ marginBottom: '12px' }}>
            <input
              type="number"
              className="calc-manual-input"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
            />
          </div>
          <WheelPicker
            items={PURCHASE_PRICE_OPTIONS}
            selectedValue={purchasePrice}
            onChange={setPurchasePrice}
            unit="원"
          />
        </div>

        {/* 매입 금액 */}
        <div className="calc-card">
          <div className="calc-card-label">
            <span className="calc-card-label-icon">🏦</span>
            매입 금액
          </div>
          <div style={{ marginBottom: '12px' }}>
            <input
              type="number"
              className="calc-manual-input"
              value={buybackPrice}
              onChange={(e) => setBuybackPrice(Number(e.target.value))}
            />
          </div>
          <WheelPicker
            items={BUYBACK_PRICE_OPTIONS}
            selectedValue={buybackPrice}
            onChange={setBuybackPrice}
            unit="원"
          />
        </div>
      </div>




      {/* Result Cards */}
      <div className="calc-result-section calc-animate-in">
        <div className="calc-result-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><span>📋</span> 계산 결과</div>
          <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: '500', color: 'var(--text-primary)' }}>
            <input 
              type="checkbox" 
              checked={isDoublePoint}
              onChange={(e) => setIsDoublePoint(e.target.checked)}
              style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
            />
            2배 적립
          </label>
        </div>
        <div className="calc-result-grid">
          {/* 적립 마일 */}
          <div className="calc-result-item">
            <div className="calc-result-label">적립 마일</div>
            <div className="calc-result-value gold">
              {results.accruedMiles.toLocaleString()}
              <span className="calc-result-unit">마일</span>
            </div>
          </div>

          {/* 손해 금액 */}
          <div className={`calc-result-item ${lossIsNegative ? 'positive' : lossIsZero ? '' : 'negative'}`}>
            <div className="calc-result-label">손해 금액</div>
            <div className={`calc-result-value ${lossIsNegative ? 'positive' : lossIsZero ? 'neutral' : 'negative'}`}>
              {results.loss.toLocaleString()}
              <span className="calc-result-unit">원</span>
            </div>
          </div>

          {/* 마일당 금액 */}
          <div className={`calc-result-item ${results.costPerMile < 0 ? 'positive' : results.costPerMile > 15 ? 'negative' : ''}`}>
            <div className="calc-result-label">마일당 금액</div>
            <div className={`calc-result-value ${results.costPerMile < 0 ? 'positive' : results.costPerMile > 15 ? 'negative' : 'neutral'}`}>
              {results.costPerMile.toLocaleString()}
              <span className="calc-result-unit">원</span>
            </div>
          </div>

          {/* 차감 % */}
          <div className="calc-result-item">
            <div className="calc-result-label">차감 %</div>
            <div className="calc-result-value neutral">
              {results.deductionPct}
              <span className="calc-result-unit">%</span>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="calc-footer calc-animate-in" style={{ animationDelay: '400ms' }}>
        <p>
          made by <a href="https://github.com/krazyeom" target="_blank" rel="noopener noreferrer">krazyeom</a>
        </p>
      </footer>
    </main>
    </div>
  );
}
