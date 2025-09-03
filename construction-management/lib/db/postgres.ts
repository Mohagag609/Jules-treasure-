import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database with schema
export async function initializeDatabase() {
  try {
    // Check if tables already exist
    const tablesExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
      );
    `);
    
    if (tablesExist.rows[0].exists) {
      console.log('Database tables already exist - skipping initialization');
      return;
    }
    
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'postgres-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split schema into individual statements and execute
    const statements = schema
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    for (const statement of statements) {
      if (statement.trim() && statement.trim() !== ';') {
        try {
          await pool.query(statement);
        } catch (err: any) {
          // Ignore errors about existing objects
          if (!err.message?.includes('already exists')) {
            console.error('Error executing statement:', err.message);
          }
        }
      }
    }
    
    console.log('PostgreSQL Database initialized successfully');
  } catch (error: any) {
    // Only log if it's not a "already exists" error
    if (!error.message?.includes('already exists')) {
      console.error('Error initializing database:', error.message);
    }
  }
}

// Database query helper
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Transaction helper
export async function transaction(callback: (client: any) => Promise<any>) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get single row
export async function getOne(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows[0];
}

// Get multiple rows
export async function getMany(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows;
}

// Insert and return inserted row
export async function insert(text: string, params?: any[]) {
  const result = await query(text + ' RETURNING *', params);
  return result.rows[0];
}

// Update and return updated row
export async function update(text: string, params?: any[]) {
  const result = await query(text + ' RETURNING *', params);
  return result.rows[0];
}

// Delete and return deleted count
export async function remove(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rowCount;
}

// Initialize on first import
initializeDatabase().catch(console.error);

export default {
  pool,
  query,
  transaction,
  getOne,
  getMany,
  insert,
  update,
  remove
};