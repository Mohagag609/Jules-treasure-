'use client';

import { useState } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  Calculator,
  CheckCircle,
  AlertCircle,
  Info,
  DollarSign,
  Users,
  Truck,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function QuickEntryPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form Data
  const [stageData, setStageData] = useState({
    name: '',
    total_amount: 0,
    description: ''
  });

  const [partners, setPartners] = useState([
    { id: 1, name: '', percentage: 0, payment: 0 }
  ]);

  const [suppliers, setSuppliers] = useState([
    { id: 1, name: '', payment: 0, description: '' }
  ]);

  // Calculations
  const totalPercentage = partners.reduce((sum, p) => sum + (parseFloat(p.percentage?.toString() || '0')), 0);
  const totalPartnerPayments = partners.reduce((sum, p) => sum + (parseFloat(p.payment?.toString() || '0')), 0);
  const totalSupplierPayments = suppliers.reduce((sum, s) => sum + (parseFloat(s.payment?.toString() || '0')), 0);
  const treasuryBalance = totalPartnerPayments - totalSupplierPayments;

  const addPartner = () => {
    setPartners([...partners, { 
      id: partners.length + 1, 
      name: '', 
      percentage: 0, 
      payment: 0 
    }]);
  };

  const removePartner = (id: number) => {
    if (partners.length > 1) {
      setPartners(partners.filter(p => p.id !== id));
    }
  };

  const updatePartner = (id: number, field: string, value: any) => {
    setPartners(partners.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const addSupplier = () => {
    setSuppliers([...suppliers, { 
      id: suppliers.length + 1, 
      name: '', 
      payment: 0,
      description: ''
    }]);
  };

  const removeSupplier = (id: number) => {
    if (suppliers.length > 1) {
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  const updateSupplier = (id: number, field: string, value: any) => {
    setSuppliers(suppliers.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSubmit = async () => {
    if (totalPercentage !== 100) {
      alert('مجموع نسب الشركاء يجب أن يساوي 100%');
      return;
    }

    setIsProcessing(true);
    
    try {
      const data = {
        stage: {
          ...stageData,
          remaining_amount: stageData.total_amount
        },
        partners: partners.filter(p => p.name),
        suppliers: suppliers.filter(s => s.name)
      };

      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          // Reset form
          setStageData({ name: '', total_amount: 0, description: '' });
          setPartners([{ id: 1, name: '', percentage: 0, payment: 0 }]);
          setSuppliers([{ id: 1, name: '', payment: 0, description: '' }]);
          setActiveStep(1);
        }, 3000);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ في معالجة البيانات');
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 1, title: 'بيانات المرحلة', icon: Info },
    { id: 2, title: 'الشركاء', icon: Users },
    { id: 3, title: 'الموردين', icon: Truck },
    { id: 4, title: 'المراجعة والحفظ', icon: CheckCircle }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">الإدخال السريع</h1>
            <p className="text-gray-500 mt-1">أدخل جميع البيانات من مكان واحد بسهولة</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">رصيد الخزينة المتوقع:</span>
            <span className={`text-2xl font-bold ${treasuryBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {treasuryBalance.toLocaleString('ar-EG')} جنيه
            </span>
          </div>
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                    activeStep === step.id
                      ? 'bg-blue-600 text-white'
                      : activeStep > step.id
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-1 mx-2 ${
                    activeStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Step 1: Stage Data */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Info className="w-6 h-6 text-blue-600" />
              بيانات المرحلة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المرحلة *</label>
                <input
                  type="text"
                  value={stageData.name}
                  onChange={(e) => setStageData({ ...stageData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: الأساسات"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ الإجمالي *</label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={stageData.total_amount}
                    onChange={(e) => setStageData({ ...stageData, total_amount: parseFloat(e.target.value) })}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">وصف المرحلة</label>
                <textarea
                  value={stageData.description}
                  onChange={(e) => setStageData({ ...stageData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="وصف اختياري للمرحلة..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveStep(2)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Partners */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-6 h-6 text-orange-600" />
                بيانات الشركاء
              </h2>
              <button
                onClick={addPartner}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus className="w-4 h-4" />
                إضافة شريك
              </button>
            </div>

            <div className="space-y-4">
              {partners.map((partner, index) => (
                <div key={partner.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-700">الشريك #{index + 1}</h3>
                    {partners.length > 1 && (
                      <button
                        onClick={() => removePartner(partner.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">اسم الشريك</label>
                      <input
                        type="text"
                        value={partner.name}
                        onChange={(e) => updatePartner(partner.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="اسم الشريك"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">النسبة %</label>
                      <input
                        type="number"
                        value={partner.percentage}
                        onChange={(e) => updatePartner(partner.id, 'percentage', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">المبلغ المدفوع</label>
                      <input
                        type="number"
                        value={partner.payment}
                        onChange={(e) => updatePartner(partner.id, 'payment', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPercentage !== 100 && (
              <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800">
                  مجموع النسب: {totalPercentage}% (يجب أن يساوي 100%)
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setActiveStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                السابق
              </button>
              <button
                onClick={() => setActiveStep(3)}
                disabled={totalPercentage !== 100}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Suppliers */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Truck className="w-6 h-6 text-red-600" />
                بيانات الموردين
              </h2>
              <button
                onClick={addSupplier}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus className="w-4 h-4" />
                إضافة مورد
              </button>
            </div>

            <div className="space-y-4">
              {suppliers.map((supplier, index) => (
                <div key={supplier.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-700">المورد #{index + 1}</h3>
                    {suppliers.length > 1 && (
                      <button
                        onClick={() => removeSupplier(supplier.id)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">اسم المورد</label>
                      <input
                        type="text"
                        value={supplier.name}
                        onChange={(e) => updateSupplier(supplier.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="اسم المورد"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">المبلغ المدفوع</label>
                      <input
                        type="number"
                        value={supplier.payment}
                        onChange={(e) => updateSupplier(supplier.id, 'payment', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">الوصف</label>
                      <input
                        type="text"
                        value={supplier.description}
                        onChange={(e) => updateSupplier(supplier.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="وصف اختياري"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setActiveStep(2)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                السابق
              </button>
              <button
                onClick={() => setActiveStep(4)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Save */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              مراجعة البيانات والحفظ
            </h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">المرحلة</p>
                <p className="font-bold text-lg">{stageData.name || 'غير محدد'}</p>
                <p className="text-sm text-gray-600">{stageData.total_amount.toLocaleString('ar-EG')} جنيه</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 mb-1">عدد الشركاء</p>
                <p className="font-bold text-lg">{partners.filter(p => p.name).length}</p>
                <p className="text-sm text-gray-600">إجمالي: {totalPartnerPayments.toLocaleString('ar-EG')} جنيه</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 mb-1">عدد الموردين</p>
                <p className="font-bold text-lg">{suppliers.filter(s => s.name).length}</p>
                <p className="text-sm text-gray-600">إجمالي: {totalSupplierPayments.toLocaleString('ar-EG')} جنيه</p>
              </div>
              <div className={`${treasuryBalance >= 0 ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg`}>
                <p className={`text-sm ${treasuryBalance >= 0 ? 'text-green-600' : 'text-red-600'} mb-1`}>رصيد الخزينة</p>
                <p className="font-bold text-lg flex items-center gap-1">
                  {treasuryBalance >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {treasuryBalance.toLocaleString('ar-EG')} جنيه
                </p>
              </div>
            </div>

            {/* Details Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Partners Table */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold mb-3">تفاصيل الشركاء</h3>
                <div className="space-y-2">
                  {partners.filter(p => p.name).map((partner, index) => (
                    <div key={index} className="bg-white p-3 rounded flex justify-between">
                      <div>
                        <p className="font-medium">{partner.name}</p>
                        <p className="text-sm text-gray-500">النسبة: {partner.percentage}%</p>
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{partner.payment.toLocaleString('ar-EG')} جنيه</p>
                        <p className="text-sm text-gray-500">
                          المستحق: {((stageData.total_amount * partner.percentage) / 100).toLocaleString('ar-EG')} جنيه
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suppliers Table */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold mb-3">تفاصيل الموردين</h3>
                <div className="space-y-2">
                  {suppliers.filter(s => s.name).map((supplier, index) => (
                    <div key={index} className="bg-white p-3 rounded flex justify-between">
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-gray-500">{supplier.description || 'بدون وصف'}</p>
                      </div>
                      <p className="font-medium">{supplier.payment.toLocaleString('ar-EG')} جنيه</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <button
                onClick={() => setActiveStep(3)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                السابق
              </button>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition shadow-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حفظ وحساب التسويات
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-6 h-6" />
          <span className="font-medium">تم حفظ البيانات وحساب التسويات بنجاح!</span>
        </div>
      )}
    </div>
  );
}