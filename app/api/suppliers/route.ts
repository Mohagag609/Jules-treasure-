import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/database';

// GET - جلب جميع الموردين
export async function GET() {
  try {
    const suppliers = db.prepare(`
      SELECT * FROM suppliers 
      ORDER BY name
    `).all();
    
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

// POST - إنشاء مورد جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, address } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      );
    }
    
    // التحقق من عدم وجود مورد بنفس الاسم
    const existingSupplier = db.prepare('SELECT id FROM suppliers WHERE name = ?').get(name);
    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this name already exists' },
        { status: 400 }
      );
    }
    
    const result = db.prepare(`
      INSERT INTO suppliers (name, phone, email, address)
      VALUES (?, ?, ?, ?)
    `).run(name, phone || null, email || null, address || null);
    
    const newSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}