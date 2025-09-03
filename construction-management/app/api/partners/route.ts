import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/database';

// GET - جلب جميع الشركاء
export async function GET() {
  try {
    const partners = db.prepare(`
      SELECT * FROM partners 
      ORDER BY name
    `).all();
    
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
    const existingPartner = db.prepare('SELECT id FROM partners WHERE name = ?').get(name);
    if (existingPartner) {
      return NextResponse.json(
        { error: 'Partner with this name already exists' },
        { status: 400 }
      );
    }
    
    const result = db.prepare(`
      INSERT INTO partners (name, phone, email)
      VALUES (?, ?, ?)
    `).run(name, phone || null, email || null);
    
    const newPartner = db.prepare('SELECT * FROM partners WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json(newPartner, { status: 201 });
  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}