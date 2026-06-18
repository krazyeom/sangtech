import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST() {
  try {
    const today = new Date();
    // KST 기준으로 오늘 날짜(YYYY-MM-DD) 구하기
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(today.getTime() + kstOffset);
    const dateStr = kstDate.toISOString().split('T')[0];

    // 현재 날짜의 레코드 확인
    const { data: existing, error: selectError } = await db
      .from('page_views')
      .select('id, view_count')
      .eq('visit_date', dateStr)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "Results contain 0 rows"
      console.error('Error fetching page_views:', selectError);
      return NextResponse.json({ success: false, error: 'Select failed' }, { status: 500 });
    }

    if (existing) {
      // 이미 있으면 카운트 증가
      const { error: updateError } = await db
        .from('page_views')
        .update({ view_count: existing.view_count + 1 })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating page_views:', updateError);
        return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
      }
    } else {
      // 없으면 새로 추가
      const { error: insertError } = await db
        .from('page_views')
        .insert([{ visit_date: dateStr, view_count: 1 }]);

      // 중복 키 에러(23505)가 발생할 수 있음 (동시 접속) -> 이 경우 무시하거나 재시도 가능하지만 단순 카운터이므로 패스
      if (insertError && insertError.code !== '23505') {
        console.error('Error inserting page_views:', insertError);
        return NextResponse.json({ success: false, error: 'Insert failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, date: dateStr });
  } catch (error) {
    console.error('Visit tracking error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
