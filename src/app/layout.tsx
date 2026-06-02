import './globals.css';

export const metadata = {
  title: 'DeptGift - 백화점 상품권 시세 비교',
  description: '신세계, 롯데, 현대 백화점 상품권 매입가 실시간 비교',
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
            <a href="/" className="nav-logo">DeptGift</a>
            <div className="nav-links">
              <a href="/">시세 비교</a>
              <a href="/history">시세 변동</a>
              <a href="/calculator">계산기</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
