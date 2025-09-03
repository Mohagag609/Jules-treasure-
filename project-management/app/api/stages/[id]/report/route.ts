import { NextRequest, NextResponse } from 'next/server';
import { getStageReport } from '@/lib/db-operations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stageId = parseInt(params.id);
    const report = getStageReport(stageId);
    
    if (!report.stage) {
      return NextResponse.json(
        { error: 'المرحلة غير موجودة' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في جلب التقرير' },
      { status: 500 }
    );
  }
}