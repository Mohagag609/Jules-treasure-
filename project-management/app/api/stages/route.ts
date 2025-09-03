import { NextRequest, NextResponse } from 'next/server';
import { stageOperations } from '@/lib/db-operations';

export async function GET() {
  try {
    const stages = stageOperations.getAll();
    return NextResponse.json(stages);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في جلب المراحل' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const id = stageOperations.create(data);
    return NextResponse.json({ id, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في إنشاء المرحلة' },
      { status: 500 }
    );
  }
}