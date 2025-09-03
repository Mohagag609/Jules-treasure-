import type { Metadata } from "next";
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #1f2937;
            font-weight: 500;
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-weight: 800;
            color: #111827;
          }
          
          p {
            color: #374151;
            font-weight: 500;
          }
          
          .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 16px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 24px;
            transition: all 0.3s ease;
          }
          
          .glass-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.25);
          }
          
          .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px 0 rgba(102, 126, 234, 0.4);
          }
          
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px 0 rgba(102, 126, 234, 0.6);
          }
          
          .sidebar {
            position: fixed;
            right: 0;
            top: 0;
            width: 280px;
            height: 100vh;
            background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
            overflow-y: auto;
            z-index: 1000;
          }
          
          .main-content {
            margin-right: 280px;
            padding: 24px;
            min-height: 100vh;
          }
          
          .stat-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            border-top: 4px solid;
          }
          
          .stat-card:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          }
          
          .gradient-text {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .progress-bar {
            width: 100%;
            height: 12px;
            background: #e5e7eb;
            border-radius: 999px;
            overflow: hidden;
          }
          
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 999px;
            transition: width 0.5s ease;
          }
          
          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(100%);
              width: 100%;
            }
            
            .sidebar.open {
              transform: translateX(0);
            }
            
            .main-content {
              margin-right: 0;
            }
          }
          
          ::-webkit-scrollbar {
            width: 10px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
          }
        `}</style>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main className="main-content" style={{ flex: 1, marginRight: '280px', padding: '24px' }}>
            {children}
          </main>
        </div>
        
        {/* Floating Action Button */}
        <div style={{
          position: 'fixed',
          bottom: '32px',
          left: '32px',
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}>
          <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </body>
    </html>
  );
}