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
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.isHundredth) {
          // 100번째 단위 방문자 이벤트: 폭죽 애니메이션
          import('canvas-confetti').then((confetti) => {
            const fire = confetti.default;
            var duration = 3 * 1000;
            var animationEnd = Date.now() + duration;
            var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

            function randomInRange(min: number, max: number) {
              return Math.random() * (max - min) + min;
            }

            var interval: any = setInterval(function() {
              var timeLeft = animationEnd - Date.now();

              if (timeLeft <= 0) {
                return clearInterval(interval);
              }

              var particleCount = 50 * (timeLeft / duration);
              fire(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
              fire(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
            
            // 축하 알림
            setTimeout(() => {
              alert(`🎉 축하합니다! 당신은 행운의 ${data.totalViews}번째 방문자입니다! 🎉`);
            }, 500);
          });
        }
      })
      .catch(err => console.error('Visit tracking failed:', err));
    }
  }, []);

  return null;
}
