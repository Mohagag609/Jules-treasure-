import db from './db';
import { Stage, Partner, StagePartner, Supplier, Payment, Settlement, Treasury, UnifiedInput, PartnerBalance } from './types';

// عمليات المراحل
export const stageOperations = {
  create: (stage: Stage) => {
    const stmt = db.prepare('INSERT INTO stages (name, total_amount, remaining_amount) VALUES (?, ?, ?)');
    const result = stmt.run(stage.name, stage.total_amount, stage.total_amount);
    
    // إنشاء سجل خزينة للمرحلة
    const treasuryStmt = db.prepare('INSERT INTO treasury (stage_id, balance) VALUES (?, ?)');
    treasuryStmt.run(result.lastInsertRowid, 0);
    
    return result.lastInsertRowid;
  },
  
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM stages ORDER BY created_at DESC');
    return stmt.all();
  },
  
  getById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM stages WHERE id = ?');
    return stmt.get(id);
  },
  
  update: (id: number, stage: Partial<Stage>) => {
    const stmt = db.prepare('UPDATE stages SET name = ?, total_amount = ? WHERE id = ?');
    return stmt.run(stage.name, stage.total_amount, id);
  },
  
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM stages WHERE id = ?');
    return stmt.run(id);
  }
};

// عمليات الشركاء
export const partnerOperations = {
  create: (partner: Partner) => {
    const stmt = db.prepare('INSERT INTO partners (name) VALUES (?)');
    const result = stmt.run(partner.name);
    return result.lastInsertRowid;
  },
  
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM partners ORDER BY name');
    return stmt.all();
  },
  
  getById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM partners WHERE id = ?');
    return stmt.get(id);
  },
  
  getByName: (name: string) => {
    const stmt = db.prepare('SELECT * FROM partners WHERE name = ?');
    return stmt.get(name);
  },
  
  getOrCreate: (name: string) => {
    let partner = partnerOperations.getByName(name);
    if (!partner) {
      const id = partnerOperations.create({ name });
      partner = { id, name };
    }
    return partner;
  }
};

// عمليات الموردين
export const supplierOperations = {
  create: (supplier: Supplier) => {
    const stmt = db.prepare('INSERT INTO suppliers (name) VALUES (?)');
    const result = stmt.run(supplier.name);
    return result.lastInsertRowid;
  },
  
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM suppliers ORDER BY name');
    return stmt.all();
  },
  
  getByName: (name: string) => {
    const stmt = db.prepare('SELECT * FROM suppliers WHERE name = ?');
    return stmt.get(name);
  },
  
  getOrCreate: (name: string) => {
    let supplier = supplierOperations.getByName(name);
    if (!supplier) {
      const id = supplierOperations.create({ name });
      supplier = { id, name };
    }
    return supplier;
  }
};

// عمليات شركاء المراحل
export const stagePartnerOperations = {
  create: (stagePartner: StagePartner) => {
    const stmt = db.prepare('INSERT INTO stage_partners (stage_id, partner_id, percentage) VALUES (?, ?, ?)');
    return stmt.run(stagePartner.stage_id, stagePartner.partner_id, stagePartner.percentage);
  },
  
  getByStage: (stageId: number) => {
    const stmt = db.prepare(`
      SELECT sp.*, p.name as partner_name 
      FROM stage_partners sp
      JOIN partners p ON sp.partner_id = p.id
      WHERE sp.stage_id = ?
    `);
    return stmt.all(stageId);
  },
  
  update: (id: number, percentage: number) => {
    const stmt = db.prepare('UPDATE stage_partners SET percentage = ? WHERE id = ?');
    return stmt.run(percentage, id);
  },
  
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM stage_partners WHERE id = ?');
    return stmt.run(id);
  }
};

