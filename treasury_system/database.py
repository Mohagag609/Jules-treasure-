import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import sqlite3

Base = declarative_base()

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 
    'postgresql://neondb_owner:npg_gP3a1ldnEBeb@ep-bold-butterfly-adx98o9c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
)

# Fix for postgres:// URLs (convert to postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine with appropriate settings
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL)
else:
    # For PostgreSQL (Neon or other)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={"sslmode": "require"}
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# نموذج العملاء
class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(50))
    address = Column(Text)
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # العلاقات
    vouchers = relationship("Voucher", back_populates="customer", cascade="all, delete-orphan")

# نموذج الموردين
class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(50))
    address = Column(Text)
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # العلاقات
    vouchers = relationship("Voucher", back_populates="supplier", cascade="all, delete-orphan")

# نموذج الخزائن - محدث للنظام المتدرج
class Safe(Base):
    __tablename__ = "safes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50))  # main, branch, sub-branch
    balance = Column(Float, default=0.0)
    is_main = Column(Boolean, default=False)
    
    # حقول جديدة للنظام المتدرج
    parent_safe_id = Column(Integer, ForeignKey("safes.id"), nullable=True)
    is_container = Column(Boolean, default=False)  # هل خزينة حاوية فقط؟
    level = Column(Integer, default=0)  # 0=رئيسية، 1=فرعية، 2=فرعية من فرعية
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # العلاقات
    parent = relationship("Safe", remote_side=[id], backref="children")
    vouchers_from = relationship("Voucher", foreign_keys="Voucher.safe_from_id", back_populates="safe_from")
    vouchers_to = relationship("Voucher", foreign_keys="Voucher.safe_to_id", back_populates="safe_to")

# نموذج السندات (المحور الرئيسي)
class Voucher(Base):
    __tablename__ = "vouchers"
    
    id = Column(Integer, primary_key=True, index=True)
    voucher_number = Column(String(50), unique=True, nullable=False)
    voucher_type = Column(String(50), nullable=False)  # receipt, payment, transfer
    amount = Column(Float, nullable=False)
    description = Column(Text)
    date = Column(DateTime, default=datetime.utcnow)
    
    # Foreign Keys
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    safe_from_id = Column(Integer, ForeignKey("safes.id"), nullable=True)
    safe_to_id = Column(Integer, ForeignKey("safes.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # العلاقات
    customer = relationship("Customer", back_populates="vouchers")
    supplier = relationship("Supplier", back_populates="vouchers")
    safe_from = relationship("Safe", foreign_keys=[safe_from_id], back_populates="vouchers_from")
    safe_to = relationship("Safe", foreign_keys=[safe_to_id], back_populates="vouchers_to")
    category = relationship("Category", back_populates="vouchers")

# نموذج الفئات
class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50))  # income, expense
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # العلاقات
    vouchers = relationship("Voucher", back_populates="category")

# إنشاء الجداول
def init_db():
    Base.metadata.create_all(bind=engine)
    
    # إضافة خزينة رئيسية افتراضية
    db = SessionLocal()
    main_safe = db.query(Safe).filter_by(is_main=True).first()
    if not main_safe:
        main_safe = Safe(name="الخزينة الرئيسية", type="main", is_main=True, balance=0)
        db.add(main_safe)
        
        # إضافة فئات افتراضية
        default_categories = [
            Category(name="مبيعات", type="income"),
            Category(name="خدمات", type="income"),
            Category(name="إيرادات أخرى", type="income"),
            Category(name="مشتريات", type="expense"),
            Category(name="رواتب", type="expense"),
            Category(name="إيجار", type="expense"),
            Category(name="مصاريف أخرى", type="expense"),
        ]
        
        for cat in default_categories:
            existing = db.query(Category).filter_by(name=cat.name).first()
            if not existing:
                db.add(cat)
        
        db.commit()
    db.close()

# دالة لتوليد رقم السند التلقائي
def generate_voucher_number(voucher_type):
    db = SessionLocal()
    prefix = {
        'receipt': 'REC',
        'payment': 'PAY',
        'transfer': 'TRN'
    }.get(voucher_type, 'VCH')
    
    # الحصول على آخر رقم
    last_voucher = db.query(Voucher).filter(
        Voucher.voucher_number.like(f"{prefix}%")
    ).order_by(Voucher.id.desc()).first()
    
    if last_voucher:
        last_num = int(last_voucher.voucher_number.replace(prefix, ''))
        new_num = last_num + 1
    else:
        new_num = 1
    
    db.close()
    return f"{prefix}{new_num:06d}"

# دالة للحصول على الرصيد السابق
def get_previous_balance(entity_type, entity_id, before_date=None, before_voucher_id=None):
    db = SessionLocal()
    query = db.query(Voucher)
    
    if entity_type == 'customer':
        query = query.filter(Voucher.customer_id == entity_id)
    elif entity_type == 'supplier':
        query = query.filter(Voucher.supplier_id == entity_id)
    elif entity_type == 'safe':
        query = query.filter(
            (Voucher.safe_from_id == entity_id) | 
            (Voucher.safe_to_id == entity_id)
        )
    
    if before_date:
        query = query.filter(Voucher.date < before_date)
    if before_voucher_id:
        query = query.filter(Voucher.id < before_voucher_id)
    
    vouchers = query.all()
    balance = 0
    
    for v in vouchers:
        if entity_type == 'customer':
            if v.voucher_type == 'receipt':
                balance -= v.amount  # العميل يدفع
            elif v.voucher_type == 'payment':
                balance += v.amount  # العميل يستلم
        elif entity_type == 'supplier':
            if v.voucher_type == 'payment':
                balance -= v.amount  # ندفع للمورد
            elif v.voucher_type == 'receipt':
                balance += v.amount  # نستلم من المورد
        elif entity_type == 'safe':
            if v.safe_from_id == entity_id:
                balance -= v.amount  # خروج من الخزينة
            if v.safe_to_id == entity_id:
                balance += v.amount  # دخول للخزينة
    
    db.close()
    return balance

# دالة جديدة لحساب رصيد الخزينة الحاوية
def get_container_safe_balance(safe_id):
    """حساب رصيد الخزينة الحاوية من مجموع الخزائن الفرعية"""
    db = SessionLocal()
    safe = db.query(Safe).filter_by(id=safe_id).first()
    
    if not safe or not safe.is_container:
        db.close()
        return get_previous_balance('safe', safe_id) if safe else 0
    
    total_balance = 0
    
    # حساب مجموع أرصدة الخزائن الفرعية
    for child in safe.children:
        if child.is_container:
            # إذا كانت الفرعية أيضاً حاوية، احسب مجموع فرعياتها
            total_balance += get_container_safe_balance(child.id)
        else:
            # إذا كانت خزينة عادية، احسب رصيدها
            total_balance += get_previous_balance('safe', child.id)
    
    db.close()
    return total_balance

# دالة لإنشاء خزينة فرعية
def create_sub_safe(parent_id, name, is_container=False):
    """إنشاء خزينة فرعية تحت خزينة أخرى"""
    db = SessionLocal()
    
    parent = db.query(Safe).filter_by(id=parent_id).first()
    if not parent:
        db.close()
        return None
    
    sub_safe = Safe(
        name=name,
        type='sub-branch',
        parent_safe_id=parent_id,
        is_container=is_container,
        level=parent.level + 1,
        is_main=False
    )
    
    db.add(sub_safe)
    db.commit()
    db.refresh(sub_safe)
    db.close()
    
    return sub_safe