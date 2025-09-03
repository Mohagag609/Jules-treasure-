'use client';

import { useState } from 'react';
import { Layers } from 'lucide-react';

export default function PhasesPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Layers className="ml-2 h-6 w-6" />
          إدارة المراحل
        </h1>
        <p className="text-gray-600 mt-2">
          يمكنك إدارة مراحل المشاريع من صفحة تفاصيل كل مشروع
        </p>
      </div>
    </div>
  );
}