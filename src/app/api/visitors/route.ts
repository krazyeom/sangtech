import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    // 1. 오늘 방문자 수 (한국 시간 KST 기준)
    const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const today = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const { data: todayData, error: todayError } = await supabase
      .from('daily_visitors')
      .select('count')
      .eq('visit_date', today)
      .single();

    if (todayError && todayError.code !== 'PGRST116') {
      console.error('Error fetching today visitors:', todayError);
    }

    // 2. 어제 방문자 수 (한국 시간 KST 기준)
    const yesterdayDate = new Date(kstDate.getTime() - 24 * 60 * 60 * 1000);
    const yesterday = yesterdayDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const { data: yesterdayData, error: yesterdayError } = await supabase
      .from('daily_visitors')
      .select('count')
      .eq('visit_date', yesterday)
      .single();

    if (yesterdayError && yesterdayError.code !== 'PGRST116') {
      console.error('Error fetching yesterday visitors:', yesterdayError);
    }
    
    // 3. 전체 방문자 수
    const { data: totalData, error: totalError } = await supabase
      .from('daily_visitors')
      .select('count');

    if (totalError) {
      console.error('Error fetching total visitors:', totalError);
    }

    const todayCount = todayData?.count || 0;
    const yesterdayCount = yesterdayData?.count || 0;
    const totalCount = totalData?.reduce((acc, curr) => acc + curr.count, 0) || 0;

    return NextResponse.json({
      success: true,
      stats: {
        today: todayCount,
        yesterday: yesterdayCount,
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
    const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const today = kstDate.toISOString().split('T')[0]; // YYYY-MM-DD (KST)
    
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
