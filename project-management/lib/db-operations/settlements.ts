import { pool } from '../db';
import { PartnerSettlement, ProfitDistribution } from '../types';

// ================== عمليات التسويات ==================

export async function calculateSettlement(
  buildingId: number,
  periodStart: string,
  periodEnd: string
): Promise<PartnerSettlement[]> {
  const query = `
    SELECT * FROM calculate_partner_settlement($1, $2::date, $3::date)
  `;
  const result = await pool.query(query, [buildingId, periodStart, periodEnd]);
  
  // حفظ التسوية في الجدول
  const settlements: PartnerSettlement[] = [];
  for (const row of result.rows) {
    const insertQuery = `
      INSERT INTO partner_settlements (
        building_id, partner_id, period_start, period_end,
        total_expenses, partner_share, actual_paid, difference, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      buildingId,
      row.partner_id,
      periodStart,
      periodEnd,
      row.total_expenses,
      row.expected_share,
      row.actual_paid,
      row.difference,
      row.status
    ];
    const insertResult = await pool.query(insertQuery, values);
    settlements.push(insertResult.rows[0]);
  }
  
  return settlements;
}

export async function getSettlementsByBuilding(buildingId: number): Promise<any[]> {
  const query = `
    SELECT ps.*, p.name as partner_name
    FROM partner_settlements ps
    JOIN partners p ON ps.partner_id = p.id
    WHERE ps.building_id = $1
    ORDER BY ps.created_at DESC
  `;
  const result = await pool.query(query, [buildingId]);
  return result.rows;
}

export async function getSettlementsByPartner(partnerId: number): Promise<any[]> {
  const query = `
    SELECT ps.*, b.name as building_name
    FROM partner_settlements ps
    JOIN buildings b ON ps.building_id = b.id
    WHERE ps.partner_id = $1
    ORDER BY ps.created_at DESC
  `;
  const result = await pool.query(query, [partnerId]);
  return result.rows;
}

export async function markSettlementAsPaid(settlementId: number): Promise<PartnerSettlement> {
  const query = `
    UPDATE partner_settlements 
    SET status = 'settled', 
        settlement_date = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [settlementId]);
  return result.rows[0];
}

// ================== عمليات توزيع الأرباح ==================

export async function calculateProfitDistribution(buildingId: number): Promise<any[]> {
  const query = 'SELECT * FROM calculate_profit_distribution($1)';
  const result = await pool.query(query, [buildingId]);
  return result.rows;
}

export async function distributeProfits(buildingId: number): Promise<ProfitDistribution[]> {
  const profitShares = await calculateProfitDistribution(buildingId);
  const distributions: ProfitDistribution[] = [];
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const share of profitShares) {
      const query = `
        INSERT INTO profit_distributions (
          building_id, partner_id, profit_amount, distribution_date, status
        )
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *
      `;
      const values = [
        buildingId,
        share.partner_id,
        share.profit_amount,
        new Date().toISOString().split('T')[0]
      ];
      const result = await client.query(query, values);
      distributions.push(result.rows[0]);
      
      // تحديث حصة الربح للشريك
      await client.query(
        'UPDATE building_partners SET profit_share = $1 WHERE building_id = $2 AND partner_id = $3',
        [share.profit_amount, buildingId, share.partner_id]
      );
    }
    
    // تحديث الأرباح الموزعة في الخزينة
    const totalDistributed = distributions.reduce((sum, d) => sum + parseFloat(d.profit_amount.toString()), 0);
    await client.query(
      'UPDATE treasury SET distributed_profits = distributed_profits + $1, last_updated = CURRENT_TIMESTAMP WHERE building_id = $2',
      [totalDistributed, buildingId]
    );
    
    await client.query('COMMIT');
    return distributions;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getProfitDistributions(buildingId: number): Promise<any[]> {
  const query = `
    SELECT pd.*, p.name as partner_name
    FROM profit_distributions pd
    JOIN partners p ON pd.partner_id = p.id
    WHERE pd.building_id = $1
    ORDER BY pd.distribution_date DESC
  `;
  const result = await pool.query(query, [buildingId]);
  return result.rows;
}

export async function markProfitAsPaid(distributionId: number, paymentMethod: string, referenceNumber?: string): Promise<ProfitDistribution> {
  const query = `
    UPDATE profit_distributions 
    SET status = 'paid', 
        payment_method = $2,
        reference_number = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [distributionId, paymentMethod, referenceNumber || null]);
  return result.rows[0];
}

// حساب التسوية التلقائية للفترة الحالية
export async function autoCalculateCurrentSettlement(buildingId: number): Promise<PartnerSettlement[]> {
  // حساب التسوية من بداية المشروع حتى اليوم
  const buildingQuery = 'SELECT start_date FROM buildings WHERE id = $1';
  const buildingResult = await pool.query(buildingQuery, [buildingId]);
  
  if (buildingResult.rows.length === 0) {
    throw new Error('العمارة غير موجودة');
  }
  
  const startDate = buildingResult.rows[0].start_date;
  const endDate = new Date().toISOString().split('T')[0];
  
  return calculateSettlement(buildingId, startDate, endDate);
}