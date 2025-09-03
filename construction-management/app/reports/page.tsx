'use client';

import { BarChart3, FileText, Download, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    {
      title: 'تقرير المدفوعات للموردين',
      description: 'عرض جميع المدفوعات للموردين مع تفاصيل البنود والمواد',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'تقرير الخزينة',
      description: 'حالة الخزينة مع المبالغ الداخلة والخارجة',
      icon: BarChart3,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'تقرير التسويات',
      description: 'التسويات بين الشركاء والمبالغ المستحقة',
      icon: Calendar,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'تقرير شامل للمشروع',
      description: 'تقرير مفصل عن المشروع بجميع تفاصيله',
      icon: Download,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="ml-2 h-6 w-6" />
          التقارير المالية
        </h1>
        <p className="text-gray-600 mt-2">
          تقارير شاملة عن جميع العمليات المالية والإدارية في المشاريع
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report, index) => (
          <div key={index} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
            <div className="flex items-start">
              <div className={`p-3 rounded-full ${report.color} ml-4`}>
                <report.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  عرض التقرير ←
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>ملاحظة:</strong> يمكنك تصدير جميع التقارير بصيغة PDF أو Excel للطباعة أو المشاركة
        </p>
      </div>
    </div>
  );
}