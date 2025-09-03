# نظام إدارة مشاريع البناء

نظام متكامل لإدارة مشاريع البناء مع إدارة المراحل والشركاء والموردين والمدفوعات والتسويات.

## المميزات

- ✅ إدارة متعددة للمشاريع
- ✅ إدارة مراحل البناء لكل مشروع
- ✅ إدارة الشركاء ونسب المساهمة
- ✅ إدارة الموردين والمواد
- ✅ نظام المدفوعات (القبض والصرف)
- ✅ خزينة موحدة لكل مشروع
- ✅ نظام التسويات بين الشركاء
- ✅ التقارير المالية الشاملة
- ✅ واجهة مستخدم عربية حديثة

## التقنيات المستخدمة

- **Next.js 15** - إطار العمل الرئيسي
- **TypeScript** - للكتابة الآمنة
- **PostgreSQL** - قاعدة البيانات (Neon)
- **Tailwind CSS** - للتصميم
- **React Hot Toast** - للإشعارات

## التثبيت والتشغيل

### المتطلبات
- Node.js 18 أو أحدث
- npm أو yarn

### خطوات التثبيت

1. استنساخ المشروع:
```bash
git clone [repository-url]
cd construction-management
```

2. إعداد قاعدة البيانات:
- أنشئ حساب على [Neon](https://neon.tech) أو استخدم أي قاعدة بيانات PostgreSQL
- انسخ ملف `.env.example` إلى `.env`
- أضف رابط قاعدة البيانات في ملف `.env`

3. تثبيت المكتبات:
```bash
npm install
```

4. تشغيل المشروع في وضع التطوير:
```bash
npm run dev
```

5. فتح المتصفح على:
```
http://localhost:3000
```

## البناء للإنتاج

```bash
npm run build
npm run start
```

## النشر على Render

1. إنشاء حساب على [Render.com](https://render.com)
2. ربط المستودع من GitHub
3. اختيار "Web Service"
4. استخدام الإعدادات التالية:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Environment Variables:
     - `NODE_ENV`: production
     - `PORT`: 10000
     - `DATABASE_URL`: رابط قاعدة البيانات PostgreSQL

## هيكل المشروع

```
construction-management/
├── app/                    # صفحات التطبيق
│   ├── api/               # نقاط النهاية API
│   ├── projects/          # صفحات المشاريع
│   ├── partners/          # صفحات الشركاء
│   ├── suppliers/         # صفحات الموردين
│   └── ...
├── components/            # المكونات المشتركة
├── lib/                   # المكتبات والأدوات
│   └── db/               # قاعدة البيانات
├── public/               # الملفات العامة
└── ...
```

## قاعدة البيانات

النظام يستخدم PostgreSQL (Neon) مع الجداول التالية:
- **projects** - المشاريع
- **phases** - مراحل البناء
- **partners** - الشركاء
- **suppliers** - الموردين
- **materials** - المواد والبنود
- **payments** - المدفوعات
- **settlements** - التسويات
- **treasury_logs** - سجل الخزينة

## الأمان

- قاعدة البيانات PostgreSQL محمية بـ SSL
- التحقق من صحة المدخلات
- حماية من SQL Injection
- استخدام Prepared Statements

## الدعم

للمساعدة أو الإبلاغ عن مشاكل، يرجى فتح Issue على GitHub.

## الترخيص

هذا المشروع مرخص تحت رخصة MIT.