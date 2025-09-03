import { Pool } from 'pg';

// إنشاء pool للاتصال بقاعدة البيانات
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_rxk2aBu6VcNz@ep-orange-hat-adtkjsbe-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// دالة لتهيئة قاعدة البيانات
export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // قراءة ملف SQL وتنفيذه
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(process.cwd(), 'lib', 'db-init.sql');
    
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // تقسيم الأوامر وتنفيذها واحدة تلو الأخرى
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        try {
          await client.query(statement + ';');
        } catch (error: any) {
          // تجاهل أخطاء الكائنات الموجودة بالفعل
          if (!error.message.includes('already exists')) {
            console.error('Error executing statement:', error.message);
          }
        }
      }
      
      console.log('Database initialized successfully');
    } else {
      console.log('SQL initialization file not found');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// التحقق من الاتصال عند بدء التطبيق
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});