# دليل نشر التطبيق على Render

## الخطوات:

### 1. إنشاء حساب على Render
- اذهب إلى [render.com](https://render.com)
- أنشئ حساب جديد أو سجل دخول

### 2. رفع الكود على GitHub
```bash
# إنشاء مستودع جديد على GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/project-management.git
git push -u origin main
```

### 3. إنشاء خدمة جديدة على Render

1. من لوحة التحكم، اضغط على **"New +"** ثم **"Web Service"**
2. اربط حسابك على GitHub إذا لم يكن مربوطاً
3. اختر المستودع `project-management`
4. املأ البيانات التالية:

   - **Name**: `project-management` (أو أي اسم تريده)
   - **Region**: اختر الأقرب لك
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: 
     ```
     npm install && npm run build
     ```
   - **Start Command**: 
     ```
     npm start
     ```

### 4. إضافة متغيرات البيئة

في قسم **Environment Variables**، أضف:

```
DATABASE_URL = postgresql://neondb_owner:npg_rxk2aBu6VcNz@ep-orange-hat-adtkjsbe-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### 5. النشر

1. اضغط على **"Create Web Service"**
2. انتظر حتى يكتمل البناء والنشر (5-10 دقائق)
3. بعد الانتهاء، ستحصل على رابط مثل:
   ```
   https://project-management.onrender.com
   ```

## أوامر Git المطلوبة:

```bash
# تهيئة Git
git init

# إضافة جميع الملفات
git add .

# عمل commit
git commit -m "Initial commit - Project Management System"

# إضافة remote repository (استبدل YOUR_USERNAME باسم المستخدم الخاص بك)
git remote add origin https://github.com/YOUR_USERNAME/project-management.git

# رفع الكود
git push -u origin main
```

## تهيئة قاعدة البيانات (اختياري):

بعد نشر التطبيق، إذا احتجت لتهيئة الجداول يدوياً، يمكنك زيارة:
```
https://[اسم-التطبيق].onrender.com/api/init
```

## ملاحظات مهمة:

1. **قاعدة البيانات**: التطبيق مُعد للعمل مع PostgreSQL على Neon
2. **البناء**: قد يستغرق البناء الأول 5-10 دقائق
3. **السكون**: الخدمة المجانية قد تدخل في وضع السكون بعد 15 دقيقة من عدم الاستخدام
4. **الأداء**: أول طلب بعد السكون قد يستغرق 30 ثانية

## حل المشاكل الشائعة:

### إذا فشل البناء:
- تأكد من أن `package.json` يحتوي على جميع المكتبات المطلوبة
- تحقق من سجلات البناء في Render Dashboard

### إذا لم تعمل قاعدة البيانات:
- تأكد من أن `DATABASE_URL` صحيح
- تحقق من أن قاعدة البيانات على Neon نشطة

### إذا ظهرت أخطاء 500:
- افحص السجلات في Render Dashboard
- تأكد من أن جميع متغيرات البيئة مُعرَّفة

## الرابط النهائي:
بعد النشر الناجح، يمكنك الوصول للتطبيق على:
```
https://[اسم-التطبيق].onrender.com
```