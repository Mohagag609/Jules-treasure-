'use client';

import { useState } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, Calendar, User, FileText } from 'lucide-react';

export default function PaymentsPage() {
  const [payments] = useState([
    { id: 1, type: 'من شريك', name: 'أحمد محمد', amount: 50000, date: '2024-03-15', stage: 'الأساسات', description: 'دفعة أولى' },
    { id: 2, type: 'إلى مورد', name: 'شركة الحديد', amount: 25000, date: '2024-03-14', stage: 'الأساسات', description: 'شراء حديد' },
    { id: 3, type: 'من شريك', name: 'محمد علي', amount: 35000, date: '2024-03-13', stage: 'الأعمدة', description: 'دفعة ثانية' },
    { id: 4, type: 'إلى مورد', name: 'مورد الأسمنت', amount: 15000, date: '2024-03-12', stage: 'الأساسات', description: 'شراء أسمنت' },
    { id: 5, type: 'من شريك', name: 'علي حسن', amount: 40000, date: '2024-03-11', stage: 'التشطيبات', description: 'دفعة أولى' }
  ]);

  const totalIncoming = payments.filter(p => p.type === 'من شريك').reduce((sum, p) => sum + p.amount, 0);
  const totalOutgoing = payments.filter(p => p.type === 'إلى مورد').reduce((sum, p) => sum + p.amount, 0);
  const balance = totalIncoming - totalOutgoing;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900">سجل المدفوعات</h1>
        <p className="text-gray-500 mt-1">جميع المدفوعات الواردة والصادرة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">المدفوعات الواردة</p>
              <p className="text-2xl font-bold mt-2">{totalIncoming.toLocaleString('ar-EG')} جنيه</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-red-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm">المدفوعات الصادرة</p>
              <p className="text-2xl font-bold mt-2">{totalOutgoing.toLocaleString('ar-EG')} جنيه</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm">الرصيد الحالي</p>
              <p className="text-2xl font-bold mt-2">{balance.toLocaleString('ar-EG')} جنيه</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
            <Plus className="w-4 h-4" />
            إضافة دفعة جديدة
          </button>
        </div>
        
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right">النوع</th>
              <th className="px-6 py-3 text-right">الاسم</th>
              <th className="px-6 py-3 text-right">المبلغ</th>
              <th className="px-6 py-3 text-right">المرحلة</th>
              <th className="px-6 py-3 text-right">التاريخ</th>
              <th className="px-6 py-3 text-right">الوصف</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map(payment => (
              <tr key={payment.id}>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payment.type === 'من شريك' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {payment.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">{payment.name}</td>
                <td className="px-6 py-4 font-bold">{payment.amount.toLocaleString('ar-EG')} جنيه</td>
                <td className="px-6 py-4">{payment.stage}</td>
                <td className="px-6 py-4">{payment.date}</td>
                <td className="px-6 py-4 text-gray-500">{payment.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}