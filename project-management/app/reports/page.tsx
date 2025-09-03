'use client';

import { useState } from 'react';
import { FileText, Download, Printer, Calendar, Filter, BarChart3, PieChart, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('summary');
  const [dateRange, setDateRange] = useState({ from: '2024-01-01', to: '2024-12-31' });

  const reports = [
    { id: 'summary', name: 'تقرير إجمالي', icon: BarChart3, color: 'blue' },
    { id: 'stages', name: 'تقرير المراحل', icon: PieChart, color: 'green' },
    { id: 'partners', name: 'تقرير الشركاء', icon: TrendingUp, color: 'orange' },
    { id: 'financial', name: 'التقرير المالي', icon: FileText, color: 'purple' }
  ];

  const summaryData = {
    totalProjects: 5,
    totalPartners: 12,
    totalSuppliers: 8,
    totalRevenue: 850000,
    totalExpenses: 620000,
    netProfit: 230000,
    completedStages: 15,
    activeStages: 8,
    pendingSettlements: 3
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">التقارير</h1>
            <p className="text-gray-500 mt-1">تقارير شاملة ومفصلة عن المشروع</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
              <Printer className="w-4 h-4" />
              طباعة
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              تصدير PDF
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            />
            <span className="text-gray-500">إلى</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Filter className="w-4 h-4" />
            تطبيق الفلتر
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {reports.map(report => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-4 rounded-xl transition ${
              selectedReport === report.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white hover:shadow-md'
            }`}
          >
            <report.icon className={`w-8 h-8 mb-2 ${
              selectedReport === report.id ? 'text-white' : `text-${report.color}-600`
            }`} />
            <p className="font-bold">{report.name}</p>
          </button>
        ))}
      </div>

      {selectedReport === 'summary' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">التقرير الإجمالي</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-600 text-sm">إجمالي المشاريع</p>
              <p className="text-2xl font-bold mt-1">{summaryData.totalProjects}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-600 text-sm">عدد الشركاء</p>
              <p className="text-2xl font-bold mt-1">{summaryData.totalPartners}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-orange-600 text-sm">عدد الموردين</p>
              <p className="text-2xl font-bold mt-1">{summaryData.totalSuppliers}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-purple-600 text-sm">الإيرادات</p>
              <p className="text-2xl font-bold mt-1">{summaryData.totalRevenue.toLocaleString('ar-EG')} جنيه</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-red-600 text-sm">المصروفات</p>
              <p className="text-2xl font-bold mt-1">{summaryData.totalExpenses.toLocaleString('ar-EG')} جنيه</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-green-600 text-sm">صافي الربح</p>
              <p className="text-2xl font-bold mt-1">{summaryData.netProfit.toLocaleString('ar-EG')} جنيه</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-bold mb-4">حالة المراحل</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{summaryData.completedStages}</p>
                <p className="text-sm text-gray-500">مكتملة</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{summaryData.activeStages}</p>
                <p className="text-sm text-gray-500">نشطة</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{summaryData.pendingSettlements}</p>
                <p className="text-sm text-gray-500">تسويات معلقة</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'stages' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">تقرير المراحل التفصيلي</h2>
          <p className="text-gray-500">عرض تفصيلي لجميع المراحل ونسب الإنجاز...</p>
        </div>
      )}

      {selectedReport === 'partners' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">تقرير الشركاء</h2>
          <p className="text-gray-500">تفاصيل مساهمات وأرصدة جميع الشركاء...</p>
        </div>
      )}

      {selectedReport === 'financial' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">التقرير المالي الشامل</h2>
          <p className="text-gray-500">تحليل مالي مفصل للإيرادات والمصروفات...</p>
        </div>
      )}
    </div>
  );
}