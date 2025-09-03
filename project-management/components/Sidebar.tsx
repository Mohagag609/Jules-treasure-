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
  HandshakeIcon,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  {
    title: 'الرئيسية',
    icon: Home,
    href: '/',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'لوحة التحكم',
    icon: BarChart3,
    href: '/dashboard',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'الإدخال السريع',
    icon: PlusCircle,
    href: '/quick-entry',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'المراحل',
    icon: Layers,
    href: '/stages',
    gradient: 'from-indigo-500 to-blue-500'
  },
  {
    title: 'الشركاء',
    icon: Users,
    href: '/partners',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    title: 'الموردين',
    icon: Truck,
    href: '/suppliers',
    gradient: 'from-red-500 to-pink-500'
  },
  {
    title: 'المدفوعات',
    icon: DollarSign,
    href: '/payments',
    gradient: 'from-green-500 to-teal-500'
  },
  {
    title: 'التسويات',
    icon: HandshakeIcon,
    href: '/settlements',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    title: 'الخزينة',
    icon: Wallet,
    href: '/treasury',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    title: 'التقارير',
    icon: FileText,
    href: '/reports',
    gradient: 'from-pink-500 to-purple-500'
  },
  {
    title: 'الإعدادات',
    icon: Settings,
    href: '/settings',
    gradient: 'from-gray-500 to-gray-700'
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed right-0 top-0 z-40 h-screen w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white overflow-y-auto shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">إدارة المشاريع</h1>
              <p className="text-xs text-gray-400">النظام المتقدم v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-xl transition-all duration-300 font-bold group
                      ${isActive 
                        ? 'bg-gradient-to-l from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30' 
                        : 'hover:bg-white/20 hover:translate-x-[-5px]'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-base font-bold">
                      {item.title}
                    </span>
                    {isActive && (
                      <div className="mr-auto">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/20">
            <div className="text-xs text-gray-400 mb-2">تم التطوير بواسطة</div>
            <div className="text-sm font-bold text-white">فريق التطوير المتقدم</div>
            <div className="mt-3 flex justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">النظام يعمل</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}