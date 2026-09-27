import fs from 'fs';
import path from 'path';
import db, { hasSupabaseConfig } from '@/lib/db';

export interface PopupSettings {
  title: string;
  content: string;
  subContent?: string;
  footerText?: string;
  startDate: string; // YYYY-MM-DD or empty string
  endDate: string;   // YYYY-MM-DD or empty string
  isEnabled: boolean;
  updatedAt?: string;
}

const DEFAULT_SETTINGS: PopupSettings = {
  title: '',
  content: '',
  subContent: '',
  footerText: '개발자 krazyeom, 그래염',
  startDate: '',
  endDate: '',
  isEnabled: false,
  updatedAt: new Date().toISOString(),
};

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE_PATH = path.join(DATA_DIR, 'popup-settings.json');

export function getKoreaToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * 팝업 노출 조건 판별 (한국 시간 기준)
 */
export function isPopupCurrentlyActive(settings: PopupSettings): boolean {
  if (!settings.isEnabled) return false;
  if (!settings.content.trim() && !settings.title.trim()) return false;

  const today = getKoreaToday();

  if (settings.startDate && today < settings.startDate) {
    return false;
  }

  if (settings.endDate && today > settings.endDate) {
    return false;
  }

  return true;
}

/**
 * 로컬 파일 시스템에서 설정 읽기
 */
function readFromFile(): PopupSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('[PopupStore] Error reading file:', err);
  }
  return DEFAULT_SETTINGS;
}

/**
 * 로컬 파일 시스템에 설정 쓰기 (Vercel Serverless 환경에서는 Read-only이므로 예외 무시)
 */
function writeToFile(settings: PopupSettings): void {
  try {
    // Vercel 서버리스 람다 환경에서는 /var/task가 read-only임
    if (process.env.VERCEL) {
      return;
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    // 파일 시스템 쓰기 실패 시 조용히 무시 (Supabase가 우선 관리)
  }
}

/**
 * 팝업 설정 가져오기 (Supabase 시도 -> 로컬 파일 폴백)
 */
export async function getPopupSettings(): Promise<PopupSettings> {
  // 1. Supabase 시도
  if (hasSupabaseConfig && db) {
    try {
      const { data, error } = await db
        .from('popup_settings')
        .select('*')
        .eq('id', 'global_popup')
        .maybeSingle();

      if (!error && data) {
        return {
          title: data.title ?? '',
          content: data.content ?? '',
          subContent: data.sub_content ?? '',
          footerText: data.footer_text ?? '',
          startDate: data.start_date ?? '',
          endDate: data.end_date ?? '',
          isEnabled: Boolean(data.is_enabled),
          updatedAt: data.updated_at,
        };
      }
    } catch {
      // Supabase 테이블이 없거나 쿼리 실패 시 파일 시스템 사용
    }
  }

  // 2. 파일 시스템 폴백
  return readFromFile();
}

/**
 * 팝업 설정 저장하기 (로컬 파일 저장 + Supabase 시도)
 */
export async function savePopupSettings(settings: PopupSettings): Promise<PopupSettings> {
  const updated: PopupSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  // 1. 로컬 파일 시스템에 항상 저장
  writeToFile(updated);

  // 2. Supabase가 설정되어 있다면 DB 동기화 시도
  if (hasSupabaseConfig && db) {
    try {
      await db.from('popup_settings').upsert({
        id: 'global_popup',
        title: updated.title,
        content: updated.content,
        sub_content: updated.subContent || '',
        footer_text: updated.footerText || '',
        start_date: updated.startDate || null,
        end_date: updated.endDate || null,
        is_enabled: updated.isEnabled,
        updated_at: updated.updatedAt,
      });
    } catch {
      // Supabase 테이블이 없는 경우 조용히 무시 (파일에 안전히 저장됨)
    }
  }

  return updated;
}
