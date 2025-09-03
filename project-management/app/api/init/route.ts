import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

// API endpoint لتهيئة قاعدة البيانات (يمكن استدعاؤه يدوياً إذا لزم الأمر)
export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error: any) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to initialize database' 
      },
      { status: 500 }
    );
  }
}