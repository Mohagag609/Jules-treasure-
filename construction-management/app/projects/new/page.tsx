'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.start_date) {
      toast.error('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }

      const project = await response.json();
      toast.success('تم إنشاء المشروع بنجاح');
      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'فشل في إنشاء المشروع');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              إنشاء مشروع جديد
            </h1>
            <Link href="/projects">
              <button className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              اسم المشروع *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: مشروع بناء عمارة سكنية - المعادي"
              required
            />
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ البدء *
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
              تاريخ الانتهاء المتوقع
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
            <Link href="/projects">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ المشروع
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">ملاحظات:</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>بعد إنشاء المشروع، يمكنك إضافة المراحل والشركاء والموردين</li>
          <li>رصيد الخزينة الأولي سيكون صفر ويتم تحديثه مع المدفوعات</li>
          <li>يمكنك تعديل تفاصيل المشروع لاحقاً من صفحة المشروع</li>
        </ul>
      </div>
    </div>
  );
}