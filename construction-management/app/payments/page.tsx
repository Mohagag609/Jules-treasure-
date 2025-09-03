'use client';

import Link from 'next/link';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <DollarSign className="ml-2 h-6 w-6" />
          إدارة المدفوعات
        </h1>
        <p className="text-gray-600 mt-2">
          إدارة جميع المدفوعات الواردة من الشركاء والصادرة للموردين
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/payments/partner">
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">مدفوعات الشركاء</h2>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600">
              تسجيل وإدارة المدفوعات الواردة من الشركاء إلى خزينة المشروع
            </p>
            <button className="mt-4 text-green-600 hover:text-green-700 font-medium">
              إدارة مدفوعات الشركاء ←
            </button>
          </div>
        </Link>

        <Link href="/payments/supplier">
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">مدفوعات الموردين</h2>
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingDown className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-600">
              تسجيل وإدارة المدفوعات الصادرة من خزينة المشروع للموردين
            </p>
            <button className="mt-4 text-orange-600 hover:text-orange-700 font-medium">
              إدارة مدفوعات الموردين ←
            </button>
          </div>
        </Link>
      </div>
    </div>
  );
}