// ملف منفصل لتهيئة قاعدة البيانات
import pool from './db';

export async function ensureDatabaseInitialized() {
  try {
    // التحقق من وجود الجداول
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stages'
      );
    `);
    
    const tablesExist = result.rows[0].exists;
    
    if (!tablesExist) {
      console.log('Initializing database tables...');
      const { initializeDatabase } = await import('./db');
      await initializeDatabase();
      console.log('Database tables initialized successfully');
    }
  } catch (error) {
    console.error('Error checking/initializing database:', error);
    // في حالة الخطأ، نحاول إنشاء الجداول
    try {
      const { initializeDatabase } = await import('./db');
      await initializeDatabase();
    } catch (initError) {
      console.error('Failed to initialize database:', initError);
    }
  }
}