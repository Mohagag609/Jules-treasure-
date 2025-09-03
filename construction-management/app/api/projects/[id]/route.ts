import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/postgres';

// GET - جلب مشروع محدد مع تفاصيله
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const projectId = parseInt(params.id);
    
    // جلب المشروع
    const project = await db.getOne('SELECT * FROM projects WHERE id = $1', [projectId]);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // جلب المراحل
    const phases = await db.getMany(`
      SELECT * FROM phases 
      WHERE project_id = $1 
      ORDER BY created_at
    `, [projectId]);
    
    // جلب الشركاء
    const partners = await db.getMany(`
      SELECT 
        pp.*,
        p.name as partner_name,
        p.phone,
        p.email
      FROM project_partners pp
      JOIN partners p ON pp.partner_id = p.id
      WHERE pp.project_id = $1
    `, [projectId]);
    
    // جلب سجل الخزينة
    const treasuryLogs = await db.getMany(`
      SELECT * FROM treasury_logs 
      WHERE project_id = $1 
      ORDER BY transaction_date DESC
      LIMIT 10
    `, [projectId]);
    
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
    
    const updatedProject = await db.update(`
      UPDATE projects 
      SET name = $1, start_date = $2, end_date = $3, status = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [name, start_date, end_date, status, projectId]);
    
    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
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
    
    const deletedCount = await db.remove('DELETE FROM projects WHERE id = $1', [projectId]);
    
    if (deletedCount === 0) {
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