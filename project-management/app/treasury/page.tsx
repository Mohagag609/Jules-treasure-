'use client';

import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TreasuryPage() {
  const [treasuryData] = useState([
    { id: 1, stage: 'الأساسات', balance: 85000, incoming: 150000, outgoing: 65000, status: 'positive' },
    { id: 2, stage: 'الأعمدة', balance: 45000, incoming: 100000, outgoing: 55000, status: 'positive' },
    { id: 3, stage: 'السقف', balance: -5000, incoming: 50000, outgoing: 55000, status: 'negative' },
    { id: 4, stage: 'التشطيبات', balance: 120000, incoming: 200000, outgoing: 80000, status: 'positive' }
  ]);

  const totalBalance = treasuryData.reduce((sum, t) => sum + t.balance, 0);
  const totalIncoming = treasuryData.reduce((sum, t) => sum + t.incoming, 0);
  const totalOutgoing = treasuryData.reduce((sum, t) => sum + t.outgoing, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3">
          <Wallet className="w-8 h-8 text-cyan-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">الخزينة</h1>
            <p className="text-gray-500">إدارة أرصدة المراحل والخزينة العامة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`rounded-xl p-6 ${totalBalance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                الرصيد الإجمالي
              </p>
              <p className="text-3xl font-bold mt-2">
                {totalBalance.toLocaleString('ar-EG')} جنيه
              </p>
            </div>
            {totalBalance >= 0 ? 
              <CheckCircle className="w-8 h-8 text-green-600" /> :
              <AlertTriangle className="w-8 h-8 text-red-600" />
            }
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm">إجمالي الوارد</p>
              <p className="text-2xl font-bold mt-2">
                {totalIncoming.toLocaleString('ar-EG')} جنيه
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm">إجمالي الصادر</p>
              <p className="text-2xl font-bold mt-2">
                {totalOutgoing.toLocaleString('ar-EG')} جنيه
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm">عدد المراحل</p>
              <p className="text-2xl font-bold mt-2">{treasuryData.length}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold">أرصدة المراحل</h2>
        </div>
        
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right">المرحلة</th>
              <th className="px-6 py-3 text-right">الوارد</th>
              <th className="px-6 py-3 text-right">الصادر</th>
              <th className="px-6 py-3 text-right">الرصيد</th>
              <th className="px-6 py-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {treasuryData.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold">{item.stage}</td>
                <td className="px-6 py-4">
                  <span className="text-green-600 font-medium">
                    +{item.incoming.toLocaleString('ar-EG')} جنيه
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-red-600 font-medium">
                    -{item.outgoing.toLocaleString('ar-EG')} جنيه
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-bold text-lg ${item.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.balance.toLocaleString('ar-EG')} جنيه
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.balance >= 0 ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      إيجابي
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      سالب
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-bold text-yellow-800">تنبيه</p>
            <p className="text-yellow-700 text-sm mt-1">
              يوجد رصيد سالب في مرحلة "السقف" يحتاج إلى معالجة عاجلة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}