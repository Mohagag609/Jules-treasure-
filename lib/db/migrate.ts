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
  }
});

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Read the updated schema
    const schemaPath = path.join(process.cwd(), 'lib', 'db', 'postgres-schema-updated.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split schema into individual statements and execute
    const statements = schema
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (statement.trim() && statement.trim() !== ';') {
        try {
          await pool.query(statement);
          successCount++;
          console.log(`✓ Executed statement ${successCount}`);
        } catch (err: any) {
          errorCount++;
          console.error(`✗ Error executing statement: ${err.message}`);
        }
      }
    }
    
    console.log(`\nMigration completed: ${successCount} successful, ${errorCount} errors`);
    
    // Close the pool
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

// Run migration
migrate();