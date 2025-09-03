import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/postgres';

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
    const currentPercentages = await db.getOne(`
      SELECT SUM(percentage) as total FROM project_partners WHERE project_id = $1
    `, [project_id]);
    
    const totalPercentage = (currentPercentages?.total || 0) + percentage;
    if (totalPercentage > 100) {
      return NextResponse.json(
        { error: `Total percentage would exceed 100% (current: ${currentPercentages?.total || 0}%, adding: ${percentage}%)` },
        { status: 400 }
      );
    }
    
    // حساب المبلغ المستحق بناء على إجمالي تكلفة المراحل
    const phasesTotal = await db.getOne(`
      SELECT SUM(amount_required) as total FROM phases WHERE project_id = $1
    `, [project_id]);
    
    const amountDue = (phasesTotal?.total || 0) * (percentage / 100);
    
    try {
      const newProjectPartner = await db.insert(`
        INSERT INTO project_partners (project_id, partner_id, percentage, amount_due, amount_paid)
        VALUES ($1, $2, $3, $4, 0)
      `, [project_id, partner_id, percentage, amountDue]);
      
      // جلب معلومات الشريك
      const partnerInfo = await db.getOne(`
        SELECT 
          pp.*,
          p.name as partner_name,
          p.phone,
          p.email
        FROM project_partners pp
        JOIN partners p ON pp.partner_id = p.id
        WHERE pp.id = $1
      `, [newProjectPartner.id]);
      
      return NextResponse.json(partnerInfo, { status: 201 });
    } catch (error: any) {
      if (error.message?.includes('duplicate key') || error.message?.includes('UNIQUE constraint')) {
        return NextResponse.json(
          { error: 'This partner is already added to the project' },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error adding partner to project:', error);
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
    const currentPartner = await db.getOne('SELECT * FROM project_partners WHERE id = $1', [id]);
    
    if (!currentPartner) {
      return NextResponse.json(
        { error: 'Project partner not found' },
        { status: 404 }
      );
    }
    
    // التحقق من أن مجموع النسب لا يتجاوز 100%
    const otherPartnersTotal = await db.getOne(`
      SELECT SUM(percentage) as total 
      FROM project_partners 
      WHERE project_id = $1 AND id != $2
    `, [currentPartner.project_id, id]);
    
    const totalPercentage = (otherPartnersTotal?.total || 0) + percentage;
    if (totalPercentage > 100) {
      return NextResponse.json(
        { error: `Total percentage would exceed 100% (others: ${otherPartnersTotal?.total || 0}%, new: ${percentage}%)` },
        { status: 400 }
      );
    }
    
    // إعادة حساب المبلغ المستحق
    const phasesTotal = await db.getOne(`
      SELECT SUM(amount_required) as total FROM phases WHERE project_id = $1
    `, [currentPartner.project_id]);
    
    const amountDue = (phasesTotal?.total || 0) * (percentage / 100);
    
    const updatedPartner = await db.update(`
      UPDATE project_partners 
      SET percentage = $1, amount_due = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [percentage, amountDue, id]);
    
    // جلب معلومات الشريك المحدثة
    const partnerInfo = await db.getOne(`
      SELECT 
        pp.*,
        p.name as partner_name,
        p.phone,
        p.email
      FROM project_partners pp
      JOIN partners p ON pp.partner_id = p.id
      WHERE pp.id = $1
    `, [id]);
    
    return NextResponse.json(partnerInfo);
  } catch (error) {
    console.error('Error updating project partner:', error);
    return NextResponse.json(
      { error: 'Failed to update project partner' },
      { status: 500 }
    );
  }
}