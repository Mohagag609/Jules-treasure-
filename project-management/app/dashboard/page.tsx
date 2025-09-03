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
  Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStages: 0,
    totalPartners: 0,
    totalSuppliers: 0,
    totalPayments: 0,
    totalTreasury: 0,
    pendingSettlements: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // جلب البيانات من APIs
      const stagesRes = await fetch('/api/stages');
      const stages = await stagesRes.json();
      
      setStats({
        totalStages: stages.length || 0,
        totalPartners: 12,
        totalSuppliers: 8,
        totalPayments: 145000,
        totalTreasury: 85000,
        pendingSettlements: 3
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // بيانات وهمية للرسوم البيانية
  const pieData = [
    { name: 'مكتملة', value: 65, color: '#10B981' },
    { name: 'قيد التنفيذ', value: 25, color: '#F59E0B' },
    { name: 'متأخرة', value: 10, color: '#EF4444' }
  ];

  const barData = [
    { month: 'يناير', income: 45000, expenses: 32000 },
    { month: 'فبراير', income: 52000, expenses: 38000 },
    { month: 'مارس', income: 48000, expenses: 35000 },
    { month: 'أبريل', income: 61000, expenses: 42000 },
    { month: 'مايو', income: 55000, expenses: 40000 },
    { month: 'يونيو', income: 67000, expenses: 45000 }
  ];

  const lineData = [
    { day: 'الأحد', amount: 12000 },
    { day: 'الإثنين', amount: 15000 },
    { day: 'الثلاثاء', amount: 18000 },
    { day: 'الأربعاء', amount: 14000 },
    { day: 'الخميس', amount: 22000 },
    { day: 'الجمعة', amount: 19000 },
    { day: 'السبت', amount: 16000 }
  ];

  const statCards = [
    {
      title: 'إجمالي المراحل',
      value: stats.totalStages,
      icon: Layers,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      change: '+12%',
      isPositive: true
    },
    {
      title: 'عدد الشركاء',
      value: stats.totalPartners,
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      change: '+5%',
      isPositive: true
    },
    {
      title: 'عدد الموردين',
      value: stats.totalSuppliers,
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      change: '+8%',
      isPositive: true
    },
    {
      title: 'إجمالي المدفوعات',
      value: `${stats.totalPayments.toLocaleString('ar-EG')} جنيه`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      change: '+18%',
      isPositive: true
    },
    {
      title: 'رصيد الخزينة',
      value: `${stats.totalTreasury.toLocaleString('ar-EG')} جنيه`,
      icon: Wallet,
      color: 'bg-cyan-500',
      bgColor: 'bg-cyan-50',
      change: '+22%',
      isPositive: true
    },
    {
      title: 'التسويات المعلقة',
      value: stats.pendingSettlements,
      icon: AlertCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      change: '-3',
      isPositive: false
    }
  ];

  const recentActivities = [
    { id: 1, type: 'payment', message: 'دفعة جديدة من أحمد محمد', amount: 5000, time: 'منذ 5 دقائق', status: 'success' },
    { id: 2, type: 'stage', message: 'تم إضافة مرحلة الأساسات', amount: null, time: 'منذ 15 دقيقة', status: 'info' },
    { id: 3, type: 'settlement', message: 'تسوية معلقة تحتاج مراجعة', amount: 3000, time: 'منذ ساعة', status: 'warning' },
    { id: 4, type: 'supplier', message: 'دفعة لمورد الحديد', amount: 8000, time: 'منذ ساعتين', status: 'success' },
    { id: 5, type: 'partner', message: 'تم إضافة شريك جديد', amount: null, time: 'منذ 3 ساعات', status: 'info' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-gray-500 mt-1">نظرة عامة على أداء المشروع</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">آخر تحديث:</span>
            <span className="text-sm font-medium">{new Date().toLocaleString('ar-EG')}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 text-white ${card.color.replace('bg-', 'text-').replace('500', '600')}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${card.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {card.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {card.change}
                </div>
              </div>
              <h3 className="text-gray-500 text-sm mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold mb-4">حالة المراحل</h3>
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

        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">الإيرادات والمصروفات الشهرية</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name="الإيرادات" />
              <Bar dataKey="expenses" fill="#EF4444" name="المصروفات" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold mb-4">التدفق النقدي الأسبوعي</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">النشاطات الأخيرة</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition">
                <div className={`p-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-100' :
                  activity.status === 'warning' ? 'bg-yellow-100' :
                  'bg-blue-100'
                }`}>
                  {activity.status === 'success' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                   activity.status === 'warning' ? <AlertCircle className="w-4 h-4 text-yellow-600" /> :
                   <Clock className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  {activity.amount && (
                    <p className="text-sm text-gray-500">{activity.amount.toLocaleString('ar-EG')} جنيه</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}