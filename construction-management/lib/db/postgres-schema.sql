-- جدول المشاريع
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    treasury_balance DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول المراحل
CREATE TABLE IF NOT EXISTS phases (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    amount_required DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- جدول الشركاء
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الشركاء في المشاريع
CREATE TABLE IF NOT EXISTS project_partners (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    partner_id INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    amount_due DECIMAL(15,2) DEFAULT 0,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
    UNIQUE(project_id, partner_id)
);

-- جدول الموردين
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول الموردين في المراحل
CREATE TABLE IF NOT EXISTS phase_suppliers (
    id SERIAL PRIMARY KEY,
    phase_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    amount_due DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- جدول البنود/المواد
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    phase_supplier_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phase_supplier_id) REFERENCES phase_suppliers(id) ON DELETE CASCADE
);

-- جدول المدفوعات (القبض من الشركاء)
CREATE TABLE IF NOT EXISTS partner_payments (
    id SERIAL PRIMARY KEY,
    project_partner_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_partner_id) REFERENCES project_partners(id) ON DELETE CASCADE
);

-- جدول المدفوعات (الصرف للموردين)
CREATE TABLE IF NOT EXISTS supplier_payments (
    id SERIAL PRIMARY KEY,
    phase_supplier_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phase_supplier_id) REFERENCES phase_suppliers(id) ON DELETE CASCADE
);

-- جدول التسويات بين الشركاء
CREATE TABLE IF NOT EXISTS settlements (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    phase_id INTEGER,
    from_partner_id INTEGER NOT NULL,
    to_partner_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    settlement_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE,
    FOREIGN KEY (from_partner_id) REFERENCES partners(id) ON DELETE CASCADE,
    FOREIGN KEY (to_partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- جدول سجل الخزينة
CREATE TABLE IF NOT EXISTS treasury_logs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL, -- 'income' أو 'expense'
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_type TEXT, -- 'partner_payment' أو 'supplier_payment'
    reference_id INTEGER,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- إنشاء الفهارس
CREATE INDEX IF NOT EXISTS idx_phases_project ON phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_partners_project ON project_partners(project_id);
CREATE INDEX IF NOT EXISTS idx_project_partners_partner ON project_partners(partner_id);
CREATE INDEX IF NOT EXISTS idx_phase_suppliers_phase ON phase_suppliers(phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_suppliers_supplier ON phase_suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_treasury_logs_project ON treasury_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_settlements_project ON settlements(project_id);