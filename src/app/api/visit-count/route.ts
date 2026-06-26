import { NextResponse } from 'next/server';
import db, { hasSupabaseConfig } from '@/lib/db';

export async function GET() {
  try {
    const client = db;
    if (!hasSupabaseConfig || !client) {
      return NextResponse.json({ success: true, totalViews: 0, nextTarget: 100 });
    }

    const { data: allViews, error: sumError } = await client.from('page_views').select('view_count');
    
    if (sumError) {
      console.error('Error fetching page_views:', sumError);
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }

    const totalViews = allViews?.reduce((acc, curr) => acc + (curr.view_count || 0), 0) || 0;
    
    return NextResponse.json({ 
      success: true, 
      totalViews,
      nextTarget: Math.ceil((totalViews + 1) / 100) * 100
    });
  } catch (error) {
    console.error('Visit count error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
