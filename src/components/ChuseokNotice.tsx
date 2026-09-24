'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'chuseok-notice-dismissed-date';

function koreaToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export default function ChuseokNotice() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(window.localStorage.getItem(STORAGE_KEY) !== koreaToday());
  }, []);

  if (!isOpen) return null;

  const closeToday = () => {
    window.localStorage.setItem(STORAGE_KEY, koreaToday());
    setIsOpen(false);
  };

  return (
    <div role="presentation" onClick={closeToday} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: '20px', background: 'rgba(15, 23, 42, 0.78)' }}>
      <section role="dialog" aria-modal="true" aria-labelledby="chuseok-notice-title" onClick={(event) => event.stopPropagation()} style={{ boxSizing: 'border-box', width: '100%', maxWidth: '390px', padding: '24px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#fff', color: '#1f2937', boxShadow: '0 20px 60px rgba(0,0,0,.32)' }}>
        <h2 id="chuseok-notice-title" style={{ margin: '0 0 .8rem', fontSize: '1.2rem', color: '#111827' }}>🌕 추석 연휴 안내 🐇</h2>
        <p style={{ margin: '0 0 .75rem', lineHeight: 1.7 }}>추석 연휴에는 상품권 업체마다 휴무일이 다릅니다. 헛걸음하지 않도록 방문 전 반드시 전화 등으로 영업 여부를 확인해 주세요.</p>
        <p style={{ margin: '0 0 1.25rem', lineHeight: 1.7, fontWeight: 700, color: '#334155' }}>🌾 가족과 함께 즐겁고 풍성한 한가위 보내세요! 🥮</p>
        <p style={{ margin: '0 0 1.25rem', textAlign: 'right', fontSize: '.82rem', color: '#64748b' }}>개발자 krazyeom, 그래염</p>
        <button type="button" onClick={closeToday} style={{ width: '100%', padding: '.75rem 1rem', border: 0, borderRadius: '9px', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>오늘 하루 닫기</button>
      </section>
    </div>
  );
}
