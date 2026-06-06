'use client';

import { useState, useEffect } from 'react';

export default function Automation() {
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [copiedUserscript, setCopiedUserscript] = useState(false);
  
  const [bookmarkletCode, setBookmarkletCode] = useState('로딩 중...');
  const [userscriptCode, setUserscriptCode] = useState('로딩 중...');

  useEffect(() => {
    fetch('/scripts/bookmarklet.js')
      .then(r => r.text())
      .then(setBookmarkletCode)
      .catch(e => setBookmarkletCode('코드를 불러오지 못했습니다.'));
      
    fetch('/scripts/mileage-analyzer.user.js')
      .then(r => r.text())
      .then(setUserscriptCode)
      .catch(e => setUserscriptCode('코드를 불러오지 못했습니다.'));
  }, []);

  const copyToClipboard = (text: string, type: 'bookmarklet' | 'userscript') => {
    navigator.clipboard.writeText(text);
    if (type === 'bookmarklet') {
      setCopiedBookmarklet(true);
      setTimeout(() => setCopiedBookmarklet(false), 2000);
    } else {
      setCopiedUserscript(true);
      setTimeout(() => setCopiedUserscript(false), 2000);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <header>
        <div className="logo">
          <h1>자동화 도구 가이드</h1>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* iOS 북마클릿 가이드 */}
        <section className="card">
          <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            🍏 iOS (Safari) - 북마클릿 (Bookmarklet)
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
            아이폰 Safari 브라우저에서 사용할 수 있는 북마클릿 스크립트입니다. 
            즐겨찾기에 아래 코드를 주소 대신 저장해두고, G마켓 등 상품 페이지에서 실행하면 
            시세를 불러와 마일리지를 자동으로 계산해 줍니다.
          </p>
          
          <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.8' }}>
            <li>아래 <b>코드 복사</b> 버튼을 눌러 스크립트를 복사합니다.</li>
            <li>Safari 브라우저에서 아무 페이지나 <b>즐겨찾기에 추가</b>합니다.</li>
            <li>즐겨찾기 수정 모드로 들어가서 방금 추가한 항목의 이름을 '마일리지 분석'으로 바꿉니다.</li>
            <li>URL(주소) 칸의 내용을 모두 지우고, 방금 복사한 코드를 <b>붙여넣기</b> 한 후 저장합니다.</li>
            <li>원하는 상품 페이지에 접속 후, 즐겨찾기를 열어 '마일리지 분석'을 누르면 실행됩니다.</li>
          </ol>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
            <button 
              onClick={() => copyToClipboard(bookmarkletCode, 'bookmarklet')}
              style={{ position: 'absolute', right: '10px', top: '10px', background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, zIndex: 10 }}
            >
              {copiedBookmarklet ? '복사 완료!' : '코드 복사'}
            </button>
            <pre style={{ overflowX: 'auto', color: '#e2e8f0', fontSize: '0.9rem', paddingTop: '2rem', margin: 0 }}>
              <code>{bookmarkletCode}</code>
            </pre>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <a href="/scripts/bookmarklet.js" download style={{ display: 'inline-block', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
              📥 북마클릿 소스 파일 다운로드
            </a>
          </div>
        </section>

        {/* Android 네이버 웨일 / Tampermonkey 가이드 */}
        <section className="card">
          <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            🤖 Android (Naver Whale) - 탬퍼몽키 유저스크립트
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
            안드로이드 <b>네이버 웨일(Whale)</b> 브라우저에서 확장앱(Tampermonkey 등)을 사용해 적용할 수 있는 전체 코드입니다. 
            적용해두면 특정 쇼핑몰 상품 페이지 접속 시 화면 하단에 <b>분석 버튼</b>이 자동으로 나타납니다.
          </p>

          <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.8' }}>
            <li>안드로이드 네이버 웨일 브라우저를 켜고, 우측 하단 메뉴에서 <b>확장앱</b> ➔ <b>호환 스토어</b>로 이동해 <b>Tampermonkey</b>를 설치합니다.</li>
            <li>아래 <b>코드 복사</b> 버튼을 눌러 스크립트 전체를 복사합니다.</li>
            <li>네이버 웨일 확장앱 메뉴에서 Tampermonkey 대시보드로 들어가 <b>새 스크립트 만들기(+)</b>를 누릅니다.</li>
            <li>기존에 적혀있는 내용을 모두 지우고 복사한 코드를 붙여넣기 한 후 <b>저장(Save)</b>합니다.</li>
            <li>이제 지정된 상품 페이지(예: 지마켓)에 접속하면 자동으로 '현재 상품 마일리지 분석하기' 버튼이 하단에 나타납니다.</li>
          </ol>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
            <button 
              onClick={() => copyToClipboard(userscriptCode, 'userscript')}
              style={{ position: 'absolute', right: '10px', top: '10px', background: 'var(--accent-purple)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, zIndex: 10 }}
            >
              {copiedUserscript ? '복사 완료!' : '코드 복사'}
            </button>
            <pre style={{ overflowX: 'auto', maxHeight: '350px', color: '#e2e8f0', fontSize: '0.85rem', paddingTop: '2rem', margin: 0 }}>
              <code>{userscriptCode}</code>
            </pre>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <a href="/scripts/mileage-analyzer.user.js" download style={{ display: 'inline-block', color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 600 }}>
              📥 탬퍼몽키 유저스크립트 소스 파일 다운로드
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
