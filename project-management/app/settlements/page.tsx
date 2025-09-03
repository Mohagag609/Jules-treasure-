'use client';

import { useState } from 'react';
import { HandshakeIcon, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

export default function SettlementsPage() {
  const [settlements] = useState([
    { 
      id: 1, 
      from: 'محمد علي', 
      to: 'أحمد محمد', 
      amount: 15000, 
      stage: 'الأساسات',
      status: 'مكتملة',
      date: '2024-03-15',
      reason: 'تسوية فرق المدفوعات'
    },
    { 
      id: 2, 
      from: 'علي حسن', 
      to: 'محمد علي', 
      amount: 8000, 
      stage: 'الأعمدة',
      status: 'معلقة',
      date: '2024-03-14',
      reason: 'تسوية نسبة المشاركة'
    },
    { 
      id: 3, 
      from: 'أحمد محمد', 
      to: 'علي حسن', 
      amount: 12000, 
      stage: 'التشطيبات',
      status: 'قيد المراجعة',
      date: '2024-03-13',
      reason: 'تسوية تلقائية'
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'مكتملة':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-3 h-3" />
            {status}
          </span>
        );
      case 'معلقة':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            <AlertCircle className="w-3 h-3" />
            {status}
          </span>
        );
      case 'قيد المراجعة':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <Clock className="w-3 h-3" />
            {status}
          </span>
        );
      default:
        return null;
    }
  };

  const totalSettlements = settlements.reduce((sum, s) => sum + s.amount, 0);
  const completedCount = settlements.filter(s => s.status === 'مكتملة').length;
  const pendingCount = settlements.filter(s => s.status === 'معلقة').length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3">
          <HandshakeIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">التسويات</h1>
            <p className="text-gray-500">إدارة التسويات بين الشركاء</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">إجمالي التسويات</p>
          <p className="text-2xl font-bold mt-2">{totalSettlements.toLocaleString('ar-EG')} جنيه</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">عدد التسويات</p>
          <p className="text-2xl font-bold mt-2">{settlements.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-green-600 text-sm">المكتملة</p>
          <p className="text-2xl font-bold mt-2">{completedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-red-600 text-sm">المعلقة</p>
          <p className="text-2xl font-bold mt-2">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold">سجل التسويات</h2>
        </div>
        
        <div className="divide-y">
          {settlements.map(settlement => (
            <div key={settlement.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">من</p>
                    <p className="font-bold">{settlement.from}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                  <div className="text-center">
                    <p className="text-sm text-gray-500">إلى</p>
                    <p className="font-bold">{settlement.to}</p>
                  </div>
                </div>
                
                <div className="text-left">
                  <p className="text-2xl font-bold text-blue-600">
                    {settlement.amount.toLocaleString('ar-EG')} جنيه
                  </p>
                  <p className="text-sm text-gray-500">{settlement.stage}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  {getStatusBadge(settlement.status)}
                  <span className="text-sm text-gray-500">{settlement.reason}</span>
                </div>
                <span className="text-sm text-gray-400">{settlement.date}</span>
              </div>
              
              {settlement.status === 'معلقة' && (
                <div className="mt-4 flex gap-2">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">
                    تأكيد التسوية
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                    رفض
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}