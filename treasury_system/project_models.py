# نماذج نظام المشاريع المتكامل

from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, Date, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base
import datetime

# جدول وسيط للشركاء في المشاريع
project_partners = Table('project_partners', Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('project_id', Integer, ForeignKey('projects.id')),
    Column('partner_id', Integer, ForeignKey('partners.id')),
    Column('share_percentage', Float, default=0),  # نسبة الشريك في المشروع
    Column('invested_amount', Float, default=0),  # المبلغ المستثمر
    Column('created_at', DateTime, default=datetime.datetime.utcnow)
)

# جدول وسيط للموردين في المراحل
phase_suppliers = Table('phase_suppliers', Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('phase_id', Integer, ForeignKey('project_phases.id')),
    Column('supplier_id', Integer, ForeignKey('suppliers.id')),
    Column('contract_amount', Float, default=0),  # قيمة التعاقد
    Column('paid_amount', Float, default=0),  # المدفوع
    Column('service_type', String(200)),  # نوع الخدمة
    Column('created_at', DateTime, default=datetime.datetime.utcnow)
)

# نموذج الشركاء (بدلاً من العملاء)
class Partner(Base):
    __tablename__ = "partners"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(50))
    email = Column(String(100))
    address = Column(Text)
    national_id = Column(String(50))  # الرقم القومي أو السجل التجاري
    partner_type = Column(String(50), default='individual')  # individual, company
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # العلاقات
    projects = relationship("Project", secondary=project_partners, back_populates="partners")
    payments = relationship("PartnerPayment", back_populates="partner")

# نموذج المشاريع
class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    safe_id = Column(Integer, ForeignKey('safes.id'), nullable=False)  # خزينة خاصة بالمشروع
    total_budget = Column(Float, default=0)
    total_invested = Column(Float, default=0)  # إجمالي الاستثمار من الشركاء
    total_spent = Column(Float, default=0)  # إجمالي المصروفات
    total_revenue = Column(Float, default=0)  # إجمالي الإيرادات
    start_date = Column(Date, default=datetime.date.today)
    end_date = Column(Date)
    status = Column(String(50), default='planning')  # planning, active, completed, cancelled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # العلاقات
    safe = relationship("Safe")
    partners = relationship("Partner", secondary=project_partners, back_populates="projects")
    phases = relationship("ProjectPhase", back_populates="project", cascade="all, delete-orphan")
    vouchers = relationship("Voucher", back_populates="project")

# نموذج مراحل المشروع
class ProjectPhase(Base):
    __tablename__ = "project_phases"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    phase_number = Column(Integer, default=1)
    budget = Column(Float, default=0)  # ميزانية المرحلة
    spent = Column(Float, default=0)  # المصروف في المرحلة
    revenue = Column(Float, default=0)  # إيرادات المرحلة
    start_date = Column(Date)
    end_date = Column(Date)
    completion_percentage = Column(Float, default=0)  # نسبة الإنجاز
    status = Column(String(50), default='pending')  # pending, in_progress, completed, delayed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # العلاقات
    project = relationship("Project", back_populates="phases")
    suppliers = relationship("Supplier", secondary=phase_suppliers)
    vouchers = relationship("Voucher", back_populates="phase")
    partner_payments = relationship("PartnerPayment", back_populates="phase")

# نموذج مدفوعات الشركاء في المراحل
class PartnerPayment(Base):
    __tablename__ = "partner_payments"
    
    id = Column(Integer, primary_key=True)
    partner_id = Column(Integer, ForeignKey('partners.id'), nullable=False)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    phase_id = Column(Integer, ForeignKey('project_phases.id'), nullable=False)
    amount = Column(Float, nullable=False)
    payment_type = Column(String(50))  # investment, withdrawal, profit_share
    description = Column(Text)
    date = Column(Date, default=datetime.date.today)
    voucher_id = Column(Integer, ForeignKey('vouchers.id'))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # العلاقات
    partner = relationship("Partner", back_populates="payments")
    project = relationship("Project")
    phase = relationship("ProjectPhase", back_populates="partner_payments")
    voucher = relationship("Voucher")

# دوال مساعدة للحسابات
def get_project_balance(project_id):
    """حساب رصيد المشروع (الإيرادات - المصروفات)"""
    from database import SessionLocal
    db = SessionLocal()
    project = db.query(Project).filter_by(id=project_id).first()
    if project:
        return project.total_revenue - project.total_spent
    return 0

def get_partner_balance_in_project(partner_id, project_id):
    """حساب رصيد الشريك في مشروع معين"""
    from database import SessionLocal
    db = SessionLocal()
    
    # الحصول على نسبة الشريك
    partnership = db.execute(
        project_partners.select().where(
            project_partners.c.partner_id == partner_id,
            project_partners.c.project_id == project_id
        )
    ).first()
    
    if partnership:
        project = db.query(Project).filter_by(id=project_id).first()
        project_profit = project.total_revenue - project.total_spent
        partner_share = (partnership.share_percentage / 100) * project_profit
        
        # خصم المدفوعات السابقة
        payments = db.query(PartnerPayment).filter_by(
            partner_id=partner_id,
            project_id=project_id,
            payment_type='withdrawal'
        ).all()
        
        total_withdrawals = sum(p.amount for p in payments)
        
        return partnership.invested_amount + partner_share - total_withdrawals
    
    return 0

def get_phase_supplier_balance(phase_id, supplier_id):
    """حساب المستحق للمورد في مرحلة معينة"""
    from database import SessionLocal
    db = SessionLocal()
    
    supplier_contract = db.execute(
        phase_suppliers.select().where(
            phase_suppliers.c.phase_id == phase_id,
            phase_suppliers.c.supplier_id == supplier_id
        )
    ).first()
    
    if supplier_contract:
        return supplier_contract.contract_amount - supplier_contract.paid_amount
    
    return 0

def get_phase_progress_report(phase_id):
    """تقرير تفصيلي عن المرحلة"""
    from database import SessionLocal
    db = SessionLocal()
    
    phase = db.query(ProjectPhase).filter_by(id=phase_id).first()
    if not phase:
        return None
    
    # حساب مدفوعات الشركاء في المرحلة
    partner_payments = db.query(PartnerPayment).filter_by(phase_id=phase_id).all()
    total_partner_investment = sum(p.amount for p in partner_payments if p.payment_type == 'investment')
    
    # حساب مدفوعات الموردين
    suppliers = db.execute(
        phase_suppliers.select().where(phase_suppliers.c.phase_id == phase_id)
    ).fetchall()
    total_supplier_payments = sum(s.paid_amount for s in suppliers)
    total_supplier_contracts = sum(s.contract_amount for s in suppliers)
    
    return {
        'phase_name': phase.name,
        'budget': phase.budget,
        'spent': phase.spent,
        'revenue': phase.revenue,
        'completion': phase.completion_percentage,
        'partner_investment': total_partner_investment,
        'supplier_payments': total_supplier_payments,
        'supplier_remaining': total_supplier_contracts - total_supplier_payments,
        'profit_loss': phase.revenue - phase.spent
    }