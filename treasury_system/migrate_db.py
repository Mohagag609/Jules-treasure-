#!/usr/bin/env python3
"""
سكريبت لتحديث قاعدة البيانات لدعم نظام الخزائن المتدرج
"""

import os
from sqlalchemy import create_engine, text
from database import Base, SessionLocal, Safe, init_db

# إعداد قاعدة البيانات
DATABASE_URL = os.environ.get('DATABASE_URL', 
    'postgresql://neondb_owner:npg_gP3a1ldnEBeb@ep-bold-butterfly-adx98o9c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

print("بدء تحديث قاعدة البيانات...")

try:
    # إضافة الأعمدة الجديدة إذا لم تكن موجودة
    with engine.connect() as conn:
        # التحقق من وجود الأعمدة الجديدة
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='safes' AND column_name IN ('parent_safe_id', 'is_container', 'level')
        """))
        
        existing_columns = [row[0] for row in result]
        
        # إضافة الأعمدة غير الموجودة
        if 'parent_safe_id' not in existing_columns:
            conn.execute(text("ALTER TABLE safes ADD COLUMN parent_safe_id INTEGER REFERENCES safes(id)"))
            print("✅ تم إضافة عمود parent_safe_id")
            
        if 'is_container' not in existing_columns:
            conn.execute(text("ALTER TABLE safes ADD COLUMN is_container BOOLEAN DEFAULT FALSE"))
            print("✅ تم إضافة عمود is_container")
            
        if 'level' not in existing_columns:
            conn.execute(text("ALTER TABLE safes ADD COLUMN level INTEGER DEFAULT 0"))
            print("✅ تم إضافة عمود level")
        
        conn.commit()
    
    # إنشاء خزينة حاوية مثال
    db = SessionLocal()
    
    # التحقق من وجود خزينة حاوية
    container_safe = db.query(Safe).filter_by(name="خزينة السلام", is_container=True).first()
    
    if not container_safe:
        # إنشاء خزينة حاوية رئيسية
        container_safe = Safe(
            name="خزينة السلام",
            type="main",
            is_container=True,
            level=0,
            is_main=False
        )
        db.add(container_safe)
        db.commit()
        print("✅ تم إنشاء خزينة السلام (حاوية)")
        
        # إنشاء خزائن فرعية تحتها
        sub_safes = [
            {"name": "صندوق المبيعات النقدية", "type": "sub-branch"},
            {"name": "صندوق مبيعات الفيزا", "type": "sub-branch"},
            {"name": "خزينة الطوارئ", "type": "sub-branch"}
        ]
        
        for sub_safe_data in sub_safes:
            sub_safe = Safe(
                name=sub_safe_data["name"],
                type=sub_safe_data["type"],
                parent_safe_id=container_safe.id,
                is_container=False,
                level=1,
                is_main=False
            )
            db.add(sub_safe)
            print(f"✅ تم إنشاء {sub_safe_data['name']}")
        
        db.commit()
    
    db.close()
    print("\n✅ تم تحديث قاعدة البيانات بنجاح!")
    print("يمكنك الآن استخدام نظام الخزائن المتدرج")
    
except Exception as e:
    print(f"❌ خطأ: {e}")
    import traceback
    traceback.print_exc()