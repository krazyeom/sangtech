import crypto from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_AUTH_COOKIE = 'sangtech_admin_session';

function getAdminSecret(): string {
  return process.env.ADMIN_PASSWORD || 'default_admin_password_key_2026';
}

/**
 * 올바른 관리자 토큰 생성
 */
export function generateAdminToken(): string {
  const secret = getAdminSecret();
  return crypto.createHmac('sha256', secret).update('admin_authenticated_session').digest('hex');
}

/**
 * 비밀번호 검증
 */
export function verifyAdminPassword(password: string): boolean {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    // 환경변수가 없으면 기본값과 비교
    return password === 'admin1234';
  }
  // 타이밍 공격 방지를 위해 timingSafeEqual 사용
  const inputBuffer = Buffer.from(password);
  const secretBuffer = Buffer.from(secret);
  if (inputBuffer.length !== secretBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(inputBuffer, secretBuffer);
}

/**
 * 쿠키 기반 관리자 인증 확인
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_AUTH_COOKIE)?.value;
    if (!token) return false;

    const expectedToken = generateAdminToken();
    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(expectedToken);

    if (tokenBuf.length !== expectedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(tokenBuf, expectedBuf);
  } catch {
    return false;
  }
}
