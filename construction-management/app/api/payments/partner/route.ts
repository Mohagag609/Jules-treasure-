import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/postgres';

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
    
    // استخدام transaction
    const result = await db.transaction(async (client) => {
      // جلب معلومات الشريك في المشروع
      const projectPartner = await client.query(`
        SELECT pp.*, p.treasury_balance 
        FROM project_partners pp
        JOIN projects p ON pp.project_id = p.id
        WHERE pp.id = $1
      `, [project_partner_id]);
      
      if (projectPartner.rows.length === 0) {
        throw new Error('Project partner not found');
      }
      
      const partner = projectPartner.rows[0];
      
      // إدخال الدفعة
      const paymentResult = await client.query(`
        INSERT INTO partner_payments (project_partner_id, amount, payment_date, payment_method, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [project_partner_id, amount, payment_date, payment_method || null, notes || null]);
      
      // تحديث المبلغ المدفوع للشريك
      await client.query(`
        UPDATE project_partners 
        SET amount_paid = amount_paid + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [amount, project_partner_id]);
      
      // تحديث رصيد خزينة المشروع
      const newBalance = partner.treasury_balance + amount;
      await client.query(`
        UPDATE projects 
        SET treasury_balance = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newBalance, partner.project_id]);
      
      // تسجيل الحركة في سجل الخزينة
      await client.query(`
        INSERT INTO treasury_logs (
          project_id, transaction_type, amount, balance_after, 
          description, reference_type, reference_id
        )
        VALUES ($1, 'income', $2, $3, $4, 'partner_payment', $5)
      `, [
        partner.project_id,
        amount,
        newBalance,
        `دفعة من الشريك - ${notes || ''}`,
        paymentResult.rows[0].id
      ]);
      
      return paymentResult.rows[0];
    });
    
    // جلب معلومات الدفعة الكاملة
    const payment = await db.getOne(`
      SELECT 
        pp.*,
        pr.name as partner_name,
        proj.name as project_name
      FROM partner_payments pp
      JOIN project_partners propar ON pp.project_partner_id = propar.id
      JOIN partners pr ON propar.partner_id = pr.id
      JOIN projects proj ON propar.project_id = proj.id
      WHERE pp.id = $1
    `, [result.id]);
    
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
      params.push(projectId);
      query += ` AND propar.project_id = $${params.length}`;
    }
    
    if (partnerId) {
      params.push(partnerId);
      query += ` AND propar.partner_id = $${params.length}`;
    }
    
    query += ' ORDER BY pp.payment_date DESC';
    
    const payments = await db.getMany(query, params);
    
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching partner payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partner payments' },
      { status: 500 }
    );
  }
}