'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const GIFT_CARD_NAMES = {
  lotte: '롯데 상품권',
  shinsegae: '신세계 상품권',
  hyundai: '현대 상품권'
};

const RANGE_OPTIONS = [
  { value: '30d', label: '30일' },
  { value: '60d', label: '60일' },
  { value: '90d', label: '90일' },
  { value: '180d', label: '180일' },
  { value: '365d', label: '1년' },
  { value: 'all', label: '전체' },
] as const;

type RangeValue = typeof RANGE_OPTIONS[number]['value'];

type GiftCardType = keyof typeof GIFT_CARD_NAMES;

const MOVING_AVERAGE_WINDOW = 7;

const buildPriceSeries = (
  dates: string[],
  historyData: any[],
  type: GiftCardType,
) => dates.map(date => {
  const item = historyData.find(d => d.date === date && d.gift_card_type === type);
  return item ? item.best_buy_price : null;
});

const buildMovingAverageSeries = (values: Array<number | null>, window = MOVING_AVERAGE_WINDOW) => {
  return values.map((value, index) => {
    if (value === null) return null;

    const start = Math.max(0, index - window + 1);
    const slice = values.slice(start, index + 1).filter((entry): entry is number => typeof entry === 'number');

    if (slice.length < window) return null;

    return Math.round(slice.reduce((sum, entry) => sum + entry, 0) / slice.length);
  });
};

export default function History() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<RangeValue>('30d');
  const [showMovingAverage, setShowMovingAverage] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?type=all&range=${selectedRange}&t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        setHistoryData(data.history);
        setLastUpdated(new Date().toLocaleString('ko-KR'));
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    fetchHistory();

    const refreshTimer = window.setInterval(() => {
      fetchHistory();
    }, 60 * 1000);

    const handleFocus = () => {
      fetchHistory();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchHistory]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#f8fafc' },
        onClick: function(e: any, legendItem: any, legend: any) {
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          if (ci.isDatasetVisible(index)) {
            ci.hide(index);
            legendItem.hidden = true;
          } else {
            ci.show(index);
            legendItem.hidden = false;
          }
        }
      },
      title: {
        display: true,
        text: `${RANGE_OPTIONS.find(option => option.value === selectedRange)?.label ?? '30일'} 시세 변동`,
        color: '#f8fafc'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const dataset = context.dataset as any;
            const value = context.parsed.y;

            if (dataset.kind === 'moving-average') {
              return `${dataset.label}: ${value.toLocaleString()}원`;
            }

            const dataIndex = context.dataIndex;
            const type = dataset.cardType as GiftCardType;
            const date = dates[dataIndex];
            const item = historyData.find(d => d.date === date && d.gift_card_type === type);

            if (!item) return `매입가 데이터 없음`;
            return `매입가: ${value.toLocaleString()}원 (${item.best_site_name})`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 95000,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const dates = Array.from(new Set(historyData.map(d => d.date))).sort() as string[];
  const lotteSeries = buildPriceSeries(dates, historyData, 'lotte');
  const shinsegaeSeries = buildPriceSeries(dates, historyData, 'shinsegae');
  const hyundaiSeries = buildPriceSeries(dates, historyData, 'hyundai');
  const lotteMovingAverage = buildMovingAverageSeries(lotteSeries);
  const shinsegaeMovingAverage = buildMovingAverageSeries(shinsegaeSeries);
  const hyundaiMovingAverage = buildMovingAverageSeries(hyundaiSeries);

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: GIFT_CARD_NAMES['lotte'],
        cardType: 'lotte',
        data: lotteSeries,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        tension: 0.3,
        spanGaps: true,
        pointRadius: 2,
      },
      {
        label: GIFT_CARD_NAMES['shinsegae'],
        cardType: 'shinsegae',
        data: shinsegaeSeries,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.3,
        spanGaps: true,
        pointRadius: 2,
      },
      {
        label: GIFT_CARD_NAMES['hyundai'],
        cardType: 'hyundai',
        data: hyundaiSeries,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
        spanGaps: true,
        pointRadius: 2,
      }
    ].concat(showMovingAverage ? [
      {
        label: `${GIFT_CARD_NAMES['lotte']} 7일 이동평균`,
        kind: 'moving-average',
        cardType: 'lotte',
        data: lotteMovingAverage,
        borderColor: '#d97706',
        backgroundColor: 'transparent',
        borderDash: [6, 6],
        tension: 0.2,
        spanGaps: true,
        pointRadius: 0,
      },
      {
        label: `${GIFT_CARD_NAMES['shinsegae']} 7일 이동평균`,
        kind: 'moving-average',
        cardType: 'shinsegae',
        data: shinsegaeMovingAverage,
        borderColor: '#dc2626',
        backgroundColor: 'transparent',
        borderDash: [6, 6],
        tension: 0.2,
        spanGaps: true,
        pointRadius: 0,
      },
      {
        label: `${GIFT_CARD_NAMES['hyundai']} 7일 이동평균`,
        kind: 'moving-average',
        cardType: 'hyundai',
        data: hyundaiMovingAverage,
        borderColor: '#2563eb',
        backgroundColor: 'transparent',
        borderDash: [6, 6],
        tension: 0.2,
        spanGaps: true,
        pointRadius: 0,
      }
    ] as any[] : []),
  };

  return (
    <div className="container">
      <section className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            {lastUpdated ? `마지막 갱신: ${lastUpdated}` : '아직 갱신 전입니다.'}
          </div>
          <button
            type="button"
            onClick={fetchHistory}
            style={{
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#f8fafc',
              borderRadius: '999px',
              padding: '0.55rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {loading ? '새로고침 중...' : '지금 새로고침'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {RANGE_OPTIONS.map(option => {
            const active = selectedRange === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedRange(option.value)}
                style={{
                  border: 'none',
                  borderBottom: active ? '2px solid #f8fafc' : '2px solid transparent',
                  background: 'transparent',
                  color: active ? '#f8fafc' : '#94a3b8',
                  padding: '0.4rem 0.15rem',
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#cbd5e1', fontSize: '0.92rem' }}>
          <input
            type="checkbox"
            checked={showMovingAverage}
            onChange={(e) => setShowMovingAverage(e.target.checked)}
            style={{ width: '1rem', height: '1rem' }}
          />
          7일 이동평균선 표시
        </label>

        {loading ? (
          <p style={{ textAlign: 'center' }}>데이터를 불러오는 중입니다...</p>
        ) : historyData.length === 0 ? (
          <p style={{ textAlign: 'center' }}>아직 수집된 시세 변동 데이터가 없습니다. 내일 다시 확인해주세요!</p>
        ) : (
          <div style={{ width: '100%', height: '400px' }}>
            <Line options={chartOptions} data={chartData} />
          </div>
        )}
      </section>

      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
        상단의 범례(상품권 이름)를 클릭하면 그래프를 껐다 켤 수 있습니다.
      </div>

    </div>
  );
}
