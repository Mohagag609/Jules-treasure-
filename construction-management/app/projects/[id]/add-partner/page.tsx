'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Users, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Partner {
  id: number;
  name: string;
}

interface ProjectPartner {
  id: number;
  partner_name: string;
  percentage: number;
  amount_due: number;
  amount_paid: number;
}

export default function AddPartnerToProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [projectPartners, setProjectPartners] = useState<ProjectPartner[]>([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    partner_id: '',
    percentage: ''
  });

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      // جلب معلومات المشروع
      const projectResponse = await fetch(`/api/projects/${params.id}`);
      if (!projectResponse.ok) throw new Error('Failed to fetch project');
      const projectData = await projectResponse.json();
      setProjectName(projectData.name);
      setProjectPartners(projectData.partners || []);

      // جلب جميع الشركاء
      const partnersResponse = await fetch('/api/partners');
      if (!partnersResponse.ok) throw new Error('Failed to fetch partners');
      const partnersData = await partnersResponse.json();
      setPartners(partnersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.partner_id || !formData.percentage) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    const percentage = parseFloat(formData.percentage);
    if (percentage <= 0 || percentage > 100) {
      toast.error('النسبة يجب أن تكون بين 0 و 100');
      return;
    }

    // حساب مجموع النسب الحالية
    const currentTotal = projectPartners.reduce((sum, p) => sum + p.percentage, 0);
    if (currentTotal + percentage > 100) {
      toast.error(`لا يمكن إضافة هذه النسبة. المتاح: ${100 - currentTotal}%`);
      return;
    }

    try {
      const response = await fetch('/api/project-partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: params.id,
          partner_id: formData.partner_id,
          percentage: percentage
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add partner');
      }

      toast.success('تم إضافة الشريك بنجاح');
      router.push(`/projects/${params.id}`);
    } catch (error: any) {
      console.error('Error adding partner:', error);
      toast.error(error.message || 'فشل في إضافة الشريك');
    }
  };

  const totalPercentage = projectPartners.reduce((sum, p) => sum + p.percentage, 0);
  const remainingPercentage = 100 - totalPercentage;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <Link href={`/projects/${params.id}`}>
            <button className="text-gray-500 hover:text-gray-700 ml-3">
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <Users className="ml-2 h-5 w-5" />
              إضافة شريك للمشروع
            </h1>
            <p className="text-sm text-gray-600 mt-1">{projectName}</p>
          </div>
        </div>
      </div>

      {/* Current Partners */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">الشركاء الحاليين</h2>
        {projectPartners.length === 0 ? (
          <p className="text-gray-500 text-center py-4">لا يوجد شركاء في هذا المشروع بعد</p>
        ) : (
          <div className="space-y-2">
            {projectPartners.map((partner) => (
              <div key={partner.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{partner.partner_name}</span>
                  <span className="text-sm text-gray-500 mr-2">({partner.percentage}%)</span>
                </div>
                <div className="text-sm text-gray-600">
                  المستحق: {new Intl.NumberFormat('ar-EG').format(partner.amount_due)} جنيه
                </div>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">المجموع:</span>
                <span className={`font-bold ${totalPercentage === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {totalPercentage}%
                </span>
              </div>
              {remainingPercentage > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  النسبة المتبقية: {remainingPercentage}%
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Partner Form */}
      {remainingPercentage > 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">إضافة شريك جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اختر الشريك *
              </label>
              <select
                value={formData.partner_id}
                onChange={(e) => setFormData({...formData, partner_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- اختر شريك --</option>
                {partners
                  .filter(p => !projectPartners.some(pp => pp.partner_name === p.name))
                  .map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نسبة المساهمة (%) *
              </label>
              <input
                type="number"
                value={formData.percentage}
                onChange={(e) => setFormData({...formData, percentage: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`أقصى نسبة: ${remainingPercentage}%`}
                min="0.01"
                max={remainingPercentage}
                step="0.01"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                النسبة المتاحة: {remainingPercentage}%
              </p>
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse">
              <Link href={`/projects/${params.id}`}>
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                إضافة الشريك
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            تم توزيع 100% من نسب المشروع. لا يمكن إضافة شركاء آخرين.
          </p>
          <Link href={`/projects/${params.id}`}>
            <button className="mt-2 text-blue-600 hover:underline">
              العودة للمشروع
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}