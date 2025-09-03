'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Users, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface Partner {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners');
      if (!response.ok) throw new Error('Failed to fetch partners');
      const data = await response.json();
      setPartners(data);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('فشل في جلب الشركاء');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('الرجاء إدخال اسم الشريك');
      return;
    }

    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create partner');
      }

      toast.success('تم إضافة الشريك بنجاح');
      setShowAddModal(false);
      setFormData({ name: '', phone: '', email: '' });
      fetchPartners();
    } catch (error: any) {
      console.error('Error creating partner:', error);
      toast.error(error.message || 'فشل في إضافة الشريك');
    }
  };

  const deletePartner = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشريك؟')) return;

    try {
      const response = await fetch(`/api/partners/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete partner');
      
      toast.success('تم حذف الشريك بنجاح');
      fetchPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('فشل في حذف الشريك');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="ml-2 h-6 w-6" />
              إدارة الشركاء
            </h1>
            <p className="text-gray-600 mt-1">
              عدد الشركاء: {partners.length}
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="ml-2 h-5 w-5" />
            إضافة شريك
          </button>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">لا يوجد شركاء مضافين بعد</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:underline"
            >
              إضافة أول شريك
            </button>
          </div>
        ) : (
          partners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full ml-3">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{partner.name}</h3>
                      <p className="text-xs text-gray-500">
                        مضاف في {new Date(partner.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {partner.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="ml-2 h-4 w-4" />
                      <span dir="ltr">{partner.phone}</span>
                    </div>
                  )}
                  {partner.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="ml-2 h-4 w-4" />
                      <span>{partner.email}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse pt-3 border-t">
                  <button 
                    className="text-yellow-600 hover:text-yellow-900"
                    title="تعديل"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deletePartner(partner.id)}
                    className="text-red-600 hover:text-red-900"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">إضافة شريك جديد</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الشريك *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
              </div>
              
              <div className="flex justify-end space-x-3 space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', phone: '', email: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}