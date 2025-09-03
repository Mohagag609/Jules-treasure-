'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  Clock,
  ArrowRight,
  Calculator,
  FileText,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProjectPartnerDetails {
  project_id: number;
  project_name: string;
  partner_id: number;
  partner_name: string;
  percentage: number;
  amount_due: number;
  amount_paid: number;
  balance: number; // الفرق بين المدفوع والمستحق
}

interface Settlement {
  id: number;
  project_name: string;
  phase_name?: string;
  from_partner_name: string;
  to_partner_name: string;
  amount: number;
  settlement_date: string;
  settlement_type: 'phase' | 'project' | 'manual';
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

interface SettlementCalculation {
  project_id: number;
  project_name: string;
  total_cost: number;
  partners: {
    partner_id: number;
    partner_name: string;
    percentage: number;
    amount_due: number;
    amount_paid: number;
    balance: number; // موجب = دفع أكثر، سالب = دفع أقل
  }[];
  settlements_needed: {
    from_partner_id: number;
    from_partner_name: string;
    to_partner_id: number;
    to_partner_name: string;
    amount: number;
  }[];
}

export default function EnhancedSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [settlementCalculations, setSettlementCalculations] = useState<SettlementCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');

  useEffect(() => {
    fetchSettlements();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      calculateSettlements(selectedProject);
    }
  }, [selectedProject]);

  const fetchSettlements = async () => {
    try {
      const response = await fetch('/api/settlements');
      if (!response.ok) throw new Error('Failed to fetch settlements');
      const data = await response.json();
      setSettlements(data);
    } catch (error) {
      console.error('Error fetching settlements:', error);
      toast.error('فشل في جلب التسويات');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const calculateSettlements = async (projectId: string) => {
    try {
      // جلب تفاصيل المشروع والشركاء
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) throw new Error('Failed to fetch project details');
      const projectData = await projectResponse.json();

      // حساب التسويات المطلوبة
      const partners = projectData.partners || [];
      const totalCost = projectData.phases?.reduce((sum: number, phase: any) => 
        sum + phase.amount_required, 0) || 0;

      // حساب الرصيد لكل شريك
      const partnersWithBalance = partners.map((partner: any) => ({
        partner_id: partner.partner_id,
        partner_name: partner.partner_name,
        percentage: partner.percentage,
        amount_due: (totalCost * partner.percentage) / 100,
        amount_paid: partner.amount_paid || 0,
        balance: (partner.amount_paid || 0) - ((totalCost * partner.percentage) / 100)
      }));

      // تحديد التسويات المطلوبة
      const settlements_needed: any[] = [];
      const creditors = partnersWithBalance.filter((p: any) => p.balance > 0); // من دفع أكثر
      const debtors = partnersWithBalance.filter((p: any) => p.balance < 0); // من دفع أقل

      // خوارزمية بسيطة للتسوية
      for (const creditor of creditors) {
        let remainingCredit = creditor.balance;
        
        for (const debtor of debtors) {
          if (remainingCredit <= 0) break;
          
          const debtAmount = Math.abs(debtor.balance);
          const settlementAmount = Math.min(remainingCredit, debtAmount);
          
          if (settlementAmount > 0) {
            settlements_needed.push({
              from_partner_id: debtor.partner_id,
              from_partner_name: debtor.partner_name,
              to_partner_id: creditor.partner_id,
              to_partner_name: creditor.partner_name,
              amount: settlementAmount
            });
            
            remainingCredit -= settlementAmount;
            debtor.balance += settlementAmount;
          }
        }
      }

      setSettlementCalculations({
        project_id: parseInt(projectId),
        project_name: projectData.name,
        total_cost: totalCost,
        partners: partnersWithBalance,
        settlements_needed
      });
    } catch (error) {
      console.error('Error calculating settlements:', error);
      toast.error('فشل في حساب التسويات');
    }
  };

  const createSettlement = async (settlement: any) => {
    try {
      const response = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settlement)
      });

      if (!response.ok) throw new Error('Failed to create settlement');
      
      toast.success('تم إنشاء التسوية بنجاح');
      fetchSettlements();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating settlement:', error);
      toast.error('فشل في إنشاء التسوية');
    }
  };

  const updateSettlementStatus = async (id: number, status: 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/settlements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update settlement');
      
      toast.success(`تم ${status === 'completed' ? 'إكمال' : 'إلغاء'} التسوية`);
      fetchSettlements();
    } catch (error) {
      console.error('Error updating settlement:', error);
      toast.error('فشل في تحديث التسوية');
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

  const filteredSettlements = settlements.filter(s => {
    if (activeTab === 'pending') return s.status === 'pending';
    if (activeTab === 'completed') return s.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">التسويات بين الشركاء</h1>
            <p className="text-gray-600 mt-1">إدارة وحساب التسويات المالية بين الشركاء في المشاريع</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Calculator className="ml-2 h-5 w-5" />
            حساب تسوية جديدة
          </button>
        </div>
      </div>

      {/* Settlement Calculator */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Calculator className="ml-2 h-5 w-5 text-blue-600" />
          حاسبة التسويات
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر المشروع لحساب التسويات
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- اختر المشروع --</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {settlementCalculations && (
          <div className="space-y-4">
            {/* Project Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">ملخص المشروع</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">اسم المشروع:</span>
                  <p className="font-medium">{settlementCalculations.project_name}</p>
                </div>
                <div>
                  <span className="text-gray-600">إجمالي التكلفة:</span>
                  <p className="font-medium text-blue-600">
                    {formatCurrency(settlementCalculations.total_cost)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">عدد الشركاء:</span>
                  <p className="font-medium">{settlementCalculations.partners.length}</p>
                </div>
              </div>
            </div>

            {/* Partners Balance */}
            <div>
              <h3 className="font-medium mb-2">أرصدة الشركاء</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        الشريك
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        النسبة
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        المستحق
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        المدفوع
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        الرصيد
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {settlementCalculations.partners.map(partner => (
                      <tr key={partner.partner_id}>
                        <td className="px-4 py-3 text-sm font-medium">
                          {partner.partner_name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {partner.percentage}%
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatCurrency(partner.amount_due)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatCurrency(partner.amount_paid)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          <span className={partner.balance > 0 ? 'text-green-600' : partner.balance < 0 ? 'text-red-600' : 'text-gray-600'}>
                            {formatCurrency(Math.abs(partner.balance))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {partner.balance > 0 ? (
                            <span className="flex items-center text-green-600">
                              <TrendingUp className="h-4 w-4 ml-1" />
                              دائن
                            </span>
                          ) : partner.balance < 0 ? (
                            <span className="flex items-center text-red-600">
                              <TrendingDown className="h-4 w-4 ml-1" />
                              مدين
                            </span>
                          ) : (
                            <span className="flex items-center text-gray-600">
                              <CheckCircle className="h-4 w-4 ml-1" />
                              متوازن
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Settlements Needed */}
            {settlementCalculations.settlements_needed.length > 0 && (
              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <AlertCircle className="ml-2 h-5 w-5 text-orange-600" />
                  التسويات المطلوبة
                </h3>
                <div className="space-y-2">
                  {settlementCalculations.settlements_needed.map((settlement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="text-sm">
                          <span className="font-medium">{settlement.from_partner_name}</span>
                          <span className="text-gray-600"> يدفع لـ </span>
                          <span className="font-medium">{settlement.to_partner_name}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-orange-600" />
                        <div className="text-lg font-bold text-orange-600">
                          {formatCurrency(settlement.amount)}
                        </div>
                      </div>
                      <button
                        onClick={() => createSettlement({
                          project_id: settlementCalculations.project_id,
                          from_partner_id: settlement.from_partner_id,
                          to_partner_id: settlement.to_partner_id,
                          amount: settlement.amount,
                          settlement_type: 'project',
                          settlement_date: new Date().toISOString().split('T')[0],
                          notes: 'تسوية تلقائية بناء على الحسابات'
                        })}
                        className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        إنشاء التسوية
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settlementCalculations.settlements_needed.length === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                  <p className="text-green-800">جميع الحسابات متوازنة ولا توجد تسويات مطلوبة</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settlements List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">سجل التسويات</h2>
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1 rounded ${activeTab === 'pending' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                معلقة ({settlements.filter(s => s.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1 rounded ${activeTab === 'completed' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                مكتملة ({settlements.filter(s => s.status === 'completed').length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded ${activeTab === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                الكل ({settlements.length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المشروع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  من
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  إلى
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  النوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSettlements.map(settlement => (
                <tr key={settlement.id}>
                  <td className="px-6 py-4 text-sm font-medium">
                    {settlement.project_name}
                    {settlement.phase_name && (
                      <span className="text-gray-500 text-xs block">
                        {settlement.phase_name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {settlement.from_partner_name}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {settlement.to_partner_name}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">
                    {formatCurrency(settlement.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {formatDate(settlement.settlement_date)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      settlement.settlement_type === 'phase' ? 'bg-purple-100 text-purple-700' :
                      settlement.settlement_type === 'project' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {settlement.settlement_type === 'phase' ? 'مرحلة' :
                       settlement.settlement_type === 'project' ? 'مشروع' : 'يدوي'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      settlement.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      settlement.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {settlement.status === 'pending' ? 'معلقة' :
                       settlement.status === 'completed' ? 'مكتملة' : 'ملغاة'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {settlement.status === 'pending' && (
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => updateSettlementStatus(settlement.id, 'completed')}
                          className="text-green-600 hover:text-green-800"
                          title="إكمال التسوية"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => updateSettlementStatus(settlement.id, 'cancelled')}
                          className="text-red-600 hover:text-red-800"
                          title="إلغاء التسوية"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSettlements.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              لا توجد تسويات {activeTab === 'pending' ? 'معلقة' : activeTab === 'completed' ? 'مكتملة' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}