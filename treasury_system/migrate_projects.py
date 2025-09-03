#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Migration script لإضافة نظام المشاريع المتكامل
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment variables")
    exit(1)

engine = create_engine(DATABASE_URL)

def create_projects_tables():
    """إنشاء جداول نظام المشاريع"""
    
    with engine.connect() as connection:
        # 1. جدول الشركاء
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS partners (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                phone VARCHAR(50),
                email VARCHAR(100),
                address TEXT,
                national_id VARCHAR(50),
                partner_type VARCHAR(50) DEFAULT 'individual',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # 2. جدول المشاريع
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                safe_id INTEGER REFERENCES safes(id) NOT NULL,
                total_budget FLOAT DEFAULT 0,
                total_invested FLOAT DEFAULT 0,
                total_spent FLOAT DEFAULT 0,
                total_revenue FLOAT DEFAULT 0,
                start_date DATE DEFAULT CURRENT_DATE,
                end_date DATE,
                status VARCHAR(50) DEFAULT 'planning',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # 3. جدول مراحل المشروع
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS project_phases (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                project_id INTEGER REFERENCES projects(id) NOT NULL,
                phase_number INTEGER DEFAULT 1,
                budget FLOAT DEFAULT 0,
                spent FLOAT DEFAULT 0,
                revenue FLOAT DEFAULT 0,
                start_date DATE,
                end_date DATE,
                completion_percentage FLOAT DEFAULT 0,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # 4. جدول الشركاء في المشاريع
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS project_partners (
                id SERIAL PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id),
                partner_id INTEGER REFERENCES partners(id),
                share_percentage FLOAT DEFAULT 0,
                invested_amount FLOAT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_id, partner_id)
            )
        """))
        
        # 5. جدول الموردين في المراحل
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS phase_suppliers (
                id SERIAL PRIMARY KEY,
                phase_id INTEGER REFERENCES project_phases(id),
                supplier_id INTEGER REFERENCES suppliers(id),
                contract_amount FLOAT DEFAULT 0,
                paid_amount FLOAT DEFAULT 0,
                service_type VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(phase_id, supplier_id)
            )
        """))
        
        # 6. جدول مدفوعات الشركاء
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS partner_payments (
                id SERIAL PRIMARY KEY,
                partner_id INTEGER REFERENCES partners(id) NOT NULL,
                project_id INTEGER REFERENCES projects(id) NOT NULL,
                phase_id INTEGER REFERENCES project_phases(id) NOT NULL,
                amount FLOAT NOT NULL,
                payment_type VARCHAR(50),
                description TEXT,
                date DATE DEFAULT CURRENT_DATE,
                voucher_id INTEGER REFERENCES vouchers(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # 7. إضافة أعمدة للسندات لربطها بالمشاريع
        try:
            connection.execute(text("""
                ALTER TABLE vouchers 
                ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id),
                ADD COLUMN IF NOT EXISTS phase_id INTEGER REFERENCES project_phases(id)
            """))
        except:
            print("Columns might already exist in vouchers table")
        
        # 8. إضافة indexes للأداء
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_project_partners_project ON project_partners(project_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_project_partners_partner ON project_partners(partner_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_phase_suppliers_phase ON phase_suppliers(phase_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_phase_suppliers_supplier ON phase_suppliers(supplier_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_partner_payments_partner ON partner_payments(partner_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_partner_payments_project ON partner_payments(project_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS idx_partner_payments_phase ON partner_payments(phase_id)"))
        
        connection.commit()
        print("✅ تم إنشاء جداول نظام المشاريع بنجاح")

def add_sample_data():
    """إضافة بيانات تجريبية"""
    
    with engine.connect() as connection:
        # إضافة شركاء
        connection.execute(text("""
            INSERT INTO partners (name, phone, partner_type)
            VALUES 
            ('أحمد محمد - شريك رئيسي', '01001234567', 'individual'),
            ('شركة النور للاستثمار', '01098765432', 'company'),
            ('محمد علي - شريك', '01011111111', 'individual')
            ON CONFLICT DO NOTHING
        """))
        
        # الحصول على خزينة
        safe = connection.execute(text("SELECT id FROM safes LIMIT 1")).first()
        if safe:
            # إضافة مشروع
            connection.execute(text(f"""
                INSERT INTO projects (name, description, safe_id, total_budget, status)
                VALUES 
                ('مشروع برج السلام السكني', 'مشروع سكني متكامل 100 وحدة', {safe.id}, 10000000, 'active')
                ON CONFLICT DO NOTHING
            """))
            
            # الحصول على المشروع
            project = connection.execute(text("SELECT id FROM projects WHERE name='مشروع برج السلام السكني'")).first()
            if project:
                # إضافة مراحل
                connection.execute(text(f"""
                    INSERT INTO project_phases (name, project_id, phase_number, budget, status)
                    VALUES 
                    ('مرحلة الأساسات', {project.id}, 1, 2000000, 'completed'),
                    ('مرحلة الهيكل الخرساني', {project.id}, 2, 3000000, 'in_progress'),
                    ('مرحلة التشطيبات', {project.id}, 3, 3000000, 'pending'),
                    ('مرحلة التسليم', {project.id}, 4, 2000000, 'pending')
                    ON CONFLICT DO NOTHING
                """))
                
                # ربط الشركاء بالمشروع
                partners = connection.execute(text("SELECT id FROM partners LIMIT 3")).fetchall()
                if partners:
                    connection.execute(text(f"""
                        INSERT INTO project_partners (project_id, partner_id, share_percentage, invested_amount)
                        VALUES 
                        ({project.id}, {partners[0].id}, 50, 5000000),
                        ({project.id}, {partners[1].id}, 30, 3000000),
                        ({project.id}, {partners[2].id}, 20, 2000000)
                        ON CONFLICT DO NOTHING
                    """))
        
        connection.commit()
        print("✅ تم إضافة البيانات التجريبية")

if __name__ == "__main__":
    print("🚀 بدء migration نظام المشاريع...")
    create_projects_tables()
    add_sample_data()
    print("✨ تم الانتهاء بنجاح!")