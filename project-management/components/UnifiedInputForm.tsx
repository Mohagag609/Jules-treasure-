'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { UnifiedInput } from '@/lib/types';
import { Plus, Trash2, Calculator, Save } from 'lucide-react';

interface UnifiedInputFormProps {
  onSubmit: (data: UnifiedInput) => void;
}

export default function UnifiedInputForm({ onSubmit }: UnifiedInputFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<UnifiedInput>({
    defaultValues: {
      stage: {
        name: '',
        total_amount: 0,
        remaining_amount: 0
      },
      partners: [
        { name: '', percentage: 50, payment: 0 },
        { name: '', percentage: 50, payment: 0 }
      ],
      suppliers: [
        { name: '', payment: 0 }
      ]
    }
  });

  const { fields: partnerFields, append: appendPartner, remove: removePartner } = useFieldArray({
    control,
    name: 'partners'
  });

  const { fields: supplierFields, append: appendSupplier, remove: removeSupplier } = useFieldArray({
    control,
    name: 'suppliers'
  });

  const partners = watch('partners');
  const totalPercentage = partners?.reduce((sum, p) => sum + (parseFloat(p.percentage?.toString() || '0')), 0) || 0;
  const totalPartnerPayments = partners?.reduce((sum, p) => sum + (parseFloat(p.payment?.toString() || '0')), 0) || 0;
  const totalSupplierPayments = watch('suppliers')?.reduce((sum, s) => sum + (parseFloat(s.payment?.toString() || '0')), 0) || 0;

  const onFormSubmit = async (data: UnifiedInput) => {
    setIsLoading(true);
    try {
      // تحديث المبلغ المتبقي
      data.stage.remaining_amount = data.stage.total_amount;
      await onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 bg-white p-6 rounded-lg shadow-lg" dir="rtl">
      {/* بيانات المرحلة */}
      <div className="border-b pb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          بيانات المرحلة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المرحلة</label>
            <input
              {...register('stage.name', { required: 'اسم المرحلة مطلوب' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: الأساسات"
            />
            {errors.stage?.name && (
              <p className="text-red-500 text-sm mt-1">{errors.stage.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إجمالي المبلغ</label>
            <input
              type="number"
              step="0.01"
              {...register('stage.total_amount', { 
                required: 'المبلغ الإجمالي مطلوب',
                min: { value: 0, message: 'المبلغ يجب أن يكون موجب' }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            {errors.stage?.total_amount && (
              <p className="text-red-500 text-sm mt-1">{errors.stage.total_amount.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* بيانات الشركاء */}
      <div className="border-b pb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">الشركاء ونسبهم</h2>
          <button
            type="button"
            onClick={() => appendPartner({ name: '', percentage: 0, payment: 0 })}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            <Plus className="w-4 h-4" />
            إضافة شريك
          </button>
        </div>
        
        <div className="space-y-3">
          {partnerFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشريك</label>
                <input
                  {...register(`partners.${index}.name`, { required: 'اسم الشريك مطلوب' })}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم الشريك"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">النسبة %</label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`partners.${index}.percentage`, { 
                    required: 'النسبة مطلوبة',
                    min: { value: 0, message: 'النسبة يجب أن تكون موجبة' },
                    max: { value: 100, message: 'النسبة لا يمكن أن تتجاوز 100%' }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع</label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`partners.${index}.payment`, { 
                    min: { value: 0, message: 'المبلغ يجب أن يكون موجب' }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                {partnerFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePartner(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {totalPercentage !== 100 && (
          <p className="text-amber-600 text-sm mt-2">
            مجموع النسب: {totalPercentage}% (يجب أن يساوي 100%)
          </p>
        )}
        
        <p className="text-gray-600 text-sm mt-2">
          إجمالي مدفوعات الشركاء: {totalPartnerPayments.toLocaleString('ar-EG')} جنيه
        </p>
      </div>

      {/* بيانات الموردين */}
      <div className="border-b pb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">الموردين والمدفوعات</h2>
          <button
            type="button"
            onClick={() => appendSupplier({ name: '', payment: 0 })}
            className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
          >
            <Plus className="w-4 h-4" />
            إضافة مورد
          </button>
        </div>
        
        <div className="space-y-3">
          {supplierFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المورد</label>
                <input
                  {...register(`suppliers.${index}.name`, { required: 'اسم المورد مطلوب' })}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اسم المورد"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المدفوع</label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`suppliers.${index}.payment`, { 
                    min: { value: 0, message: 'المبلغ يجب أن يكون موجب' }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                {supplierFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSupplier(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-gray-600 text-sm mt-2">
          إجمالي المدفوعات للموردين: {totalSupplierPayments.toLocaleString('ar-EG')} جنيه
        </p>
      </div>

      {/* ملخص */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-bold text-lg mb-3">ملخص العملية</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">إجمالي المرحلة:</p>
            <p className="font-bold">{watch('stage.total_amount')?.toLocaleString('ar-EG') || 0} جنيه</p>
          </div>
          <div>
            <p className="text-gray-600">مدفوعات الشركاء:</p>
            <p className="font-bold">{totalPartnerPayments.toLocaleString('ar-EG')} جنيه</p>
          </div>
          <div>
            <p className="text-gray-600">مدفوعات للموردين:</p>
            <p className="font-bold">{totalSupplierPayments.toLocaleString('ar-EG')} جنيه</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <p className="text-gray-600">رصيد الخزينة المتوقع:</p>
          <p className="font-bold text-lg">
            {(totalPartnerPayments - totalSupplierPayments).toLocaleString('ar-EG')} جنيه
          </p>
        </div>
      </div>

      {/* زر الإرسال */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isLoading || totalPercentage !== 100}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isLoading ? 'جاري المعالجة...' : 'حفظ وحساب التسويات'}
        </button>
      </div>
    </form>
  );
}