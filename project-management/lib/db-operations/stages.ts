import { pool } from '../db';
import { Stage } from '../types';

// ================== عمليات المراحل ==================

export async function getStagesByBuilding(buildingId: number): Promise<Stage[]> {
  const query = `
    SELECT s.*, 
           COALESCE(SUM(e.amount), 0) as actual_cost
    FROM stages s
    LEFT JOIN expenses e ON s.id = e.stage_id
    WHERE s.building_id = $1
    GROUP BY s.id
    ORDER BY s.order_index
  `;
  const result = await pool.query(query, [buildingId]);
  return result.rows;
}

export async function getStageById(id: number): Promise<Stage | null> {
  const query = `
    SELECT s.*, 
           COALESCE(SUM(e.amount), 0) as actual_cost
    FROM stages s
    LEFT JOIN expenses e ON s.id = e.stage_id
    WHERE s.id = $1
    GROUP BY s.id
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function createStage(stage: Partial<Stage>): Promise<Stage> {
  const query = `
    INSERT INTO stages (building_id, name, description, estimated_cost, status, order_index, start_date, end_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  // الحصول على آخر order_index للعمارة
  const maxOrderResult = await pool.query(
    'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM stages WHERE building_id = $1',
    [stage.building_id]
  );
  
  const values = [
    stage.building_id,
    stage.name,
    stage.description || null,
    stage.estimated_cost || 0,
    stage.status || 'pending',
    stage.order_index || maxOrderResult.rows[0].next_order,
    stage.start_date || null,
    stage.end_date || null
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function updateStage(id: number, stage: Partial<Stage>): Promise<Stage> {
  const query = `
    UPDATE stages 
    SET name = $2, description = $3, estimated_cost = $4, 
        status = $5, start_date = $6, end_date = $7,
        progress_percentage = $8, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const values = [
    id,
    stage.name,
    stage.description,
    stage.estimated_cost,
    stage.status,
    stage.start_date,
    stage.end_date,
    stage.progress_percentage || 0
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function updateStageProgress(id: number, progress: number, status?: string): Promise<Stage> {
  const query = `
    UPDATE stages 
    SET progress_percentage = $2, 
        status = COALESCE($3, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [id, progress, status || null]);
  return result.rows[0];
}

export async function deleteStage(id: number): Promise<boolean> {
  const query = 'DELETE FROM stages WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount > 0;
}

// حساب تقدم العمارة بناءً على المراحل
export async function calculateBuildingProgress(buildingId: number): Promise<number> {
  const query = `
    SELECT 
      COUNT(*) as total_stages,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_stages,
      AVG(progress_percentage) as average_progress
    FROM stages
    WHERE building_id = $1
  `;
  const result = await pool.query(query, [buildingId]);
  
  if (result.rows.length === 0 || result.rows[0].total_stages === 0) {
    return 0;
  }
  
  return parseFloat(result.rows[0].average_progress) || 0;
}

// تحديث ترتيب المراحل
export async function reorderStages(buildingId: number, stageOrders: { id: number; order: number }[]): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const { id, order } of stageOrders) {
      await client.query(
        'UPDATE stages SET order_index = $1 WHERE id = $2 AND building_id = $3',
        [order, id, buildingId]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}