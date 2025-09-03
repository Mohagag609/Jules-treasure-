import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db/postgres';

// GET - جلب جميع المشاريع
export async function GET() {
  try {
    const projects = await db.getMany(`
      SELECT * FROM projects 
      ORDER BY created_at DESC
    `);
    
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
    
    const newProject = await db.insert(`
      INSERT INTO projects (name, start_date, end_date, treasury_balance, status)
      VALUES ($1, $2, $3, 0, 'active')
    `, [name, start_date, end_date || null]);
    
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}