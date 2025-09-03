// أنواع البيانات المستخدمة في النظام

export interface Stage {
  id?: number;
  name: string;
  total_amount: number;
  remaining_amount: number;
  created_at?: string;
}

export interface Partner {
  id?: number;
  name: string;
  created_at?: string;
}

export interface StagePartner {
  id?: number;
  stage_id: number;
  partner_id: number;
  partner_name?: string;
  percentage: number;
}

export interface Supplier {
  id?: number;
  name: string;
  created_at?: string;
}

export interface Payment {
  id?: number;
  stage_id: number;
  partner_id?: number;
  supplier_id?: number;
  amount: number;
  payment_type: 'from_partner' | 'to_supplier';
  description?: string;
  payment_date?: string;
  partner_name?: string;
  supplier_name?: string;
}

export interface Settlement {
  id?: number;
  stage_id: number;
  from_partner_id: number;
  to_partner_id: number;
  amount: number;
  description?: string;
  settlement_date?: string;
  from_partner_name?: string;
  to_partner_name?: string;
}

export interface Treasury {
  id?: number;
  stage_id: number;
  balance: number;
  last_updated?: string;
}

export interface UnifiedInput {
  stage: Stage;
  partners: Array<{
    name: string;
    percentage: number;
    payment: number;
  }>;
  suppliers: Array<{
    name: string;
    payment: number;
  }>;
}

export interface PartnerBalance {
  partner_id: number;
  partner_name: string;
  stage_id: number;
  stage_name: string;
  expected_payment: number;
  actual_payment: number;
  difference: number;
  status: 'overpaid' | 'underpaid' | 'balanced';
}