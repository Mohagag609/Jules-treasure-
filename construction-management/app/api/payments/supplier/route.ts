import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/database';

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
    
    const transaction = db.transaction(() => {
      // جلب معلومات المورد في المرحلة والمشروع
      const phaseSupplier = db.prepare(`
        SELECT 
          ps.*,
          ph.project_id,
          p.treasury_balance
        FROM phase_suppliers ps
        JOIN phases ph ON ps.phase_id = ph.id
        JOIN projects p ON ph.project_id = p.id
        WHERE ps.id = ?
      `).get(phase_supplier_id) as any;
      
      if (!phaseSupplier) {
        throw new Error('Phase supplier not found');
      }
      
      // التحقق من توفر الرصيد في الخزينة
      if (phaseSupplier.treasury_balance < amount) {
        throw new Error(`Insufficient treasury balance. Available: ${phaseSupplier.treasury_balance}, Required: ${amount}`);
      }
      
      // إدخال الدفعة
      const paymentResult = db.prepare(`
        INSERT INTO supplier_payments (phase_supplier_id, amount, payment_date, payment_method, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(phase_supplier_id, amount, payment_date, payment_method || null, notes || null);
      
      // تحديث المبلغ المدفوع للمورد
      db.prepare(`
        UPDATE phase_suppliers 
        SET amount_paid = amount_paid + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(amount, phase_supplier_id);
      
      // تحديث المبلغ المدفوع في المرحلة
      db.prepare(`
        UPDATE phases 
        SET amount_paid = amount_paid + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(amount, phaseSupplier.phase_id);
      
      // تحديث رصيد خزينة المشروع
      const newBalance = phaseSupplier.treasury_balance - amount;
      db.prepare(`
        UPDATE projects 
        SET treasury_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newBalance, phaseSupplier.project_id);
      
      // تسجيل الحركة في سجل الخزينة
      db.prepare(`
        INSERT INTO treasury_logs (
          project_id, transaction_type, amount, balance_after, 
          description, reference_type, reference_id
        )
        VALUES (?, 'expense', ?, ?, ?, 'supplier_payment', ?)
      `).run(
        phaseSupplier.project_id,
        amount,
        newBalance,
        `دفعة للمورد - ${notes || ''}`,
        paymentResult.lastInsertRowid
      );
      
      return paymentResult.lastInsertRowid;
    });
    
    const paymentId = transaction();
    
    const payment = db.prepare(`
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
      WHERE sp.id = ?
    `).get(paymentId);
    
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
      query += ' AND ph.project_id = ?';
      params.push(projectId);
    }
    
    if (phaseId) {
      query += ' AND ps.phase_id = ?';
      params.push(phaseId);
    }
    
    if (supplierId) {
      query += ' AND ps.supplier_id = ?';
      params.push(supplierId);
    }
    
    query += ' ORDER BY sp.payment_date DESC';
    
    const payments = db.prepare(query).all(...params);
    
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching supplier payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier payments' },
      { status: 500 }
    );
  }
}