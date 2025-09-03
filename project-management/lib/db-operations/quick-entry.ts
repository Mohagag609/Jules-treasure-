import { pool } from '../db';
import { Supplier } from '../types';

// ================== الإدخال السريع المتكامل ==================

export async function quickEntry(data: any): Promise<any> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const results: any = {};
    
    // 1. إضافة مصروف إذا كان موجوداً
    if (data.expense) {
      // إنشاء مورد جديد إذا لزم
      if (data.expense.supplier_name && !data.expense.supplier_id) {
        const supplierResult = await client.query(
          'INSERT INTO suppliers (name, supplier_type) VALUES ($1, $2) RETURNING id',
          [data.expense.supplier_name, data.expense.expense_type || 'materials']
        );
        data.expense.supplier_id = supplierResult.rows[0].id;
      }
      
      const expenseQuery = `
        INSERT INTO expenses (
          building_id, stage_id, supplier_id, paid_by_partner_id,
          expense_type, description, amount, payment_date, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const expenseValues = [
        data.building_id,
        data.stage_id || null,
        data.expense.supplier_id || null,
        data.expense.paid_by_partner_id,
        data.expense.expense_type,
        data.expense.description,
        data.expense.amount,
        data.expense.payment_date || new Date().toISOString().split('T')[0],
        data.expense.notes || null
      ];
      const expenseResult = await client.query(expenseQuery, expenseValues);
      results.expense = expenseResult.rows[0];
    }
    
    // 2. إضافة دفعة من شريك إذا كانت موجودة
    if (data.partner_payment) {
      const paymentQuery = `
        INSERT INTO partner_payments (
          building_id, partner_id, amount, payment_type,
          payment_date, payment_method, reference_number, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const paymentValues = [
        data.building_id,
        data.partner_payment.partner_id,
        data.partner_payment.amount,
        data.partner_payment.payment_type || 'investment',
        data.partner_payment.payment_date || new Date().toISOString().split('T')[0],
        data.partner_payment.payment_method || 'cash',
        data.partner_payment.reference_number || null,
        data.partner_payment.notes || null
      ];
      const paymentResult = await client.query(paymentQuery, paymentValues);
      results.partner_payment = paymentResult.rows[0];
    }
    
    // 3. إضافة إيراد إذا كان موجوداً
    if (data.revenue) {
      const revenueQuery = `
        INSERT INTO revenues (
          building_id, revenue_type, description, amount,
          revenue_date, unit_number, buyer_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const revenueValues = [
        data.building_id,
        data.revenue.revenue_type || 'unit_sale',
        data.revenue.description,
        data.revenue.amount,
        data.revenue.revenue_date || new Date().toISOString().split('T')[0],
        data.revenue.unit_number || null,
        data.revenue.buyer_name || null
      ];
      const revenueResult = await client.query(revenueQuery, revenueValues);
      results.revenue = revenueResult.rows[0];
    }
    
    // 4. إضافة تسوية إذا كانت مطلوبة
    if (data.calculate_settlement) {
      const settlementQuery = `
        SELECT * FROM calculate_partner_settlement($1, $2::date, $3::date)
      `;
      const settlementResult = await client.query(
        settlementQuery, 
        [data.building_id, data.settlement_start || '2024-01-01', data.settlement_end || new Date().toISOString().split('T')[0]]
      );
      results.settlement = settlementResult.rows;
    }
    
    // جلب الخزينة المحدثة
    const treasuryResult = await client.query(
      'SELECT * FROM treasury WHERE building_id = $1',
      [data.building_id]
    );
    results.treasury = treasuryResult.rows[0];
    
    // جلب إحصائيات سريعة
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT e.id) as total_expenses,
        COALESCE(SUM(e.amount), 0) as total_expenses_amount,
        COUNT(DISTINCT pp.id) as total_payments,
        COALESCE(SUM(pp.amount), 0) as total_payments_amount,
        COUNT(DISTINCT r.id) as total_revenues,
        COALESCE(SUM(r.amount), 0) as total_revenues_amount
      FROM buildings b
      LEFT JOIN expenses e ON b.id = e.building_id
      LEFT JOIN partner_payments pp ON b.id = pp.building_id
      LEFT JOIN revenues r ON b.id = r.building_id
      WHERE b.id = $1
      GROUP BY b.id
    `;
    const statsResult = await client.query(statsQuery, [data.building_id]);
    results.stats = statsResult.rows[0];
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// إضافة عمارة جديدة مع الشركاء
export async function quickCreateBuilding(data: {
  building: any;
  partners: { partner_id: number; ownership_percentage: number }[];
  initial_stages?: string[];
}): Promise<any> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. إنشاء العمارة
    const buildingQuery = `
      INSERT INTO buildings (name, address, total_floors, total_units, estimated_cost, status, start_date, expected_completion_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const buildingValues = [
      data.building.name,
      data.building.address || null,
      data.building.total_floors || 0,
      data.building.total_units || 0,
      data.building.estimated_cost || 0,
      data.building.status || 'planning',
      data.building.start_date || new Date().toISOString().split('T')[0],
      data.building.expected_completion_date || null
    ];
    const buildingResult = await client.query(buildingQuery, buildingValues);
    const building = buildingResult.rows[0];
    
    // 2. إنشاء خزينة للعمارة
    await client.query(
      'INSERT INTO treasury (building_id, total_investments, total_expenses, total_revenues, current_balance) VALUES ($1, 0, 0, 0, 0)',
      [building.id]
    );
    
    // 3. ربط الشركاء بالعمارة
    const partners = [];
    let totalPercentage = 0;
    
    for (const partner of data.partners) {
      totalPercentage += partner.ownership_percentage;
      
      if (totalPercentage > 100) {
        throw new Error(`مجموع نسب الشركاء يتجاوز 100% (${totalPercentage}%)`);
      }
      
      const partnerQuery = `
        INSERT INTO building_partners (building_id, partner_id, ownership_percentage)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const partnerResult = await client.query(
        partnerQuery,
        [building.id, partner.partner_id, partner.ownership_percentage]
      );
      partners.push(partnerResult.rows[0]);
    }
    
    // 4. إضافة المراحل الأساسية إذا كانت محددة
    const stages = [];
    if (data.initial_stages && data.initial_stages.length > 0) {
      for (let i = 0; i < data.initial_stages.length; i++) {
        const stageQuery = `
          INSERT INTO stages (building_id, name, order_index, status)
          VALUES ($1, $2, $3, 'pending')
          RETURNING *
        `;
        const stageResult = await client.query(
          stageQuery,
          [building.id, data.initial_stages[i], i + 1]
        );
        stages.push(stageResult.rows[0]);
      }
    }
    
    await client.query('COMMIT');
    
    return {
      building,
      partners,
      stages,
      message: `تم إنشاء العمارة "${building.name}" بنجاح مع ${partners.length} شريك و ${stages.length} مرحلة`
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// إضافة مصروف سريع مع إنشاء مورد جديد إذا لزم
export async function quickAddExpense(data: {
  building_id: number;
  stage_id?: number;
  partner_id: number;
  supplier_name?: string;
  supplier_id?: number;
  expense_type: string;
  description: string;
  amount: number;
  payment_date?: string;
  receipt_number?: string;
  notes?: string;
}): Promise<any> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    let supplierId = data.supplier_id;
    
    // إنشاء مورد جديد إذا تم توفير اسم بدون ID
    if (data.supplier_name && !supplierId) {
      // التحقق من وجود مورد بنفس الاسم
      const existingSupplier = await client.query(
        'SELECT id FROM suppliers WHERE name = $1',
        [data.supplier_name]
      );
      
      if (existingSupplier.rows.length > 0) {
        supplierId = existingSupplier.rows[0].id;
      } else {
        const newSupplier = await client.query(
          'INSERT INTO suppliers (name, supplier_type) VALUES ($1, $2) RETURNING *',
          [data.supplier_name, data.expense_type]
        );
        supplierId = newSupplier.rows[0].id;
      }
    }
    
    // إضافة المصروف
    const expenseQuery = `
      INSERT INTO expenses (
        building_id, stage_id, supplier_id, paid_by_partner_id,
        expense_type, description, amount, payment_date, receipt_number, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const expenseValues = [
      data.building_id,
      data.stage_id || null,
      supplierId || null,
      data.partner_id,
      data.expense_type,
      data.description,
      data.amount,
      data.payment_date || new Date().toISOString().split('T')[0],
      data.receipt_number || null,
      data.notes || null
    ];
    const expenseResult = await client.query(expenseQuery, expenseValues);
    
    // جلب معلومات إضافية
    const partnerInfo = await client.query(
      'SELECT name FROM partners WHERE id = $1',
      [data.partner_id]
    );
    
    const buildingInfo = await client.query(
      'SELECT name FROM buildings WHERE id = $1',
      [data.building_id]
    );
    
    const treasuryInfo = await client.query(
      'SELECT * FROM treasury WHERE building_id = $1',
      [data.building_id]
    );
    
    await client.query('COMMIT');
    
    return {
      expense: expenseResult.rows[0],
      partner_name: partnerInfo.rows[0]?.name,
      building_name: buildingInfo.rows[0]?.name,
      treasury: treasuryInfo.rows[0],
      message: `تم إضافة مصروف بقيمة ${data.amount} جنيه بنجاح`
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}