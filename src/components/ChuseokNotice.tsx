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
    <div role="presentation" onClick={closeToday} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.68)' }}>
      <section role="dialog" aria-modal="true" aria-labelledby="chuseok-notice-title" onClick={(event) => event.stopPropagation()} style={{ width: 'min(100%, 460px)', padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg, #fff)', color: 'var(--text-primary, #111827)', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <h2 id="chuseok-notice-title" style={{ margin: '0 0 .8rem', fontSize: '1.2rem' }}>추석 연휴 안내</h2>
        <p style={{ margin: '0 0 1.25rem', lineHeight: 1.7 }}>추석 연휴는 상품권 업체마다 휴무일이 다르니 꼭 가기전에 전화 통화등 연락을 하고 가세요.</p>
        <button type="button" onClick={closeToday} style={{ width: '100%', padding: '.75rem 1rem', border: 0, borderRadius: '9px', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>오늘 하루 닫기</button>
      </section>
    </div>
  );
}
