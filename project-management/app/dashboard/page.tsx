'use client';

import { useState } from 'react';
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

export default function DashboardPage() {
  const [stats] = useState({
    totalStages: 8,
    totalPartners: 12,
    totalSuppliers: 15,
    totalPayments: 245000,
    totalTreasury: 185000,
    pendingSettlements: 3
  });

  const statCards = [
    {
      title: 'إجمالي المراحل',
      value: stats.totalStages,
      icon: Layers,
      change: '+12%',
      isPositive: true,
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      title: 'عدد الشركاء',
      value: stats.totalPartners,
      icon: Users,
      change: '+5%',
      isPositive: true,
      color: '#A855F7',
      bgColor: '#FAF5FF'
    },
    {
      title: 'عدد الموردين',
      value: stats.totalSuppliers,
      icon: Users,
      change: '+8%',
      isPositive: true,
      color: '#F97316',
      bgColor: '#FFF7ED'
    },
    {
      title: 'إجمالي المدفوعات',
      value: `${stats.totalPayments.toLocaleString('ar-EG')}`,
      unit: 'جنيه',
      icon: DollarSign,
      change: '+18%',
      isPositive: true,
      color: '#10B981',
      bgColor: '#F0FDF4'
    },
    {
      title: 'رصيد الخزينة',
      value: `${stats.totalTreasury.toLocaleString('ar-EG')}`,
      unit: 'جنيه',
      icon: Wallet,
      change: '+22%',
      isPositive: true,
      color: '#06B6D4',
      bgColor: '#F0FDFA'
    },
    {
      title: 'التسويات المعلقة',
      value: stats.pendingSettlements,
      icon: AlertCircle,
      change: '-3',
      isPositive: false,
      color: '#EF4444',
      bgColor: '#FEF2F2'
    }
  ];

  const recentActivities = [
    { id: 1, type: 'payment', message: 'دفعة جديدة من أحمد محمد', amount: 5000, time: 'منذ 5 دقائق', status: 'success' },
    { id: 2, type: 'stage', message: 'تم إضافة مرحلة الأساسات', amount: null, time: 'منذ 15 دقيقة', status: 'info' },
    { id: 3, type: 'settlement', message: 'تسوية معلقة تحتاج مراجعة', amount: 3000, time: 'منذ ساعة', status: 'warning' },
    { id: 4, type: 'supplier', message: 'دفعة لمورد الحديد', amount: 8000, time: 'منذ ساعتين', status: 'success' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div className="glass-card" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              لوحة التحكم
            </h1>
            <p style={{ color: '#6B7280', marginTop: '8px', fontSize: '16px', fontWeight: 600 }}>
              مرحباً بك في النظام المتقدم لإدارة المشاريع
            </p>
          </div>
          <button className="btn-primary" style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px'
          }}>
            <Eye style={{ width: '20px', height: '20px' }} />
            عرض التقرير
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="stat-card" style={{
              background: card.bgColor,
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderTop: `4px solid ${card.color}`,
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}cc 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 15px ${card.color}40`
                }}>
                  <Icon style={{ width: '24px', height: '24px', color: 'white' }} />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: card.isPositive ? '#10B981' : '#EF4444'
                }}>
                  {card.isPositive ? <ArrowUp style={{ width: '16px', height: '16px' }} /> : <ArrowDown style={{ width: '16px', height: '16px' }} />}
                  {card.change}
                </div>
              </div>
              <h3 style={{ color: '#6B7280', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{card.title}</h3>
              <p style={{ fontSize: '28px', fontWeight: 900, color: '#111827' }}>
                {card.value}
                {card.unit && <span style={{ fontSize: '16px', color: '#6B7280', marginRight: '4px' }}> {card.unit}</span>}
              </p>
            </div>
          );
        })}
      </div>

      {/* Progress Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Progress Stats */}
        <div className="glass-card" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px', color: '#111827' }}>مؤشرات الأداء</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>معدل الإنجاز</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#3B82F6' }}>78%</span>
              </div>
              <div className="progress-bar" style={{
                width: '100%',
                height: '12px',
                background: '#E5E7EB',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div className="progress-fill" style={{
                  width: '78%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #3B82F6 0%, #A855F7 100%)',
                  borderRadius: '999px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>استخدام الميزانية</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#10B981' }}>65%</span>
              </div>
              <div className="progress-bar" style={{
                width: '100%',
                height: '12px',
                background: '#E5E7EB',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div className="progress-fill" style={{
                  width: '65%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                  borderRadius: '999px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>رضا العملاء</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#A855F7' }}>92%</span>
              </div>
              <div className="progress-bar" style={{
                width: '100%',
                height: '12px',
                background: '#E5E7EB',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div className="progress-fill" style={{
                  width: '92%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #A855F7 0%, #EC4899 100%)',
                  borderRadius: '999px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="glass-card" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity style={{ width: '20px', height: '20px', color: '#A855F7' }} />
            النشاطات الأخيرة
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '256px', overflowY: 'auto' }}>
            {recentActivities.map((activity) => (
              <div key={activity.id} style={{
                display: 'flex',
                alignItems: 'start',
                gap: '12px',
                padding: '12px',
                borderRadius: '12px',
                background: '#F9FAFB',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F3F4F6';
                e.currentTarget.style.transform = 'translateX(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F9FAFB';
                e.currentTarget.style.transform = 'translateX(0)';
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: activity.status === 'success' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' :
                             activity.status === 'warning' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' :
                             'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                }}>
                  {activity.status === 'success' ? <CheckCircle style={{ width: '20px', height: '20px', color: 'white' }} /> :
                   activity.status === 'warning' ? <AlertCircle style={{ width: '20px', height: '20px', color: 'white' }} /> :
                   <Clock style={{ width: '20px', height: '20px', color: 'white' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{activity.message}</p>
                  {activity.amount && (
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#6B7280', marginTop: '4px' }}>
                      {activity.amount.toLocaleString('ar-EG')} جنيه
                    </p>
                  )}
                  <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px', fontWeight: 500 }}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}