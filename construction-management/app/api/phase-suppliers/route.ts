import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/postgres';

// POST - إضافة مورد لمرحلة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phase_id, supplier_id, amount_due } = body;
    
    if (!phase_id || !supplier_id || !amount_due) {
      return NextResponse.json(
        { error: 'Phase ID, supplier ID, and amount due are required' },
        { status: 400 }
      );
    }
    
    // التحقق من عدم وجود المورد في نفس المرحلة
    const existing = await db.getOne(
      'SELECT id FROM phase_suppliers WHERE phase_id = $1 AND supplier_id = $2',
      [phase_id, supplier_id]
    );
    
    if (existing) {
      return NextResponse.json(
        { error: 'This supplier is already added to this phase' },
        { status: 400 }
      );
    }
    
    const newPhaseSupplier = await db.insert(`
      INSERT INTO phase_suppliers (phase_id, supplier_id, amount_due, amount_paid)
      VALUES ($1, $2, $3, 0)
    `, [phase_id, supplier_id, amount_due]);
    
    // جلب معلومات المورد
    const supplierInfo = await db.getOne(`
      SELECT 
        ps.*,
        s.name as supplier_name,
        s.phone,
        s.email
      FROM phase_suppliers ps
      JOIN suppliers s ON ps.supplier_id = s.id
      WHERE ps.id = $1
    `, [newPhaseSupplier.id]);
    
    return NextResponse.json(supplierInfo, { status: 201 });
  } catch (error) {
    console.error('Error adding supplier to phase:', error);
    return NextResponse.json(
      { error: 'Failed to add supplier to phase' },
      { status: 500 }
    );
  }
}

// GET - جلب موردي مرحلة
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phaseId = searchParams.get('phase_id');
    
    if (!phaseId) {
      return NextResponse.json(
        { error: 'Phase ID is required' },
        { status: 400 }
      );
    }
    
    const suppliers = await db.getMany(`
      SELECT 
        ps.*,
        s.name as supplier_name,
        s.phone,
        s.email,
        s.address
      FROM phase_suppliers ps
      JOIN suppliers s ON ps.supplier_id = s.id
      WHERE ps.phase_id = $1
      ORDER BY s.name
    `, [phaseId]);
    
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching phase suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch phase suppliers' },
      { status: 500 }
    );
  }
}