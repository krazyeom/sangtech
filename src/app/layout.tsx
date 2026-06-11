import './globals.css';

export const metadata = {
  title: 'Sang Tech - 백화점 상품권 시세 비교',
  description: '주요 백화점 상품권 매입 시세를 한눈에 비교하세요',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <nav className="main-nav">
          <div className="nav-container">
            <a href="/" className="nav-logo">Sang Tech</a>
            <div className="nav-links">
              <a href="/">시세 비교</a>
              <a href="/history">시세 변동</a>
              <a href="/market-calculator">시세 계산기</a>
              <a href="/calculator">계산기</a>
              <a href="/automation">자동화</a>
              <a href="/changelog">업데이트 노트</a>
            </div>
          </div>
        </nav>
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <footer style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          background: 'var(--card-bg)',
          borderTop: '1px solid var(--border-color)',
          marginTop: 'auto'
        }}>
          <div style={{ marginBottom: '1.2rem' }}>
            <a href="https://qr.kakaopay.com/Ej70ez4QV" target="_blank" rel="noreferrer" style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: '#FEE500', 
              color: '#191919', 
              padding: '0.8rem 1.5rem', 
              borderRadius: '30px', 
              textDecoration: 'none', 
              fontWeight: '700', 
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease'
            }}>
              ☕️ 개발자에게 커피 한 잔 후원하기
            </a>
          </div>
          <div style={{ letterSpacing: '0.02em', fontSize: '0.85rem' }}>
            made by <a href="https://github.com/krazyeom" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>krazyeom</a> | 그래염 @ <a href="https://cafe.naver.com/hexenyang" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>LTC</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
