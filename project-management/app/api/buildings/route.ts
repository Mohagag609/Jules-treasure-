import { NextRequest, NextResponse } from 'next/server';
import { getAllBuildings, createBuilding } from '@/lib/db-operations/buildings';

export async function GET() {
  try {
    const buildings = await getAllBuildings();
    return NextResponse.json(buildings);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return NextResponse.json({ error: 'Failed to fetch buildings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const building = await createBuilding(data);
    return NextResponse.json(building);
  } catch (error) {
    console.error('Error creating building:', error);
    return NextResponse.json({ error: 'Failed to create building' }, { status: 500 });
  }
}