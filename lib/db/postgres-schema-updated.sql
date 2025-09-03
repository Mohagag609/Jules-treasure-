-- إسقاط الجداول الموجودة إذا كانت موجودة (للتحديث)
DROP TABLE IF EXISTS treasury_logs CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS supplier_payments CASCADE;
DROP TABLE IF EXISTS partner_payments CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS phase_suppliers CASCADE;
DROP TABLE IF EXISTS project_partners CASCADE;
DROP TABLE IF EXISTS phases CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- جدول المشاريع
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    treasury_balance DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0, -- إجمالي تكلفة المشروع
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المراحل
CREATE TABLE phases (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phase_order INTEGER DEFAULT 1, -- ترتيب المرحلة في المشروع
    amount_required DECIMAL(15,2) NOT NULL, -- المبلغ المطلوب للمرحلة
    amount_paid DECIMAL(15,2) DEFAULT 0, -- المبلغ المدفوع حتى الآن
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- جدول الشركاء
CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    phone TEXT,
    email TEXT,
    national_id TEXT, -- الرقم القومي
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الشركاء في المشاريع (ربط الشركاء بالمشاريع)
CREATE TABLE project_partners (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    partner_id INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    amount_due DECIMAL(15,2) DEFAULT 0, -- المبلغ المستحق على الشريك
    amount_paid DECIMAL(15,2) DEFAULT 0, -- المبلغ المدفوع من الشريك
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
    UNIQUE(project_id, partner_id),
    CONSTRAINT valid_percentage CHECK (percentage > 0 AND percentage <= 100)
);

-- جدول الموردين
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    phone TEXT,
    email TEXT,
    address TEXT,
    supplier_type TEXT, -- نوع المورد (أسمنت، حديد، إلخ)
    tax_number TEXT, -- الرقم الضريبي
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الموردين في المراحل
CREATE TABLE phase_suppliers (
    id SERIAL PRIMARY KEY,
    phase_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    amount_due DECIMAL(15,2) NOT NULL, -- المبلغ المستحق للمورد
    amount_paid DECIMAL(15,2) DEFAULT 0, -- المبلغ المدفوع للمورد
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- جدول البنود/المواد
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    phase_supplier_id INTEGER NOT NULL,
    name TEXT NOT NULL, -- اسم المادة (أسمنت، حديد، رمل، إلخ)
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL, -- الوحدة (طن، متر مكعب، قطعة، إلخ)
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    purchase_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phase_supplier_id) REFERENCES phase_suppliers(id) ON DELETE CASCADE
);

-- جدول المدفوعات من الشركاء (القبض)
CREATE TABLE partner_payments (
    id SERIAL PRIMARY KEY,
    project_partner_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque')),
    reference_number TEXT, -- رقم الإيصال أو الشيك
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_partner_id) REFERENCES project_partners(id) ON DELETE CASCADE
);

-- جدول المدفوعات للموردين (الصرف)
CREATE TABLE supplier_payments (
    id SERIAL PRIMARY KEY,
    phase_supplier_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque')),
    reference_number TEXT, -- رقم الإيصال أو الشيك
    paid_by_partner_id INTEGER, -- الشريك الذي دفع (للتتبع)
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phase_supplier_id) REFERENCES phase_suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by_partner_id) REFERENCES partners(id) ON DELETE SET NULL
);

