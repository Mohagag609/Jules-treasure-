import { pool } from '../db';
import { BuildingReport } from '../types';
import {
  getBuildingById,
  getStagesByBuilding,
  getPartnersByBuilding,
  getExpensesByBuilding,
  getRevenuesByBuilding,
  getTreasuryByBuilding
} from './index';

// ================== التقارير الشاملة ==================

export async function getBuildingFullReport(buildingId: number): Promise<BuildingReport> {
  const building = await getBuildingById(buildingId);
  if (!building) throw new Error('العمارة غير موجودة');
  
  const stages = await getStagesByBuilding(buildingId);
  const partners = await getPartnersByBuilding(buildingId);
  const expenses = await getExpensesByBuilding(buildingId);
  const revenues = await getRevenuesByBuilding(buildingId);
  const treasury = await getTreasuryByBuilding(buildingId);
  
  // جلب توزيعات الأرباح
  const profitDistributions = await pool.query(
    'SELECT * FROM profit_distributions WHERE building_id = $1 ORDER BY distribution_date DESC',
    [buildingId]
  );
  
  // جلب التسويات
  const settlements = await pool.query(
    'SELECT * FROM partner_settlements WHERE building_id = $1 ORDER BY created_at DESC',
    [buildingId]
  );
  
  // حساب حالة التسوية لكل شريك
  const partnersWithSettlement = partners.map((partner: any) => {
    const totalExpenses = parseFloat(treasury?.total_expenses?.toString() || '0');
    const expectedShare = (totalExpenses * partner.ownership_percentage) / 100;
    const actualPaid = parseFloat(partner.total_expenses_paid || '0');
    const difference = actualPaid - expectedShare;
    
    return {
      ...partner,
      total_expenses_share: expectedShare,
      settlement_status: difference > 0 ? 'overpaid' : difference < 0 ? 'underpaid' : 'settled' as const
    };
  });
  
  return {
    building,
    stages,
    partners: partnersWithSettlement,
    expenses,
    revenues,
    treasury: treasury!,
    profitDistributions: profitDistributions.rows,
    settlements: settlements.rows
  };
}

// ================== الإحصائيات العامة ==================

export async function getDashboardStats(): Promise<any> {
  // إجمالي العمارات
  const buildingsCount = await pool.query('SELECT COUNT(*) FROM buildings');
  
  // إجمالي الاستثمارات
  const totalInvestments = await pool.query('SELECT COALESCE(SUM(total_investments), 0) as total FROM treasury');
  
  // إجمالي المصروفات
  const totalExpenses = await pool.query('SELECT COALESCE(SUM(total_expenses), 0) as total FROM treasury');
  
  // إجمالي الأرباح
  const totalProfits = await pool.query('SELECT COALESCE(SUM(total_profits), 0) as total FROM treasury');
  
  // عدد الشركاء
  const partnersCount = await pool.query('SELECT COUNT(*) FROM partners');
  
  // عدد المراحل النشطة
  const activeStages = await pool.query("SELECT COUNT(*) FROM stages WHERE status = 'in_progress'");
  
  // آخر المصروفات
  const recentExpenses = await pool.query(`
    SELECT e.*, p.name as partner_name, b.name as building_name
    FROM expenses e
    JOIN partners p ON e.paid_by_partner_id = p.id
    JOIN buildings b ON e.building_id = b.id
    ORDER BY e.created_at DESC
    LIMIT 5
  `);
  
  // العمارات النشطة
  const activeBuildings = await pool.query(`
    SELECT b.*, 
           COALESCE(t.current_balance, 0) as current_balance,
           COUNT(DISTINCT s.id) as stages_count,
           COUNT(DISTINCT bp.partner_id) as partners_count
    FROM buildings b
    LEFT JOIN treasury t ON b.id = t.building_id
    LEFT JOIN stages s ON b.id = s.building_id
    LEFT JOIN building_partners bp ON b.id = bp.building_id
    WHERE b.status = 'under_construction'
    GROUP BY b.id, t.current_balance
    ORDER BY b.created_at DESC
    LIMIT 5
  `);
  
  return {
    buildings_count: parseInt(buildingsCount.rows[0].count),
    total_investments: parseFloat(totalInvestments.rows[0].total),
    total_expenses: parseFloat(totalExpenses.rows[0].total),
    total_profits: parseFloat(totalProfits.rows[0].total),
    partners_count: parseInt(partnersCount.rows[0].count),
    active_stages: parseInt(activeStages.rows[0].count),
    recent_expenses: recentExpenses.rows,
    active_buildings: activeBuildings.rows
  };
}

