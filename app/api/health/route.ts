import { NextResponse } from 'next/server';
import db from '@/lib/db/postgres';

export async function GET() {
  try {
    // التحقق من الاتصال بقاعدة البيانات
    const result = await db.query('SELECT 1 as healthy');
    
    if (result.rows[0]?.healthy === 1) {
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        service: 'construction-management',
        version: '1.0.0'
      }, { status: 200 });
    }
    
    throw new Error('Database check failed');
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    }, { status: 503 });
  }
}