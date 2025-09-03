'use client';

import { useState, useEffect } from 'react';
import { Building, Partner, BuildingPartner } from '@/lib/types';
import { Plus, Edit, Eye, Trash2, Users, TrendingUp, Calendar, MapPin, Layers, DollarSign } from 'lucide-react';

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    total_floors: 0,
    total_units: 0,
    estimated_cost: 0,
    status: 'planning' as const,
    start_date: '',
    expected_completion_date: '',
    partners: [] as { partner_id: number; ownership_percentage: number }[],
    initial_stages: ['الأساسات', 'الهيكل الخرساني', 'الأعمال الكهربائية', 'السباكة', 'التشطيبات']
  });

  useEffect(() => {
    fetchBuildings();
    fetchPartners();
  }, []);

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings');
      const data = await response.json();
      setBuildings(data);
    } catch (error) {
      console.error('Error fetching buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners');
      const data = await response.json();
      setPartners(data);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

  const fetchBuildingDetails = async (buildingId: number) => {
    try {
      const response = await fetch(`/api/buildings/${buildingId}/report`);
      const data = await response.json();
      setSelectedBuilding(data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching building details:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/buildings/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          building: {
            name: formData.name,
            address: formData.address,
            total_floors: formData.total_floors,
            total_units: formData.total_units,
            estimated_cost: formData.estimated_cost,
            status: formData.status,
            start_date: formData.start_date,
            expected_completion_date: formData.expected_completion_date
          },
          partners: formData.partners,
          initial_stages: formData.initial_stages
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        fetchBuildings();
        // Reset form
        setFormData({
          name: '',
          address: '',
          total_floors: 0,
          total_units: 0,
          estimated_cost: 0,
          status: 'planning',
          start_date: '',
          expected_completion_date: '',
          partners: [],
          initial_stages: ['الأساسات', 'الهيكل الخرساني', 'الأعمال الكهربائية', 'السباكة', 'التشطيبات']
        });
      }
    } catch (error) {
      console.error('Error creating building:', error);
    }
  };

  const addPartnerToForm = () => {
    setFormData({
      ...formData,
      partners: [...formData.partners, { partner_id: 0, ownership_percentage: 0 }]
    });
  };

  const updatePartnerInForm = (index: number, field: string, value: any) => {
    const newPartners = [...formData.partners];
    newPartners[index] = { ...newPartners[index], [field]: value };
    setFormData({ ...formData, partners: newPartners });
  };

  const removePartnerFromForm = (index: number) => {
    setFormData({
      ...formData,
      partners: formData.partners.filter((_, i) => i !== index)
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'under_construction': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning': return 'تخطيط';
      case 'under_construction': return 'قيد الإنشاء';
      case 'completed': return 'مكتمل';
      case 'sold': return 'تم البيع';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة العمارات</h1>
            <p className="text-gray-600">إدارة جميع المشاريع العقارية والعمارات</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            إضافة عمارة جديدة
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">إجمالي العمارات</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{buildings.length}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-lg">
              <Layers className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">قيد الإنشاء</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                {buildings.filter(b => b.status === 'under_construction').length}
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">مكتملة</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {buildings.filter(b => b.status === 'completed').length}
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">إجمالي الاستثمار</p>
              <p className="text-2xl font-bold text-orange-900 mt-2">
                {formatCurrency(buildings.reduce((sum, b) => sum + (b.estimated_cost || 0), 0))}
              </p>
            </div>
            <div className="bg-orange-200 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buildings.map((building) => (
          <div key={building.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{building.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(building.status)}`}>
                  {getStatusText(building.status)}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                {building.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{building.address}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <Layers className="w-4 h-4" />
                  <span>{building.total_floors} طوابق - {building.total_units} وحدة</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>التكلفة المقدرة: {formatCurrency(building.estimated_cost || 0)}</span>
                </div>

                {building.current_balance !== undefined && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>الرصيد الحالي: {formatCurrency(building.current_balance || 0)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>تاريخ البدء: {new Date(building.start_date).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => fetchBuildingDetails(building.id)}
                  className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  عرض التفاصيل
                </button>
                <button
                  onClick={() => window.location.href = `/buildings/${building.id}`}
                  className="flex-1 bg-green-50 text-green-600 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  إدارة
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Building Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">إضافة عمارة جديدة</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">المعلومات الأساسية</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم العمارة</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد الطوابق</label>
                  <input
                    type="number"
                    value={formData.total_floors}
                    onChange={(e) => setFormData({ ...formData, total_floors: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عدد الوحدات</label>
                  <input
                    type="number"
                    value={formData.total_units}
                    onChange={(e) => setFormData({ ...formData, total_units: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التكلفة المقدرة</label>
                  <input
                    type="number"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="planning">تخطيط</option>
                    <option value="under_construction">قيد الإنشاء</option>
                    <option value="completed">مكتمل</option>
                    <option value="sold">تم البيع</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البدء</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الانتهاء المتوقع</label>
                  <input
                    type="date"
                    value={formData.expected_completion_date}
                    onChange={(e) => setFormData({ ...formData, expected_completion_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Partners Section */}
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">الشركاء</h3>
                    <button
                      type="button"
                      onClick={addPartnerToForm}
                      className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة شريك
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.partners.map((partner, index) => (
                      <div key={index} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">الشريك</label>
                          <select
                            value={partner.partner_id}
                            onChange={(e) => updatePartnerInForm(index, 'partner_id', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">اختر شريك</option>
                            {partners.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="block text-sm font-medium text-gray-700 mb-1">النسبة %</label>
                          <input
                            type="number"
                            value={partner.ownership_percentage}
                            onChange={(e) => updatePartnerInForm(index, 'ownership_percentage', parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            max="100"
                            step="0.01"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePartnerFromForm(index)}
                          className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {formData.partners.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        مجموع النسب: {formData.partners.reduce((sum, p) => sum + p.ownership_percentage, 0)}%
                        {formData.partners.reduce((sum, p) => sum + p.ownership_percentage, 0) !== 100 && (
                          <span className="text-red-600 font-medium"> (يجب أن يكون المجموع 100%)</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={formData.partners.reduce((sum, p) => sum + p.ownership_percentage, 0) !== 100}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  إضافة العمارة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Building Details Modal */}
      {showDetailsModal && selectedBuilding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">تفاصيل {selectedBuilding.building.name}</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Treasury Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص الخزينة</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الاستثمارات</p>
                    <p className="text-xl font-bold text-blue-900">
                      {formatCurrency(selectedBuilding.treasury?.total_investments || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">إجمالي المصروفات</p>
                    <p className="text-xl font-bold text-red-900">
                      {formatCurrency(selectedBuilding.treasury?.total_expenses || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                    <p className="text-xl font-bold text-green-900">
                      {formatCurrency(selectedBuilding.treasury?.total_revenues || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">الرصيد الحالي</p>
                    <p className="text-xl font-bold text-purple-900">
                      {formatCurrency(selectedBuilding.treasury?.current_balance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Partners */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">الشركاء</h3>
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الشريك</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">النسبة</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المدفوع</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">المتوقع</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedBuilding.partners?.map((partner: any) => (
                        <tr key={partner.id}>
                          <td className="px-4 py-3 text-sm">{partner.name}</td>
                          <td className="px-4 py-3 text-sm">{partner.ownership_percentage}%</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(partner.total_paid || 0)}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrency(partner.total_expenses_share || 0)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              partner.settlement_status === 'overpaid' ? 'bg-green-100 text-green-800' :
                              partner.settlement_status === 'underpaid' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {partner.settlement_status === 'overpaid' ? 'دفع زيادة' :
                               partner.settlement_status === 'underpaid' ? 'دفع أقل' : 'متوازن'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stages */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">المراحل</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedBuilding.stages?.map((stage: any) => (
                    <div key={stage.id} className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{stage.name}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">التكلفة المقدرة:</span>
                          <span>{formatCurrency(stage.estimated_cost || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">التكلفة الفعلية:</span>
                          <span>{formatCurrency(stage.actual_cost || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">التقدم:</span>
                          <span>{stage.progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${stage.progress_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}