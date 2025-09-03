'use client';

import { Building, Users, Calculator } from 'lucide-react';

export default function SettlementsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Building className="ml-2 h-6 w-6" />
          التسويات بين الشركاء
        </h1>
        <p className="text-gray-600 mt-2">
          إدارة التسويات المالية بين الشركاء بناءً على نسب المساهمة والمدفوعات الفعلية
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">كيفية عمل التسويات:</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>يتم حساب المبلغ المستحق لكل شريك بناءً على نسبته في المشروع</li>
          <li>مقارنة المدفوعات الفعلية مع المبالغ المستحقة</li>
          <li>إذا دفع شريك أكثر من حصته، يتم تعويضه من الشركاء الآخرين</li>
          <li>إذا دفع شريك أقل من حصته، يتم مطالبته بتسوية الفارق</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-center text-gray-500 py-8">
          قريباً: نظام التسويات التلقائي بين الشركاء
        </p>
      </div>
    </div>
  );
}