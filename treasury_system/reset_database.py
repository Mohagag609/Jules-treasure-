#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script to reset and rebuild the database with projects support
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment variables")
    exit(1)

engine = create_engine(DATABASE_URL)

def drop_all_tables():
    """Drop all existing tables"""
    print("🗑️ Dropping existing tables...")
    
    with engine.connect() as connection:
        # Drop tables in reverse order of dependencies
        tables_to_drop = [
            'partner_payments',
            'phase_suppliers', 
            'project_partners',
            'project_phases',
            'projects',
            'partners',
            'vouchers',
            'categories',
            'suppliers',
            'customers',
            'safes'
        ]
        
        for table in tables_to_drop:
            try:
                connection.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
                print(f"  ✓ Dropped table: {table}")
            except Exception as e:
                print(f"  ⚠ Could not drop {table}: {e}")
        
        connection.commit()

def create_all_tables():
    """Create all tables with correct structure"""
    print("\n📦 Creating new tables...")
    
    with engine.connect() as connection:
        # 1. Create Categories table
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("  ✓ Created categories table")
        
        # 2. Create Safes table
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS safes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                type VARCHAR(50),
                balance FLOAT DEFAULT 0,
                is_main BOOLEAN DEFAULT FALSE,
                parent_safe_id INTEGER REFERENCES safes(id),
                is_container BOOLEAN DEFAULT FALSE,
                level INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("  ✓ Created safes table")
        
        # 3. Create Customers table
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                phone VARCHAR(50),
                address TEXT,
                balance FLOAT DEFAULT 0,
                parent_customer_id INTEGER REFERENCES customers(id),
                is_group BOOLEAN DEFAULT FALSE,
                level INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("  ✓ Created customers table")
        
        # 4. Create Suppliers table
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS suppliers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                phone VARCHAR(50),
                address TEXT,
                balance FLOAT DEFAULT 0,
                parent_supplier_id INTEGER REFERENCES suppliers(id),
                is_group BOOLEAN DEFAULT FALSE,
                level INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("  ✓ Created suppliers table")
        
        # 5. Create Partners table
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
        print("  ✓ Created partners table")
        
        # 6. Create Projects table
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
        print("  ✓ Created projects table")
        
        # 7. Create Project Phases table
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
        print("  ✓ Created project_phases table")
        
        # 8. Create Vouchers table (with project fields)
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS vouchers (
                id SERIAL PRIMARY KEY,
                voucher_number VARCHAR(50) UNIQUE NOT NULL,
                voucher_type VARCHAR(50) NOT NULL,
                amount FLOAT NOT NULL,
                description TEXT,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                customer_id INTEGER REFERENCES customers(id),
                supplier_id INTEGER REFERENCES suppliers(id),
                safe_from_id INTEGER REFERENCES safes(id),
                safe_to_id INTEGER REFERENCES safes(id),
                category_id INTEGER REFERENCES categories(id),
                project_id INTEGER REFERENCES projects(id),
                phase_id INTEGER REFERENCES project_phases(id)
            )
        """))
        print("  ✓ Created vouchers table")
        
        # 9. Create Project Partners table
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
        print("  ✓ Created project_partners table")
        
        # 10. Create Phase Suppliers table
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
        print("  ✓ Created phase_suppliers table")
        
        # 11. Create Partner Payments table
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
        print("  ✓ Created partner_payments table")
        
        # Create indexes
        print("\n🔍 Creating indexes...")
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_vouchers_customer ON vouchers(customer_id)",
            "CREATE INDEX IF NOT EXISTS idx_vouchers_supplier ON vouchers(supplier_id)",
            "CREATE INDEX IF NOT EXISTS idx_vouchers_project ON vouchers(project_id)",
            "CREATE INDEX IF NOT EXISTS idx_vouchers_phase ON vouchers(phase_id)",
            "CREATE INDEX IF NOT EXISTS idx_project_partners_project ON project_partners(project_id)",
            "CREATE INDEX IF NOT EXISTS idx_project_partners_partner ON project_partners(partner_id)",
            "CREATE INDEX IF NOT EXISTS idx_phase_suppliers_phase ON phase_suppliers(phase_id)",
            "CREATE INDEX IF NOT EXISTS idx_phase_suppliers_supplier ON phase_suppliers(supplier_id)"
        ]
        
        for idx in indexes:
            connection.execute(text(idx))
        
        connection.commit()
        print("  ✓ Created all indexes")

def insert_sample_data():
    """Insert sample data"""
    print("\n📝 Inserting sample data...")
    
    with engine.connect() as connection:
        # Insert categories
        connection.execute(text("""
            INSERT INTO categories (name, type) VALUES
            ('مبيعات', 'income'),
            ('مشتريات', 'expense'),
            ('رواتب', 'expense'),
            ('إيجار', 'expense'),
            ('خدمات', 'expense')
        """))
        
        # Insert safes hierarchy
        connection.execute(text("""
            INSERT INTO safes (name, type, is_container, level, is_main) VALUES
            ('الخزينة الرئيسية', 'main', true, 0, true)
        """))
        
        main_safe_id = connection.execute(text("SELECT id FROM safes WHERE name='الخزينة الرئيسية'")).first().id
        
        connection.execute(text(f"""
            INSERT INTO safes (name, type, parent_safe_id, level) VALUES
            ('خزينة النقدية', 'sub-branch', {main_safe_id}, 1),
            ('خزينة البنك', 'sub-branch', {main_safe_id}, 1),
            ('خزينة الفيزا', 'sub-branch', {main_safe_id}, 1)
        """))
        
        # Insert customers hierarchy
        connection.execute(text("""
            INSERT INTO customers (name, is_group, level) VALUES
            ('مجموعة الأمل التجارية', true, 0)
        """))
        
        customer_group_id = connection.execute(text("SELECT id FROM customers WHERE name='مجموعة الأمل التجارية'")).first().id
        
        connection.execute(text(f"""
            INSERT INTO customers (name, parent_customer_id, level, phone) VALUES
            ('فرع القاهرة', {customer_group_id}, 1, '01001234567'),
            ('فرع الإسكندرية', {customer_group_id}, 1, '01001234568'),
            ('فرع أسيوط', {customer_group_id}, 1, '01001234569')
        """))
        
        # Insert suppliers hierarchy
        connection.execute(text("""
            INSERT INTO suppliers (name, is_group, level) VALUES
            ('شركة النور للتوريدات', true, 0)
        """))
        
        supplier_group_id = connection.execute(text("SELECT id FROM suppliers WHERE name='شركة النور للتوريدات'")).first().id
        
        connection.execute(text(f"""
            INSERT INTO suppliers (name, parent_supplier_id, level, phone) VALUES
            ('مصنع المنتجات الغذائية', {supplier_group_id}, 1, '01098765432'),
            ('مركز التوزيع الرئيسي', {supplier_group_id}, 1, '01098765433'),
            ('مخازن الجملة', {supplier_group_id}, 1, '01098765434')
        """))
        
        # Insert partners
        connection.execute(text("""
            INSERT INTO partners (name, phone, partner_type) VALUES
            ('أحمد محمد - شريك رئيسي', '01001234567', 'individual'),
            ('شركة النور للاستثمار', '01098765432', 'company'),
            ('محمد علي - شريك', '01011111111', 'individual')
        """))
        
        # Create project safe
        connection.execute(text("""
            INSERT INTO safes (name, type, is_container, level) VALUES
            ('خزينة مشروع برج السلام', 'project', false, 0)
        """))
        
        project_safe_id = connection.execute(text("SELECT id FROM safes WHERE name='خزينة مشروع برج السلام'")).first().id
        
        # Insert project
        connection.execute(text(f"""
            INSERT INTO projects (name, description, safe_id, total_budget, status) VALUES
            ('مشروع برج السلام السكني', 'مشروع سكني متكامل 100 وحدة', {project_safe_id}, 10000000, 'active')
        """))
        
        project_id = connection.execute(text("SELECT id FROM projects WHERE name='مشروع برج السلام السكني'")).first().id
        
        # Insert project phases
        connection.execute(text(f"""
            INSERT INTO project_phases (name, project_id, phase_number, budget, status) VALUES
            ('مرحلة الأساسات', {project_id}, 1, 2000000, 'completed'),
            ('مرحلة الهيكل الخرساني', {project_id}, 2, 3000000, 'in_progress'),
            ('مرحلة التشطيبات', {project_id}, 3, 3000000, 'pending'),
            ('مرحلة التسليم', {project_id}, 4, 2000000, 'pending')
        """))
        
        # Link partners to project
        partners = connection.execute(text("SELECT id FROM partners")).fetchall()
        shares = [50, 30, 20]
        amounts = [5000000, 3000000, 2000000]
        
        for i, partner in enumerate(partners[:3]):
            connection.execute(text(f"""
                INSERT INTO project_partners (project_id, partner_id, share_percentage, invested_amount) VALUES
                ({project_id}, {partner.id}, {shares[i]}, {amounts[i]})
            """))
        
        # Insert some sample vouchers
        connection.execute(text(f"""
            INSERT INTO vouchers (voucher_number, voucher_type, amount, description, customer_id, safe_to_id) VALUES
            ('V-000001', 'receipt', 5000, 'دفعة من عميل', {customer_group_id + 1}, {main_safe_id + 1}),
            ('V-000002', 'payment', 3000, 'دفعة لمورد', NULL, {main_safe_id + 1})
        """))
        
        connection.execute(text(f"""
            UPDATE vouchers SET supplier_id = {supplier_group_id + 1}, safe_from_id = {main_safe_id + 1}
            WHERE voucher_number = 'V-000002'
        """))
        
        connection.commit()
        print("  ✓ Inserted all sample data")

if __name__ == "__main__":
    print("🚀 Starting database reset and rebuild...")
    print("⚠️  WARNING: This will delete all existing data!")
    
    response = input("\nDo you want to continue? (yes/no): ")
    if response.lower() != 'yes':
        print("Operation cancelled.")
        exit(0)
    
    print("\n" + "="*50)
    drop_all_tables()
    time.sleep(1)
    create_all_tables()
    time.sleep(1)
    insert_sample_data()
    print("\n" + "="*50)
    print("✨ Database reset completed successfully!")
    print("🎉 The system is ready to use with projects support!")