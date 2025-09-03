import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "نظام إدارة المشاريع والشركاء - الإصدار الاحترافي",
  description: "نظام احترافي متكامل لإدارة المشاريع والشركاء والموردين مع التسويات التلقائية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="main-content flex-1 animate-fadeIn">
            {children}
          </main>
        </div>
        
        {/* Floating Action Button */}
        <div className="fab group">
          <PlusIcon />
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
              إضافة سريعة
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

function PlusIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}