'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'sangtech-notice-popup-dismissed-date';

function koreaToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

interface PopupData {
  title: string;
  content: string;
  subContent?: string;
  footerText?: string;
  updatedAt?: string;
}

export default function NoticePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [popup, setPopup] = useState<PopupData | null>(null);

  useEffect(() => {
    // 오늘 하루 닫기를 눌렀는지 먼저 확인
    const dismissedDate = window.localStorage.getItem(STORAGE_KEY);
    if (dismissedDate === koreaToday()) {
      return;
    }

    // 활성화된 팝업 정보 조회
    fetch('/api/popup')
      .then((res) => res.json())
      .then((data) => {
        if (data.active && data.popup) {
          setPopup(data.popup);
          setIsOpen(true);
        }
      })
      .catch((err) => {
        console.error('Failed to check popup:', err);
      });
  }, []);

  if (!isOpen || !popup) return null;

  const closeToday = () => {
    window.localStorage.setItem(STORAGE_KEY, koreaToday());
    setIsOpen(false);
  };

  const closeJustNow = () => {
    setIsOpen(false);
  };

  return (
    <div
      role="presentation"
      onClick={closeJustNow}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="notice-popup-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '420px',
          padding: '26px',
          border: '1px solid #e2e8f0',
          borderRadius: '18px',
          background: '#ffffff',
          color: '#1f2937',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          {popup.title ? (
            <h2
              id="notice-popup-title"
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.4,
              }}
            >
              {popup.title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={closeJustNow}
            aria-label="닫기"
            style={{
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              color: '#94a3b8',
              fontSize: '1.2rem',
              lineHeight: 1,
              padding: '4px',
              marginLeft: '8px',
            }}
          >
            ✕
          </button>
        </div>

        {popup.content && (
          <div
            style={{
              margin: '0 0 1rem',
              lineHeight: 1.75,
              fontSize: '0.98rem',
              color: '#334155',
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
            }}
          >
            {popup.content}
          </div>
        )}

        {popup.subContent && (
          <div
            style={{
              margin: '0 0 1.25rem',
              padding: '10px 14px',
              background: '#f8fafc',
              borderLeft: '4px solid #3b82f6',
              borderRadius: '6px',
              lineHeight: 1.6,
              fontWeight: 600,
              fontSize: '0.92rem',
              color: '#1e293b',
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
            }}
          >
            {popup.subContent}
          </div>
        )}

        {popup.footerText && (
          <p
            style={{
              margin: '0 0 1.25rem',
              textAlign: 'right',
              fontSize: '0.82rem',
              color: '#64748b',
            }}
          >
            {popup.footerText}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={closeToday}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              background: '#f1f5f9',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            오늘 하루 닫기
          </button>
          <button
            type="button"
            onClick={closeJustNow}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: 0,
              borderRadius: '10px',
              background: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            확인
          </button>
        </div>
      </section>
    </div>
  );
}
