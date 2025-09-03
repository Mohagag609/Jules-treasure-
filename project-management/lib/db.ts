import Database from 'better-sqlite3';
import path from 'path';

// إنشاء أو فتح قاعدة البيانات
const dbPath = path.join(process.cwd(), 'project.db');
const db = new Database(dbPath);

// إنشاء الجداول
export function initializeDatabase() {
  // جدول المراحل
  db.exec(`
    CREATE TABLE IF NOT EXISTS stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      remaining_amount REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول الشركاء
  db.exec(`
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول علاقة الشركاء بالمراحل
  db.exec(`
    CREATE TABLE IF NOT EXISTS stage_partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      partner_id INTEGER NOT NULL,
      percentage REAL NOT NULL,
      FOREIGN KEY (stage_id) REFERENCES stages(id),
      FOREIGN KEY (partner_id) REFERENCES partners(id),
      UNIQUE(stage_id, partner_id)
    )
  `);

  // جدول الموردين
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // جدول المدفوعات
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      partner_id INTEGER,
      supplier_id INTEGER,
      amount REAL NOT NULL,
      payment_type TEXT NOT NULL CHECK(payment_type IN ('from_partner', 'to_supplier')),
      description TEXT,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stage_id) REFERENCES stages(id),
      FOREIGN KEY (partner_id) REFERENCES partners(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )
  `);

  // جدول التسويات
  db.exec(`
    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      from_partner_id INTEGER NOT NULL,
      to_partner_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      settlement_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stage_id) REFERENCES stages(id),
      FOREIGN KEY (from_partner_id) REFERENCES partners(id),
      FOREIGN KEY (to_partner_id) REFERENCES partners(id)
    )
  `);

  // جدول الخزينة
  db.exec(`
    CREATE TABLE IF NOT EXISTS treasury (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_id INTEGER NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stage_id) REFERENCES stages(id),
      UNIQUE(stage_id)
    )
  `);
}

// تهيئة قاعدة البيانات عند بدء التطبيق
initializeDatabase();

export default db;