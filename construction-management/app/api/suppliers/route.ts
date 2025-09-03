import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/postgres';

// GET - جلب جميع الموردين
export async function GET() {
  try {
    const suppliers = await db.getMany(`
      SELECT * FROM suppliers 
      ORDER BY name
    `);
    
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
    const existingSupplier = await db.getOne('SELECT id FROM suppliers WHERE name = $1', [name]);
    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this name already exists' },
        { status: 400 }
      );
    }
    
    const newSupplier = await db.insert(`
      INSERT INTO suppliers (name, phone, email, address)
      VALUES ($1, $2, $3, $4)
    `, [name, phone || null, email || null, address || null]);
    
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}