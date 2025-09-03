#!/usr/bin/env python3
"""
سكريبت لتحديث قاعدة البيانات لدعم النظام الهرمي للعملاء والموردين
"""

import os
from sqlalchemy import create_engine, text
from database import Base, SessionLocal, Customer, Supplier, init_db

# إعداد قاعدة البيانات
DATABASE_URL = os.environ.get('DATABASE_URL', 
    'postgresql://neondb_owner:npg_gP3a1ldnEBeb@ep-bold-butterfly-adx98o9c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

print("بدء تحديث قاعدة البيانات للنظام الهرمي...")

try:
    with engine.connect() as conn:
        # ========== تحديث جدول العملاء ==========
        print("\n📋 تحديث جدول العملاء...")
        
        # التحقق من وجود الأعمدة الجديدة للعملاء
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='customers' AND column_name IN ('parent_customer_id', 'is_group', 'level')
        """))
        
        existing_columns = [row[0] for row in result]
        
        # إضافة الأعمدة غير الموجودة للعملاء
        if 'parent_customer_id' not in existing_columns:
            conn.execute(text("ALTER TABLE customers ADD COLUMN parent_customer_id INTEGER REFERENCES customers(id)"))
            print("✅ تم إضافة عمود parent_customer_id للعملاء")
            
        if 'is_group' not in existing_columns:
            conn.execute(text("ALTER TABLE customers ADD COLUMN is_group BOOLEAN DEFAULT FALSE"))
            print("✅ تم إضافة عمود is_group للعملاء")
            
        if 'level' not in existing_columns:
            conn.execute(text("ALTER TABLE customers ADD COLUMN level INTEGER DEFAULT 0"))
            print("✅ تم إضافة عمود level للعملاء")
        
        # ========== تحديث جدول الموردين ==========
        print("\n📦 تحديث جدول الموردين...")
        
        # التحقق من وجود الأعمدة الجديدة للموردين
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='suppliers' AND column_name IN ('parent_supplier_id', 'is_group', 'level')
        """))
        
        existing_columns = [row[0] for row in result]
        
        # إضافة الأعمدة غير الموجودة للموردين
        if 'parent_supplier_id' not in existing_columns:
            conn.execute(text("ALTER TABLE suppliers ADD COLUMN parent_supplier_id INTEGER REFERENCES suppliers(id)"))
            print("✅ تم إضافة عمود parent_supplier_id للموردين")
            
        if 'is_group' not in existing_columns:
            conn.execute(text("ALTER TABLE suppliers ADD COLUMN is_group BOOLEAN DEFAULT FALSE"))
            print("✅ تم إضافة عمود is_group للموردين")
            
        if 'level' not in existing_columns:
            conn.execute(text("ALTER TABLE suppliers ADD COLUMN level INTEGER DEFAULT 0"))
            print("✅ تم إضافة عمود level للموردين")
        
        conn.commit()
    
    # إنشاء أمثلة للعملاء والموردين
    db = SessionLocal()
    
    # ========== إنشاء عملاء مثال ==========
    print("\n👥 إنشاء عملاء مثال...")
    
    # التحقق من وجود شركة عملاء مثال
    customer_group = db.query(Customer).filter_by(name="مجموعة الأمل التجارية", is_group=True).first()
    
    if not customer_group:
        # إنشاء شركة عملاء رئيسية
        customer_group = Customer(
            name="مجموعة الأمل التجارية",
            phone="01000000001",
            address="القاهرة - مصر",
            is_group=True,
            level=0
        )
        db.add(customer_group)
        db.commit()
        print("✅ تم إنشاء مجموعة الأمل التجارية (عملاء)")
        
        # إنشاء فروع للعملاء
        branches = [
            {"name": "فرع القاهرة", "phone": "01000000002", "address": "القاهرة - وسط البلد"},
            {"name": "فرع الإسكندرية", "phone": "01000000003", "address": "الإسكندرية - سموحة"},
            {"name": "فرع أسيوط", "phone": "01000000004", "address": "أسيوط - المركز"}
        ]
        
        for branch_data in branches:
            branch = Customer(
                name=branch_data["name"],
                phone=branch_data["phone"],
                address=branch_data["address"],
                parent_customer_id=customer_group.id,
                is_group=False,
                level=1
            )
            db.add(branch)
            print(f"✅ تم إنشاء {branch_data['name']}")
        
        db.commit()
    
    # ========== إنشاء موردين مثال ==========
    print("\n🚚 إنشاء موردين مثال...")
    
    # التحقق من وجود شركة موردين مثال
    supplier_group = db.query(Supplier).filter_by(name="شركة النور للتوريدات", is_group=True).first()
    
    if not supplier_group:
        # إنشاء شركة موردين رئيسية
        supplier_group = Supplier(
            name="شركة النور للتوريدات",
            phone="02000000001",
            address="القاهرة - المنطقة الصناعية",
            is_group=True,
            level=0
        )
        db.add(supplier_group)
        db.commit()
        print("✅ تم إنشاء شركة النور للتوريدات (موردين)")
        
        # إنشاء فروع للموردين
        branches = [
            {"name": "مصنع المنتجات الغذائية", "phone": "02000000002", "address": "6 أكتوبر"},
            {"name": "مركز التوزيع الرئيسي", "phone": "02000000003", "address": "العبور"},
            {"name": "مخازن الجملة", "phone": "02000000004", "address": "السويس"}
        ]
        
        for branch_data in branches:
            branch = Supplier(
                name=branch_data["name"],
                phone=branch_data["phone"],
                address=branch_data["address"],
                parent_supplier_id=supplier_group.id,
                is_group=False,
                level=1
            )
            db.add(branch)
            print(f"✅ تم إنشاء {branch_data['name']}")
        
        db.commit()
    
    db.close()
    
    print("\n" + "="*50)
    print("✅ تم تحديث قاعدة البيانات بنجاح!")
    print("🎯 النظام الهرمي جاهز للاستخدام:")
    print("   - الخزائن المتدرجة ✓")
    print("   - العملاء المتدرجة ✓")
    print("   - الموردين المتدرجة ✓")
    print("="*50)
    
except Exception as e:
    print(f"❌ خطأ: {e}")
    import traceback
    traceback.print_exc()