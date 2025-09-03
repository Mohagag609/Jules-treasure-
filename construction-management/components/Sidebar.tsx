'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FolderOpen,
  Users,
  Truck,
  DollarSign,
  FileText,
  Settings,
  BarChart3,
  Building,
  Layers
} from 'lucide-react';

const navigation = [
  { name: 'الرئيسية', href: '/', icon: Home },
  { name: 'المشاريع', href: '/projects', icon: FolderOpen },
  { name: 'المراحل', href: '/phases', icon: Layers },
  { name: 'الشركاء', href: '/partners', icon: Users },
  { name: 'الموردين', href: '/suppliers', icon: Truck },
  { name: 'المدفوعات', href: '/payments', icon: DollarSign },
  { name: 'التسويات', href: '/settlements', icon: Building },
  { name: 'التقارير', href: '/reports', icon: BarChart3 },
  { name: 'الإعدادات', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <h1 className="text-white text-xl font-bold">إدارة مشاريع البناء</h1>
      </div>
      <nav className="flex-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-4 py-3 mb-2 rounded-lg transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <item.icon className="ml-3 h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}