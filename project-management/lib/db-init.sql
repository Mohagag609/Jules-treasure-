-- إنشاء قاعدة البيانات المترابطة للنظام المتكامل

-- حذف الجداول القديمة إن وجدت
DROP TABLE IF EXISTS profit_distributions CASCADE;
DROP TABLE IF EXISTS partner_settlements CASCADE;
DROP TABLE IF EXISTS revenues CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS partner_payments CASCADE;
DROP TABLE IF EXISTS supplier_payments CASCADE;
DROP TABLE IF EXISTS treasury CASCADE;
DROP TABLE IF EXISTS building_partners CASCADE;
DROP TABLE IF EXISTS stages CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;

-- 1. جدول العمارات/المشاريع
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    total_floors INTEGER DEFAULT 0,
    total_units INTEGER DEFAULT 0,
    estimated_cost DECIMAL(15,2) DEFAULT 0,
    actual_cost DECIMAL(15,2) DEFAULT 0,
    selling_price DECIMAL(15,2) DEFAULT 0,
    profit DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'under_construction', 'completed', 'sold')),
    start_date DATE,
    expected_completion_date DATE,
    actual_completion_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. جدول الشركاء
CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    national_id VARCHAR(50) UNIQUE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. جدول الموردين
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    supplier_type VARCHAR(50) DEFAULT 'materials' CHECK (supplier_type IN ('materials', 'labor', 'equipment', 'services', 'other')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. جدول المراحل (مرتبط بالعمارات)
CREATE TABLE stages (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_cost DECIMAL(15,2) DEFAULT 0,
    actual_cost DECIMAL(15,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(building_id, order_index)
);

-- 5. جدول ربط الشركاء بالعمارات مع النسب
CREATE TABLE building_partners (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    ownership_percentage DECIMAL(5,2) NOT NULL CHECK (ownership_percentage > 0 AND ownership_percentage <= 100),
    investment_amount DECIMAL(15,2) DEFAULT 0,
    profit_share DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(building_id, partner_id)
);

-- 6. جدول المصروفات (مرتبط بالعمارات والمراحل والشركاء)
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    stage_id INTEGER REFERENCES stages(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    paid_by_partner_id INTEGER NOT NULL REFERENCES partners(id),
    expense_type VARCHAR(50) DEFAULT 'materials' CHECK (expense_type IN ('materials', 'labor', 'equipment', 'permits', 'utilities', 'other')),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    receipt_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. جدول المدفوعات من الشركاء للمشروع
CREATE TABLE partner_payments (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    partner_id INTEGER NOT NULL REFERENCES partners(id),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    payment_type VARCHAR(50) DEFAULT 'investment' CHECK (payment_type IN ('investment', 'expense_coverage', 'additional')),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'check')),
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. جدول المدفوعات للموردين
CREATE TABLE supplier_payments (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'check')),
    reference_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. جدول الإيرادات والأرباح
CREATE TABLE revenues (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    revenue_type VARCHAR(50) DEFAULT 'unit_sale' CHECK (revenue_type IN ('unit_sale', 'rent', 'other')),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    revenue_date DATE NOT NULL,
    unit_number VARCHAR(50),
    buyer_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. جدول توزيع الأرباح على الشركاء
CREATE TABLE profit_distributions (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    partner_id INTEGER NOT NULL REFERENCES partners(id),
    profit_amount DECIMAL(15,2) NOT NULL CHECK (profit_amount >= 0),
    distribution_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'check')),
    reference_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. جدول التسويات بين الشركاء
CREATE TABLE partner_settlements (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    partner_id INTEGER NOT NULL REFERENCES partners(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    partner_share DECIMAL(15,2) DEFAULT 0,
    actual_paid DECIMAL(15,2) DEFAULT 0,
    difference DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('overpaid', 'underpaid', 'settled', 'pending')),
    settlement_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. جدول الخزينة (خزينة لكل عمارة)
CREATE TABLE treasury (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    total_investments DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    total_revenues DECIMAL(15,2) DEFAULT 0,
    total_profits DECIMAL(15,2) DEFAULT 0,
    distributed_profits DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(building_id)
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_stages_building ON stages(building_id);
CREATE INDEX idx_building_partners_building ON building_partners(building_id);
CREATE INDEX idx_building_partners_partner ON building_partners(partner_id);
CREATE INDEX idx_expenses_building ON expenses(building_id);
CREATE INDEX idx_expenses_stage ON expenses(stage_id);
CREATE INDEX idx_expenses_partner ON expenses(paid_by_partner_id);
CREATE INDEX idx_partner_payments_building ON partner_payments(building_id);
CREATE INDEX idx_partner_payments_partner ON partner_payments(partner_id);
CREATE INDEX idx_revenues_building ON revenues(building_id);
CREATE INDEX idx_profit_distributions_building ON profit_distributions(building_id);
CREATE INDEX idx_profit_distributions_partner ON profit_distributions(partner_id);
CREATE INDEX idx_partner_settlements_building ON partner_settlements(building_id);
CREATE INDEX idx_partner_settlements_partner ON partner_settlements(partner_id);

-- إنشاء Views للتقارير المترابطة

-- 1. عرض تفاصيل العمارة مع الحسابات
CREATE OR REPLACE VIEW building_financial_summary AS
SELECT 
    b.id,
    b.name,
    b.status,
    b.estimated_cost,
    COALESCE(SUM(e.amount), 0) as total_expenses,
    COALESCE(SUM(r.amount), 0) as total_revenues,
    COALESCE(SUM(r.amount), 0) - COALESCE(SUM(e.amount), 0) as net_profit,
    COUNT(DISTINCT bp.partner_id) as total_partners,
    COUNT(DISTINCT s.id) as total_stages
FROM buildings b
LEFT JOIN expenses e ON b.id = e.building_id
LEFT JOIN revenues r ON b.id = r.building_id
LEFT JOIN building_partners bp ON b.id = bp.building_id
LEFT JOIN stages s ON b.id = s.building_id
GROUP BY b.id, b.name, b.status, b.estimated_cost;

-- 2. عرض حصص الشركاء في كل عمارة
CREATE OR REPLACE VIEW partner_building_shares AS
SELECT 
    p.id as partner_id,
    p.name as partner_name,
    b.id as building_id,
    b.name as building_name,
    bp.ownership_percentage,
    bp.investment_amount,
    COALESCE(SUM(e.amount), 0) as total_paid_expenses,
    COALESCE(SUM(pp.amount), 0) as total_payments,
    bp.profit_share
FROM partners p
JOIN building_partners bp ON p.id = bp.partner_id
JOIN buildings b ON bp.building_id = b.id
LEFT JOIN expenses e ON p.id = e.paid_by_partner_id AND b.id = e.building_id
LEFT JOIN partner_payments pp ON p.id = pp.partner_id AND b.id = pp.building_id
GROUP BY p.id, p.name, b.id, b.name, bp.ownership_percentage, bp.investment_amount, bp.profit_share;

-- 3. عرض تفاصيل المراحل مع التكاليف
CREATE OR REPLACE VIEW stage_cost_summary AS
SELECT 
    s.id as stage_id,
    s.name as stage_name,
    s.building_id,
    b.name as building_name,
    s.estimated_cost,
    COALESCE(SUM(e.amount), 0) as actual_cost,
    s.progress_percentage,
    s.status,
    s.estimated_cost - COALESCE(SUM(e.amount), 0) as cost_variance
FROM stages s
JOIN buildings b ON s.building_id = b.id
LEFT JOIN expenses e ON s.id = e.stage_id
GROUP BY s.id, s.name, s.building_id, b.name, s.estimated_cost, s.progress_percentage, s.status;

-- إنشاء الدوال المترابطة للحسابات التلقائية

-- 1. دالة تحديث الخزينة عند إضافة مصروف
CREATE OR REPLACE FUNCTION update_treasury_on_expense()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث إجمالي المصروفات في الخزينة
    UPDATE treasury 
    SET 
        total_expenses = total_expenses + NEW.amount,
        current_balance = total_investments + total_revenues - (total_expenses + NEW.amount) - distributed_profits,
        last_updated = CURRENT_TIMESTAMP
    WHERE building_id = NEW.building_id;
    
    -- إنشاء خزينة جديدة إذا لم تكن موجودة
    IF NOT FOUND THEN
        INSERT INTO treasury (building_id, total_expenses, current_balance)
        VALUES (NEW.building_id, NEW.amount, -NEW.amount);
    END IF;
    
    -- تحديث التكلفة الفعلية للمرحلة
    IF NEW.stage_id IS NOT NULL THEN
        UPDATE stages 
        SET actual_cost = COALESCE(actual_cost, 0) + NEW.amount
        WHERE id = NEW.stage_id;
    END IF;
    
    -- تحديث التكلفة الفعلية للعمارة
    UPDATE buildings 
    SET actual_cost = COALESCE(actual_cost, 0) + NEW.amount
    WHERE id = NEW.building_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_treasury_on_expense
AFTER INSERT ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_treasury_on_expense();

-- 2. دالة تحديث الخزينة عند إضافة دفعة من شريك
CREATE OR REPLACE FUNCTION update_treasury_on_partner_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث إجمالي الاستثمارات في الخزينة
    UPDATE treasury 
    SET 
        total_investments = total_investments + NEW.amount,
        current_balance = (total_investments + NEW.amount) + total_revenues - total_expenses - distributed_profits,
        last_updated = CURRENT_TIMESTAMP
    WHERE building_id = NEW.building_id;
    
    -- إنشاء خزينة جديدة إذا لم تكن موجودة
    IF NOT FOUND THEN
        INSERT INTO treasury (building_id, total_investments, current_balance)
        VALUES (NEW.building_id, NEW.amount, NEW.amount);
    END IF;
    
    -- تحديث مبلغ الاستثمار للشريك في العمارة
    UPDATE building_partners 
    SET investment_amount = COALESCE(investment_amount, 0) + NEW.amount
    WHERE building_id = NEW.building_id AND partner_id = NEW.partner_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_treasury_on_partner_payment
AFTER INSERT ON partner_payments
FOR EACH ROW
EXECUTE FUNCTION update_treasury_on_partner_payment();

-- 3. دالة تحديث الخزينة عند إضافة إيراد
CREATE OR REPLACE FUNCTION update_treasury_on_revenue()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث إجمالي الإيرادات في الخزينة
    UPDATE treasury 
    SET 
        total_revenues = total_revenues + NEW.amount,
        total_profits = (total_revenues + NEW.amount) - total_expenses,
        current_balance = total_investments + (total_revenues + NEW.amount) - total_expenses - distributed_profits,
        last_updated = CURRENT_TIMESTAMP
    WHERE building_id = NEW.building_id;
    
    -- إنشاء خزينة جديدة إذا لم تكن موجودة
    IF NOT FOUND THEN
        INSERT INTO treasury (building_id, total_revenues, total_profits, current_balance)
        VALUES (NEW.building_id, NEW.amount, NEW.amount, NEW.amount);
    END IF;
    
    -- تحديث الربح في العمارة
    UPDATE buildings 
    SET 
        profit = COALESCE(profit, 0) + NEW.amount,
        selling_price = COALESCE(selling_price, 0) + NEW.amount
    WHERE id = NEW.building_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_treasury_on_revenue
AFTER INSERT ON revenues
FOR EACH ROW
EXECUTE FUNCTION update_treasury_on_revenue();

-- 4. دالة حساب وتوزيع الأرباح تلقائياً
CREATE OR REPLACE FUNCTION calculate_profit_distribution(p_building_id INTEGER)
RETURNS TABLE (
    partner_id INTEGER,
    partner_name VARCHAR,
    ownership_percentage DECIMAL,
    profit_amount DECIMAL
) AS $$
DECLARE
    v_total_profit DECIMAL;
BEGIN
    -- حساب إجمالي الربح للعمارة
    SELECT total_profits INTO v_total_profit
    FROM treasury
    WHERE building_id = p_building_id;
    
    -- توزيع الأرباح حسب النسب
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        bp.ownership_percentage,
        ROUND((v_total_profit * bp.ownership_percentage / 100), 2) as profit_amount
    FROM partners p
    JOIN building_partners bp ON p.id = bp.partner_id
    WHERE bp.building_id = p_building_id;
END;
$$ LANGUAGE plpgsql;

-- 5. دالة حساب التسوية بين الشركاء
CREATE OR REPLACE FUNCTION calculate_partner_settlement(
    p_building_id INTEGER,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS TABLE (
    partner_id INTEGER,
    partner_name VARCHAR,
    ownership_percentage DECIMAL,
    total_expenses DECIMAL,
    expected_share DECIMAL,
    actual_paid DECIMAL,
    difference DECIMAL,
    status VARCHAR
) AS $$
DECLARE
    v_total_expenses DECIMAL;
BEGIN
    -- حساب إجمالي المصروفات للفترة
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
    FROM expenses
    WHERE building_id = p_building_id
    AND payment_date BETWEEN p_period_start AND p_period_end;
    
    -- حساب التسوية لكل شريك
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        bp.ownership_percentage,
        v_total_expenses,
        ROUND((v_total_expenses * bp.ownership_percentage / 100), 2) as expected_share,
        COALESCE(SUM(e.amount), 0) as actual_paid,
        COALESCE(SUM(e.amount), 0) - ROUND((v_total_expenses * bp.ownership_percentage / 100), 2) as difference,
        CASE 
            WHEN COALESCE(SUM(e.amount), 0) > ROUND((v_total_expenses * bp.ownership_percentage / 100), 2) THEN 'overpaid'
            WHEN COALESCE(SUM(e.amount), 0) < ROUND((v_total_expenses * bp.ownership_percentage / 100), 2) THEN 'underpaid'
            ELSE 'settled'
        END as status
    FROM partners p
    JOIN building_partners bp ON p.id = bp.partner_id
    LEFT JOIN expenses e ON p.id = e.paid_by_partner_id 
        AND e.building_id = p_building_id
        AND e.payment_date BETWEEN p_period_start AND p_period_end
    WHERE bp.building_id = p_building_id
    GROUP BY p.id, p.name, bp.ownership_percentage;
END;
$$ LANGUAGE plpgsql;

-- 6. دالة للتحقق من أن مجموع نسب الشركاء = 100%
CREATE OR REPLACE FUNCTION check_partner_percentages()
RETURNS TRIGGER AS $$
DECLARE
    v_total_percentage DECIMAL;
BEGIN
    -- حساب مجموع النسب للعمارة
    SELECT COALESCE(SUM(ownership_percentage), 0) + NEW.ownership_percentage
    INTO v_total_percentage
    FROM building_partners
    WHERE building_id = NEW.building_id
    AND partner_id != NEW.partner_id;
    
    -- التحقق من أن المجموع لا يتجاوز 100%
    IF v_total_percentage > 100 THEN
        RAISE EXCEPTION 'مجموع نسب الشركاء لا يمكن أن يتجاوز 100%% (المجموع الحالي: %%)', v_total_percentage;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_partner_percentages
BEFORE INSERT OR UPDATE ON building_partners
FOR EACH ROW
EXECUTE FUNCTION check_partner_percentages();

-- إضافة بيانات تجريبية للاختبار
INSERT INTO buildings (name, address, total_floors, total_units, estimated_cost, status, start_date)
VALUES 
    ('عمارة الياسمين', 'شارع الملك فيصل، الرياض', 5, 10, 5000000, 'under_construction', '2024-01-01'),
    ('عمارة النخيل', 'حي النخيل، جدة', 7, 14, 7000000, 'planning', '2024-03-01');

INSERT INTO partners (name, phone, email, national_id)
VALUES 
    ('أحمد محمد', '0501234567', 'ahmed@example.com', '1234567890'),
    ('خالد عبدالله', '0502345678', 'khalid@example.com', '2345678901'),
    ('سعيد إبراهيم', '0503456789', 'saeed@example.com', '3456789012');

INSERT INTO suppliers (name, phone, supplier_type)
VALUES 
    ('شركة الأسمنت السعودية', '0504567890', 'materials'),
    ('مؤسسة الحديد والصلب', '0505678901', 'materials'),
    ('شركة المقاولات العامة', '0506789012', 'labor');

-- ربط الشركاء بالعمارات مع النسب
INSERT INTO building_partners (building_id, partner_id, ownership_percentage)
VALUES 
    (1, 1, 40.00),  -- أحمد 40% في عمارة الياسمين
    (1, 2, 35.00),  -- خالد 35% في عمارة الياسمين
    (1, 3, 25.00),  -- سعيد 25% في عمارة الياسمين
    (2, 1, 50.00),  -- أحمد 50% في عمارة النخيل
    (2, 2, 50.00);  -- خالد 50% في عمارة النخيل

-- إضافة مراحل للعمارات
INSERT INTO stages (building_id, name, description, estimated_cost, status, order_index)
VALUES 
    (1, 'الأساسات', 'حفر وصب الأساسات', 1000000, 'completed', 1),
    (1, 'الهيكل الخرساني', 'بناء الهيكل الخرساني للمبنى', 2000000, 'in_progress', 2),
    (1, 'التشطيبات', 'التشطيبات الداخلية والخارجية', 2000000, 'pending', 3),
    (2, 'التصميم والتراخيص', 'إعداد التصاميم واستخراج التراخيص', 200000, 'in_progress', 1);

-- إنشاء الخزائن للعمارات
INSERT INTO treasury (building_id, total_investments, total_expenses, total_revenues, current_balance)
VALUES 
    (1, 0, 0, 0, 0),
    (2, 0, 0, 0, 0);