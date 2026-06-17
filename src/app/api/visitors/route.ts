import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    // 1. 오늘 방문자 수
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data: todayData, error: todayError } = await supabase
      .from('daily_visitors')
      .select('count')
      .eq('visit_date', today)
      .single();

    if (todayError && todayError.code !== 'PGRST116') {
      console.error('Error fetching today visitors:', todayError);
    }

    // 2. 이번 달 방문자 수
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const { data: monthData, error: monthError } = await supabase
      .from('daily_visitors')
      .select('count')
      .gte('visit_date', firstDayOfMonth);

    if (monthError) {
      console.error('Error fetching month visitors:', monthError);
    }
    
    // 3. 전체 방문자 수
    const { data: totalData, error: totalError } = await supabase
      .from('daily_visitors')
      .select('count');

    if (totalError) {
      console.error('Error fetching total visitors:', totalError);
    }

    const todayCount = todayData?.count || 0;
    const monthCount = monthData?.reduce((acc, curr) => acc + curr.count, 0) || 0;
    const totalCount = totalData?.reduce((acc, curr) => acc + curr.count, 0) || 0;

    return NextResponse.json({
      success: true,
      stats: {
        today: todayCount,
        month: monthCount,
        total: totalCount
      }
    });
  } catch (error) {
    console.error('API Error /api/visitors (GET):', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // UPSERT 로직 대신 먼저 조회를 하고 업데이트/인서트를 처리할 수도 있지만,
    // Supabase JS 클라이언트의 upsert 기능을 활용하거나 단순 조회를 통해 처리합니다.
    
    const { data: existingData } = await supabase
      .from('daily_visitors')
      .select('count')
      .eq('visit_date', today)
      .single();

    if (existingData) {
      // 존재하면 +1 업데이트
      await supabase
        .from('daily_visitors')
        .update({ count: existingData.count + 1 })
        .eq('visit_date', today);
    } else {
      // 없으면 새로 생성 (기본값 1로 할당해도 되고 명시적으로 1 전달)
      await supabase
        .from('daily_visitors')
        .insert([{ visit_date: today, count: 1 }]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error /api/visitors (POST):', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
