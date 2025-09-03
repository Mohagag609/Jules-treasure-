import pool from './db';
import { Stage, Partner, StagePartner, Supplier, Payment, Settlement, Treasury, UnifiedInput, PartnerBalance } from './types';

// عمليات المراحل
export const stageOperations = {
  create: async (stage: Stage) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        'INSERT INTO stages (name, total_amount, remaining_amount) VALUES ($1, $2, $3) RETURNING id',
        [stage.name, stage.total_amount, stage.total_amount]
      );
      
      const stageId = result.rows[0].id;
      
      // إنشاء سجل خزينة للمرحلة
      await client.query(
        'INSERT INTO treasury (stage_id, balance) VALUES ($1, $2)',
        [stageId, 0]
      );
      
      await client.query('COMMIT');
      return stageId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  getAll: async () => {
    const result = await pool.query('SELECT * FROM stages ORDER BY created_at DESC');
    return result.rows;
  },
  
  getById: async (id: number) => {
    const result = await pool.query('SELECT * FROM stages WHERE id = $1', [id]);
    return result.rows[0];
  },
  
  update: async (id: number, stage: Partial<Stage>) => {
    const result = await pool.query(
      'UPDATE stages SET name = $1, total_amount = $2 WHERE id = $3',
      [stage.name, stage.total_amount, id]
    );
    return result;
  },
  
  delete: async (id: number) => {
    const result = await pool.query('DELETE FROM stages WHERE id = $1', [id]);
    return result;
  }
};

// عمليات الشركاء
export const partnerOperations = {
  create: async (partner: Partner) => {
    const result = await pool.query(
      'INSERT INTO partners (name) VALUES ($1) RETURNING id',
      [partner.name]
    );
    return result.rows[0].id;
  },
  
  getAll: async () => {
    const result = await pool.query('SELECT * FROM partners ORDER BY name');
    return result.rows;
  },
  
  getById: async (id: number) => {
    const result = await pool.query('SELECT * FROM partners WHERE id = $1', [id]);
    return result.rows[0];
  },
  
  getByName: async (name: string) => {
    const result = await pool.query('SELECT * FROM partners WHERE name = $1', [name]);
    return result.rows[0];
  },
  
  getOrCreate: async (name: string) => {
    let partner = await partnerOperations.getByName(name);
    if (!partner) {
      const id = await partnerOperations.create({ name });
      partner = { id, name };
    }
    return partner;
  }
};

// عمليات الموردين
export const supplierOperations = {
  create: async (supplier: Supplier) => {
    const result = await pool.query(
      'INSERT INTO suppliers (name) VALUES ($1) RETURNING id',
      [supplier.name]
    );
    return result.rows[0].id;
  },
  
  getAll: async () => {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name');
    return result.rows;
  },
  
  getByName: async (name: string) => {
    const result = await pool.query('SELECT * FROM suppliers WHERE name = $1', [name]);
    return result.rows[0];
  },
  
  getOrCreate: async (name: string) => {
    let supplier = await supplierOperations.getByName(name);
    if (!supplier) {
      const id = await supplierOperations.create({ name });
      supplier = { id, name };
    }
    return supplier;
  }
};

// عمليات شركاء المراحل
export const stagePartnerOperations = {
  create: async (stagePartner: StagePartner) => {
    const result = await pool.query(
      'INSERT INTO stage_partners (stage_id, partner_id, percentage) VALUES ($1, $2, $3)',
      [stagePartner.stage_id, stagePartner.partner_id, stagePartner.percentage]
    );
    return result;
  },
  
  getByStage: async (stageId: number) => {
    const result = await pool.query(`
      SELECT sp.*, p.name as partner_name 
      FROM stage_partners sp
      JOIN partners p ON sp.partner_id = p.id
      WHERE sp.stage_id = $1
    `, [stageId]);
    return result.rows;
  },
  
  update: async (id: number, percentage: number) => {
    const result = await pool.query(
      'UPDATE stage_partners SET percentage = $1 WHERE id = $2',
      [percentage, id]
    );
    return result;
  },
  
  delete: async (id: number) => {
    const result = await pool.query('DELETE FROM stage_partners WHERE id = $1', [id]);
    return result;
  }
};

