'use client';

import { useState, useEffect } from 'react';

interface PopupSettings {
  title: string;
  content: string;
  subContent?: string;
  footerText?: string;
  startDate: string;
  endDate: string;
  isEnabled: boolean;
  updatedAt?: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 팝업 설정 상태
  const [settings, setSettings] = useState<PopupSettings>({
    title: '',
    content: '',
    subContent: '',
    footerText: '',
    startDate: '',
    endDate: '',
    isEnabled: false,
  });

  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // 한국 시간 오늘 날짜 (YYYY-MM-DD)
  const getKoreaToday = () => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  };

  // 초기 인증 상태 확인
  useEffect(() => {
    fetch('/api/admin/auth')
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(Boolean(data.authenticated));
        if (data.authenticated) {
          loadSettings();
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  // 설정 불러오기
  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await fetch('/api/admin/popup');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings({
            title: data.settings.title || '',
            content: data.settings.content || '',
            subContent: data.settings.subContent || '',
            footerText: data.settings.footerText || '',
            startDate: data.settings.startDate || '',
            endDate: data.settings.endDate || '',
            isEnabled: Boolean(data.settings.isEnabled),
            updatedAt: data.settings.updatedAt,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setLoginError('비밀번호를 입력해주세요.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPassword('');
        loadSettings();
      } else {
        setLoginError(data.message || '비밀번호가 올바르지 않습니다.');
      }
    } catch {
      setLoginError('로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsAuthenticated(false);
  };

  // 설정 저장 처리
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/admin/popup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setSaveMessage({ type: 'success', text: '팝업 설정이 성공적으로 저장되었습니다.' });
      } else {
        setSaveMessage({ type: 'error', text: data.message || '저장에 실패했습니다.' });
      }
    } catch {
      setSaveMessage({ type: 'error', text: '네트워크 오류로 저장하지 못했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 기한 퀵 버튼 핸들러
  const setQuickPeriod = (days: number) => {
    const today = new Date();
    const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const formatDate = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);

    setSettings((prev) => ({
      ...prev,
      startDate: formatDate(today),
      endDate: formatDate(future),
    }));
  };

  // 현재 노출 상태 판별
  const getStatusBadge = () => {
    if (!settings.isEnabled) {
      return { text: '비활성화 (숨김)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    }
    const today = getKoreaToday();
    if (settings.startDate && today < settings.startDate) {
      return { text: `시작 대기중 (${settings.startDate}부터)`, color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
    }
    if (settings.endDate && today > settings.endDate) {
      return { text: `기간 만료됨 (~${settings.endDate})`, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    }
    if (!settings.title.trim() && !settings.content.trim()) {
      return { text: '문구 미입력 (숨김)', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
    }
    return { text: '현재 노출 중 (활성)', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' };
  };

  // 로딩 중 표시
  if (isAuthenticated === null) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
        인증 상태를 확인하고 있습니다...
      </div>
    );
  }

  // 1. 비로그인 상태 (로그인 화면)
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '70vh', padding: '1rem' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔐</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>관리자 로그인</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
              팝업 관리를 위해 비밀번호를 입력해주세요.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="admin-password"
                style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}
              >
                관리자 비밀번호 (.env)
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                autoFocus
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              />
            </div>

            {loginError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%',
                padding: '0.85rem',
                border: 0,
                borderRadius: '10px',
                background: 'linear-gradient(to right, var(--accent-blue), var(--accent-purple))',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                opacity: isLoggingIn ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              {isLoggingIn ? '확인 중...' : '로그인'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            비밀번호는 <code>.env.local</code>의 <code>ADMIN_PASSWORD</code>에 설정됩니다.
          </p>
        </div>
      </div>
    );
  }

  // 2. 로그인된 상태 (관리자 대시보드)
  const status = getStatusBadge();

  return (
    <div className="container" style={{ maxWidth: '840px', padding: '2rem 1rem' }}>
      {/* 상단 바 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>⚙️ 팝업 공지 관리</h1>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            사이트 방문자에게 노출될 공지 팝업을 실시간으로 관리합니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            👁️ 팝업 미리보기
          </button>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 상태 배지 카드 */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: '12px',
          padding: '1.2rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.8rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.75rem' }}>
            현재 노출 상태:
          </span>
          <span
            style={{
              display: 'inline-block',
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              background: status.bg,
              color: status.color,
              fontWeight: 700,
              fontSize: '0.85rem',
              border: `1px solid ${status.color}40`,
            }}
          >
            {status.text}
          </span>
        </div>
        {settings.updatedAt && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            마지막 수정: {new Date(settings.updatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
          </div>
        )}
      </div>

      {/* 알림 메시지 */}
      {saveMessage && (
        <div
          style={{
            padding: '1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            background: saveMessage.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${saveMessage.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: saveMessage.type === 'success' ? '#4ade80' : '#f87171',
            fontWeight: 600,
          }}
        >
          {saveMessage.type === 'success' ? '✅ ' : '⚠️ '}
          {saveMessage.text}
        </div>
      )}

      {/* 설정 폼 */}
      <form onSubmit={handleSave}>
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
          }}
        >
          {/* 1. 노출 가능 체크박스 */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              background: settings.isEnabled ? 'rgba(37, 99, 235, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${settings.isEnabled ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer',
            }}
            onClick={() => setSettings({ ...settings, isEnabled: !settings.isEnabled })}
          >
            <input
              type="checkbox"
              id="isEnabled"
              checked={settings.isEnabled}
              onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
              style={{
                width: '1.3rem',
                height: '1.3rem',
                cursor: 'pointer',
                accentColor: 'var(--accent-blue)',
              }}
            />
            <div>
              <label
                htmlFor="isEnabled"
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: settings.isEnabled ? '#60a5fa' : 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'block',
                }}
              >
                팝업 노출 활성화 (체크박스)
              </label>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                체크가 해제되어 있으면 설정된 기간이어도 팝업이 노출되지 않습니다.
              </div>
            </div>
          </div>

          {/* 2. 팝업 제목 */}
          <div>
            <label
              htmlFor="popup-title"
              style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.5rem' }}
            >
              팝업 제목
            </label>
            <input
              id="popup-title"
              type="text"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="예: 📢 공지사항 또는 시스템 점검 안내"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          {/* 3. 팝업 본문 문구 */}
          <div>
            <label
              htmlFor="popup-content"
              style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.5rem' }}
            >
              팝업 본문 문구 <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(줄바꿈 지원)</span>
            </label>
            <textarea
              id="popup-content"
              rows={5}
              value={settings.content}
              onChange={(e) => setSettings({ ...settings, content: e.target.value })}
              placeholder="팝업에 표시할 주요 안내 문구를 입력하세요.&#10;줄바꿈(엔터)이 그대로 화면에 반영됩니다."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* 4. 부가/강조 문구 (선택) */}
          <div>
            <label
              htmlFor="popup-subcontent"
              style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.5rem' }}
            >
              강조 문구 <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(선택 사항 - 파란 박스 강조)</span>
            </label>
            <input
              id="popup-subcontent"
              type="text"
              value={settings.subContent || ''}
              onChange={(e) => setSettings({ ...settings, subContent: e.target.value })}
              placeholder="예: 💡 방문 전 반드시 유선으로 영업 여부를 확인해 주세요!"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          {/* 5. 하단 서명 (선택) */}
          <div>
            <label
              htmlFor="popup-footer"
              style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.5rem' }}
            >
              하단 서명 문구 <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(선택 사항)</span>
            </label>
            <input
              id="popup-footer"
              type="text"
              value={settings.footerText || ''}
              onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
              placeholder="예: 개발자 krazyeom, 그래염"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          {/* 6. 노출 기한 설정 */}
          <div
            style={{
              borderTop: '1px solid var(--card-border)',
              paddingTop: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                📅 노출 기한 설정
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setQuickPeriod(3)}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  3일간
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPeriod(7)}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  7일간
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, startDate: '', endDate: '' })}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  무기한 (비우기)
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
              날짜를 비워두면 기한 제한 없이 활성화 체크박스 상태에 따라 노출됩니다.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  노출 시작일 (KST)
                </span>
                <input
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  노출 종료일 (KST)
                </span>
                <input
                  type="date"
                  value={settings.endDate}
                  onChange={(e) => setSettings({ ...settings, endDate: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={isSaving || isLoadingSettings}
              style={{
                flex: 1,
                padding: '0.95rem',
                borderRadius: '10px',
                border: 0,
                background: 'linear-gradient(to right, var(--accent-blue), var(--accent-purple))',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)',
                transition: 'transform 0.15s ease',
              }}
            >
              {isSaving ? '저장 중...' : '💾 설정 저장하기'}
            </button>
          </div>
        </div>
      </form>

      {/* 팝업 미리보기 모달 */}
      {showPreviewModal && (
        <div
          role="presentation"
          onClick={() => setShowPreviewModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(5px)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxSizing: 'border-box',
              width: '100%',
              maxWidth: '420px',
              padding: '26px',
              border: '1px solid #e2e8f0',
              borderRadius: '18px',
              background: '#ffffff',
              color: '#1f2937',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                미리보기 화면
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                }}
              >
                ✕
              </button>
            </div>

            <h2 style={{ margin: '0 0 0.8rem', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              {settings.title || '제목이 없습니다'}
            </h2>

            <div
              style={{
                margin: '0 0 1rem',
                lineHeight: 1.75,
                fontSize: '0.98rem',
                color: '#334155',
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
              }}
            >
              {settings.content || '본문 문구가 비어 있습니다.'}
            </div>

            {settings.subContent && (
              <div
                style={{
                  margin: '0 0 1.25rem',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '6px',
                  lineHeight: 1.6,
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  color: '#1e293b',
                  whiteSpace: 'pre-line',
                }}
              >
                {settings.subContent}
              </div>
            )}

            {settings.footerText && (
              <p
                style={{
                  margin: '0 0 1.25rem',
                  textAlign: 'right',
                  fontSize: '0.82rem',
                  color: '#64748b',
                }}
              >
                {settings.footerText}
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                오늘 하루 닫기
              </button>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: 0,
                  borderRadius: '10px',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
