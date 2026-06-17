'use client';

import { useEffect, useState } from 'react';

interface VisitorStats {
  today: number;
  month: number;
  total: number;
}

export default function VisitorCounter() {
  const [stats, setStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    const trackAndFetchVisit = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const lastVisitDate = localStorage.getItem('last_visit_date');

        // 오늘 처음 방문한 경우에만 카운트 증가
        if (lastVisitDate !== todayStr) {
          await fetch('/api/visitors', { method: 'POST' });
          localStorage.setItem('last_visit_date', todayStr);
        }

        // 방문자 통계 조회
        const res = await fetch('/api/visitors');
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to track/fetch visitors', err);
      }
    };

    trackAndFetchVisit();
  }, []);

  if (!stats) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      background: 'var(--bg-color, #ffffff)',
      padding: '0.6rem 1.2rem',
      borderRadius: '20px',
      fontSize: '0.85rem',
      color: 'var(--text-secondary, #666)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      marginTop: '1.5rem',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary, #333)' }}>TODAY</span>
        <span>{stats.today.toLocaleString()}</span>
      </div>
      <div style={{ width: '1px', height: '12px', background: 'var(--border-color, #eaeaea)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary, #333)' }}>MONTH</span>
        <span>{stats.month.toLocaleString()}</span>
      </div>
      <div style={{ width: '1px', height: '12px', background: 'var(--border-color, #eaeaea)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary, #333)' }}>TOTAL</span>
        <span>{stats.total.toLocaleString()}</span>
      </div>
    </div>
  );
}
