import type { Metadata } from "next";
import { Cairo } from 'next/font/google';
import "./globals.css";
import Sidebar from '@/components/Sidebar';
import { Toaster } from 'react-hot-toast';

// Auto-initialize database on production
if (process.env.NODE_ENV === 'production') {
  import('@/lib/db/auto-init');
}

const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: "نظام إدارة مشاريع البناء",
  description: "نظام متكامل لإدارة مشاريع البناء والمدفوعات والتسويات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans antialiased bg-gray-50`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
