import { NextRequest, NextResponse } from 'next/server';
import { getAllPartners, createPartner } from '@/lib/db-operations/partners';

export async function GET() {
  try {
    const partners = await getAllPartners();
    return NextResponse.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const partner = await createPartner(data);
    return NextResponse.json(partner);
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 });
  }
}