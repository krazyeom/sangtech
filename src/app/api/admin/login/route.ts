import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, generateAdminToken, ADMIN_AUTH_COOKIE } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (typeof password !== 'string') {
      return NextResponse.json({ success: false, message: '비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json({ success: false, message: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const token = generateAdminToken();
    const response = NextResponse.json({ success: true, message: '인증되었습니다.' });

    // 보안 쿠키 설정 (7일)
    response.cookies.set({
      name: ADMIN_AUTH_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('[API /api/admin/login] Error:', error);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
