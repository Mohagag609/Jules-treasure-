// نموذج البيانات المتكامل للنظام

// العمارة/المشروع
export interface Building {
  id: number;
  name: string;
  address: string;
  total_floors: number;
  total_units: number;
  estimated_cost: number;
  actual_cost?: number;
  selling_price?: number;
  profit?: number;
  status: 'planning' | 'under_construction' | 'completed' | 'sold';
  start_date: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  created_at: string;
  updated_at: string;
}

// المراحل
export interface Stage {
  id: number;
  building_id: number;
  name: string;
  description?: string;
  estimated_cost: number;
  actual_cost?: number;
  start_date?: string;
  end_date?: string;
  progress_percentage: number;
  status: 'pending' | 'in_progress' | 'completed';
  order_index: number; // ترتيب المرحلة
  created_at: string;
  updated_at: string;
}

// الشركاء
export interface Partner {
  id: number;
  name: string;
  phone: string;
  email?: string;
  national_id: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// نسب الشركاء في العمارات
export interface BuildingPartner {
  id: number;
  building_id: number;
  partner_id: number;
  ownership_percentage: number;
  investment_amount: number;
  profit_share?: number;
  created_at: string;
  updated_at: string;
}

// الموردين
export interface Supplier {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  supplier_type: 'materials' | 'labor' | 'equipment' | 'services' | 'other';
  created_at: string;
  updated_at: string;
}

// المصروفات
export interface Expense {
  id: number;
  building_id: number;
  stage_id?: number;
  supplier_id?: number;
  paid_by_partner_id: number;
  expense_type: 'materials' | 'labor' | 'equipment' | 'permits' | 'utilities' | 'other';
  description: string;
  amount: number;
  payment_date: string;
  receipt_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// المدفوعات من الشركاء
export interface PartnerPayment {
  id: number;
  building_id: number;
  partner_id: number;
  amount: number;
  payment_type: 'investment' | 'expense_coverage' | 'additional';
  payment_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'check';
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// الإيرادات والأرباح
export interface Revenue {
  id: number;
  building_id: number;
  revenue_type: 'unit_sale' | 'rent' | 'other';
  description: string;
  amount: number;
  revenue_date: string;
  unit_number?: string;
  buyer_name?: string;
  created_at: string;
  updated_at: string;
}

// توزيع الأرباح
export interface ProfitDistribution {
  id: number;
  building_id: number;
  partner_id: number;
  profit_amount: number;
  distribution_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'check';
  reference_number?: string;
  status: 'pending' | 'paid';
  created_at: string;
  updated_at: string;
}

// التسويات بين الشركاء
export interface PartnerSettlement {
  id: number;
  building_id: number;
  partner_id: number;
  period_start: string;
  period_end: string;
  total_expenses: number;
  partner_share: number; // حصة الشريك من المصروفات
  actual_paid: number; // ما دفعه فعلياً
  difference: number; // الفرق (موجب = دفع زيادة، سالب = دفع أقل)
  status: 'overpaid' | 'underpaid' | 'settled';
  settlement_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// الخزينة
export interface Treasury {
  id: number;
  building_id: number;
  total_investments: number; // إجمالي الاستثمارات من الشركاء
  total_expenses: number; // إجمالي المصروفات
  total_revenues: number; // إجمالي الإيرادات
  total_profits: number; // إجمالي الأرباح
  distributed_profits: number; // الأرباح الموزعة
  current_balance: number; // الرصيد الحالي
  last_updated: string;
  created_at: string;
}

// تقرير شامل للعمارة
export interface BuildingReport {
  building: Building;
  stages: Stage[];
  partners: (Partner & {
    ownership_percentage: number;
    investment_amount: number;
    total_paid: number;
    total_expenses_share: number;
    profit_share: number;
    settlement_status: 'overpaid' | 'underpaid' | 'settled';
  })[];
  expenses: Expense[];
  revenues: Revenue[];
  treasury: Treasury;
  profitDistributions: ProfitDistribution[];
  settlements: PartnerSettlement[];
}

// نموذج الإدخال السريع المتكامل
export interface QuickEntry {
  building_id: number;
  stage_id?: number;
  expense?: {
    supplier_id?: number;
    supplier_name?: string;
    paid_by_partner_id: number;
    expense_type: string;
    description: string;
    amount: number;
    payment_date: string;
  };
  partner_payment?: {
    partner_id: number;
    amount: number;
    payment_type: string;
    payment_method: string;
  };
  revenue?: {
    revenue_type: string;
    description: string;
    amount: number;
    unit_number?: string;
  };
}

// Legacy interfaces for backward compatibility
export interface Payment {
  id: number;
  partner_id: number;
  amount: number;
  payment_type: 'from_partner' | 'to_supplier';
  stage_id: number;
  created_at: string;
}

export interface Settlement {
  id: number;
  partner_id: number;
  stage_id: number;
  expected_amount: number;
  paid_amount: number;
  difference: number;
  status: 'overpaid' | 'underpaid' | 'settled';
  created_at: string;
}