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
      <body>
        <nav className="main-nav">
          <div className="nav-container">
            <a href="/" className="nav-logo">Sang Tech</a>
            <div className="nav-links">
              <a href="/">시세 비교</a>
              <a href="/history">시세 변동</a>
              <a href="/market-calculator">시세 계산기</a>
              <a href="/calculator">계산기</a>
              <a href="/automation">자동화</a>
              <a href="/notifications">알림</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
