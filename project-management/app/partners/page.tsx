'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  User,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  TrendingUp
} from 'lucide-react';

interface Partner {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  total_invested?: number;
  total_profit?: number;
  created_at: string;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      // Simulated data
      const dummyData: Partner[] = [
        {
          id: 1,
          name: 'أحمد محمد',
          phone: '01012345678',
          email: 'ahmed@example.com',
          address: 'القاهرة، مصر',
          total_invested: 150000,
          total_profit: 25000,
          created_at: '2024-01-15'
        },
        {
          id: 2,
          name: 'محمد علي',
          phone: '01098765432',
          email: 'mohamed@example.com',
          address: 'الإسكندرية، مصر',
          total_invested: 200000,
          total_profit: 35000,
          created_at: '2024-01-20'
        },
        {
          id: 3,
          name: 'علي حسن',
          phone: '01234567890',
          email: 'ali@example.com',
          address: 'الجيزة، مصر',
          total_invested: 100000,
          total_profit: 15000,
          created_at: '2024-02-01'
        }
      ];
      setPartners(dummyData);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPartner = async () => {
    try {
      // API call to add partner
      setShowAddModal(false);
      fetchPartners();
      setFormData({ name: '', phone: '', email: '', address: '' });
    } catch (error) {
      console.error('Error adding partner:', error);
    }
  };

  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الشركاء</h1>
            <p className="text-gray-500 mt-1">إدارة بيانات جميع الشركاء في المشروع</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            إضافة شريك جديد
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث عن شريك..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.map((partner) => (
          <div key={partner.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {partner.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{partner.name}</h3>
                  <p className="text-sm text-gray-500">ID: {partner.id}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-1 text-yellow-600 hover:bg-yellow-50 rounded">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {partner.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{partner.phone}</span>
                </div>
              )}
              {partner.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{partner.email}</span>
                </div>
              )}
              {partner.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{partner.address}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-1 text-green-600 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">المستثمر</span>
                </div>
                <p className="font-bold text-gray-900">{partner.total_invested?.toLocaleString('ar-EG')} جنيه</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-1 text-blue-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">الأرباح</span>
                </div>
                <p className="font-bold text-gray-900">{partner.total_profit?.toLocaleString('ar-EG')} جنيه</p>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              انضم في: {new Date(partner.created_at).toLocaleDateString('ar-EG')}
            </div>
          </div>
        ))}
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">إضافة شريك جديد</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشريك *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddPartner}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  إضافة
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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