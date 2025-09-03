import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/postgres';

// POST - تسجيل دفعة لمورد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phase_supplier_id, amount, payment_date, payment_method, notes } = body;
    
    if (!phase_supplier_id || !amount || !payment_date) {
      return NextResponse.json(
        { error: 'Phase supplier ID, amount, and payment date are required' },
        { status: 400 }
      );
    }
    
    // استخدام transaction
    const result = await db.transaction(async (client) => {
      // جلب معلومات المورد في المرحلة والمشروع
      const phaseSupplier = await client.query(`
        SELECT 
          ps.*,
          ph.project_id,
          p.treasury_balance
        FROM phase_suppliers ps
        JOIN phases ph ON ps.phase_id = ph.id
        JOIN projects p ON ph.project_id = p.id
        WHERE ps.id = $1
      `, [phase_supplier_id]);
      
      if (phaseSupplier.rows.length === 0) {
        throw new Error('Phase supplier not found');
      }
      
      const supplier = phaseSupplier.rows[0];
      
      // التحقق من توفر الرصيد في الخزينة
      if (supplier.treasury_balance < amount) {
        throw new Error(`Insufficient treasury balance. Available: ${supplier.treasury_balance}, Required: ${amount}`);
      }
      
      // إدخال الدفعة
      const paymentResult = await client.query(`
        INSERT INTO supplier_payments (phase_supplier_id, amount, payment_date, payment_method, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [phase_supplier_id, amount, payment_date, payment_method || null, notes || null]);
      
      // تحديث المبلغ المدفوع للمورد
      await client.query(`
        UPDATE phase_suppliers 
        SET amount_paid = amount_paid + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [amount, phase_supplier_id]);
      
      // تحديث المبلغ المدفوع في المرحلة
      await client.query(`
        UPDATE phases 
        SET amount_paid = amount_paid + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [amount, supplier.phase_id]);
      
      // تحديث رصيد خزينة المشروع
      const newBalance = supplier.treasury_balance - amount;
      await client.query(`
        UPDATE projects 
        SET treasury_balance = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newBalance, supplier.project_id]);
      
      // تسجيل الحركة في سجل الخزينة
      await client.query(`
        INSERT INTO treasury_logs (
          project_id, transaction_type, amount, balance_after, 
          description, reference_type, reference_id
        )
        VALUES ($1, 'expense', $2, $3, $4, 'supplier_payment', $5)
      `, [
        supplier.project_id,
        amount,
        newBalance,
        `دفعة للمورد - ${notes || ''}`,
        paymentResult.rows[0].id
      ]);
      
      return paymentResult.rows[0];
    });
    
    // جلب معلومات الدفعة الكاملة
    const payment = await db.getOne(`
      SELECT 
        sp.*,
        s.name as supplier_name,
        ph.name as phase_name,
        proj.name as project_name
      FROM supplier_payments sp
      JOIN phase_suppliers ps ON sp.phase_supplier_id = ps.id
      JOIN suppliers s ON ps.supplier_id = s.id
      JOIN phases ph ON ps.phase_id = ph.id
      JOIN projects proj ON ph.project_id = proj.id
      WHERE sp.id = $1
    `, [result.id]);
    
    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('Error recording supplier payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record supplier payment' },
      { status: 400 }
    );
  }
}

// GET - جلب مدفوعات الموردين
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const phaseId = searchParams.get('phase_id');
    const supplierId = searchParams.get('supplier_id');
    
    let query = `
      SELECT 
        sp.*,
        s.name as supplier_name,
        ph.name as phase_name,
        proj.name as project_name,
        ps.amount_due,
        ps.amount_paid as total_paid
      FROM supplier_payments sp
      JOIN phase_suppliers ps ON sp.phase_supplier_id = ps.id
      JOIN suppliers s ON ps.supplier_id = s.id
      JOIN phases ph ON ps.phase_id = ph.id
      JOIN projects proj ON ph.project_id = proj.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (projectId) {
      params.push(projectId);
      query += ` AND ph.project_id = $${params.length}`;
    }
    
    if (phaseId) {
      params.push(phaseId);
      query += ` AND ps.phase_id = $${params.length}`;
    }
    
    if (supplierId) {
      params.push(supplierId);
      query += ` AND ps.supplier_id = $${params.length}`;
    }
    
    query += ' ORDER BY sp.payment_date DESC';
    
    const payments = await db.getMany(query, params);
    
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching supplier payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier payments' },
      { status: 500 }
    );
  }
}