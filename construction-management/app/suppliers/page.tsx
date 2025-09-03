'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Truck, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('فشل في جلب الموردين');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('الرجاء إدخال اسم المورد');
      return;
    }

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create supplier');
      }

      toast.success('تم إضافة المورد بنجاح');
      setShowAddModal(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error creating supplier:', error);
      toast.error(error.message || 'فشل في إضافة المورد');
    }
  };

  const deleteSupplier = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return;

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete supplier');
      
      toast.success('تم حذف المورد بنجاح');
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('فشل في حذف المورد');
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
              <Truck className="ml-2 h-6 w-6" />
              إدارة الموردين
            </h1>
            <p className="text-gray-600 mt-1">
              عدد الموردين: {suppliers.length}
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="ml-2 h-5 w-5" />
            إضافة مورد
          </button>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <Truck className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">لا يوجد موردين مضافين بعد</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:underline"
            >
              إضافة أول مورد
            </button>
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-3 rounded-full ml-3">
                      <Truck className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                      <p className="text-xs text-gray-500">
                        مضاف في {new Date(supplier.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {supplier.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="ml-2 h-4 w-4" />
                      <span dir="ltr">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="ml-2 h-4 w-4" />
                      <span>{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="ml-2 h-4 w-4" />
                      <span className="line-clamp-2">{supplier.address}</span>
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
                    onClick={() => deleteSupplier(supplier.id)}
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

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">إضافة مورد جديد</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المورد *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: شركة الأسمنت المصرية"
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
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  العنوان
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', phone: '', email: '', address: '' });
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