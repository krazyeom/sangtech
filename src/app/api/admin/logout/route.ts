import { NextResponse } from 'next/server';
import { ADMIN_AUTH_COOKIE } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true, message: '로그아웃되었습니다.' });
  response.cookies.delete(ADMIN_AUTH_COOKIE);
  return response;
}
