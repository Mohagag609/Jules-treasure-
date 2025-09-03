import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/database';

// POST - تسجيل دفعة من شريك
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_partner_id, amount, payment_date, payment_method, notes } = body;
    
    if (!project_partner_id || !amount || !payment_date) {
      return NextResponse.json(
        { error: 'Project partner ID, amount, and payment date are required' },
        { status: 400 }
      );
    }
    
    const transaction = db.transaction(() => {
      // جلب معلومات الشريك في المشروع
      const projectPartner = db.prepare(`
        SELECT pp.*, p.treasury_balance 
        FROM project_partners pp
        JOIN projects p ON pp.project_id = p.id
        WHERE pp.id = ?
      `).get(project_partner_id) as any;
      
      if (!projectPartner) {
        throw new Error('Project partner not found');
      }
      
      // إدخال الدفعة
      const paymentResult = db.prepare(`
        INSERT INTO partner_payments (project_partner_id, amount, payment_date, payment_method, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(project_partner_id, amount, payment_date, payment_method || null, notes || null);
      
      // تحديث المبلغ المدفوع للشريك
      db.prepare(`
        UPDATE project_partners 
        SET amount_paid = amount_paid + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(amount, project_partner_id);
      
      // تحديث رصيد خزينة المشروع
      const newBalance = projectPartner.treasury_balance + amount;
      db.prepare(`
        UPDATE projects 
        SET treasury_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newBalance, projectPartner.project_id);
      
      // تسجيل الحركة في سجل الخزينة
      db.prepare(`
        INSERT INTO treasury_logs (
          project_id, transaction_type, amount, balance_after, 
          description, reference_type, reference_id
        )
        VALUES (?, 'income', ?, ?, ?, 'partner_payment', ?)
      `).run(
        projectPartner.project_id,
        amount,
        newBalance,
        `دفعة من الشريك - ${notes || ''}`,
        paymentResult.lastInsertRowid
      );
      
      return paymentResult.lastInsertRowid;
    });
    
    const paymentId = transaction();
    
    const payment = db.prepare(`
      SELECT 
        pp.*,
        pr.name as partner_name,
        proj.name as project_name
      FROM partner_payments pp
      JOIN project_partners propar ON pp.project_partner_id = propar.id
      JOIN partners pr ON propar.partner_id = pr.id
      JOIN projects proj ON propar.project_id = proj.id
      WHERE pp.id = ?
    `).get(paymentId);
    
    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('Error recording partner payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record partner payment' },
      { status: 400 }
    );
  }
}

// GET - جلب مدفوعات الشركاء
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const partnerId = searchParams.get('partner_id');
    
    let query = `
      SELECT 
        pp.*,
        pr.name as partner_name,
        proj.name as project_name,
        propar.percentage,
        propar.amount_due,
        propar.amount_paid as total_paid
      FROM partner_payments pp
      JOIN project_partners propar ON pp.project_partner_id = propar.id
      JOIN partners pr ON propar.partner_id = pr.id
      JOIN projects proj ON propar.project_id = proj.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (projectId) {
      query += ' AND propar.project_id = ?';
      params.push(projectId);
    }
    
    if (partnerId) {
      query += ' AND propar.partner_id = ?';
      params.push(partnerId);
    }
    
    query += ' ORDER BY pp.payment_date DESC';
    
    const payments = db.prepare(query).all(...params);
    
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching partner payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partner payments' },
      { status: 500 }
    );
  }
}