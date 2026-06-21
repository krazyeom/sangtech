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
  lotte: '롯데 상품권',
  shinsegae: '신세계 상품권',
  hyundai: '현대 상품권'
};

export default function History() {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/history?type=all&days=30`);
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
  }, []);

  const chartOptions = {
    responsive: true,
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
        text: `30일 시세 변동`,
        color: '#f8fafc'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const datasetIndex = context.datasetIndex;
            const date = dates[dataIndex];
            const type = datasetIndex === 0 ? 'shinsegae' : datasetIndex === 1 ? 'lotte' : 'hyundai';
            const item = historyData.find(d => d.date === date && d.gift_card_type === type);
            
            if (!item) return `매입가 데이터 없음`;
            return `매입가: ${context.parsed.y.toLocaleString()}원 (${item.best_site_name})`;
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

  const dates = Array.from(new Set(historyData.map(d => d.date))).sort() as string[];

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: GIFT_CARD_NAMES['lotte'],
        data: dates.map(date => {
          const item = historyData.find(d => d.date === date && d.gift_card_type === 'lotte');
          return item ? item.best_buy_price : null;
        }),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: GIFT_CARD_NAMES['shinsegae'],
        data: dates.map(date => {
          const item = historyData.find(d => d.date === date && d.gift_card_type === 'shinsegae');
          return item ? item.best_buy_price : null;
        }),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: GIFT_CARD_NAMES['hyundai'],
        data: dates.map(date => {
          const item = historyData.find(d => d.date === date && d.gift_card_type === 'hyundai');
          return item ? item.best_buy_price : null;
        }),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
        spanGaps: true,
      }
    ],
  };

  return (
    <div className="container">
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

      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
        상단의 범례(상품권 이름)를 클릭하면 그래프를 껐다 켤 수 있습니다.
      </div>


    </div>
  );
}
