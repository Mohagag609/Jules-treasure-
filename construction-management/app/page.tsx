'use client';

import { useEffect, useState } from 'react';
import { 
  Building, 
  Users, 
  Truck, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  projects: number;
  activeProjects: number;
  partners: number;
  suppliers: number;
  totalIncome: number;
  totalExpense: number;
  treasuryBalance: number;
  phases: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({
    projects: 0,
    activeProjects: 0,
    partners: 0,
    suppliers: 0,
    totalIncome: 0,
    totalExpense: 0,
    treasuryBalance: 0,
    phases: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // هنا يمكن جلب الإحصائيات من API
      // مؤقتاً نستخدم بيانات وهمية
      setStats({
        projects: 5,
        activeProjects: 3,
        partners: 8,
        suppliers: 12,
        totalIncome: 1500000,
        totalExpense: 980000,
        treasuryBalance: 520000,
        phases: 15
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const statCards = [
    {
      title: 'المشاريع النشطة',
      value: `${stats.activeProjects} / ${stats.projects}`,
      icon: Building,
      color: 'bg-blue-500',
      link: '/projects'
    },
    {
      title: 'المراحل',
      value: stats.phases,
      icon: Layers,
      color: 'bg-purple-500',
      link: '/phases'
    },
    {
      title: 'الشركاء',
      value: stats.partners,
      icon: Users,
      color: 'bg-green-500',
      link: '/partners'
    },
    {
      title: 'الموردين',
      value: stats.suppliers,
      icon: Truck,
      color: 'bg-orange-500',
      link: '/suppliers'
    }
  ];

  const financeCards = [
    {
      title: 'إجمالي المقبوضات',
      value: formatCurrency(stats.totalIncome),
      icon: TrendingUp,
      color: 'bg-green-600',
      trend: 'up'
    },
    {
      title: 'إجمالي المدفوعات',
      value: formatCurrency(stats.totalExpense),
      icon: TrendingDown,
      color: 'bg-red-600',
      trend: 'down'
    },
    {
      title: 'رصيد الخزينة',
      value: formatCurrency(stats.treasuryBalance),
      icon: DollarSign,
      color: 'bg-indigo-600',
      trend: 'neutral'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          لوحة التحكم الرئيسية
        </h1>
        <p className="text-gray-600">
          نظرة عامة على جميع المشاريع والعمليات المالية
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link href={stat.link} key={index}>
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-full`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Finance Cards */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Activity className="ml-2 h-5 w-5" />
          الحالة المالية
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {financeCards.map((card, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">{card.title}</p>
                <div className={`${card.color} p-2 rounded-full`}>
                  <card.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              {card.trend === 'up' && (
                <p className="text-xs text-green-600 mt-1">↑ زيادة</p>
              )}
              {card.trend === 'down' && (
                <p className="text-xs text-red-600 mt-1">↓ نقصان</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/projects/new">
            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              مشروع جديد
            </button>
          </Link>
          <Link href="/payments/partner">
            <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              قبض من شريك
            </button>
          </Link>
          <Link href="/payments/supplier">
            <button className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              دفع لمورد
            </button>
          </Link>
          <Link href="/reports">
            <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              عرض التقارير
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}