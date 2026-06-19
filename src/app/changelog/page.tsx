export const metadata = {
  title: '업데이트 노트 | Sang Tech',
  description: 'Sang Tech의 주요 업데이트 및 변경 사항을 확인하세요.',
};

export default function ChangelogPage() {
  const releases = [
    {
      version: 'v1.2.2',
      date: '2026. 06. 20',
      title: '시세 차트 통합 및 크롤링 안정성 개선',
      items: [
        '시세 변동 페이지 차트 통합 (신세계/롯데/현대 상품권을 한 번에 비교 및 범례 클릭으로 끄기/켜기 가능)',
        '도전상품권 등 일부 샵의 OCR 이미지 인식률 개선 (자동 명암 대비 적용)',
        '기프너스, 도전상품권, 맥스솔루션, VIP상품권 등 주요 샵의 지역 지점명 표기 추가',
        '푸터 영역에 "개발자에게 문의하기" 카카오톡 오픈채팅 버튼 추가',
      ],
    },
    {
      version: 'v1.2.1',
      date: '2026. 06. 19',
      title: '방문자 수 통계 기준 개선',
      items: [
        '사이트 하단 방문자 수 표기를 "이번 달"에서 "어제" 기준으로 변경 (오늘, 어제, 전체 제공)',
      ],
    },
    {
      version: 'v1.2.0',
      date: '2026. 06. 11',
      title: '계산기 대규모 업데이트 및 사용성 개선',
      items: [
        '기존 계산기 페이지에 실시간 최고가 시세 연동 기능 추가 (신세계, 현대, 롯데 탭)',
        '마일리지 2배 적립 체크박스 기능 추가',
        '매입 금액 휠 피커(드럼) 10원 단위 세밀화 및 자동 스냅(보정) 기능 적용',
        '금액당 1마일 피커에 918원 옵션 추가',
        '전체 화면 공통 푸터(후원하기) 디자인 통합 및 중복 제거',
      ],
    },
    {
      version: 'v1.1.0',
      date: '2026. 06. 08',
      title: '시세 계산기 고도화 및 신규 샵 추가',
      items: [
        '우현상품권 실시간 시세 트래킹 및 데이터 연동 추가',
        '시세 계산기에 각 샵별 할인율, 합계 금액, 수수료(할인 금액) 한눈에 보기 기능 추가',
        '모바일 해상도에서 화면이 깨지지 않도록 상품권 권종별 그리드 1줄 고정 적용',
      ],
    },
    {
      version: 'v1.0.0',
      date: '2026. 06.',
      title: 'Sang Tech 시세 비교 서비스 오픈',
      items: [
        '주요 백화점 상품권(신세계, 롯데, 현대) 매입 시세 비교 제공',
        '명동 우대빵, 티켓나라, 맥스솔루션 등 다수 샵 시세 스크래핑 연동',
        '자동화된 시세 이력(History) 로깅 및 차트 제공',
        '마일리지 상테크용 단가 계산기 및 시세 계산기 제공',
      ],
    },
  ];

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', background: 'var(--gradient-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          업데이트 노트
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          새롭게 추가된 기능과 개선 사항을 안내해 드립니다.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {releases.map((release, index) => (
          <div key={index} className="card highlight" style={{ padding: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-color)' }}>{release.version}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{release.title}</span>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{release.date}</span>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {release.items.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--accent-blue)', marginTop: '2px' }}>✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
