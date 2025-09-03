import { pool } from '../db';
import { Expense, PartnerPayment, Revenue } from '../types';

// ================== عمليات المصروفات ==================

export async function createExpense(expense: Partial<Expense>): Promise<Expense> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // إضافة المصروف
    const query = `
      INSERT INTO expenses (
        building_id, stage_id, supplier_id, paid_by_partner_id,
        expense_type, description, amount, payment_date, receipt_number, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      expense.building_id,
      expense.stage_id || null,
      expense.supplier_id || null,
      expense.paid_by_partner_id,
      expense.expense_type || 'materials',
      expense.description,
      expense.amount,
      expense.payment_date || new Date().toISOString().split('T')[0],
      expense.receipt_number || null,
      expense.notes || null
    ];
    const result = await client.query(query, values);
    
    // الدوال التلقائية ستحدث الخزينة والمراحل والعمارة
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getExpensesByBuilding(buildingId: number): Promise<any[]> {
  const query = `
    SELECT e.*, p.name as partner_name, s.name as supplier_name, st.name as stage_name
    FROM expenses e
    JOIN partners p ON e.paid_by_partner_id = p.id
    LEFT JOIN suppliers s ON e.supplier_id = s.id
    LEFT JOIN stages st ON e.stage_id = st.id
    WHERE e.building_id = $1
    ORDER BY e.payment_date DESC
  `;
  const result = await pool.query(query, [buildingId]);
  return result.rows;
}

export async function getExpensesByStage(stageId: number): Promise<any[]> {
  const query = `
    SELECT e.*, p.name as partner_name, s.name as supplier_name
    FROM expenses e
    JOIN partners p ON e.paid_by_partner_id = p.id
    LEFT JOIN suppliers s ON e.supplier_id = s.id
    WHERE e.stage_id = $1
    ORDER BY e.payment_date DESC
  `;
  const result = await pool.query(query, [stageId]);
  return result.rows;
}

export async function getExpensesByPartner(partnerId: number, buildingId?: number): Promise<any[]> {
  let query = `
    SELECT e.*, b.name as building_name, s.name as supplier_name, st.name as stage_name
    FROM expenses e
    JOIN buildings b ON e.building_id = b.id
    LEFT JOIN suppliers s ON e.supplier_id = s.id
    LEFT JOIN stages st ON e.stage_id = st.id
    WHERE e.paid_by_partner_id = $1
  `;
  
  const values: any[] = [partnerId];
  
  if (buildingId) {
    query += ' AND e.building_id = $2';
    values.push(buildingId);
  }
  
  query += ' ORDER BY e.payment_date DESC';
  
  const result = await pool.query(query, values);
  return result.rows;
}

export async function updateExpense(id: number, expense: Partial<Expense>): Promise<Expense> {
  const query = `
    UPDATE expenses 
    SET description = $2, amount = $3, payment_date = $4, 
        receipt_number = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const values = [
    id,
    expense.description,
    expense.amount,
    expense.payment_date,
    expense.receipt_number,
    expense.notes
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// ================== عمليات المدفوعات من الشركاء ==================

export async function createPartnerPayment(payment: Partial<PartnerPayment>): Promise<PartnerPayment> {
  const query = `
    INSERT INTO partner_payments (
      building_id, partner_id, amount, payment_type, 
      payment_date, payment_method, reference_number, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const values = [
    payment.building_id,
    payment.partner_id,
    payment.amount,
    payment.payment_type || 'investment',
    payment.payment_date || new Date().toISOString().split('T')[0],
    payment.payment_method || 'cash',
    payment.reference_number || null,
    payment.notes || null
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getPartnerPayments(partnerId: number, buildingId?: number): Promise<PartnerPayment[]> {
  let query = `
    SELECT pp.*, b.name as building_name
    FROM partner_payments pp
    JOIN buildings b ON pp.building_id = b.id
    WHERE pp.partner_id = $1
  `;
  
  const values: any[] = [partnerId];
  
  if (buildingId) {
    query += ' AND pp.building_id = $2';
    values.push(buildingId);
  }
  
  query += ' ORDER BY pp.payment_date DESC';
  
  const result = await pool.query(query, values);
  return result.rows;
}

// ================== عمليات الإيرادات ==================

export async function createRevenue(revenue: Partial<Revenue>): Promise<Revenue> {
  const query = `
    INSERT INTO revenues (
      building_id, revenue_type, description, amount,
      revenue_date, unit_number, buyer_name
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [
    revenue.building_id,
    revenue.revenue_type || 'unit_sale',
    revenue.description,
    revenue.amount,
    revenue.revenue_date || new Date().toISOString().split('T')[0],
    revenue.unit_number || null,
    revenue.buyer_name || null
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getRevenuesByBuilding(buildingId: number): Promise<Revenue[]> {
  const query = `
    SELECT * FROM revenues
    WHERE building_id = $1
    ORDER BY revenue_date DESC
  `;
  const result = await pool.query(query, [buildingId]);
  return result.rows;
}

export async function updateRevenue(id: number, revenue: Partial<Revenue>): Promise<Revenue> {
  const query = `
    UPDATE revenues 
    SET description = $2, amount = $3, revenue_date = $4, 
        unit_number = $5, buyer_name = $6, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const values = [
    id,
    revenue.description,
    revenue.amount,
    revenue.revenue_date,
    revenue.unit_number,
    revenue.buyer_name
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// حساب صافي الربح للعمارة
export async function calculateBuildingProfit(buildingId: number): Promise<number> {
  const query = `
    SELECT 
      COALESCE(SUM(r.amount), 0) as total_revenues,
      COALESCE(SUM(e.amount), 0) as total_expenses
    FROM buildings b
    LEFT JOIN revenues r ON b.id = r.building_id
    LEFT JOIN expenses e ON b.id = e.building_id
    WHERE b.id = $1
    GROUP BY b.id
  `;
  const result = await pool.query(query, [buildingId]);
  
  if (result.rows.length === 0) return 0;
  
  const { total_revenues, total_expenses } = result.rows[0];
  return parseFloat(total_revenues) - parseFloat(total_expenses);
}