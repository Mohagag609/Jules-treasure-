import { pool } from '../db';
import { Partner, BuildingPartner } from '../types';

// ================== عمليات الشركاء ==================

export async function getAllPartners(): Promise<Partner[]> {
  const query = 'SELECT * FROM partners ORDER BY name';
  const result = await pool.query(query);
  return result.rows;
}

export async function getPartnerById(id: number): Promise<Partner | null> {
  const query = 'SELECT * FROM partners WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function createPartner(partner: Partial<Partner>): Promise<Partner> {
  const query = `
    INSERT INTO partners (name, phone, email, national_id, address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [
    partner.name,
    partner.phone || null,
    partner.email || null,
    partner.national_id || null,
    partner.address || null
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function updatePartner(id: number, partner: Partial<Partner>): Promise<Partner> {
  const query = `
    UPDATE partners 
    SET name = $2, phone = $3, email = $4, national_id = $5, address = $6,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const values = [
    id,
    partner.name,
    partner.phone,
    partner.email,
    partner.national_id,
    partner.address
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// ================== عمليات ربط الشركاء بالعمارات ==================

export async function getPartnersByBuilding(buildingId: number): Promise<any[]> {
  const query = `
    SELECT p.*, bp.ownership_percentage, bp.investment_amount, bp.profit_share,
           COALESCE(SUM(e.amount), 0) as total_expenses_paid,
           COALESCE(SUM(pp.amount), 0) as total_payments
    FROM partners p
    JOIN building_partners bp ON p.id = bp.partner_id
    LEFT JOIN expenses e ON p.id = e.paid_by_partner_id AND e.building_id = $1
    LEFT JOIN partner_payments pp ON p.id = pp.partner_id AND pp.building_id = $1
    WHERE bp.building_id = $1
    GROUP BY p.id, p.name, p.phone, p.email, p.national_id, p.address, 
             p.created_at, p.updated_at, bp.ownership_percentage, 
             bp.investment_amount, bp.profit_share
    ORDER BY bp.ownership_percentage DESC
  `;
  const result = await pool.query(query, [buildingId]);
  return result.rows;
}

export async function addPartnerToBuilding(
  buildingId: number,
  partnerId: number,
  ownershipPercentage: number
): Promise<BuildingPartner> {
  // التحقق من أن مجموع النسب لا يتجاوز 100%
  const currentTotal = await pool.query(
    'SELECT COALESCE(SUM(ownership_percentage), 0) as total FROM building_partners WHERE building_id = $1',
    [buildingId]
  );
  
  if (parseFloat(currentTotal.rows[0].total) + ownershipPercentage > 100) {
    throw new Error(`مجموع نسب الشركاء سيتجاوز 100% (الحالي: ${currentTotal.rows[0].total}%)`);
  }
  
  const query = `
    INSERT INTO building_partners (building_id, partner_id, ownership_percentage)
    VALUES ($1, $2, $3)
    ON CONFLICT (building_id, partner_id) 
    DO UPDATE SET ownership_percentage = $3, updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  const result = await pool.query(query, [buildingId, partnerId, ownershipPercentage]);
  return result.rows[0];
}

export async function updatePartnerPercentage(
  buildingId: number,
  partnerId: number,
  newPercentage: number
): Promise<BuildingPartner> {
  // التحقق من أن مجموع النسب لا يتجاوز 100%
  const currentTotal = await pool.query(
    `SELECT COALESCE(SUM(ownership_percentage), 0) as total 
     FROM building_partners 
     WHERE building_id = $1 AND partner_id != $2`,
    [buildingId, partnerId]
  );
  
  if (parseFloat(currentTotal.rows[0].total) + newPercentage > 100) {
    throw new Error(`مجموع نسب الشركاء سيتجاوز 100% (الحالي للآخرين: ${currentTotal.rows[0].total}%)`);
  }
  
  const query = `
    UPDATE building_partners 
    SET ownership_percentage = $3, updated_at = CURRENT_TIMESTAMP
    WHERE building_id = $1 AND partner_id = $2
    RETURNING *
  `;
  const result = await pool.query(query, [buildingId, partnerId, newPercentage]);
  return result.rows[0];
}

export async function removePartnerFromBuilding(
  buildingId: number,
  partnerId: number
): Promise<boolean> {
  const query = 'DELETE FROM building_partners WHERE building_id = $1 AND partner_id = $2';
  const result = await pool.query(query, [buildingId, partnerId]);
  return result.rowCount > 0;
}

// حساب توزيع المصروفات المتوقع لكل شريك
export async function calculatePartnerExpenseShare(
  buildingId: number,
  partnerId: number
): Promise<number> {
  const query = `
    SELECT 
      bp.ownership_percentage,
      t.total_expenses
    FROM building_partners bp
    JOIN treasury t ON bp.building_id = t.building_id
    WHERE bp.building_id = $1 AND bp.partner_id = $2
  `;
  const result = await pool.query(query, [buildingId, partnerId]);
  
  if (result.rows.length === 0) return 0;
  
  const { ownership_percentage, total_expenses } = result.rows[0];
  return (parseFloat(total_expenses) * parseFloat(ownership_percentage)) / 100;
}