// تقرير مالي شهري
export async function getMonthlyFinancialReport(buildingId: number, year: number, month: number): Promise<any> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  
  const query = `
    WITH monthly_data AS (
      SELECT 
        -- المصروفات الشهرية
        (SELECT COALESCE(SUM(amount), 0) 
         FROM expenses 
         WHERE building_id = $1 
         AND payment_date BETWEEN $2::date AND $3::date) as monthly_expenses,
        
        -- الإيرادات الشهرية
        (SELECT COALESCE(SUM(amount), 0) 
         FROM revenues 
         WHERE building_id = $1 
         AND revenue_date BETWEEN $2::date AND $3::date) as monthly_revenues,
        
        -- المدفوعات من الشركاء
        (SELECT COALESCE(SUM(amount), 0) 
         FROM partner_payments 
         WHERE building_id = $1 
         AND payment_date BETWEEN $2::date AND $3::date) as monthly_investments
    )
    SELECT * FROM monthly_data
  `;
  
  const result = await pool.query(query, [buildingId, startDate, endDate]);
  
  // تفاصيل المصروفات حسب النوع
  const expensesByType = await pool.query(`
    SELECT 
      expense_type,
      COUNT(*) as count,
      SUM(amount) as total
    FROM expenses
    WHERE building_id = $1
    AND payment_date BETWEEN $2::date AND $3::date
    GROUP BY expense_type
    ORDER BY total DESC
  `, [buildingId, startDate, endDate]);
  
  // تفاصيل المصروفات حسب الشريك
  const expensesByPartner = await pool.query(`
    SELECT 
      p.name as partner_name,
      COUNT(e.*) as count,
      SUM(e.amount) as total
    FROM expenses e
    JOIN partners p ON e.paid_by_partner_id = p.id
    WHERE e.building_id = $1
    AND e.payment_date BETWEEN $2::date AND $3::date
    GROUP BY p.id, p.name
    ORDER BY total DESC
  `, [buildingId, startDate, endDate]);
  
  return {
    period: { year, month },
    summary: result.rows[0],
    expenses_by_type: expensesByType.rows,
    expenses_by_partner: expensesByPartner.rows,
    net_cash_flow: parseFloat(result.rows[0].monthly_investments) + 
                   parseFloat(result.rows[0].monthly_revenues) - 
                   parseFloat(result.rows[0].monthly_expenses)
  };
}

// تقرير مقارنة بين العمارات
export async function getBuildingsComparisonReport(): Promise<any[]> {
  const query = `
    SELECT 
      b.id,
      b.name,
      b.status,
      b.estimated_cost,
      b.actual_cost,
      b.profit,
      t.total_investments,
      t.total_expenses,
      t.total_revenues,
      t.total_profits,
      t.current_balance,
      COUNT(DISTINCT s.id) as stages_count,
      COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_stages,
      COUNT(DISTINCT bp.partner_id) as partners_count,
      AVG(s.progress_percentage) as average_progress
    FROM buildings b
    LEFT JOIN treasury t ON b.id = t.building_id
    LEFT JOIN stages s ON b.id = s.building_id
    LEFT JOIN building_partners bp ON b.id = bp.building_id
    GROUP BY b.id, t.building_id, t.total_investments, t.total_expenses, 
             t.total_revenues, t.total_profits, t.current_balance
    ORDER BY b.created_at DESC
  `;
  
  const result = await pool.query(query);
  
  return result.rows.map(row => ({
    ...row,
    roi: row.total_investments > 0 
      ? ((row.total_profits / row.total_investments) * 100).toFixed(2) 
      : 0,
    cost_variance: row.estimated_cost > 0
      ? ((row.actual_cost - row.estimated_cost) / row.estimated_cost * 100).toFixed(2)
      : 0
  }));
}

// تقرير أداء الشركاء
export async function getPartnersPerformanceReport(buildingId?: number): Promise<any[]> {
  let query = `
    SELECT 
      p.id,
      p.name,
      ${buildingId ? 'bp.building_id,' : ''}
      ${buildingId ? 'b.name as building_name,' : 'COUNT(DISTINCT bp.building_id) as buildings_count,'}
      ${buildingId ? 'bp.ownership_percentage,' : 'AVG(bp.ownership_percentage) as avg_ownership,'}
      SUM(bp.investment_amount) as total_investment,
      SUM(bp.profit_share) as total_profit_share,
      COUNT(DISTINCT e.id) as expenses_count,
      COALESCE(SUM(e.amount), 0) as total_expenses_paid,
      COUNT(DISTINCT pp.id) as payments_count,
      COALESCE(SUM(pp.amount), 0) as total_payments
    FROM partners p
    LEFT JOIN building_partners bp ON p.id = bp.partner_id
    ${buildingId ? 'JOIN buildings b ON bp.building_id = b.id' : ''}
    LEFT JOIN expenses e ON p.id = e.paid_by_partner_id ${buildingId ? 'AND e.building_id = $1' : ''}
    LEFT JOIN partner_payments pp ON p.id = pp.partner_id ${buildingId ? 'AND pp.building_id = $1' : ''}
    ${buildingId ? 'WHERE bp.building_id = $1' : ''}
    GROUP BY p.id, p.name${buildingId ? ', bp.building_id, b.name, bp.ownership_percentage' : ''}
    ORDER BY total_investment DESC
  `;
  
  const values = buildingId ? [buildingId] : [];
  const result = await pool.query(query, values);
  
  return result.rows;
}