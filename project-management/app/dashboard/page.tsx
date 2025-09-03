'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Layers, 
  DollarSign,
  Wallet,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStages: 8,
    totalPartners: 12,
    totalSuppliers: 15,
    totalPayments: 245000,
    totalTreasury: 185000,
    pendingSettlements: 3,
    monthlyGrowth: 22,
    completionRate: 78
  });

  const [loading, setLoading] = useState(false);

  // Data for charts
  const pieData = [
    { name: 'مكتملة', value: 65, color: '#10B981' },
    { name: 'قيد التنفيذ', value: 25, color: '#F59E0B' },
    { name: 'متأخرة', value: 10, color: '#EF4444' }
  ];

  const monthlyData = [
    { month: 'يناير', revenue: 45000, expenses: 32000, profit: 13000 },
    { month: 'فبراير', revenue: 52000, expenses: 38000, profit: 14000 },
    { month: 'مارس', revenue: 48000, expenses: 35000, profit: 13000 },
    { month: 'أبريل', revenue: 61000, expenses: 42000, profit: 19000 },
    { month: 'مايو', revenue: 55000, expenses: 40000, profit: 15000 },
    { month: 'يونيو', revenue: 67000, expenses: 45000, profit: 22000 }
  ];

  const statCards = [
    {
      title: 'إجمالي المراحل',
      value: stats.totalStages,
      icon: Layers,
      change: '+12%',
      isPositive: true,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'عدد الشركاء',
      value: stats.totalPartners,
      icon: Users,
      change: '+5%',
      isPositive: true,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'عدد الموردين',
      value: stats.totalSuppliers,
      icon: Users,
      change: '+8%',
      isPositive: true,
      gradient: 'from-orange-500 to-red-500'
    },
    {
      title: 'إجمالي المدفوعات',
      value: `${stats.totalPayments.toLocaleString('ar-EG')}`,
      unit: 'جنيه',
      icon: DollarSign,
      change: '+18%',
      isPositive: true,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      title: 'رصيد الخزينة',
      value: `${stats.totalTreasury.toLocaleString('ar-EG')}`,
      unit: 'جنيه',
      icon: Wallet,
      change: '+22%',
      isPositive: true,
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      title: 'التسويات المعلقة',
      value: stats.pendingSettlements,
      icon: AlertCircle,
      change: '-3',
      isPositive: false,
      gradient: 'from-red-500 to-pink-500'
    }
  ];

  const recentActivities = [
    { id: 1, type: 'payment', message: 'دفعة جديدة من أحمد محمد', amount: 5000, time: 'منذ 5 دقائق', status: 'success' },
    { id: 2, type: 'stage', message: 'تم إضافة مرحلة الأساسات', amount: null, time: 'منذ 15 دقيقة', status: 'info' },
    { id: 3, type: 'settlement', message: 'تسوية معلقة تحتاج مراجعة', amount: 3000, time: 'منذ ساعة', status: 'warning' },
    { id: 4, type: 'supplier', message: 'دفعة لمورد الحديد', amount: 8000, time: 'منذ ساعتين', status: 'success' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              لوحة التحكم
            </h1>
            <p className="text-gray-600 mt-2">مرحباً بك في النظام المتقدم لإدارة المشاريع</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="text-sm text-gray-500">آخر تحديث</p>
              <p className="text-lg font-bold">{new Date().toLocaleString('ar-EG')}</p>
            </div>
            <button className="btn-primary">
              <Eye className="w-5 h-5 ml-2" />
              عرض التقرير الكامل
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="stat-card stat-card-blue group hover:scale-105">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold ${card.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {card.isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {card.change}
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-semibold mb-1">{card.title}</h3>
              <p className="text-3xl font-black text-gray-900">
                {card.value}
                {card.unit && <span className="text-lg text-gray-600 mr-1">{card.unit}</span>}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            حالة المراحل
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            الأداء المالي الشهري
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
              <Area type="monotone" dataKey="expenses" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Stats */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6">مؤشرات الأداء</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">معدل الإنجاز</span>
                <span className="text-sm font-bold text-blue-600">78%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">استخدام الميزانية</span>
                <span className="text-sm font-bold text-green-600">65%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '65%', background: 'linear-gradient(to right, #10b981, #059669)' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">رضا العملاء</span>
                <span className="text-sm font-bold text-purple-600">92%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '92%', background: 'linear-gradient(to right, #a855f7, #7c3aed)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            النشاطات الأخيرة
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow group-hover:scale-110 transition-transform ${
                  activity.status === 'success' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                  activity.status === 'warning' ? 'bg-gradient-to-br from-yellow-400 to-orange-600' :
                  'bg-gradient-to-br from-blue-400 to-blue-600'
                }`}>
                  {activity.status === 'success' ? <CheckCircle className="w-5 h-5 text-white" /> :
                   activity.status === 'warning' ? <AlertCircle className="w-5 h-5 text-white" /> :
                   <Clock className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{activity.message}</p>
                  {activity.amount && (
                    <p className="text-sm font-semibold text-gray-600 mt-1">
                      {activity.amount.toLocaleString('ar-EG')} جنيه
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}