import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/database';

// GET - جلب مشروع محدد مع تفاصيله
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const projectId = parseInt(params.id);
    
    // جلب المشروع
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // جلب المراحل
    const phases = db.prepare(`
      SELECT * FROM phases 
      WHERE project_id = ? 
      ORDER BY created_at
    `).all(projectId);
    
    // جلب الشركاء
    const partners = db.prepare(`
      SELECT 
        pp.*,
        p.name as partner_name,
        p.phone,
        p.email
      FROM project_partners pp
      JOIN partners p ON pp.partner_id = p.id
      WHERE pp.project_id = ?
    `).all(projectId);
    
    // جلب سجل الخزينة
    const treasuryLogs = db.prepare(`
      SELECT * FROM treasury_logs 
      WHERE project_id = ? 
      ORDER BY transaction_date DESC
      LIMIT 10
    `).all(projectId);
    
    return NextResponse.json({
      ...project,
      phases,
      partners,
      treasuryLogs
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT - تحديث مشروع
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const projectId = parseInt(params.id);
    const body = await request.json();
    const { name, start_date, end_date, status } = body;
    
    const result = db.prepare(`
      UPDATE projects 
      SET name = ?, start_date = ?, end_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, start_date, end_date, status, projectId);
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    const updatedProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - حذف مشروع
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const projectId = parseInt(params.id);
    
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}