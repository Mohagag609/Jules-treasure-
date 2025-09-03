import { pool } from '../db';
import { Treasury } from '../types';

// ================== عمليات الخزينة ==================

export async function getTreasuryByBuilding(buildingId: number): Promise<Treasury | null> {
  const query = 'SELECT * FROM treasury WHERE building_id = $1';
  const result = await pool.query(query, [buildingId]);
  return result.rows[0] || null;
}

export async function updateTreasury(buildingId: number, updates: Partial<Treasury>): Promise<Treasury> {
  const query = `
    UPDATE treasury 
    SET total_investments = COALESCE($2, total_investments),
        total_expenses = COALESCE($3, total_expenses),
        total_revenues = COALESCE($4, total_revenues),
        total_profits = COALESCE($5, total_profits),
        distributed_profits = COALESCE($6, distributed_profits),
        current_balance = COALESCE($7, current_balance),
        last_updated = CURRENT_TIMESTAMP
    WHERE building_id = $1
    RETURNING *
  `;
  const values = [
    buildingId,
    updates.total_investments || null,
    updates.total_expenses || null,
    updates.total_revenues || null,
    updates.total_profits || null,
    updates.distributed_profits || null,
    updates.current_balance || null
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// حساب الرصيد الحالي للخزينة
export async function calculateCurrentBalance(buildingId: number): Promise<number> {
  const query = `
    SELECT 
      total_investments + total_revenues - total_expenses - distributed_profits as current_balance
    FROM treasury
    WHERE building_id = $1
  `;
  const result = await pool.query(query, [buildingId]);
  
  if (result.rows.length === 0) return 0;
  
  return parseFloat(result.rows[0].current_balance) || 0;
}

// الحصول على ملخص مالي للعمارة
export async function getBuildingFinancialSummary(buildingId: number): Promise<any> {
  const query = `
    SELECT 
      t.*,
      b.name as building_name,
      b.estimated_cost,
      b.actual_cost,
      b.status as building_status,
      COUNT(DISTINCT s.id) as total_stages,
      COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_stages,
      COUNT(DISTINCT bp.partner_id) as total_partners
    FROM treasury t
    JOIN buildings b ON t.building_id = b.id
    LEFT JOIN stages s ON b.id = s.building_id
    LEFT JOIN building_partners bp ON b.id = bp.building_id
    WHERE t.building_id = $1
    GROUP BY t.id, t.building_id, t.total_investments, t.total_expenses, 
             t.total_revenues, t.total_profits, t.distributed_profits, 
             t.current_balance, t.last_updated, t.created_at,
             b.name, b.estimated_cost, b.actual_cost, b.status
  `;
  const result = await pool.query(query, [buildingId]);
  return result.rows[0] || null;
}

// الحصول على تدفقات النقدية للعمارة
export async function getCashFlow(buildingId: number, periodDays: number = 30): Promise<any[]> {
  const query = `
    WITH cash_flows AS (
      -- المدفوعات من الشركاء (إيجابي)
      SELECT 
        'partner_payment' as type,
        pp.amount,
        pp.payment_date as date,
        p.name as description,
        'in' as direction
      FROM partner_payments pp
      JOIN partners p ON pp.partner_id = p.id
      WHERE pp.building_id = $1
      AND pp.payment_date >= CURRENT_DATE - INTERVAL '${periodDays} days'
      
      UNION ALL
      
      -- المصروفات (سلبي)
      SELECT 
        'expense' as type,
        -e.amount as amount,
        e.payment_date as date,
        e.description,
        'out' as direction
      FROM expenses e
      WHERE e.building_id = $1
      AND e.payment_date >= CURRENT_DATE - INTERVAL '${periodDays} days'
      
      UNION ALL
      
      -- الإيرادات (إيجابي)
      SELECT 
        'revenue' as type,
        r.amount,
        r.revenue_date as date,
        r.description,
        'in' as direction
      FROM revenues r
      WHERE r.building_id = $1
      AND r.revenue_date >= CURRENT_DATE - INTERVAL '${periodDays} days'
    )
    SELECT * FROM cash_flows
    ORDER BY date DESC
  `;
  const result = await pool.query(query, [buildingId]);
  return result.rows;
}

// إنشاء خزينة جديدة للعمارة
export async function createTreasury(buildingId: number): Promise<Treasury> {
  const query = `
    INSERT INTO treasury (
      building_id, 
      total_investments, 
      total_expenses, 
      total_revenues, 
      total_profits,
      distributed_profits,
      current_balance
    )
    VALUES ($1, 0, 0, 0, 0, 0, 0)
    ON CONFLICT (building_id) DO NOTHING
    RETURNING *
  `;
  const result = await pool.query(query, [buildingId]);
  
  if (result.rows.length === 0) {
    // الخزينة موجودة بالفعل، نجلبها
    return (await getTreasuryByBuilding(buildingId))!;
  }
  
  return result.rows[0];
}