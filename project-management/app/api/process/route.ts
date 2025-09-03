import { NextRequest, NextResponse } from 'next/server';
import { processUnifiedInput } from '@/lib/db-operations';
import { UnifiedInput } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const data: UnifiedInput = await request.json();
    
    // التحقق من صحة البيانات
    if (!data.stage || !data.stage.name || !data.stage.total_amount) {
      return NextResponse.json(
        { error: 'بيانات المرحلة غير مكتملة' },
        { status: 400 }
      );
    }
    
    // التحقق من أن مجموع النسب = 100%
    const totalPercentage = data.partners.reduce((sum, p) => sum + p.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json(
        { error: 'مجموع نسب الشركاء يجب أن يساوي 100%' },
        { status: 400 }
      );
    }
    
    // معالجة البيانات
    const result = processUnifiedInput(data);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error processing input:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في معالجة البيانات' },
      { status: 500 }
    );
  }
}