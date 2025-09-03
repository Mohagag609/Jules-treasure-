#!/bin/bash

echo "🚀 بدء إعداد نظام إدارة مشاريع البناء..."
echo "========================================"

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. الرجاء تثبيت Node.js 18+ أولاً"
    exit 1
fi

# التحقق من وجود PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL غير مثبت أو غير موجود في PATH"
    echo "   الرجاء التأكد من تثبيت PostgreSQL وإعداد قاعدة البيانات يدوياً"
fi

# إنشاء ملف .env إذا لم يكن موجوداً
if [ ! -f .env ]; then
    echo "📝 إنشاء ملف .env من .env.example..."
    cp .env.example .env
    echo "⚠️  الرجاء تحديث ملف .env بمعلومات قاعدة البيانات الخاصة بك"
    echo "   افتح الملف وقم بتعديل DATABASE_URL"
    read -p "اضغط Enter بعد تحديث ملف .env..."
fi

# تثبيت التبعيات
echo "📦 تثبيت التبعيات..."
npm install

# تشغيل migration لقاعدة البيانات
echo "🗄️  تشغيل migration لقاعدة البيانات..."
npm run db:migrate

if [ $? -eq 0 ]; then
    echo "✅ تم إعداد قاعدة البيانات بنجاح"
else
    echo "❌ فشل إعداد قاعدة البيانات. الرجاء التحقق من إعدادات DATABASE_URL"
    exit 1
fi

# بناء التطبيق
echo "🔨 بناء التطبيق..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ تم بناء التطبيق بنجاح"
else
    echo "❌ فشل بناء التطبيق"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ تم إعداد النظام بنجاح!"
echo ""
echo "لتشغيل التطبيق:"
echo "  وضع التطوير: npm run dev"
echo "  وضع الإنتاج: npm start"
echo ""
echo "التطبيق سيعمل على: http://localhost:3000"
echo "========================================"