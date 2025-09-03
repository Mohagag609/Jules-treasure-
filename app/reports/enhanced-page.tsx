'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building,
  Layers,
  PieChart,
  BarChart3,
  Printer,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportData {
  projects: {
    total: number;
    active: number;
    completed: number;
    totalCost: number;
    totalTreasuryBalance: number;
  };
  partners: {
    total: number;
    totalDue: number;
    totalPaid: number;
    topPartners: {
      name: string;
      totalInvestment: number;
      projectsCount: number;
    }[];
  };
  suppliers: {
    total: number;
    totalDue: number;
    totalPaid: number;
    topSuppliers: {
      name: string;
      totalPayments: number;
      projectsCount: number;
    }[];
  };
  phases: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    totalRequired: number;
    totalPaid: number;
  };
  treasury: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    recentTransactions: {
      date: string;
      type: 'income' | 'expense';
      amount: number;
      description: string;
      project: string;
    }[];
  };
  settlements: {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
  };
}

export default function EnhancedReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('summary');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedProject, setSelectedProject] = useState('all');
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
    fetchProjects();
  }, [dateRange, selectedProject]);

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

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // جلب البيانات من مختلف APIs
      const [projectsRes, partnersRes, suppliersRes, phasesRes, settlementsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/partners'),
        fetch('/api/suppliers'),
        fetch('/api/phases?project_id=all'),
        fetch('/api/settlements')
      ]);

      const projectsData = await projectsRes.json();
      const partnersData = await partnersRes.json();
      const suppliersData = await suppliersRes.json();
      const phasesData = await phasesRes.json();
      const settlementsData = await settlementsRes.json();

      // معالجة البيانات وحساب الإحصائيات
      const reportData: ReportData = {
        projects: {
          total: projectsData.length,
          active: projectsData.filter((p: any) => p.status === 'active').length,
          completed: projectsData.filter((p: any) => p.status === 'completed').length,
          totalCost: projectsData.reduce((sum: number, p: any) => sum + (p.total_cost || 0), 0),
          totalTreasuryBalance: projectsData.reduce((sum: number, p: any) => sum + (p.treasury_balance || 0), 0)
        },
        partners: {
          total: partnersData.length,
          totalDue: 0, // سيتم حسابها من بيانات project_partners
          totalPaid: 0,
          topPartners: []
        },
        suppliers: {
          total: suppliersData.length,
          totalDue: 0, // سيتم حسابها من بيانات phase_suppliers
          totalPaid: 0,
          topSuppliers: []
        },
        phases: {
          total: phasesData.length,
          pending: phasesData.filter((p: any) => p.status === 'pending').length,
          inProgress: phasesData.filter((p: any) => p.status === 'in_progress').length,
          completed: phasesData.filter((p: any) => p.status === 'completed').length,
          totalRequired: phasesData.reduce((sum: number, p: any) => sum + (p.amount_required || 0), 0),
          totalPaid: phasesData.reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0)
        },
        treasury: {
          totalIncome: 0,
          totalExpense: 0,
          netBalance: 0,
          recentTransactions: []
        },
        settlements: {
          total: settlementsData.length,
          pending: settlementsData.filter((s: any) => s.status === 'pending').length,
          completed: settlementsData.filter((s: any) => s.status === 'completed').length,
          totalAmount: settlementsData.reduce((sum: number, s: any) => sum + (s.amount || 0), 0)
        }
      };

      setReportData(reportData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('فشل في جلب بيانات التقارير');
    } finally {
      setLoading(false);
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

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const exportReport = (format: 'pdf' | 'excel') => {
    // TODO: Implement export functionality
    toast.success(`سيتم تصدير التقرير بصيغة ${format === 'pdf' ? 'PDF' : 'Excel'}`);
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">لا توجد بيانات للعرض</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">التقارير المالية</h1>
            <p className="text-gray-600 mt-1">تقارير شاملة عن جميع المشاريع والعمليات المالية</p>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={() => exportReport('pdf')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            >
              <Download className="ml-2 h-4 w-4" />
              PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <Download className="ml-2 h-4 w-4" />
              Excel
            </button>
            <button
              onClick={printReport}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
            >
              <Printer className="ml-2 h-4 w-4" />
              طباعة
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Filter className="ml-2 h-5 w-5 text-gray-600" />
          فلترة التقارير
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع التقرير
            </label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="summary">ملخص عام</option>
              <option value="projects">تقرير المشاريع</option>
              <option value="partners">تقرير الشركاء</option>
              <option value="suppliers">تقرير الموردين</option>
              <option value="treasury">تقرير الخزينة</option>
              <option value="settlements">تقرير التسويات</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المشروع
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع المشاريع</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفترة الزمنية
            </label>
            <div className="flex space-x-2 space-x-reverse">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="self-center">إلى</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {selectedReport === 'summary' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Projects Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold">{reportData.projects.total}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">المشاريع</h3>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">نشط:</span>
                  <span className="text-green-600">{reportData.projects.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">مكتمل:</span>
                  <span className="text-blue-600">{reportData.projects.completed}</span>
                </div>
              </div>
            </div>

            {/* Phases Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Layers className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-2xl font-bold">{reportData.phases.total}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">المراحل</h3>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">قيد التنفيذ:</span>
                  <span className="text-orange-600">{reportData.phases.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">مكتملة:</span>
                  <span className="text-green-600">{reportData.phases.completed}</span>
                </div>
              </div>
            </div>

            {/* Partners Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold">{reportData.partners.total}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">الشركاء</h3>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">إجمالي المستحق:</span>
                  <span className="text-red-600">{formatCurrency(reportData.partners.totalDue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">إجمالي المدفوع:</span>
                  <span className="text-green-600">{formatCurrency(reportData.partners.totalPaid)}</span>
                </div>
              </div>
            </div>

            {/* Treasury Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-indigo-600" />
                </div>
                <span className="text-xl font-bold">
                  {formatCurrency(reportData.projects.totalTreasuryBalance)}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">رصيد الخزينة</h3>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">إجمالي التكلفة:</span>
                  <span className="text-blue-600">{formatCurrency(reportData.projects.totalCost)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="ml-2 h-5 w-5 text-blue-600" />
              النظرة المالية العامة
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Income vs Expense */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">المقبوضات مقابل المدفوعات</h3>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">المقبوضات</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(reportData.treasury.totalIncome)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">المدفوعات</span>
                      <span className="text-red-600 font-medium">
                        {formatCurrency(reportData.treasury.totalExpense)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{width: '40%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phases Progress */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">تقدم المراحل</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">المطلوب</span>
                    <span className="font-medium">{formatCurrency(reportData.phases.totalRequired)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">المدفوع</span>
                    <span className="text-green-600 font-medium">{formatCurrency(reportData.phases.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">المتبقي</span>
                    <span className="text-orange-600 font-medium">
                      {formatCurrency(reportData.phases.totalRequired - reportData.phases.totalPaid)}
                    </span>
                  </div>
                  <div className="pt-2">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full"
                        style={{
                          width: `${(reportData.phases.totalPaid / reportData.phases.totalRequired) * 100}%`
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-center mt-1 text-gray-600">
                      {formatPercentage(reportData.phases.totalPaid, reportData.phases.totalRequired)} مكتمل
                    </p>
                  </div>
                </div>
              </div>

              {/* Settlements Status */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">حالة التسويات</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">إجمالي التسويات</span>
                    <span className="font-medium">{reportData.settlements.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">معلقة</span>
                    <span className="text-orange-600 font-medium">{reportData.settlements.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">مكتملة</span>
                    <span className="text-green-600 font-medium">{reportData.settlements.completed}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">إجمالي المبلغ</span>
                      <span className="text-blue-600 font-bold">
                        {formatCurrency(reportData.settlements.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="ml-2 h-5 w-5 text-green-600" />
              آخر العمليات المالية
            </h2>
            
            {reportData.treasury.recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        التاريخ
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        النوع
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        المبلغ
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        الوصف
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        المشروع
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.treasury.recentTransactions.map((transaction, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {transaction.type === 'income' ? (
                            <span className="flex items-center text-green-600">
                              <TrendingUp className="h-4 w-4 ml-1" />
                              قبض
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600">
                              <TrendingDown className="h-4 w-4 ml-1" />
                              صرف
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {transaction.description}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {transaction.project}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p>لا توجد عمليات مالية حديثة</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Other Report Types */}
      {selectedReport !== 'summary' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            {selectedReport === 'projects' && 'تقرير المشاريع التفصيلي'}
            {selectedReport === 'partners' && 'تقرير الشركاء التفصيلي'}
            {selectedReport === 'suppliers' && 'تقرير الموردين التفصيلي'}
            {selectedReport === 'treasury' && 'تقرير الخزينة التفصيلي'}
            {selectedReport === 'settlements' && 'تقرير التسويات التفصيلي'}
          </h2>
          
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>سيتم عرض تقرير {selectedReport === 'projects' ? 'المشاريع' :
                selectedReport === 'partners' ? 'الشركاء' :
                selectedReport === 'suppliers' ? 'الموردين' :
                selectedReport === 'treasury' ? 'الخزينة' :
                'التسويات'} التفصيلي هنا</p>
          </div>
        </div>
      )}
    </div>
  );
}