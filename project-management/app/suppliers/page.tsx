'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Truck, Package, Phone, MapPin } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: 'شركة الحديد المتحدة', phone: '01234567890', address: 'المنطقة الصناعية', totalPayments: 85000 },
    { id: 2, name: 'مورد الأسمنت', phone: '01098765432', address: 'القاهرة', totalPayments: 62000 },
    { id: 3, name: 'شركة السيراميك', phone: '01122334455', address: 'العاشر من رمضان', totalPayments: 45000 }
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });

  const handleAdd = () => {
    const newSupplier = {
      id: suppliers.length + 1,
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      totalPayments: 0
    };
    setSuppliers([...suppliers, newSupplier]);
    setShowAddModal(false);
    setFormData({ name: '', phone: '', address: '' });
  };

  const handleDelete = (id: number) => {
    if (confirm('هل تريد حذف هذا المورد؟')) {
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الموردين</h1>
            <p className="text-gray-500 mt-1">قائمة بجميع الموردين</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            إضافة مورد
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث عن مورد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right">المورد</th>
              <th className="px-6 py-3 text-right">الهاتف</th>
              <th className="px-6 py-3 text-right">العنوان</th>
              <th className="px-6 py-3 text-right">إجمالي المدفوعات</th>
              <th className="px-6 py-3 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredSuppliers.map(supplier => (
              <tr key={supplier.id}>
                <td className="px-6 py-4 font-medium">{supplier.name}</td>
                <td className="px-6 py-4">{supplier.phone}</td>
                <td className="px-6 py-4">{supplier.address}</td>
                <td className="px-6 py-4">{supplier.totalPayments.toLocaleString('ar-EG')} جنيه</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h2 className="text-xl font-bold mb-4">إضافة مورد جديد</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="اسم المورد"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="tel"
                placeholder="رقم الهاتف"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="العنوان"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
                >
                  إضافة
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-gray-200 rounded-lg"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}