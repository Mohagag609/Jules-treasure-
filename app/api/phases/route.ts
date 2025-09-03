import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/database';

// POST - إنشاء مرحلة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, name, amount_required, start_date, end_date } = body;
    
    if (!project_id || !name || !amount_required) {
      return NextResponse.json(
        { error: 'Project ID, name, and amount required are mandatory' },
        { status: 400 }
      );
    }
    
    const result = db.prepare(`
      INSERT INTO phases (project_id, name, amount_required, amount_paid, status, start_date, end_date)
      VALUES (?, ?, ?, 0, 'pending', ?, ?)
    `).run(project_id, name, amount_required, start_date || null, end_date || null);
    
    const newPhase = db.prepare('SELECT * FROM phases WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json(newPhase, { status: 201 });
  } catch (error) {
    console.error('Error creating phase:', error);
    return NextResponse.json(
      { error: 'Failed to create phase' },
      { status: 500 }
    );
  }
}

// GET - جلب المراحل لمشروع محدد
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    const phases = db.prepare(`
      SELECT * FROM phases 
      WHERE project_id = ? 
      ORDER BY created_at
    `).all(projectId) as any[];
    
    // جلب الموردين لكل مرحلة
    for (const phase of phases) {
      const suppliers = db.prepare(`
        SELECT 
          ps.*,
          s.name as supplier_name,
          s.phone,
          s.email
        FROM phase_suppliers ps
        JOIN suppliers s ON ps.supplier_id = s.id
        WHERE ps.phase_id = ?
      `).all(phase.id);
      
      phase.suppliers = suppliers;
    }
    
    return NextResponse.json(phases);
  } catch (error) {
    console.error('Error fetching phases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch phases' },
      { status: 500 }
    );
  }
}