// عمليات المدفوعات
export const paymentOperations = {
  create: (payment: Payment) => {
    const stmt = db.prepare(`
      INSERT INTO payments (stage_id, partner_id, supplier_id, amount, payment_type, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      payment.stage_id,
      payment.partner_id || null,
      payment.supplier_id || null,
      payment.amount,
      payment.payment_type,
      payment.description || null
    );
    
    // تحديث الخزينة
    if (payment.payment_type === 'from_partner') {
      treasuryOperations.addToBalance(payment.stage_id, payment.amount);
    } else if (payment.payment_type === 'to_supplier') {
      treasuryOperations.subtractFromBalance(payment.stage_id, payment.amount);
    }
    
    return result.lastInsertRowid;
  },
  
  getByStage: (stageId: number) => {
    const stmt = db.prepare(`
      SELECT p.*, 
             part.name as partner_name,
             sup.name as supplier_name
      FROM payments p
      LEFT JOIN partners part ON p.partner_id = part.id
      LEFT JOIN suppliers sup ON p.supplier_id = sup.id
      WHERE p.stage_id = ?
      ORDER BY p.payment_date DESC
    `);
    return stmt.all(stageId);
  },
  
  getPartnerPayments: (stageId: number, partnerId: number) => {
    const stmt = db.prepare(`
      SELECT SUM(amount) as total
      FROM payments
      WHERE stage_id = ? AND partner_id = ? AND payment_type = 'from_partner'
    `);
    const result = stmt.get(stageId, partnerId) as any;
    return result?.total || 0;
  },
  
  getSupplierPayments: (stageId: number) => {
    const stmt = db.prepare(`
      SELECT SUM(amount) as total
      FROM payments
      WHERE stage_id = ? AND payment_type = 'to_supplier'
    `);
    const result = stmt.get(stageId) as any;
    return result?.total || 0;
  }
};

// عمليات الخزينة
export const treasuryOperations = {
  getByStage: (stageId: number) => {
    const stmt = db.prepare('SELECT * FROM treasury WHERE stage_id = ?');
    return stmt.get(stageId);
  },
  
  addToBalance: (stageId: number, amount: number) => {
    const stmt = db.prepare(`
      UPDATE treasury 
      SET balance = balance + ?, last_updated = CURRENT_TIMESTAMP
      WHERE stage_id = ?
    `);
    return stmt.run(amount, stageId);
  },
  
  subtractFromBalance: (stageId: number, amount: number) => {
    const stmt = db.prepare(`
      UPDATE treasury 
      SET balance = balance - ?, last_updated = CURRENT_TIMESTAMP
      WHERE stage_id = ?
    `);
    return stmt.run(amount, stageId);
  },
  
  setBalance: (stageId: number, balance: number) => {
    const stmt = db.prepare(`
      UPDATE treasury 
      SET balance = ?, last_updated = CURRENT_TIMESTAMP
      WHERE stage_id = ?
    `);
    return stmt.run(balance, stageId);
  }
};

// عمليات التسوية
export const settlementOperations = {
  create: (settlement: Settlement) => {
    const stmt = db.prepare(`
      INSERT INTO settlements (stage_id, from_partner_id, to_partner_id, amount, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      settlement.stage_id,
      settlement.from_partner_id,
      settlement.to_partner_id,
      settlement.amount,
      settlement.description || null
    );
  },
  
  getByStage: (stageId: number) => {
    const stmt = db.prepare(`
      SELECT s.*,
             fp.name as from_partner_name,
             tp.name as to_partner_name
      FROM settlements s
      JOIN partners fp ON s.from_partner_id = fp.id
      JOIN partners tp ON s.to_partner_id = tp.id
      WHERE s.stage_id = ?
      ORDER BY s.settlement_date DESC
    `);
    return stmt.all(stageId);
  }
};

// حساب أرصدة الشركاء
export function calculatePartnerBalances(stageId: number): PartnerBalance[] {
  const stage = stageOperations.getById(stageId) as any;
  const stagePartners = stagePartnerOperations.getByStage(stageId) as any[];
  const balances: PartnerBalance[] = [];
  
  for (const sp of stagePartners) {
    const expectedPayment = (stage.total_amount * sp.percentage) / 100;
    const actualPayment = paymentOperations.getPartnerPayments(stageId, sp.partner_id);
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
export function processUnifiedInput(input: UnifiedInput) {
  return db.transaction(() => {
    // 1. إنشاء المرحلة
    const stageId = stageOperations.create(input.stage) as number;
    
    // 2. إضافة الشركاء ونسبهم ومدفوعاتهم
    for (const partnerData of input.partners) {
      const partner = partnerOperations.getOrCreate(partnerData.name) as any;
      
      // إضافة الشريك للمرحلة مع نسبته
      stagePartnerOperations.create({
        stage_id: stageId,
        partner_id: partner.id,
        percentage: partnerData.percentage
      });
      
      // تسجيل مدفوعات الشريك
      if (partnerData.payment > 0) {
        paymentOperations.create({
          stage_id: stageId,
          partner_id: partner.id,
          amount: partnerData.payment,
          payment_type: 'from_partner',
          description: `دفعة من ${partnerData.name}`
        });
      }
    }
    
    // 3. إضافة الموردين ومدفوعاتهم
    for (const supplierData of input.suppliers) {
      const supplier = supplierOperations.getOrCreate(supplierData.name) as any;
      
      // تسجيل المدفوعات للمورد
      if (supplierData.payment > 0) {
        paymentOperations.create({
          stage_id: stageId,
          supplier_id: supplier.id,
          amount: supplierData.payment,
          payment_type: 'to_supplier',
          description: `دفعة إلى ${supplierData.name}`
        });
      }
    }
    
    // 4. حساب التسويات التلقائية
    const balances = calculatePartnerBalances(stageId);
    const overpaidPartners = balances.filter(b => b.status === 'overpaid');
    const underpaidPartners = balances.filter(b => b.status === 'underpaid');
    
    // إنشاء التسويات
    for (const overpaid of overpaidPartners) {
      for (const underpaid of underpaidPartners) {
        if (Math.abs(overpaid.difference) > 0 && Math.abs(underpaid.difference) > 0) {
          const settlementAmount = Math.min(Math.abs(overpaid.difference), Math.abs(underpaid.difference));
          
          settlementOperations.create({
            stage_id: stageId,
            from_partner_id: underpaid.partner_id,
            to_partner_id: overpaid.partner_id,
            amount: settlementAmount,
            description: `تسوية تلقائية`
          });
          
          // تحديث الأرصدة المتبقية
          overpaid.difference -= settlementAmount;
          underpaid.difference += settlementAmount;
        }
      }
    }
    
    return {
      stageId,
      balances: calculatePartnerBalances(stageId),
      treasury: treasuryOperations.getByStage(stageId)
    };
  })();
}

// الحصول على تقرير شامل للمرحلة
export function getStageReport(stageId: number) {
  const stage = stageOperations.getById(stageId);
  const partners = stagePartnerOperations.getByStage(stageId);
  const payments = paymentOperations.getByStage(stageId);
  const settlements = settlementOperations.getByStage(stageId);
  const treasury = treasuryOperations.getByStage(stageId);
  const balances = calculatePartnerBalances(stageId);
  
  return {
    stage,
    partners,
    payments,
    settlements,
    treasury,
    balances
  };
}