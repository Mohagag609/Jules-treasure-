import { NextRequest, NextResponse } from 'next/server';
import { quickCreateBuilding } from '@/lib/db-operations/quick-entry';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await quickCreateBuilding(data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating building:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create building' }, 
      { status: 500 }
    );
  }
}