import { NextRequest, NextResponse } from 'next/server';
import { getBuildingFullReport } from '@/lib/db-operations/reports';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const buildingId = parseInt(id);
    
    if (isNaN(buildingId)) {
      return NextResponse.json({ error: 'Invalid building ID' }, { status: 400 });
    }
    
    const report = await getBuildingFullReport(buildingId);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error fetching building report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch building report' }, 
      { status: 500 }
    );
  }
}