-- جدول التسويات بين الشركاء
CREATE TABLE settlements (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    phase_id INTEGER, -- يمكن أن تكون التسوية لمرحلة محددة أو للمشروع ككل
    from_partner_id INTEGER NOT NULL, -- الشريك الذي يدفع
    to_partner_id INTEGER NOT NULL, -- الشريك الذي يستقبل
    amount DECIMAL(15,2) NOT NULL,
    settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    settlement_type TEXT DEFAULT 'phase' CHECK (settlement_type IN ('phase', 'project', 'manual')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
    FOREIGN KEY (from_partner_id) REFERENCES partners(id) ON DELETE CASCADE,
    FOREIGN KEY (to_partner_id) REFERENCES partners(id) ON DELETE CASCADE,
    CHECK (from_partner_id != to_partner_id)
);

-- جدول سجل الخزينة
CREATE TABLE treasury_logs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    amount DECIMAL(15,2) NOT NULL,
    balance_before DECIMAL(15,2) NOT NULL DEFAULT 0,
    balance_after DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_type TEXT CHECK (reference_type IN ('partner_payment', 'supplier_payment', 'settlement', 'adjustment')),
    reference_id INTEGER,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT, -- اسم المستخدم الذي أجرى العملية
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_phases_project ON phases(project_id);
CREATE INDEX idx_project_partners_project ON project_partners(project_id);
CREATE INDEX idx_project_partners_partner ON project_partners(partner_id);
CREATE INDEX idx_phase_suppliers_phase ON phase_suppliers(phase_id);
CREATE INDEX idx_phase_suppliers_supplier ON phase_suppliers(supplier_id);
CREATE INDEX idx_materials_phase_supplier ON materials(phase_supplier_id);
CREATE INDEX idx_partner_payments_project_partner ON partner_payments(project_partner_id);
CREATE INDEX idx_supplier_payments_phase_supplier ON supplier_payments(phase_supplier_id);
CREATE INDEX idx_treasury_logs_project ON treasury_logs(project_id);
CREATE INDEX idx_settlements_project ON settlements(project_id);
CREATE INDEX idx_settlements_phase ON settlements(phase_id);

-- إنشاء Views مفيدة للتقارير

-- عرض ملخص المشاريع
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.start_date,
    p.end_date,
    p.status,
    p.treasury_balance,
    COUNT(DISTINCT ph.id) as phases_count,
    COUNT(DISTINCT pp.partner_id) as partners_count,
    COALESCE(SUM(DISTINCT ph.amount_required), 0) as total_required,
    COALESCE(SUM(DISTINCT ph.amount_paid), 0) as total_paid
FROM projects p
LEFT JOIN phases ph ON p.id = ph.project_id
LEFT JOIN project_partners pp ON p.id = pp.project_id
GROUP BY p.id;

-- عرض ملخص الشركاء في المشاريع
CREATE OR REPLACE VIEW partner_project_summary AS
SELECT 
    pp.id,
    p.name as project_name,
    pa.name as partner_name,
    pp.percentage,
    pp.amount_due,
    pp.amount_paid,
    pp.amount_due - pp.amount_paid as remaining_amount
FROM project_partners pp
JOIN projects p ON pp.project_id = p.id
JOIN partners pa ON pp.partner_id = pa.id;

-- عرض ملخص الموردين في المراحل
CREATE OR REPLACE VIEW supplier_phase_summary AS
SELECT 
    ps.id,
    ph.name as phase_name,
    p.name as project_name,
    s.name as supplier_name,
    ps.amount_due,
    ps.amount_paid,
    ps.amount_due - ps.amount_paid as remaining_amount
FROM phase_suppliers ps
JOIN phases ph ON ps.phase_id = ph.id
JOIN projects p ON ph.project_id = p.id
JOIN suppliers s ON ps.supplier_id = s.id;

-- دوال مساعدة

-- دالة لتحديث رصيد الخزينة عند إضافة مدفوعة من شريك
CREATE OR REPLACE FUNCTION update_treasury_on_partner_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث رصيد الخزينة
    UPDATE projects 
    SET treasury_balance = treasury_balance + NEW.amount
    WHERE id = (
        SELECT project_id 
        FROM project_partners 
        WHERE id = NEW.project_partner_id
    );
    
    -- تحديث المبلغ المدفوع للشريك
    UPDATE project_partners
    SET amount_paid = amount_paid + NEW.amount
    WHERE id = NEW.project_partner_id;
    
    -- إضافة سجل في سجل الخزينة
    INSERT INTO treasury_logs (
        project_id, 
        transaction_type, 
        amount, 
        balance_before,
        balance_after, 
        description, 
        reference_type, 
        reference_id
    )
    SELECT 
        pp.project_id,
        'income',
        NEW.amount,
        p.treasury_balance - NEW.amount,
        p.treasury_balance,
        'قبض من شريك: ' || pa.name,
        'partner_payment',
        NEW.id
    FROM project_partners pp
    JOIN projects p ON pp.project_id = p.id
    JOIN partners pa ON pp.partner_id = pa.id
    WHERE pp.id = NEW.project_partner_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث رصيد الخزينة عند إضافة مدفوعة لمورد
CREATE OR REPLACE FUNCTION update_treasury_on_supplier_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث رصيد الخزينة
    UPDATE projects 
    SET treasury_balance = treasury_balance - NEW.amount
    WHERE id = (
        SELECT ph.project_id 
        FROM phase_suppliers ps
        JOIN phases ph ON ps.phase_id = ph.id
        WHERE ps.id = NEW.phase_supplier_id
    );
    
    -- تحديث المبلغ المدفوع للمورد
    UPDATE phase_suppliers
    SET amount_paid = amount_paid + NEW.amount
    WHERE id = NEW.phase_supplier_id;
    
    -- تحديث المبلغ المدفوع في المرحلة
    UPDATE phases
    SET amount_paid = amount_paid + NEW.amount
    WHERE id = (
        SELECT phase_id 
        FROM phase_suppliers 
        WHERE id = NEW.phase_supplier_id
    );
    
    -- إضافة سجل في سجل الخزينة
    INSERT INTO treasury_logs (
        project_id, 
        transaction_type, 
        amount, 
        balance_before,
        balance_after, 
        description, 
        reference_type, 
        reference_id
    )
    SELECT 
        ph.project_id,
        'expense',
        NEW.amount,
        p.treasury_balance + NEW.amount,
        p.treasury_balance,
        'صرف لمورد: ' || s.name || ' - مرحلة: ' || ph.name,
        'supplier_payment',
        NEW.id
    FROM phase_suppliers ps
    JOIN phases ph ON ps.phase_id = ph.id
    JOIN projects p ON ph.project_id = p.id
    JOIN suppliers s ON ps.supplier_id = s.id
    WHERE ps.id = NEW.phase_supplier_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفزات (Triggers)
CREATE TRIGGER trigger_partner_payment_after_insert
AFTER INSERT ON partner_payments
FOR EACH ROW
EXECUTE FUNCTION update_treasury_on_partner_payment();

CREATE TRIGGER trigger_supplier_payment_after_insert
AFTER INSERT ON supplier_payments
FOR EACH ROW
EXECUTE FUNCTION update_treasury_on_supplier_payment();

-- دالة لحساب المبالغ المستحقة على الشركاء عند تحديث المراحل
CREATE OR REPLACE FUNCTION update_partner_amounts()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث المبالغ المستحقة على جميع الشركاء في المشروع
    UPDATE project_partners pp
    SET amount_due = (
        SELECT SUM(ph.amount_required) * (pp.percentage / 100)
        FROM phases ph
        WHERE ph.project_id = pp.project_id
    )
    WHERE pp.project_id = NEW.project_id;
    
    -- تحديث إجمالي تكلفة المشروع
    UPDATE projects
    SET total_cost = (
        SELECT SUM(amount_required)
        FROM phases
        WHERE project_id = NEW.project_id
    )
    WHERE id = NEW.project_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- محفز لتحديث المبالغ المستحقة عند إضافة أو تحديث مرحلة
CREATE TRIGGER trigger_update_partner_amounts
AFTER INSERT OR UPDATE OF amount_required ON phases
FOR EACH ROW
EXECUTE FUNCTION update_partner_amounts();