// عمليات المدفوعات
export const paymentOperations = {
  create: async (payment: Payment) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `INSERT INTO payments (stage_id, partner_id, supplier_id, amount, payment_type, description)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          payment.stage_id,
          payment.partner_id || null,
          payment.supplier_id || null,
          payment.amount,
          payment.payment_type,
          payment.description || null
        ]
      );
      
      // تحديث الخزينة
      if (payment.payment_type === 'from_partner') {
        await treasuryOperations.addToBalance(payment.stage_id, payment.amount, client);
      } else if (payment.payment_type === 'to_supplier') {
        await treasuryOperations.subtractFromBalance(payment.stage_id, payment.amount, client);
      }
      
      await client.query('COMMIT');
      return result.rows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
  
  getByStage: async (stageId: number) => {
    const result = await pool.query(`
      SELECT p.*, 
             part.name as partner_name,
             sup.name as supplier_name
      FROM payments p
      LEFT JOIN partners part ON p.partner_id = part.id
      LEFT JOIN suppliers sup ON p.supplier_id = sup.id
      WHERE p.stage_id = $1
      ORDER BY p.payment_date DESC
    `, [stageId]);
    return result.rows;
  },
  
  getPartnerPayments: async (stageId: number, partnerId: number) => {
    const result = await pool.query(`
      SELECT SUM(amount) as total
      FROM payments
      WHERE stage_id = $1 AND partner_id = $2 AND payment_type = 'from_partner'
    `, [stageId, partnerId]);
    return parseFloat(result.rows[0]?.total || '0');
  },
  
  getSupplierPayments: async (stageId: number) => {
    const result = await pool.query(`
      SELECT SUM(amount) as total
      FROM payments
      WHERE stage_id = $1 AND payment_type = 'to_supplier'
    `, [stageId]);
    return parseFloat(result.rows[0]?.total || '0');
  }
};

// عمليات الخزينة
export const treasuryOperations = {
  getByStage: async (stageId: number) => {
    const result = await pool.query('SELECT * FROM treasury WHERE stage_id = $1', [stageId]);
    return result.rows[0];
  },
  
  addToBalance: async (stageId: number, amount: number, client?: any) => {
    const queryClient = client || pool;
    const result = await queryClient.query(`
      UPDATE treasury 
      SET balance = balance + $1, last_updated = CURRENT_TIMESTAMP
      WHERE stage_id = $2
    `, [amount, stageId]);
    return result;
  },
  
  subtractFromBalance: async (stageId: number, amount: number, client?: any) => {
    const queryClient = client || pool;
    const result = await queryClient.query(`
      UPDATE treasury 
      SET balance = balance - $1, last_updated = CURRENT_TIMESTAMP
      WHERE stage_id = $2
    `, [amount, stageId]);
    return result;
  },
  
  setBalance: async (stageId: number, balance: number) => {
    const result = await pool.query(`
      UPDATE treasury 
      SET balance = $1, last_updated = CURRENT_TIMESTAMP
      WHERE stage_id = $2
    `, [balance, stageId]);
    return result;
  }
};

// عمليات التسوية
export const settlementOperations = {
  create: async (settlement: Settlement) => {
    const result = await pool.query(
      `INSERT INTO settlements (stage_id, from_partner_id, to_partner_id, amount, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        settlement.stage_id,
        settlement.from_partner_id,
        settlement.to_partner_id,
        settlement.amount,
        settlement.description || null
      ]
    );
    return result;
  },
  
  getByStage: async (stageId: number) => {
    const result = await pool.query(`
      SELECT s.*,
             fp.name as from_partner_name,
             tp.name as to_partner_name
      FROM settlements s
      JOIN partners fp ON s.from_partner_id = fp.id
      JOIN partners tp ON s.to_partner_id = tp.id
      WHERE s.stage_id = $1
      ORDER BY s.settlement_date DESC
    `, [stageId]);
    return result.rows;
  }
};

// حساب أرصدة الشركاء
export async function calculatePartnerBalances(stageId: number): Promise<PartnerBalance[]> {
  const stage = await stageOperations.getById(stageId);
  const stagePartners = await stagePartnerOperations.getByStage(stageId);
  const balances: PartnerBalance[] = [];
  
  for (const sp of stagePartners) {
    const expectedPayment = (parseFloat(stage.total_amount) * parseFloat(sp.percentage)) / 100;
    const actualPayment = await paymentOperations.getPartnerPayments(stageId, sp.partner_id);
    const difference = actualPayment - expectedPayment;
    
    balances.push({
      partner_id: sp.partner_id,
      partner_name: sp.partner_name,
      stage_id: stageId,
      stage_name: stage.name,
      expected_payment: expectedPayment,
      actual_payment: actualPayment,
      difference: difference,
      status: difference > 0 ? 'overpaid' : difference < 0 ? 'underpaid' : 'balanced'
    });
  }
  
  return balances;
}

