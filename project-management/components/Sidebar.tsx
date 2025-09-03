'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Layers, 
  Users, 
  Truck, 
  DollarSign, 
  Calculator,
  FileText,
  Settings,
  PlusCircle,
  BarChart3,
  Building2,
  Wallet,
  HandshakeIcon
} from 'lucide-react';

const menuItems = [
  {
    title: 'الرئيسية',
    icon: Home,
    href: '/',
    color: 'text-blue-600'
  },
  {
    title: 'لوحة التحكم',
    icon: BarChart3,
    href: '/dashboard',
    color: 'text-purple-600'
  },
  {
    title: 'الإدخال السريع',
    icon: PlusCircle,
    href: '/quick-entry',
    color: 'text-green-600'
  },
  {
    title: 'المراحل',
    icon: Layers,
    href: '/stages',
    color: 'text-indigo-600'
  },
  {
    title: 'الشركاء',
    icon: Users,
    href: '/partners',
    color: 'text-orange-600'
  },
  {
    title: 'الموردين',
    icon: Truck,
    href: '/suppliers',
    color: 'text-red-600'
  },
  {
    title: 'المدفوعات',
    icon: DollarSign,
    href: '/payments',
    color: 'text-green-600'
  },
  {
    title: 'التسويات',
    icon: HandshakeIcon,
    href: '/settlements',
    color: 'text-yellow-600'
  },
  {
    title: 'الخزينة',
    icon: Wallet,
    href: '/treasury',
    color: 'text-cyan-600'
  },
  {
    title: 'التقارير',
    icon: FileText,
    href: '/reports',
    color: 'text-pink-600'
  },
  {
    title: 'الإعدادات',
    icon: Settings,
    href: '/settings',
    color: 'text-gray-600'
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-xl h-screen sticky top-0 overflow-y-auto">
      <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="flex items-center gap-3 text-white">
          <Building2 className="w-10 h-10" />
          <div>
            <h1 className="text-xl font-bold">إدارة المشاريع</h1>
            <p className="text-xs opacity-90">نظام متكامل للشركاء</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-600 shadow-sm' 
                      : 'hover:bg-gray-50 hover:shadow-sm'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500'}`} />
                  <span className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                    {item.title}
                  </span>
                  {isActive && (
                    <div className="mr-auto w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 mt-auto border-t">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">نسخة النظام</p>
          <p className="font-bold text-gray-900">الإصدار 2.0</p>
          <p className="text-xs text-gray-500 mt-1">محدث ومطور</p>
        </div>
      </div>
    </aside>
  );
}