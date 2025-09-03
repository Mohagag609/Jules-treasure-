'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRight, 
  Building, 
  Calendar, 
  DollarSign, 
  Users, 
  Layers,
  Plus,
  Edit
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProjectDetails {
  id: number;
  name: string;
  start_date: string;
  end_date?: string;
  treasury_balance: number;
  status: string;
  phases: any[];
  partners: any[];
  treasuryLogs: any[];
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('فشل في جلب تفاصيل المشروع');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-EG');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">المشروع غير موجود</p>
        <Link href="/projects">
          <button className="mt-4 text-blue-600 hover:underline">
            العودة إلى قائمة المشاريع
          </button>
        </Link>
      </div>
    );
  }

  const totalPartnerPercentage = project.partners.reduce((sum, p) => sum + p.percentage, 0);
  const totalPhasesRequired = project.phases.reduce((sum, p) => sum + p.amount_required, 0);
  const totalPhasesPaid = project.phases.reduce((sum, p) => sum + p.amount_paid, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-2">
              <Link href="/projects">
                <button className="text-gray-500 hover:text-gray-700 ml-3">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Building className="ml-2 h-6 w-6" />
                {project.name}
              </h1>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
              <span className="flex items-center">
                <Calendar className="ml-1 h-4 w-4" />
                {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : 'مستمر'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                project.status === 'active' ? 'bg-green-100 text-green-800' : 
                project.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {project.status === 'active' ? 'نشط' : 
                 project.status === 'completed' ? 'مكتمل' : 'متوقف'}
              </span>
            </div>
          </div>
          <Link href={`/projects/${project.id}/edit`}>
            <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Edit className="ml-2 h-4 w-4" />
              تعديل
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">رصيد الخزينة</p>
          <p className={`text-xl font-bold ${project.treasury_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(project.treasury_balance)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">عدد المراحل</p>
          <p className="text-xl font-bold text-gray-900">{project.phases.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">عدد الشركاء</p>
          <p className="text-xl font-bold text-gray-900">{project.partners.length}</p>
          <p className="text-xs text-gray-500">{totalPartnerPercentage}% محجوز</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">التقدم المالي</p>
          <p className="text-xl font-bold text-gray-900">
            {totalPhasesRequired > 0 ? Math.round((totalPhasesPaid / totalPhasesRequired) * 100) : 0}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${totalPhasesRequired > 0 ? (totalPhasesPaid / totalPhasesRequired) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['overview', 'phases', 'partners', 'treasury'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'overview' && 'نظرة عامة'}
                {tab === 'phases' && `المراحل (${project.phases.length})`}
                {tab === 'partners' && `الشركاء (${project.partners.length})`}
                {tab === 'treasury' && 'الخزينة'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">ملخص مالي</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">إجمالي المطلوب:</dt>
                      <dd className="font-medium">{formatCurrency(totalPhasesRequired)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">إجمالي المدفوع:</dt>
                      <dd className="font-medium text-green-600">{formatCurrency(totalPhasesPaid)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">المتبقي:</dt>
                      <dd className="font-medium text-orange-600">
                        {formatCurrency(totalPhasesRequired - totalPhasesPaid)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">معلومات المشروع</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">تاريخ البدء:</dt>
                      <dd className="font-medium">{formatDate(project.start_date)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">تاريخ الانتهاء:</dt>
                      <dd className="font-medium">
                        {project.end_date ? formatDate(project.end_date) : 'غير محدد'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">الحالة:</dt>
                      <dd className="font-medium">
                        {project.status === 'active' ? 'نشط' : 
                         project.status === 'completed' ? 'مكتمل' : 'متوقف'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Phases Tab */}
          {activeTab === 'phases' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">مراحل المشروع</h3>
                <div className="flex space-x-2 space-x-reverse">
                  <Link href="/phases">
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
                      عرض كل المراحل
                    </button>
                  </Link>
                  <Link href={`/phases?project_id=${project.id}`}>
                    <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      <Plus className="ml-1 h-4 w-4" />
                      إضافة مرحلة
                    </button>
                  </Link>
                </div>
              </div>
              {project.phases.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد مراحل مضافة بعد</p>
              ) : (
                <div className="space-y-3">
                  {project.phases.map((phase) => (
                    <div key={phase.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={`/projects/${project.id}/phases/${phase.id}`}>
                            <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                              {phase.name}
                            </h4>
                          </Link>
                          <p className="text-sm text-gray-600 mt-1">
                            المطلوب: {formatCurrency(phase.amount_required)} | 
                            المدفوع: {formatCurrency(phase.amount_paid)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                          phase.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {phase.status === 'completed' ? 'مكتملة' :
                           phase.status === 'in_progress' ? 'قيد التنفيذ' : 'معلقة'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(phase.amount_paid / phase.amount_required) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between">
                        <Link href={`/projects/${project.id}/phases/${phase.id}`}>
                          <button className="text-sm text-blue-600 hover:underline">
                            عرض التفاصيل ←
                          </button>
                        </Link>
                        {phase.suppliers && phase.suppliers.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {phase.suppliers.length} موردين
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Partners Tab */}
          {activeTab === 'partners' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">شركاء المشروع</h3>
                <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                  <Plus className="ml-1 h-4 w-4" />
                  إضافة شريك
                </button>
              </div>
              {project.partners.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا يوجد شركاء مضافين بعد</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">الشريك</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">النسبة</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">المستحق</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">المدفوع</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">المتبقي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {project.partners.map((partner) => (
                        <tr key={partner.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {partner.partner_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {partner.percentage}%
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatCurrency(partner.amount_due)}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-600">
                            {formatCurrency(partner.amount_paid)}
                          </td>
                          <td className="px-4 py-3 text-sm text-orange-600">
                            {formatCurrency(partner.amount_due - partner.amount_paid)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Treasury Tab */}
          {activeTab === 'treasury' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">رصيد الخزينة الحالي</h3>
                <p className={`text-3xl font-bold ${project.treasury_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(project.treasury_balance)}
                </p>
              </div>
              
              <h3 className="text-lg font-semibold mb-3">آخر الحركات</h3>
              {project.treasuryLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">لا توجد حركات مالية بعد</p>
              ) : (
                <div className="space-y-2">
                  {project.treasuryLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {log.description || (log.transaction_type === 'income' ? 'إيداع' : 'سحب')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(log.transaction_date).toLocaleString('ar-EG')}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-bold ${
                          log.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {log.transaction_type === 'income' ? '+' : '-'} {formatCurrency(log.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          الرصيد: {formatCurrency(log.balance_after)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}