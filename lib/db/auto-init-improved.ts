import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables quietly
dotenv.config({ quiet: true } as any);

let initialized = false;

// Auto-initialize database on first run (singleton pattern)
async function autoInit() {
  // Only run once
  if (initialized) return;
  
  // Only in production with DATABASE_URL
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    initialized = true;
    
    console.log('🔄 Checking database initialization...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 2, // Use fewer connections for init
      connectionTimeoutMillis: 5000
    });
    
    try {
      // Quick check if tables exist
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'projects'
        );
      `);
      
      if (result.rows[0].exists) {
        console.log('✅ Database already initialized');
      } else {
        console.log('📦 Initializing database...');
        const { initializeDatabase } = await import('./postgres');
        await initializeDatabase();
        console.log('✅ Database initialization complete');
      }
    } catch (error: any) {
      // Only log real errors, not connection timeouts during build
      if (!error.message?.includes('timeout') && !error.message?.includes('duplicate')) {
        console.error('⚠️ Database check failed:', error.message);
      }
    } finally {
      await pool.end();
    }
  }
}

// Run once on module load
if (typeof window === 'undefined') {
  autoInit().catch(() => {
    // Silently catch errors during build
  });
}

export default autoInit;