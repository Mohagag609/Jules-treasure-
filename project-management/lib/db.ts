import { Pool } from 'pg';

// إنشاء اتصال بقاعدة البيانات
// في بيئة التطوير نستخدم SQLite في الذاكرة
// في بيئة الإنتاج نستخدم PostgreSQL
const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/project_management';

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// إنشاء الجداول
export async function initializeDatabase() {
  try {
    // جدول المراحل
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        remaining_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول الشركاء
    await pool.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول علاقة الشركاء بالمراحل
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stage_partners (
        id SERIAL PRIMARY KEY,
        stage_id INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
        partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        percentage DECIMAL(5,2) NOT NULL,
        UNIQUE(stage_id, partner_id)
      )
    `);

    // جدول الموردين
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول المدفوعات
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        stage_id INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
        partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        payment_type TEXT NOT NULL CHECK(payment_type IN ('from_partner', 'to_supplier')),
        description TEXT,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول التسويات
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settlements (
        id SERIAL PRIMARY KEY,
        stage_id INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
        from_partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        to_partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        settlement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول الخزينة
    await pool.query(`
      CREATE TABLE IF NOT EXISTS treasury (
        id SERIAL PRIMARY KEY,
        stage_id INTEGER NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
        balance DECIMAL(10,2) NOT NULL DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(stage_id)
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    // في حالة الخطأ، نحاول مرة أخرى بعد 5 ثواني
    if (process.env.NODE_ENV === 'production') {
      setTimeout(initializeDatabase, 5000);
    }
  }
}

// تهيئة قاعدة البيانات عند بدء التطبيق
if (process.env.NODE_ENV !== 'test') {
  initializeDatabase();
}

export default pool;