import { NextResponse } from 'next/server';
import { getPopupSettings, isPopupCurrentlyActive } from '@/lib/popup-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getPopupSettings();
    const isActive = isPopupCurrentlyActive(settings);

    if (!isActive) {
      return NextResponse.json({ active: false });
    }

    return NextResponse.json({
      active: true,
      popup: {
        title: settings.title,
        content: settings.content,
        subContent: settings.subContent,
        footerText: settings.footerText,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('[API /api/popup] Error:', error);
    return NextResponse.json({ active: false }, { status: 500 });
  }
}