// معالجة المدخل الموحد
export async function processUnifiedInput(input: UnifiedInput) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. إنشاء المرحلة
    const stageResult = await client.query(
      'INSERT INTO stages (name, total_amount, remaining_amount) VALUES ($1, $2, $3) RETURNING id',
      [input.stage.name, input.stage.total_amount, input.stage.total_amount]
    );
    const stageId = stageResult.rows[0].id;
    
    // إنشاء سجل خزينة
    await client.query(
      'INSERT INTO treasury (stage_id, balance) VALUES ($1, $2)',
      [stageId, 0]
    );
    
    // 2. إضافة الشركاء ونسبهم ومدفوعاتهم
    for (const partnerData of input.partners) {
      // الحصول على الشريك أو إنشاؤه
      let partnerResult = await client.query(
        'SELECT * FROM partners WHERE name = $1',
        [partnerData.name]
      );
      
      let partnerId;
      if (partnerResult.rows.length === 0) {
        const insertResult = await client.query(
          'INSERT INTO partners (name) VALUES ($1) RETURNING id',
          [partnerData.name]
        );
        partnerId = insertResult.rows[0].id;
      } else {
        partnerId = partnerResult.rows[0].id;
      }
      
      // إضافة الشريك للمرحلة مع نسبته
      await client.query(
        'INSERT INTO stage_partners (stage_id, partner_id, percentage) VALUES ($1, $2, $3)',
        [stageId, partnerId, partnerData.percentage]
      );
      
      // تسجيل مدفوعات الشريك
      if (partnerData.payment > 0) {
        await client.query(
          `INSERT INTO payments (stage_id, partner_id, amount, payment_type, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [stageId, partnerId, partnerData.payment, 'from_partner', `دفعة من ${partnerData.name}`]
        );
        
        // تحديث الخزينة
        await client.query(
          'UPDATE treasury SET balance = balance + $1, last_updated = CURRENT_TIMESTAMP WHERE stage_id = $2',
          [partnerData.payment, stageId]
        );
      }
    }
    
    // 3. إضافة الموردين ومدفوعاتهم
    for (const supplierData of input.suppliers) {
      // الحصول على المورد أو إنشاؤه
      let supplierResult = await client.query(
        'SELECT * FROM suppliers WHERE name = $1',
        [supplierData.name]
      );
      
      let supplierId;
      if (supplierResult.rows.length === 0) {
        const insertResult = await client.query(
          'INSERT INTO suppliers (name) VALUES ($1) RETURNING id',
          [supplierData.name]
        );
        supplierId = insertResult.rows[0].id;
      } else {
        supplierId = supplierResult.rows[0].id;
      }
      
      // تسجيل المدفوعات للمورد
      if (supplierData.payment > 0) {
        await client.query(
          `INSERT INTO payments (stage_id, supplier_id, amount, payment_type, description)
           VALUES ($1, $2, $3, $4, $5)`,
          [stageId, supplierId, supplierData.payment, 'to_supplier', `دفعة إلى ${supplierData.name}`]
        );
        
        // تحديث الخزينة
        await client.query(
          'UPDATE treasury SET balance = balance - $1, last_updated = CURRENT_TIMESTAMP WHERE stage_id = $2',
          [supplierData.payment, stageId]
        );
      }
    }
    
    // 4. حساب التسويات التلقائية
    const balances = await calculatePartnerBalances(stageId);
    const overpaidPartners = balances.filter(b => b.status === 'overpaid');
    const underpaidPartners = balances.filter(b => b.status === 'underpaid');
    
    // إنشاء التسويات
    for (const overpaid of overpaidPartners) {
      for (const underpaid of underpaidPartners) {
        if (Math.abs(overpaid.difference) > 0 && Math.abs(underpaid.difference) > 0) {
          const settlementAmount = Math.min(Math.abs(overpaid.difference), Math.abs(underpaid.difference));
          
          await client.query(
            `INSERT INTO settlements (stage_id, from_partner_id, to_partner_id, amount, description)
             VALUES ($1, $2, $3, $4, $5)`,
            [stageId, underpaid.partner_id, overpaid.partner_id, settlementAmount, 'تسوية تلقائية']
          );
          
          // تحديث الأرصدة المتبقية
          overpaid.difference -= settlementAmount;
          underpaid.difference += settlementAmount;
        }
      }
    }
    
    await client.query('COMMIT');
    
    // الحصول على البيانات النهائية
    const finalBalances = await calculatePartnerBalances(stageId);
    const treasury = await treasuryOperations.getByStage(stageId);
    
    return {
      stageId,
      balances: finalBalances,
      treasury
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// الحصول على تقرير شامل للمرحلة
export async function getStageReport(stageId: number) {
  const stage = await stageOperations.getById(stageId);
  const partners = await stagePartnerOperations.getByStage(stageId);
  const payments = await paymentOperations.getByStage(stageId);
  const settlements = await settlementOperations.getByStage(stageId);
  const treasury = await treasuryOperations.getByStage(stageId);
  const balances = await calculatePartnerBalances(stageId);
  
  return {
    stage,
    partners,
    payments,
    settlements,
    treasury,
    balances
  };
}