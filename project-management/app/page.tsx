'use client';

import { useState, useEffect } from 'react';
import UnifiedInputForm from '@/components/UnifiedInputForm';
import StageReport from '@/components/StageReport';
import { UnifiedInput } from '@/lib/types';
import { Building2, Plus, FileText, Home } from 'lucide-react';

export default function HomePage() {
  const [activeView, setActiveView] = useState<'form' | 'reports'>('form');
  const [stages, setStages] = useState<any[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      const response = await fetch('/api/stages');
      const data = await response.json();
      setStages(data);
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
  };

  const handleSubmit = async (data: UnifiedInput) => {
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage('تم حفظ البيانات وحساب التسويات بنجاح!');
        setSelectedStageId(result.data.stageId);
        setActiveView('reports');
        fetchStages();
        
        // إخفاء رسالة النجاح بعد 3 ثواني
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert(result.error || 'حدث خطأ في معالجة البيانات');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('حدث خطأ في الاتصال بالخادم');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">نظام إدارة المشاريع والشركاء</h1>
            </div>
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveView('form')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  activeView === 'form' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Plus className="w-5 h-5" />
                إدخال جديد
              </button>
              <button
                onClick={() => setActiveView('reports')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  activeView === 'reports' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FileText className="w-5 h-5" />
                التقارير
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeView === 'form' ? (
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">نموذج الإدخال الموحد</h2>
              <p className="text-gray-600">أدخل جميع بيانات المرحلة والشركاء والموردين من مكان واحد</p>
            </div>
            <UnifiedInputForm onSubmit={handleSubmit} />
          </div>
        ) : (
          <div>
            {/* قائمة المراحل */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">المراحل المسجلة</h2>
              {stages.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                  <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">لا توجد مراحل مسجلة حتى الآن</p>
                  <button
                    onClick={() => setActiveView('form')}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    إضافة مرحلة جديدة
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stages.map((stage) => (
                    <div
                      key={stage.id}
                      onClick={() => setSelectedStageId(stage.id)}
                      className={`bg-white p-4 rounded-lg shadow cursor-pointer transition hover:shadow-lg ${
                        selectedStageId === stage.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <h3 className="font-bold text-lg mb-2">{stage.name}</h3>
                      <p className="text-gray-600">
                        المبلغ الإجمالي: {stage.total_amount?.toLocaleString('ar-EG')} جنيه
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(stage.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* تقرير المرحلة المختارة */}
            {selectedStageId && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">تفاصيل المرحلة</h2>
                <StageReport stageId={selectedStageId} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>نظام إدارة المشاريع والشركاء © 2024</p>
          <p className="text-sm text-gray-400 mt-2">تم التطوير باستخدام Next.js و SQLite</p>
        </div>
      </footer>
    </div>
  );
}