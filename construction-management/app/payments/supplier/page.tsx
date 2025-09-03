'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Plus, DollarSign, Truck, Calendar, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Payment {
  id: number;
  supplier_name: string;
  phase_name: string;
  project_name: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  notes?: string;
  amount_due: number;
  total_paid: number;
}

interface PhaseSupplier {
  id: number;
  supplier_name: string;
  phase_name: string;
  project_name: string;
  amount_due: number;
  amount_paid: number;
  treasury_balance?: number;
}

export default function SupplierPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [phaseSuppliers, setPhaseSuppliers] = useState<PhaseSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    phase_supplier_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchPhaseSuppliers();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments/supplier');
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('فشل في جلب المدفوعات');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhaseSuppliers = async () => {
    try {
      // جلب جميع المشاريع والمراحل والموردين
      const projectsResponse = await fetch('/api/projects');
      const projects = await projectsResponse.json();
      
      const allPhaseSuppliers: PhaseSupplier[] = [];
      
      for (const project of projects) {
        const phasesResponse = await fetch(`/api/phases?project_id=${project.id}`);
        if (phasesResponse.ok) {
          const phases = await phasesResponse.json();
          
          for (const phase of phases) {
            if (phase.suppliers) {
              const suppliersWithInfo = phase.suppliers.map((supplier: any) => ({
                id: supplier.id,
                supplier_name: supplier.supplier_name,
                phase_name: phase.name,
                project_name: project.name,
                amount_due: supplier.amount_due,
                amount_paid: supplier.amount_paid,
                treasury_balance: project.treasury_balance
              }));
              allPhaseSuppliers.push(...suppliersWithInfo);
            }
          }
        }
      }
      
      setPhaseSuppliers(allPhaseSuppliers);
    } catch (error) {
      console.error('Error fetching phase suppliers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phase_supplier_id || !formData.amount || !formData.payment_date) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const response = await fetch('/api/payments/supplier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record payment');
      }

      toast.success('تم تسجيل الدفعة بنجاح');
      setShowAddModal(false);
      setFormData({
        phase_supplier_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: ''
      });
      fetchPayments();
      fetchPhaseSuppliers();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error(error.message || 'فشل في تسجيل الدفعة');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG');
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: { [key: string]: string } = {
      cash: 'نقدي',
      bank: 'تحويل بنكي',
      check: 'شيك'
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/payments">
              <button className="text-gray-500 hover:text-gray-700 ml-3">
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <TrendingDown className="ml-2 h-6 w-6 text-orange-600" />
                مدفوعات الموردين
              </h1>
              <p className="text-gray-600 mt-1">
                إجمالي المدفوعات: {payments.length}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="ml-2 h-5 w-5" />
            تسجيل دفعة
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">إجمالي المدفوعات</p>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">عدد الموردين</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Set(payments.map(p => p.supplier_name)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">المراحل النشطة</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Set(payments.map(p => p.phase_name)).size}
          </p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المورد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المرحلة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المشروع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  طريقة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستحق / المدفوع
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    لا توجد مدفوعات مسجلة بعد
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-orange-100 p-2 rounded-full ml-3">
                          <Truck className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.supplier_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.phase_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.project_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-orange-600">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {getPaymentMethodLabel(payment.payment_method || 'cash')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <span className="text-gray-600">{formatCurrency(payment.amount_due)}</span>
                        <span className="mx-1">/</span>
                        <span className="text-orange-600">{formatCurrency(payment.total_paid)}</span>
                      </div>
                      {payment.total_paid >= payment.amount_due && (
                        <span className="text-xs text-green-600">✓ مكتمل</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">تسجيل دفعة لمورد</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="phase_supplier_id" className="block text-sm font-medium text-gray-700 mb-1">
                  المورد والمرحلة *
                </label>
                <select
                  id="phase_supplier_id"
                  value={formData.phase_supplier_id}
                  onChange={(e) => setFormData({...formData, phase_supplier_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">اختر المورد والمرحلة</option>
                  {phaseSuppliers.map((ps) => (
                    <option key={ps.id} value={ps.id}>
                      {ps.supplier_name} - {ps.phase_name} ({ps.project_name})
                      {ps.amount_paid >= ps.amount_due && ' ✓'}
                    </option>
                  ))}
                </select>
                {formData.phase_supplier_id && (
                  <div className="text-xs text-gray-500 mt-1">
                    <p>المستحق: {formatCurrency(phaseSuppliers.find(ps => ps.id === parseInt(formData.phase_supplier_id))?.amount_due || 0)} | 
                    المدفوع: {formatCurrency(phaseSuppliers.find(ps => ps.id === parseInt(formData.phase_supplier_id))?.amount_paid || 0)}</p>
                    <p className="text-blue-600">
                      رصيد الخزينة: {formatCurrency(phaseSuppliers.find(ps => ps.id === parseInt(formData.phase_supplier_id))?.treasury_balance || 0)}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  المبلغ *
                </label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="10000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ الدفع *
                </label>
                <input
                  type="date"
                  id="payment_date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
                  طريقة الدفع
                </label>
                <select
                  id="payment_method"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="cash">نقدي</option>
                  <option value="bank">تحويل بنكي</option>
                  <option value="check">شيك</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      phase_supplier_id: '',
                      amount: '',
                      payment_date: new Date().toISOString().split('T')[0],
                      payment_method: 'cash',
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}