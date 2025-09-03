'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRight, 
  Layers, 
  Truck, 
  Plus, 
  DollarSign,
  Package,
  Edit,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Phase {
  id: number;
  project_id: number;
  name: string;
  amount_required: number;
  amount_paid: number;
  status: string;
  start_date?: string;
  end_date?: string;
}

interface PhaseSupplier {
  id: number;
  supplier_id: number;
  supplier_name: string;
  amount_due: number;
  amount_paid: number;
  phone?: string;
  email?: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

export default function PhaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [phaseSuppliers, setPhaseSuppliers] = useState<PhaseSupplier[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: '',
    amount_due: ''
  });

  useEffect(() => {
    fetchData();
  }, [params.id, params.phaseId]);

  const fetchData = async () => {
    try {
      // جلب معلومات المشروع
      const projectResponse = await fetch(`/api/projects/${params.id}`);
      if (!projectResponse.ok) throw new Error('Failed to fetch project');
      const projectData = await projectResponse.json();
      setProject(projectData);

      // جلب معلومات المرحلة
      const phasesResponse = await fetch(`/api/phases?project_id=${params.id}`);
      if (!phasesResponse.ok) throw new Error('Failed to fetch phases');
      const phasesData = await phasesResponse.json();
      const currentPhase = phasesData.find((p: Phase) => p.id === parseInt(params.phaseId as string));
      
      if (currentPhase) {
        setPhase(currentPhase);
        setPhaseSuppliers(currentPhase.suppliers || []);
      }

      // جلب جميع الموردين
      const suppliersResponse = await fetch('/api/suppliers');
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        setAllSuppliers(suppliersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id || !formData.amount_due) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    try {
      const response = await fetch('/api/phase-suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phase_id: params.phaseId,
          supplier_id: formData.supplier_id,
          amount_due: parseFloat(formData.amount_due)
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add supplier');
      }

      toast.success('تم إضافة المورد بنجاح');
      setShowAddSupplierModal(false);
      setFormData({ supplier_id: '', amount_due: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error adding supplier:', error);
      toast.error(error.message || 'فشل في إضافة المورد');
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
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!phase || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">المرحلة غير موجودة</p>
        <Link href={`/projects/${params.id}`}>
          <button className="mt-4 text-blue-600 hover:underline">
            العودة إلى المشروع
          </button>
        </Link>
      </div>
    );
  }

  const progress = phase.amount_required > 0 ? (phase.amount_paid / phase.amount_required) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-2">
              <Link href={`/projects/${params.id}`}>
                <button className="text-gray-500 hover:text-gray-700 ml-3">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Layers className="ml-2 h-6 w-6" />
                  {phase.name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  المشروع: {project.name}
                </p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <Link href={`/projects/${params.id}/phases/${params.phaseId}/edit`}>
              <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                <Edit className="ml-2 h-4 w-4" />
                تعديل
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">المبلغ المطلوب</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(phase.amount_required)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">المبلغ المدفوع</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(phase.amount_paid)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">المتبقي</p>
          <p className="text-xl font-bold text-orange-600">
            {formatCurrency(phase.amount_required - phase.amount_paid)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">نسبة الإنجاز</p>
          <p className="text-xl font-bold text-blue-600">
            {Math.round(progress)}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Suppliers Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center">
              <Truck className="ml-2 h-5 w-5" />
              الموردين في هذه المرحلة
            </h2>
            <button 
              onClick={() => setShowAddSupplierModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="ml-2 h-4 w-4" />
              إضافة مورد
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {phaseSuppliers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              لا يوجد موردين مضافين لهذه المرحلة
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {phaseSuppliers.map((supplier) => (
                <div key={supplier.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {supplier.supplier_name}
                      </h3>
                      {supplier.phone && (
                        <p className="text-sm text-gray-600">📞 {supplier.phone}</p>
                      )}
                    </div>
                    <Link href={`/payments/supplier?phase_id=${params.phaseId}&supplier_id=${supplier.supplier_id}`}>
                      <button className="text-blue-600 hover:text-blue-700">
                        <DollarSign className="h-5 w-5" />
                      </button>
                    </Link>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المستحق:</span>
                      <span className="font-medium">{formatCurrency(supplier.amount_due)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المدفوع:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(supplier.amount_paid)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">المتبقي:</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(supplier.amount_due - supplier.amount_paid)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t flex justify-between">
                    <Link href={`/suppliers/${supplier.supplier_id}`}>
                      <button className="text-sm text-blue-600 hover:underline">
                        عرض التفاصيل
                      </button>
                    </Link>
                    {supplier.amount_paid === 0 && (
                      <button className="text-sm text-red-600 hover:underline">
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              إضافة مورد للمرحلة
            </h2>
            
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المورد *
                </label>
                <select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر المورد</option>
                  {allSuppliers
                    .filter(s => !phaseSuppliers.some(ps => ps.supplier_id === s.id))
                    .map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المبلغ المستحق *
                </label>
                <input
                  type="number"
                  value={formData.amount_due}
                  onChange={(e) => setFormData({...formData, amount_due: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSupplierModal(false);
                    setFormData({ supplier_id: '', amount_due: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  إضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}