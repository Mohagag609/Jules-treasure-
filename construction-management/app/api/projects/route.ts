import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/database';
import { Project } from '@/lib/db/models';

// GET - جلب جميع المشاريع
export async function GET() {
  try {
    const projects = db.prepare(`
      SELECT * FROM projects 
      ORDER BY created_at DESC
    `).all();
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - إنشاء مشروع جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, start_date, end_date } = body;
    
    if (!name || !start_date) {
      return NextResponse.json(
        { error: 'Name and start date are required' },
        { status: 400 }
      );
    }
    
    const result = db.prepare(`
      INSERT INTO projects (name, start_date, end_date, treasury_balance, status)
      VALUES (?, ?, ?, 0, 'active')
    `).run(name, start_date, end_date || null);
    
    const newProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}