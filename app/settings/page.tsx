'use client';

import { Settings, Database, Shield, Bell, Globe } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Settings className="ml-2 h-6 w-6" />
          الإعدادات
        </h1>
        <p className="text-gray-600 mt-2">
          إدارة إعدادات النظام والتفضيلات
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Database className="ml-3 h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">قاعدة البيانات</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">حجم قاعدة البيانات</span>
              <span className="text-sm font-medium">12.5 MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">آخر نسخة احتياطية</span>
              <span className="text-sm font-medium">اليوم 10:30 ص</span>
            </div>
            <button className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              إنشاء نسخة احتياطية
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Shield className="ml-3 h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">الأمان</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">التحقق بخطوتين</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">تشفير البيانات</span>
              <span className="text-sm text-green-600">مفعّل</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Bell className="ml-3 h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">الإشعارات</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="ml-2" defaultChecked />
              <span className="text-sm text-gray-600">إشعارات المدفوعات</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="ml-2" defaultChecked />
              <span className="text-sm text-gray-600">إشعارات المراحل</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="ml-2" />
              <span className="text-sm text-gray-600">إشعارات التسويات</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Globe className="ml-3 h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">اللغة والمنطقة</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">اللغة</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">العملة</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="AED">درهم إماراتي (AED)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}