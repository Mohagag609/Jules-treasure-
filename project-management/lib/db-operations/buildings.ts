import { pool } from '../db';
import { Building, Treasury } from '../types';

// ================== عمليات العمارات ==================

export async function getAllBuildings(): Promise<Building[]> {
  const query = `
    SELECT b.*, 
           COALESCE(t.current_balance, 0) as current_balance,
           COALESCE(t.total_expenses, 0) as total_expenses,
           COALESCE(t.total_revenues, 0) as total_revenues
    FROM buildings b
    LEFT JOIN treasury t ON b.id = t.building_id
    ORDER BY b.created_at DESC
  `;
  const result = await pool.query(query);
  return result.rows;
}

export async function getBuildingById(id: number): Promise<Building | null> {
  const query = 'SELECT * FROM buildings WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function createBuilding(building: Partial<Building>): Promise<Building> {
  const query = `
    INSERT INTO buildings (name, address, total_floors, total_units, estimated_cost, status, start_date, expected_completion_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const values = [
    building.name,
    building.address || null,
    building.total_floors || 0,
    building.total_units || 0,
    building.estimated_cost || 0,
    building.status || 'planning',
    building.start_date || new Date().toISOString().split('T')[0],
    building.expected_completion_date || null
  ];
  const result = await pool.query(query, values);
  
  // إنشاء خزينة للعمارة الجديدة
  await pool.query(
    'INSERT INTO treasury (building_id, total_investments, total_expenses, total_revenues, current_balance) VALUES ($1, 0, 0, 0, 0)',
    [result.rows[0].id]
  );
  
  return result.rows[0];
}

export async function updateBuilding(id: number, building: Partial<Building>): Promise<Building> {
  const query = `
    UPDATE buildings 
    SET name = $2, address = $3, total_floors = $4, total_units = $5, 
        estimated_cost = $6, status = $7, expected_completion_date = $8,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const values = [
    id,
    building.name,
    building.address,
    building.total_floors,
    building.total_units,
    building.estimated_cost,
    building.status,
    building.expected_completion_date
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function deleteBuilding(id: number): Promise<boolean> {
  const query = 'DELETE FROM buildings WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
}