'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowRight, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Users, 
  Layers,
  Building,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Phase {
  name: string;
  amount_required: number;
  start_date?: string;
  end_date?: string;
  suppliers: {
    supplier_id: string;
    supplier_name: string;
    amount_due: number;
  }[];
}

interface Partner {
  partner_id: string;
  partner_name: string;
  percentage: number;
}

export default function EnhancedNewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // البيانات الأساسية للمشروع
  const [projectData, setProjectData] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });
  
  // المراحل
  const [phases, setPhases] = useState<Phase[]>([]);
  const [newPhase, setNewPhase] = useState<Phase>({
    name: '',
    amount_required: 0,
    start_date: '',
    end_date: '',
    suppliers: []
  });
  
  // الشركاء
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartner, setNewPartner] = useState<Partner>({
    partner_id: '',
    partner_name: '',
    percentage: 0
  });

  // إضافة مرحلة جديدة
  const addPhase = () => {
    if (!newPhase.name || newPhase.amount_required <= 0) {
      toast.error('الرجاء إدخال اسم المرحلة والمبلغ المطلوب');
      return;
    }
    
    setPhases([...phases, { ...newPhase }]);
    setNewPhase({
      name: '',
      amount_required: 0,
      start_date: '',
      end_date: '',
      suppliers: []
    });
    toast.success('تمت إضافة المرحلة');
  };
  
  // حذف مرحلة
  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index));
  };
  
  // إضافة شريك جديد
  const addPartner = () => {
    if (!newPartner.partner_name || newPartner.percentage <= 0) {
      toast.error('الرجاء إدخال اسم الشريك والنسبة');
      return;
    }
    
    const totalPercentage = partners.reduce((sum, p) => sum + p.percentage, 0) + newPartner.percentage;
    if (totalPercentage > 100) {
      toast.error(`مجموع النسب يتجاوز 100% (المجموع الحالي: ${totalPercentage}%)`);
      return;
    }
    
    setPartners([...partners, { ...newPartner }]);
    setNewPartner({
      partner_id: '',
      partner_name: '',
      percentage: 0
    });
    toast.success('تمت إضافة الشريك');
  };
  
  // حذف شريك
  const removePartner = (index: number) => {
    setPartners(partners.filter((_, i) => i !== index));
  };
  
  // حساب إجمالي تكلفة المشروع
  const totalProjectCost = phases.reduce((sum, phase) => sum + phase.amount_required, 0);
  
  // حساب مجموع نسب الشركاء
  const totalPartnersPercentage = partners.reduce((sum, p) => sum + p.percentage, 0);
  
  // التحقق من صحة البيانات للخطوة الحالية
  const isStepValid = () => {
    switch(currentStep) {
      case 1:
        return projectData.name && projectData.start_date;
      case 2:
        return phases.length > 0;
      case 3:
        return partners.length > 0 && totalPartnersPercentage === 100;
      default:
        return false;
    }
  };
  
  // حفظ المشروع
  const handleSubmit = async () => {
    if (!isStepValid()) {
      toast.error('الرجاء إكمال جميع البيانات المطلوبة');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. إنشاء المشروع
      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      
      if (!projectResponse.ok) throw new Error('فشل في إنشاء المشروع');
      const project = await projectResponse.json();
      
      // 2. إضافة المراحل
      for (const phase of phases) {
        const phaseResponse = await fetch('/api/phases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: project.id,
            ...phase
          })
        });
        
        if (!phaseResponse.ok) throw new Error('فشل في إضافة المرحلة');
        
        // إضافة الموردين للمرحلة إذا وجدوا
        const createdPhase = await phaseResponse.json();
        for (const supplier of phase.suppliers) {
          await fetch('/api/phase-suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phase_id: createdPhase.id,
              supplier_id: supplier.supplier_id,
              amount_due: supplier.amount_due
            })
          });
        }
      }
      
      // 3. إضافة الشركاء
      for (const partner of partners) {
        // إنشاء الشريك إذا لم يكن موجوداً
        let partnerId = partner.partner_id;
        if (!partnerId) {
          const partnerResponse = await fetch('/api/partners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: partner.partner_name
            })
          });
          
          if (partnerResponse.ok) {
            const createdPartner = await partnerResponse.json();
            partnerId = createdPartner.id;
          }
        }
        
        // ربط الشريك بالمشروع
        await fetch('/api/project-partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: project.id,
            partner_id: partnerId,
            percentage: partner.percentage
          })
        });
      }
      
      toast.success('تم إنشاء المشروع بنجاح');
      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'فشل في إنشاء المشروع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              إنشاء مشروع جديد متكامل
            </h1>
            <Link href="/projects">
              <button className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">بيانات المشروع</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">المراحل</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium">الشركاء</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Step 1: Project Data */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center">
                <Building className="ml-2 h-5 w-5 text-blue-600" />
                البيانات الأساسية للمشروع
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المشروع *
                </label>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData({...projectData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: مشروع بناء عمارة سكنية - المعادي"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ البدء *
                  </label>
                  <input
                    type="date"
                    value={projectData.start_date}
                    onChange={(e) => setProjectData({...projectData, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تاريخ الانتهاء المتوقع
                  </label>
                  <input
                    type="date"
                    value={projectData.end_date}
                    onChange={(e) => setProjectData({...projectData, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Phases */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center">
                <Layers className="ml-2 h-5 w-5 text-purple-600" />
                مراحل المشروع
              </h2>
              
              {/* Add New Phase Form */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-medium">إضافة مرحلة جديدة</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم المرحلة *
                    </label>
                    <input
                      type="text"
                      value={newPhase.name}
                      onChange={(e) => setNewPhase({...newPhase, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="مثال: الأساسات"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المبلغ المطلوب *
                    </label>
                    <input
                      type="number"
                      value={newPhase.amount_required}
                      onChange={(e) => setNewPhase({...newPhase, amount_required: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ البدء
                    </label>
                    <input
                      type="date"
                      value={newPhase.start_date}
                      onChange={(e) => setNewPhase({...newPhase, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ الانتهاء
                    </label>
                    <input
                      type="date"
                      value={newPhase.end_date}
                      onChange={(e) => setNewPhase({...newPhase, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <button
                  onClick={addPhase}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة المرحلة
                </button>
              </div>
              
              {/* Phases List */}
              {phases.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">المراحل المضافة</h3>
                  {phases.map((phase, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div>
                        <span className="font-medium">{phase.name}</span>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-sm text-gray-600">
                          {new Intl.NumberFormat('ar-EG', {
                            style: 'currency',
                            currency: 'EGP',
                            minimumFractionDigits: 0
                          }).format(phase.amount_required)}
                        </span>
                      </div>
                      <button
                        onClick={() => removePhase(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">إجمالي تكلفة المشروع: </span>
                    <span className="text-blue-600 font-bold">
                      {new Intl.NumberFormat('ar-EG', {
                        style: 'currency',
                        currency: 'EGP',
                        minimumFractionDigits: 0
                      }).format(totalProjectCost)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Partners */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold flex items-center">
                <Users className="ml-2 h-5 w-5 text-green-600" />
                الشركاء في المشروع
              </h2>
              
              {/* Add New Partner Form */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-medium">إضافة شريك جديد</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم الشريك *
                    </label>
                    <input
                      type="text"
                      value={newPartner.partner_name}
                      onChange={(e) => setNewPartner({...newPartner, partner_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="مثال: أحمد محمد"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      النسبة (%) *
                    </label>
                    <input
                      type="number"
                      value={newPartner.percentage}
                      onChange={(e) => setNewPartner({...newPartner, percentage: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                
                <button
                  onClick={addPartner}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة الشريك
                </button>
              </div>
              
              {/* Partners List */}
              {partners.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">الشركاء المضافون</h3>
                  {partners.map((partner, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                      <div>
                        <span className="font-medium">{partner.partner_name}</span>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-sm text-gray-600">نسبة: {partner.percentage}%</span>
                        <span className="mx-2 text-gray-400">|</span>
                        <span className="text-sm text-green-600">
                          المستحق: {new Intl.NumberFormat('ar-EG', {
                            style: 'currency',
                            currency: 'EGP',
                            minimumFractionDigits: 0
                          }).format((totalProjectCost * partner.percentage) / 100)}
                        </span>
                      </div>
                      <button
                        onClick={() => removePartner(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">مجموع النسب: </span>
                    <span className={`font-bold ${totalPartnersPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalPartnersPercentage}%
                    </span>
                    {totalPartnersPercentage !== 100 && (
                      <span className="text-sm text-red-600 mr-2">
                        (يجب أن يكون المجموع 100%)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  السابق
                </button>
              )}
            </div>
            
            <div className="space-x-3 space-x-reverse">
              <Link href="/projects">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  إلغاء
                </button>
              </Link>
              
              {currentStep < 3 ? (
                <button
                  onClick={() => {
                    if (isStepValid()) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      toast.error('الرجاء إكمال البيانات المطلوبة');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  التالي
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !isStepValid()}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      {(phases.length > 0 || partners.length > 0) && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">ملخص المشروع:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            {phases.length > 0 && (
              <div>• عدد المراحل: {phases.length} مرحلة</div>
            )}
            {totalProjectCost > 0 && (
              <div>• إجمالي التكلفة: {new Intl.NumberFormat('ar-EG', {
                style: 'currency',
                currency: 'EGP',
                minimumFractionDigits: 0
              }).format(totalProjectCost)}</div>
            )}
            {partners.length > 0 && (
              <div>• عدد الشركاء: {partners.length} شريك</div>
            )}
            {totalPartnersPercentage > 0 && (
              <div>• مجموع النسب: {totalPartnersPercentage}%</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}