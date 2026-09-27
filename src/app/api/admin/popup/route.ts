import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';
import { getPopupSettings, savePopupSettings, PopupSettings } from '@/lib/popup-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const settings = await getPopupSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[API /api/admin/popup GET] Error:', error);
    return NextResponse.json({ success: false, message: '설정을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, subContent, footerText, startDate, endDate, isEnabled } = body;

    const newSettings: PopupSettings = {
      title: typeof title === 'string' ? title.slice(0, 100) : '',
      content: typeof content === 'string' ? content.slice(0, 2000) : '',
      subContent: typeof subContent === 'string' ? subContent.slice(0, 200) : '',
      footerText: typeof footerText === 'string' ? footerText.slice(0, 100) : '',
      startDate: typeof startDate === 'string' ? startDate.slice(0, 10) : '',
      endDate: typeof endDate === 'string' ? endDate.slice(0, 10) : '',
      isEnabled: Boolean(isEnabled),
    };

    const saved = await savePopupSettings(newSettings);
    return NextResponse.json({ success: true, settings: saved, message: '설정이 성공적으로 저장되었습니다.' });
  } catch (error) {
    console.error('[API /api/admin/popup POST] Error:', error);
    return NextResponse.json({ success: false, message: '설정 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
