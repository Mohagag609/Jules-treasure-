import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/database';

// POST - إضافة شريك لمشروع
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, partner_id, percentage } = body;
    
    if (!project_id || !partner_id || percentage === undefined) {
      return NextResponse.json(
        { error: 'Project ID, partner ID, and percentage are required' },
        { status: 400 }
      );
    }
    
    // التحقق من أن مجموع النسب لا يتجاوز 100%
    const currentPercentages = db.prepare(`
      SELECT SUM(percentage) as total FROM project_partners WHERE project_id = ?
    `).get(project_id) as any;
    
    const totalPercentage = (currentPercentages?.total || 0) + percentage;
    if (totalPercentage > 100) {
      return NextResponse.json(
        { error: `Total percentage would exceed 100% (current: ${currentPercentages?.total || 0}%, adding: ${percentage}%)` },
        { status: 400 }
      );
    }
    
    // حساب المبلغ المستحق بناء على إجمالي تكلفة المراحل
    const phasesTotal = db.prepare(`
      SELECT SUM(amount_required) as total FROM phases WHERE project_id = ?
    `).get(project_id) as any;
    
    const amountDue = (phasesTotal?.total || 0) * (percentage / 100);
    
    const result = db.prepare(`
      INSERT INTO project_partners (project_id, partner_id, percentage, amount_due, amount_paid)
      VALUES (?, ?, ?, ?, 0)
    `).run(project_id, partner_id, percentage, amountDue);
    
    const newProjectPartner = db.prepare(`
      SELECT 
        pp.*,
        p.name as partner_name,
        p.phone,
        p.email
      FROM project_partners pp
      JOIN partners p ON pp.partner_id = p.id
      WHERE pp.id = ?
    `).get(result.lastInsertRowid);
    
    return NextResponse.json(newProjectPartner, { status: 201 });
  } catch (error: any) {
    console.error('Error adding partner to project:', error);
    
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { error: 'This partner is already added to the project' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to add partner to project' },
      { status: 500 }
    );
  }
}

// PUT - تحديث نسبة الشريك
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, percentage } = body;
    
    if (!id || percentage === undefined) {
      return NextResponse.json(
        { error: 'ID and percentage are required' },
        { status: 400 }
      );
    }
    
    // جلب معلومات الشريك الحالية
    const currentPartner = db.prepare('SELECT * FROM project_partners WHERE id = ?').get(id) as any;
    
    if (!currentPartner) {
      return NextResponse.json(
        { error: 'Project partner not found' },
        { status: 404 }
      );
    }
    
    // التحقق من أن مجموع النسب لا يتجاوز 100%
    const otherPartnersTotal = db.prepare(`
      SELECT SUM(percentage) as total 
      FROM project_partners 
      WHERE project_id = ? AND id != ?
    `).get(currentPartner.project_id, id) as any;
    
    const totalPercentage = (otherPartnersTotal?.total || 0) + percentage;
    if (totalPercentage > 100) {
      return NextResponse.json(
        { error: `Total percentage would exceed 100% (others: ${otherPartnersTotal?.total || 0}%, new: ${percentage}%)` },
        { status: 400 }
      );
    }
    
    // إعادة حساب المبلغ المستحق
    const phasesTotal = db.prepare(`
      SELECT SUM(amount_required) as total FROM phases WHERE project_id = ?
    `).get(currentPartner.project_id) as any;
    
    const amountDue = (phasesTotal?.total || 0) * (percentage / 100);
    
    db.prepare(`
      UPDATE project_partners 
      SET percentage = ?, amount_due = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(percentage, amountDue, id);
    
    const updatedPartner = db.prepare(`
      SELECT 
        pp.*,
        p.name as partner_name,
        p.phone,
        p.email
      FROM project_partners pp
      JOIN partners p ON pp.partner_id = p.id
      WHERE pp.id = ?
    `).get(id);
    
    return NextResponse.json(updatedPartner);
  } catch (error) {
    console.error('Error updating project partner:', error);
    return NextResponse.json(
      { error: 'Failed to update project partner' },
      { status: 500 }
    );
  }
}