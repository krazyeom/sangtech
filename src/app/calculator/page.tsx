'use client';

import { useState, useMemo } from 'react';
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

const BUYBACK_PRICE_OPTIONS = [
  { value: 95000, label: '95,000' },
  { value: 95500, label: '95,500' },
  { value: 96000, label: '96,000' },
  { value: 96500, label: '96,500' },
  { value: 96600, label: '96,600' },
  { value: 96700, label: '96,700' },
  { value: 96800, label: '96,800' },
  { value: 96900, label: '96,900' },
  { value: 97000, label: '97,000' },
  { value: 97150, label: '97,150' },
  { value: 97300, label: '97,300' },
  { value: 97500, label: '97,500' },
  { value: 98000, label: '98,000' },
];

const FACE_VALUE = 100000;

export default function Home() {
  const [mileRate, setMileRate] = useState(1500);
  const [purchasePrice, setPurchasePrice] = useState(99000);
  const [buybackPrice, setBuybackPrice] = useState(97150);

  const results = useMemo(() => {
    const accruedMiles = Math.round(purchasePrice / mileRate);
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
  }, [mileRate, purchasePrice, buybackPrice]);

  const lossIsNegative = results.loss < 0;
  const lossIsZero = results.loss === 0;

  return (
    <div className="calc-root calc-body">
    <main className="calc-main-container">


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
        <div className="calc-result-section-title">
          <span>📋</span> 계산 결과
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
