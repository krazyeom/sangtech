'use client';

import { useState, useEffect } from 'react';

export default function Automation() {
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [copiedUserscript, setCopiedUserscript] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('ios');
  
  const [bookmarkletCode, setBookmarkletCode] = useState('로딩 중...');
  const [userscriptCode, setUserscriptCode] = useState('로딩 중...');

  useEffect(() => {
    // 접속한 기기 OS 감지하여 기본 탭 설정
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) {
      setActiveTab('android');
    } else if (/iphone|ipad|ipod/.test(ua)) {
      setActiveTab('ios');
    }

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

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
        <button 
          onClick={() => setActiveTab('ios')}
          style={{ 
            flex: 1,
            maxWidth: '200px',
            padding: '0.8rem 1rem', 
            borderRadius: '8px', 
            fontWeight: 700, 
            fontSize: '1.1rem',
            border: activeTab === 'ios' ? '2px solid var(--accent-blue)' : '1px solid var(--card-border)',
            background: activeTab === 'ios' ? 'rgba(59, 130, 246, 0.1)' : 'var(--card-bg)',
            color: activeTab === 'ios' ? 'var(--accent-blue)' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🍏 iOS 가이드
        </button>
        <button 
          onClick={() => setActiveTab('android')}
          style={{ 
            flex: 1,
            maxWidth: '200px',
            padding: '0.8rem 1rem', 
            borderRadius: '8px', 
            fontWeight: 700, 
            fontSize: '1.1rem',
            border: activeTab === 'android' ? '2px solid #10b981' : '1px solid var(--card-border)',
            background: activeTab === 'android' ? 'rgba(16, 185, 129, 0.1)' : 'var(--card-bg)',
            color: activeTab === 'android' ? '#10b981' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🤖 Android 가이드
        </button>
      </div>

      {activeTab === 'ios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section className="card">
            <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              1. 북마클릿 (Safari 브라우저)
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
              Safari 브라우저의 즐겨찾기 기능을 이용해 스크립트를 수동으로 실행하는 가장 간단한 방법입니다.
            </p>
            <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.8' }}>
              <li>아래 <b>코드 복사</b> 버튼을 눌러 스크립트를 복사합니다.</li>
              <li>Safari에서 아무 페이지나 <b>즐겨찾기에 추가</b>합니다.</li>
              <li>즐겨찾기 수정 모드로 들어가서 방금 추가한 항목의 이름을 '마일리지 분석'으로 바꿉니다.</li>
              <li>URL(주소) 칸의 내용을 모두 지우고, 방금 복사한 코드를 <b>붙여넣기</b> 한 후 저장합니다.</li>
              <li>상품 페이지(예: 지마켓)에 접속 후, 즐겨찾기를 열어 '마일리지 분석'을 누르면 실행됩니다.</li>
            </ol>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
              <button onClick={() => copyToClipboard(bookmarkletCode, 'bookmarklet')} style={{ position: 'absolute', right: '10px', top: '10px', background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, zIndex: 10 }}>
                {copiedBookmarklet ? '복사 완료!' : '코드 복사'}
              </button>
              <pre style={{ overflowX: 'auto', color: '#e2e8f0', fontSize: '0.9rem', paddingTop: '2rem', margin: 0 }}>
                <code>{bookmarkletCode}</code>
              </pre>
            </div>
          </section>

          <section className="card">
            <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              2. 유저스크립트 (Userscripts 앱 적용)
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
              iOS의 Safari 확장앱인 <b>Userscripts</b>를 설치하여 즐겨찾기를 누르지 않아도 상품 페이지 접속 시 자동으로 버튼을 띄우는 방법입니다.
            </p>
            <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.8' }}>
              <li>App Store에서 <b>Userscripts</b> 앱을 다운로드 및 설치합니다.</li>
              <li>아이폰 설정 ➔ Safari ➔ 확장 프로그램에서 Userscripts를 켭니다.</li>
              <li>아래 <b>코드 복사</b> 버튼을 눌러 탬퍼몽키 형식의 코드를 복사합니다.</li>
              <li>Userscripts 앱을 열어 스크립트 디렉토리를 설정하고 새 스크립트(.user.js)를 만들어 코드를 붙여넣습니다.</li>
              <li>이후 상품 페이지에 접속하면 화면 하단에 <b>분석 버튼</b>이 자동으로 나타납니다.</li>
            </ol>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
              <button onClick={() => copyToClipboard(userscriptCode, 'userscript')} style={{ position: 'absolute', right: '10px', top: '10px', background: 'var(--accent-purple)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, zIndex: 10 }}>
                {copiedUserscript ? '복사 완료!' : '코드 복사'}
              </button>
              <pre style={{ overflowX: 'auto', maxHeight: '350px', color: '#e2e8f0', fontSize: '0.85rem', paddingTop: '2rem', margin: 0 }}>
                <code>{userscriptCode}</code>
              </pre>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'android' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section className="card">
            <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              1. 탬퍼몽키 유저스크립트 (네이버 웨일 권장)
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
              안드로이드의 <b>네이버 웨일(Whale)</b> 등 <b>확장앱(Tampermonkey)</b>을 지원하는 브라우저에서 스크립트를 자동으로 실행시키는 가장 편리한 방법입니다.
            </p>
            <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.8' }}>
              <li>안드로이드 <b>네이버 웨일</b> 브라우저를 켜고, 우측 하단 메뉴에서 <b>확장앱</b> ➔ <b>호환 스토어</b>로 이동해 <b>Tampermonkey</b>를 설치합니다.</li>
              <li>아래 <b>코드 복사</b> 버튼을 눌러 스크립트 전체를 복사합니다.</li>
              <li>웨일 확장앱 메뉴에서 Tampermonkey 대시보드로 들어가 <b>새 스크립트 만들기(+)</b>를 누릅니다.</li>
              <li>기존에 적혀있는 내용을 모두 지우고 복사한 코드를 붙여넣기 한 후 <b>저장(Save)</b>합니다.</li>
              <li>지정된 상품 페이지 접속 시 화면 하단에 <b>분석 버튼</b>이 자동으로 나타납니다.</li>
            </ol>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
              <button onClick={() => copyToClipboard(userscriptCode, 'userscript')} style={{ position: 'absolute', right: '10px', top: '10px', background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, zIndex: 10 }}>
                {copiedUserscript ? '복사 완료!' : '코드 복사'}
              </button>
              <pre style={{ overflowX: 'auto', maxHeight: '350px', color: '#e2e8f0', fontSize: '0.85rem', paddingTop: '2rem', margin: 0 }}>
                <code>{userscriptCode}</code>
              </pre>
            </div>
          </section>

          <section className="card">
            <h3 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              2. 북마클릿 (네이버 웨일 브라우저)
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1rem' }}>
              확장앱 설치가 번거롭다면, 북마크(즐겨찾기)에 코드를 저장해두고 필요할 때마다 눌러서 수동으로 실행할 수 있습니다.
            </p>
            <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.8' }}>
              <li>아래 <b>코드 복사</b> 버튼을 눌러 스크립트를 복사합니다.</li>
              <li>네이버 웨일 브라우저에서 아무 페이지나 <b>북마크 추가</b>를 합니다.</li>
              <li>북마크 편집에서 이름을 '마일리지 분석'으로 바꿉니다.</li>
              <li>URL 칸의 내용을 모두 지우고, 방금 복사한 코드를 <b>붙여넣기</b> 한 후 저장합니다.</li>
              <li>상품 페이지에서 북마크 메뉴를 열고 '마일리지 분석'을 누르거나, 주소창에 '마일리지 분석'을 쳐서 실행합니다.</li>
            </ol>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', position: 'relative' }}>
              <button onClick={() => copyToClipboard(bookmarkletCode, 'bookmarklet')} style={{ position: 'absolute', right: '10px', top: '10px', background: 'var(--accent-blue)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, zIndex: 10 }}>
                {copiedBookmarklet ? '복사 완료!' : '코드 복사'}
              </button>
              <pre style={{ overflowX: 'auto', color: '#e2e8f0', fontSize: '0.9rem', paddingTop: '2rem', margin: 0 }}>
                <code>{bookmarkletCode}</code>
              </pre>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
