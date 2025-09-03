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
    color: '#3B82F6'
  },
  {
    title: 'لوحة التحكم',
    icon: BarChart3,
    href: '/dashboard',
    color: '#A855F7'
  },
  {
    title: 'الإدخال السريع',
    icon: PlusCircle,
    href: '/quick-entry',
    color: '#10B981'
  },
  {
    title: 'المراحل',
    icon: Layers,
    href: '/stages',
    color: '#6366F1'
  },
  {
    title: 'الشركاء',
    icon: Users,
    href: '/partners',
    color: '#F97316'
  },
  {
    title: 'الموردين',
    icon: Truck,
    href: '/suppliers',
    color: '#EF4444'
  },
  {
    title: 'المدفوعات',
    icon: DollarSign,
    href: '/payments',
    color: '#10B981'
  },
  {
    title: 'التسويات',
    icon: HandshakeIcon,
    href: '/settlements',
    color: '#F59E0B'
  },
  {
    title: 'الخزينة',
    icon: Wallet,
    href: '/treasury',
    color: '#06B6D4'
  },
  {
    title: 'التقارير',
    icon: FileText,
    href: '/reports',
    color: '#EC4899'
  },
  {
    title: 'الإعدادات',
    icon: Settings,
    href: '/settings',
    color: '#6B7280'
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const sidebarStyle = {
    position: 'fixed' as const,
    right: 0,
    top: 0,
    width: '280px',
    height: '100vh',
    background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
    boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
    overflowY: 'auto' as const,
    zIndex: 1000,
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease'
  };

  const desktopSidebarStyle = {
    ...sidebarStyle,
    transform: 'translateX(0)'
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 1100,
          padding: '12px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          border: 'none',
          cursor: 'pointer'
        }}
        className="md:hidden"
      >
        {isOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
      </button>

      {/* Sidebar */}
      <aside style={typeof window !== 'undefined' && window.innerWidth < 768 ? sidebarStyle : desktopSidebarStyle}>
        {/* Logo Section */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
            }}>
              <Building2 style={{ width: '32px', height: '32px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900, color: 'white' }}>إدارة المشاريع</h1>
              <p style={{ fontSize: '12px', color: '#9CA3AF' }}>النظام المتقدم v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href} style={{ marginBottom: '8px' }}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      textDecoration: 'none',
                      background: isActive ? `linear-gradient(135deg, ${item.color} 0%, ${item.color}cc 100%)` : 'transparent',
                      boxShadow: isActive ? `0 4px 15px ${item.color}40` : 'none',
                      transform: isActive ? 'translateX(-5px)' : 'translateX(0)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'translateX(-5px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}cc 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 15px ${item.color}40`
                    }}>
                      <Icon style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: 'white'
                    }}>
                      {item.title}
                    </span>
                    {isActive && (
                      <div style={{ marginRight: 'auto' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          background: 'white',
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite'
                        }} />
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px' }}>تم التطوير بواسطة</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>فريق التطوير المتقدم</div>
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#10B981',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{ fontSize: '12px', color: '#10B981' }}>النظام يعمل</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          style={{
            display: typeof window !== 'undefined' && window.innerWidth < 768 ? 'block' : 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}