import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function healthCheck() {
  console.log('🔍 فحص صحة النظام...\n');
  
  let allGood = true;
  
  // 1. التحقق من متغيرات البيئة
  console.log('1️⃣ فحص متغيرات البيئة:');
  const requiredEnvVars = ['DATABASE_URL'];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: موجود`);
    } else {
      console.log(`   ❌ ${envVar}: مفقود`);
      allGood = false;
    }
  }
  
  // 2. التحقق من الاتصال بقاعدة البيانات
  console.log('\n2️⃣ فحص الاتصال بقاعدة البيانات:');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    const client = await pool.connect();
    console.log('   ✅ الاتصال بقاعدة البيانات: نجح');
    
    // 3. التحقق من وجود الجداول
    console.log('\n3️⃣ فحص الجداول:');
    const tables = [
      'projects',
      'phases',
      'partners',
      'project_partners',
      'suppliers',
      'phase_suppliers',
      'materials',
      'partner_payments',
      'supplier_payments',
      'settlements',
      'treasury_logs'
    ];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`   ✅ جدول ${table}: موجود`);
      } else {
        console.log(`   ❌ جدول ${table}: غير موجود`);
        allGood = false;
      }
    }
    
    // 4. التحقق من البيانات
    console.log('\n4️⃣ إحصائيات قاعدة البيانات:');
    
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM projects) as projects_count,
        (SELECT COUNT(*) FROM partners) as partners_count,
        (SELECT COUNT(*) FROM suppliers) as suppliers_count,
        (SELECT COUNT(*) FROM phases) as phases_count
    `);
    
    const row = stats.rows[0];
    console.log(`   📊 عدد المشاريع: ${row.projects_count}`);
    console.log(`   📊 عدد الشركاء: ${row.partners_count}`);
    console.log(`   📊 عدد الموردين: ${row.suppliers_count}`);
    console.log(`   📊 عدد المراحل: ${row.phases_count}`);
    
    client.release();
  } catch (error: any) {
    console.log(`   ❌ خطأ في قاعدة البيانات: ${error.message}`);
    allGood = false;
  } finally {
    await pool.end();
  }
  
  // 5. النتيجة النهائية
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('✅ النظام يعمل بشكل صحيح!');
    console.log('يمكنك تشغيل التطبيق باستخدام: npm run dev');
  } else {
    console.log('❌ توجد مشاكل تحتاج إلى حل');
    console.log('الرجاء مراجعة الأخطاء أعلاه وإصلاحها');
  }
  console.log('='.repeat(50));
  
  process.exit(allGood ? 0 : 1);
}

healthCheck().catch(console.error);