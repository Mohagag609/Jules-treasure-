// نماذج البيانات
export interface Project {
  id?: number;
  name: string;
  start_date: string;
  end_date?: string;
  treasury_balance: number;
  status: 'active' | 'completed' | 'paused';
  created_at?: string;
  updated_at?: string;
}

export interface Phase {
  id?: number;
  project_id: number;
  name: string;
  amount_required: number;
  amount_paid: number;
  status: 'pending' | 'in_progress' | 'completed';
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Partner {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectPartner {
  id?: number;
  project_id: number;
  partner_id: number;
  percentage: number;
  amount_due: number;
  amount_paid: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  partner?: Partner;
  project?: Project;
}

export interface Supplier {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PhaseSupplier {
  id?: number;
  phase_id: number;
  supplier_id: number;
  amount_due: number;
  amount_paid: number;
  created_at?: string;
  updated_at?: string;
  // Relations
  supplier?: Supplier;
  phase?: Phase;
  materials?: Material[];
}

export interface Material {
  id?: number;
  phase_supplier_id: number;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  created_at?: string;
  updated_at?: string;
}

export interface PartnerPayment {
  id?: number;
  project_partner_id: number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  project_partner?: ProjectPartner;
}

export interface SupplierPayment {
  id?: number;
  phase_supplier_id: number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  phase_supplier?: PhaseSupplier;
}

export interface Settlement {
  id?: number;
  project_id: number;
  phase_id?: number;
  from_partner_id: number;
  to_partner_id: number;
  amount: number;
  settlement_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  from_partner?: Partner;
  to_partner?: Partner;
  project?: Project;
  phase?: Phase;
}

export interface TreasuryLog {
  id?: number;
  project_id: number;
  transaction_type: 'income' | 'expense';
  amount: number;
  balance_after: number;
  description?: string;
  reference_type?: 'partner_payment' | 'supplier_payment';
  reference_id?: number;
  transaction_date: string;
  created_at?: string;
}