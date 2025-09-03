import { initializeDatabase } from './postgres';

// Auto-initialize database on first run
async function autoInit() {
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    console.log('🔄 Auto-initializing database for production...');
    try {
      await initializeDatabase();
      console.log('✅ Database auto-initialization complete');
    } catch (error) {
      console.error('⚠️ Database auto-initialization failed:', error);
      // Don't throw - let the app continue
    }
  }
}

// Run on module load
autoInit().catch(console.error);

export default autoInit;