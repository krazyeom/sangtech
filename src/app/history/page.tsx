'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  shinsegae: '신세계 상품권',
  lotte: '롯데 상품권',
  hyundai: '현대 상품권'
};

export default function History() {
  const [activeTab, setActiveTab] = useState<'shinsegae' | 'lotte' | 'hyundai'>('shinsegae');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/history?type=${activeTab}&days=30`);
        const data = await res.json();
        if (data.success) {
          setHistoryData(data.history);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [activeTab]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#f8fafc' }
      },
      title: {
        display: true,
        text: `${GIFT_CARD_NAMES[activeTab]} 30일 시세 변동`,
        color: '#f8fafc'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const dataItem = historyData[dataIndex];
            return `매입가: ${context.parsed.y.toLocaleString()}원 (${dataItem.best_site_name})`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const chartData = {
    labels: historyData.map(d => d.date),
    datasets: [
      {
        label: '최고 매입가',
        data: historyData.map(d => d.best_buy_price),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="container">


      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {(Object.keys(GIFT_CARD_NAMES) as Array<keyof typeof GIFT_CARD_NAMES>).map(type => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === type ? 'var(--accent-blue)' : 'var(--card-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {GIFT_CARD_NAMES[type]}
          </button>
        ))}
      </div>

      <section className="card" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <p>데이터를 불러오는 중입니다...</p>
        ) : historyData.length === 0 ? (
          <p>아직 수집된 시세 변동 데이터가 없습니다. 내일 다시 확인해주세요!</p>
        ) : (
          <div style={{ width: '100%', height: '400px' }}>
            <Line options={chartOptions} data={chartData} />
          </div>
        )}
      </section>

      <footer>
        <p>
          made by <a href="https://github.com/krazyeom" target="_blank" rel="noreferrer">krazyeom</a><br />
          그래염 @ LTC <a href="https://cafe.naver.com/hexenyang" target="_blank" rel="noreferrer">https://cafe.naver.com/hexenyang</a>
        </p>
      </footer>
    </div>
  );
}
