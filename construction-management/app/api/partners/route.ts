import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/postgres';

// GET - جلب جميع الشركاء
export async function GET() {
  try {
    const partners = await db.getMany(`
      SELECT * FROM partners 
      ORDER BY name
    `);
    
    return NextResponse.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

// POST - إنشاء شريك جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Partner name is required' },
        { status: 400 }
      );
    }
    
    // التحقق من عدم وجود شريك بنفس الاسم
    const existingPartner = await db.getOne('SELECT id FROM partners WHERE name = $1', [name]);
    if (existingPartner) {
      return NextResponse.json(
        { error: 'Partner with this name already exists' },
        { status: 400 }
      );
    }
    
    const newPartner = await db.insert(`
      INSERT INTO partners (name, phone, email)
      VALUES ($1, $2, $3)
    `, [name, phone || null, email || null]);
    
    return NextResponse.json(newPartner, { status: 201 });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}