'use client';

import { useEffect, useRef } from 'react';

export default function VisitTracker() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // KST 기준으로 오늘 날짜(YYYY-MM-DD) 구하기 (클라이언트에서 대략적으로)
    const today = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(today.getTime() + kstOffset);
    const dateStr = kstDate.toISOString().split('T')[0];

    const visitedDate = sessionStorage.getItem('sangse_visited_date');
    if (visitedDate !== dateStr) {
      // 오늘 처음 방문한 경우만 카운트 증가
      sessionStorage.setItem('sangse_visited_date', dateStr);
      
      fetch('/api/visit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(err => console.error('Visit tracking failed:', err));
    }
  }, []);

  return null;
}
