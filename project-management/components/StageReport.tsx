'use client';

import { useState, useEffect } from 'react';
import { FileText, Users, Truck, DollarSign, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';

interface StageReportProps {
  stageId: number;
}

export default function StageReport({ stageId }: StageReportProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [stageId]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/stages/${stageId}/report`);
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return <div className="text-center text-gray-500">لا توجد بيانات</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* معلومات المرحلة */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-8 h-8" />
          <h2 className="text-2xl font-bold">تقرير المرحلة: {report.stage?.name}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-blue-100">إجمالي المرحلة</p>
            <p className="text-2xl font-bold">{report.stage?.total_amount?.toLocaleString('ar-EG')} جنيه</p>
          </div>
          <div>
            <p className="text-blue-100">المبلغ المتبقي</p>
            <p className="text-2xl font-bold">{report.stage?.remaining_amount?.toLocaleString('ar-EG')} جنيه</p>
          </div>
          <div>
            <p className="text-blue-100">رصيد الخزينة</p>
            <p className="text-2xl font-bold">{report.treasury?.balance?.toLocaleString('ar-EG')} جنيه</p>
          </div>
        </div>
      </div>

      {/* أرصدة الشركاء */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          أرصدة الشركاء والتسويات
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right">الشريك</th>
                <th className="px-4 py-3 text-right">النسبة</th>
                <th className="px-4 py-3 text-right">المستحق</th>
                <th className="px-4 py-3 text-right">المدفوع</th>
                <th className="px-4 py-3 text-right">الفرق</th>
                <th className="px-4 py-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.balances?.map((balance: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{balance.partner_name}</td>
                  <td className="px-4 py-3">
                    {report.partners?.find((p: any) => p.partner_id === balance.partner_id)?.percentage}%
                  </td>
                  <td className="px-4 py-3">{balance.expected_payment?.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3">{balance.actual_payment?.toLocaleString('ar-EG')}</td>
                  <td className="px-4 py-3">
                    <span className={balance.difference > 0 ? 'text-green-600' : balance.difference < 0 ? 'text-red-600' : 'text-gray-600'}>
                      {Math.abs(balance.difference)?.toLocaleString('ar-EG')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                      ${balance.status === 'overpaid' ? 'bg-green-100 text-green-800' : 
                        balance.status === 'underpaid' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {balance.status === 'overpaid' ? (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          دفع زيادة
                        </>
                      ) : balance.status === 'underpaid' ? (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          دفع أقل
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          متوازن
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* سجل المدفوعات */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* مدفوعات من الشركاء */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            مدفوعات من الشركاء
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {report.payments?.filter((p: any) => p.payment_type === 'from_partner').map((payment: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded">
                <div>
                  <p className="font-medium">{payment.partner_name}</p>
                  <p className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleDateString('ar-EG')}</p>
                </div>
                <p className="font-bold text-green-600">{payment.amount?.toLocaleString('ar-EG')} جنيه</p>
              </div>
            ))}
          </div>
        </div>

        {/* مدفوعات للموردين */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-red-600" />
            مدفوعات للموردين
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {report.payments?.filter((p: any) => p.payment_type === 'to_supplier').map((payment: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded">
                <div>
                  <p className="font-medium">{payment.supplier_name}</p>
                  <p className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleDateString('ar-EG')}</p>
                </div>
                <p className="font-bold text-red-600">{payment.amount?.toLocaleString('ar-EG')} جنيه</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* التسويات */}
      {report.settlements?.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold mb-4">التسويات بين الشركاء</h3>
          <div className="space-y-2">
            {report.settlements.map((settlement: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <div>
                  <p className="font-medium">
                    من {settlement.from_partner_name} إلى {settlement.to_partner_name}
                  </p>
                  <p className="text-xs text-gray-500">{settlement.description}</p>
                </div>
                <p className="font-bold text-yellow-600">{settlement.amount?.toLocaleString('ar-EG')} جنيه</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}