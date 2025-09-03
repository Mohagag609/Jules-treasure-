from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from sqlalchemy.orm import Session
import sys
import os
from project_routes import project_bp

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import *
from datetime import datetime, timedelta
import json
import io

app = Flask(__name__)
CORS(app)

# Register project blueprint
app.register_blueprint(project_bp)

# Initialize database on startup
try:
    init_db()
    print("Database initialized successfully")
except Exception as e:
    print(f"Warning: Database initialization error: {e}")
    # Continue anyway, database might already be initialized

# الصفحة الرئيسية - النظام المودرن
@app.route('/')
def index():
    return render_template('modern_dashboard.html')

# صفحة الخزائن المتدرجة
@app.route('/safes-tree')
def safes_tree():
    return render_template('safes_tree.html')

# صفحة العملاء المتدرجة
@app.route('/customers-tree')
def customers_tree():
    return render_template('customers_tree.html')

# صفحة الموردين المتدرجة
@app.route('/suppliers-tree')
def suppliers_tree():
    return render_template('suppliers_tree.html')

@app.route('/projects')
def projects_page():
    return render_template('projects.html')

@app.route('/project/<int:project_id>')
def project_detail(project_id):
    return render_template('project_detail.html', project_id=project_id)

# ============= العملاء =============
@app.route('/api/customers', methods=['GET', 'POST'])
def handle_customers():
    db = SessionLocal()
    
    if request.method == 'GET':
        customers = db.query(Customer).all()
        result = []
        for c in customers:
            # حساب الرصيد حسب نوع العميل
            if c.is_group:
                balance = get_customer_group_balance(c.id)
            else:
                balance = get_previous_balance('customer', c.id)
            
            # جمع معلومات الفروع
            branches_data = []
            for branch in c.branches:
                branch_balance = get_customer_group_balance(branch.id) if branch.is_group else get_previous_balance('customer', branch.id)
                branches_data.append({
                    'id': branch.id,
                    'name': branch.name,
                    'balance': branch_balance,
                    'is_group': branch.is_group
                })
            
            result.append({
                'id': c.id,
                'name': c.name,
                'phone': c.phone,
                'address': c.address,
                'balance': balance,
                'parent_customer_id': c.parent_customer_id,
                'is_group': c.is_group,
                'level': c.level,
                'branches': branches_data,
                'created_at': c.created_at.isoformat()
            })
        db.close()
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        
        # تحديد المستوى بناءً على العميل الأب
        parent_id = data.get('parent_customer_id')
        level = 0
        if parent_id:
            parent = db.query(Customer).filter_by(id=parent_id).first()
            if parent:
                level = parent.level + 1
        
        customer = Customer(
            name=data['name'],
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            parent_customer_id=parent_id,
            is_group=data.get('is_group', False),
            level=level
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        result = {
            'id': customer.id,
            'name': customer.name,
            'phone': customer.phone,
            'address': customer.address,
            'balance': 0,
            'parent_customer_id': customer.parent_customer_id,
            'is_group': customer.is_group,
            'level': customer.level
        }
        db.close()
        return jsonify(result), 201

@app.route('/api/customers/<int:customer_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_customer(customer_id):
    db = SessionLocal()
    customer = db.query(Customer).filter_by(id=customer_id).first()
    
    if not customer:
        db.close()
        return jsonify({'error': 'Customer not found'}), 404
    
    if request.method == 'GET':
        result = {
            'id': customer.id,
            'name': customer.name,
            'phone': customer.phone,
            'address': customer.address,
            'balance': get_previous_balance('customer', customer.id),
            'parent_customer_id': customer.parent_customer_id,
            'is_group': customer.is_group,
            'level': customer.level
        }
        db.close()
        return jsonify(result)
    
    elif request.method == 'PUT':
        data = request.json
        customer.name = data.get('name', customer.name)
        customer.phone = data.get('phone', customer.phone)
        customer.address = data.get('address', customer.address)
        customer.parent_customer_id = data.get('parent_customer_id')
        customer.is_group = data.get('is_group', customer.is_group)
        db.commit()
        db.refresh(customer)
        result = {
            'id': customer.id,
            'name': customer.name,
            'phone': customer.phone,
            'address': customer.address,
            'balance': get_previous_balance('customer', customer.id)
        }
        db.close()
        return jsonify(result)
    
    elif request.method == 'DELETE':
        # Check if customer has transactions
        voucher_count = db.query(Voucher).filter_by(customer_id=customer_id).count()
        if voucher_count > 0:
            db.close()
            return jsonify({'error': 'لا يمكن حذف العميل لوجود معاملات مرتبطة'}), 400
        
        db.delete(customer)
        db.commit()
        db.close()
        return jsonify({'message': 'تم حذف العميل بنجاح'})

# ============= الموردين =============
@app.route('/api/suppliers', methods=['GET', 'POST'])
def handle_suppliers():
    db = SessionLocal()
    
    if request.method == 'GET':
        suppliers = db.query(Supplier).all()
        result = []
        for s in suppliers:
            # حساب الرصيد حسب نوع المورد
            if s.is_group:
                balance = get_supplier_group_balance(s.id)
            else:
                balance = get_previous_balance('supplier', s.id)
            
            # جمع معلومات الفروع
            branches_data = []
            for branch in s.branches:
                branch_balance = get_supplier_group_balance(branch.id) if branch.is_group else get_previous_balance('supplier', branch.id)
                branches_data.append({
                    'id': branch.id,
                    'name': branch.name,
                    'balance': branch_balance,
                    'is_group': branch.is_group
                })
            
            result.append({
                'id': s.id,
                'name': s.name,
                'phone': s.phone,
                'address': s.address,
                'balance': balance,
                'parent_supplier_id': s.parent_supplier_id,
                'is_group': s.is_group,
                'level': s.level,
                'branches': branches_data,
                'created_at': s.created_at.isoformat()
            })
        db.close()
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        
        # تحديد المستوى بناءً على المورد الأب
        parent_id = data.get('parent_supplier_id')
        level = 0
        if parent_id:
            parent = db.query(Supplier).filter_by(id=parent_id).first()
            if parent:
                level = parent.level + 1
        
        supplier = Supplier(
            name=data['name'],
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            parent_supplier_id=parent_id,
            is_group=data.get('is_group', False),
            level=level
        )
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        result = {
            'id': supplier.id,
            'name': supplier.name,
            'phone': supplier.phone,
            'address': supplier.address,
            'balance': 0,
            'parent_supplier_id': supplier.parent_supplier_id,
            'is_group': supplier.is_group,
            'level': supplier.level
        }
        db.close()
        return jsonify(result), 201

@app.route('/api/suppliers/<int:supplier_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_supplier(supplier_id):
    db = SessionLocal()
    supplier = db.query(Supplier).filter_by(id=supplier_id).first()
    
    if not supplier:
        db.close()
        return jsonify({'error': 'Supplier not found'}), 404
    
    if request.method == 'GET':
        result = {
            'id': supplier.id,
            'name': supplier.name,
            'phone': supplier.phone,
            'address': supplier.address,
            'balance': get_previous_balance('supplier', supplier.id),
            'parent_supplier_id': supplier.parent_supplier_id,
            'is_group': supplier.is_group,
            'level': supplier.level
        }
        db.close()
        return jsonify(result)
    
    elif request.method == 'PUT':
        data = request.json
        supplier.name = data.get('name', supplier.name)
        supplier.phone = data.get('phone', supplier.phone)
        supplier.address = data.get('address', supplier.address)
        supplier.parent_supplier_id = data.get('parent_supplier_id')
        supplier.is_group = data.get('is_group', supplier.is_group)
        db.commit()
        db.refresh(supplier)
        result = {
            'id': supplier.id,
            'name': supplier.name,
            'phone': supplier.phone,
            'address': supplier.address,
            'balance': get_previous_balance('supplier', supplier.id)
        }
        db.close()
        return jsonify(result)
    
    elif request.method == 'DELETE':
        # Check if supplier has transactions
        voucher_count = db.query(Voucher).filter_by(supplier_id=supplier_id).count()
        if voucher_count > 0:
            db.close()
            return jsonify({'error': 'لا يمكن حذف المورد لوجود معاملات مرتبطة'}), 400
        
        db.delete(supplier)
        db.commit()
        db.close()
        return jsonify({'message': 'تم حذف المورد بنجاح'})

# ============= الخزائن =============
@app.route('/api/safes', methods=['GET', 'POST'])
def handle_safes():
    db = SessionLocal()
    
    if request.method == 'GET':
        safes = db.query(Safe).all()
        result = []
        for s in safes:
            # حساب الرصيد حسب نوع الخزينة
            if s.is_container:
                balance = get_container_safe_balance(s.id)
            else:
                balance = get_previous_balance('safe', s.id)
            
            # جمع معلومات الخزائن الفرعية
            children_data = []
            for child in s.children:
                child_balance = get_container_safe_balance(child.id) if child.is_container else get_previous_balance('safe', child.id)
                children_data.append({
                    'id': child.id,
                    'name': child.name,
                    'balance': child_balance,
                    'is_container': child.is_container
                })
            
            result.append({
                'id': s.id,
                'name': s.name,
                'type': s.type,
                'balance': balance,
                'is_main': s.is_main,
                'parent_safe_id': s.parent_safe_id,
                'is_container': s.is_container,
                'level': s.level,
                'children': children_data,
                'created_at': s.created_at.isoformat()
            })
        db.close()
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        
        # تحديد المستوى بناءً على الخزينة الأم
        parent_id = data.get('parent_safe_id')
        level = 0
        if parent_id:
            parent = db.query(Safe).filter_by(id=parent_id).first()
            if parent:
                level = parent.level + 1
        
        safe = Safe(
            name=data['name'],
            type=data.get('type', 'branch'),
            is_main=data.get('is_main', False),
            parent_safe_id=parent_id,
            is_container=data.get('is_container', False),
            level=level
        )
        db.add(safe)
        db.commit()
        db.refresh(safe)
        
        result = {
            'id': safe.id,
            'name': safe.name,
            'type': safe.type,
            'balance': 0,
            'is_main': safe.is_main,
            'parent_safe_id': safe.parent_safe_id,
            'is_container': safe.is_container,
            'level': safe.level
        }
        db.close()
        return jsonify(result), 201

@app.route('/api/safes/<int:safe_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_safe(safe_id):
    db = SessionLocal()
    safe = db.query(Safe).filter_by(id=safe_id).first()
    
    if not safe:
        db.close()
        return jsonify({'error': 'Safe not found'}), 404
    
    if request.method == 'GET':
        if safe.is_container:
            balance = get_container_safe_balance(safe.id)
        else:
            balance = get_previous_balance('safe', safe.id)
        
        result = {
            'id': safe.id,
            'name': safe.name,
            'type': safe.type,
            'balance': balance,
            'is_main': safe.is_main,
            'parent_safe_id': safe.parent_safe_id,
            'is_container': safe.is_container,
            'level': safe.level
        }
        db.close()
        return jsonify(result)
    
    elif request.method == 'PUT':
        data = request.json
        safe.name = data.get('name', safe.name)
        safe.type = data.get('type', safe.type)
        safe.is_main = data.get('is_main', safe.is_main)
        safe.parent_safe_id = data.get('parent_safe_id')
        safe.is_container = data.get('is_container', safe.is_container)
        db.commit()
        db.refresh(safe)
        
        if safe.is_container:
            balance = get_container_safe_balance(safe.id)
        else:
            balance = get_previous_balance('safe', safe.id)
        
        result = {
            'id': safe.id,
            'name': safe.name,
            'type': safe.type,
            'balance': balance
        }
        db.close()
        return jsonify(result)
    
    elif request.method == 'DELETE':
        # Check if safe has children
        children_count = db.query(Safe).filter_by(parent_safe_id=safe_id).count()
        if children_count > 0:
            db.close()
            return jsonify({'error': 'لا يمكن حذف الخزينة لوجود خزائن فرعية'}), 400
        
        # Check if safe has transactions
        voucher_count = db.query(Voucher).filter(
            (Voucher.safe_from_id == safe_id) | (Voucher.safe_to_id == safe_id)
        ).count()
        if voucher_count > 0:
            db.close()
            return jsonify({'error': 'لا يمكن حذف الخزينة لوجود معاملات مرتبطة'}), 400
        
        db.delete(safe)
        db.commit()
        db.close()
        return jsonify({'message': 'تم حذف الخزينة بنجاح'})

# ============= الخزائن الهرمية =============
@app.route('/api/safes/tree')
def get_safes_tree():
    """الحصول على الخزائن بشكل هرمي"""
    db = SessionLocal()
    
    # جلب الخزائن الرئيسية فقط (بدون أب)
    root_safes = db.query(Safe).filter(Safe.parent_safe_id == None).all()
    
    def build_tree(safe):
        """بناء شجرة الخزائن بشكل تكراري"""
        if safe.is_container:
            balance = get_container_safe_balance(safe.id)
        else:
            balance = get_previous_balance('safe', safe.id)
        
        node = {
            'id': safe.id,
            'name': safe.name,
            'type': safe.type,
            'balance': balance,
            'is_container': safe.is_container,
            'level': safe.level,
            'children': []
        }
        
        # إضافة الخزائن الفرعية
        for child in safe.children:
            node['children'].append(build_tree(child))
        
        return node
    
    tree = []
    for safe in root_safes:
        tree.append(build_tree(safe))
    
    db.close()
    return jsonify(tree)

# ============= العملاء الهرمية =============
@app.route('/api/customers/tree')
def get_customers_tree():
    """الحصول على العملاء بشكل هرمي"""
    db = SessionLocal()
    
    # جلب العملاء الرئيسيين فقط (بدون أب)
    root_customers = db.query(Customer).filter(Customer.parent_customer_id == None).all()
    
    def build_tree(customer):
        """بناء شجرة العملاء بشكل تكراري"""
        if customer.is_group:
            balance = get_customer_group_balance(customer.id)
        else:
            balance = get_previous_balance('customer', customer.id)
        
        node = {
            'id': customer.id,
            'name': customer.name,
            'phone': customer.phone,
            'address': customer.address,
            'balance': balance,
            'is_group': customer.is_group,
            'level': customer.level,
            'branches': []
        }
        
        # إضافة الفروع
        for branch in customer.branches:
            node['branches'].append(build_tree(branch))
        
        return node
    
    tree = []
    for customer in root_customers:
        tree.append(build_tree(customer))
    
    db.close()
    return jsonify(tree)

# ============= الموردين الهرمية =============
@app.route('/api/suppliers/tree')
def get_suppliers_tree():
    """الحصول على الموردين بشكل هرمي"""
    db = SessionLocal()
    
    # جلب الموردين الرئيسيين فقط (بدون أب)
    root_suppliers = db.query(Supplier).filter(Supplier.parent_supplier_id == None).all()
    
    def build_tree(supplier):
        """بناء شجرة الموردين بشكل تكراري"""
        if supplier.is_group:
            balance = get_supplier_group_balance(supplier.id)
        else:
            balance = get_previous_balance('supplier', supplier.id)
        
        node = {
            'id': supplier.id,
            'name': supplier.name,
            'phone': supplier.phone,
            'address': supplier.address,
            'balance': balance,
            'is_group': supplier.is_group,
            'level': supplier.level,
            'branches': []
        }
        
        # إضافة الفروع
        for branch in supplier.branches:
            node['branches'].append(build_tree(branch))
        
        return node
    
    tree = []
    for supplier in root_suppliers:
        tree.append(build_tree(supplier))
    
    db.close()
    return jsonify(tree)

@app.route('/api/safes/validate-transaction', methods=['POST'])
def validate_safe_transaction():
    """التحقق من صلاحية المعاملة على الخزينة"""
    data = request.json
    safe_id = data.get('safe_id')
    
    db = SessionLocal()
    safe = db.query(Safe).filter_by(id=safe_id).first()
    
    if not safe:
        db.close()
        return jsonify({'valid': False, 'message': 'الخزينة غير موجودة'}), 404
    
    if safe.is_container:
        db.close()
        return jsonify({
            'valid': False, 
            'message': f'الخزينة "{safe.name}" هي خزينة حاوية ولا يمكن إجراء معاملات مباشرة عليها. يرجى اختيار إحدى الخزائن الفرعية.'
        }), 400
    
    db.close()
    return jsonify({'valid': True, 'message': 'يمكن إجراء المعاملة'})

# ============= السندات =============
@app.route('/api/vouchers/<int:voucher_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_voucher(voucher_id):
    db = SessionLocal()
    voucher = db.query(Voucher).filter_by(id=voucher_id).first()
    
    if not voucher:
        db.close()
        return jsonify({'error': 'Voucher not found'}), 404
    
    if request.method == 'GET':
        result = {
            'id': voucher.id,
            'voucher_number': voucher.voucher_number,
            'voucher_type': voucher.voucher_type,
            'amount': voucher.amount,
            'date': voucher.date.isoformat(),
            'description': voucher.description,
            'customer_id': voucher.customer_id,
            'supplier_id': voucher.supplier_id,
            'safe_from_id': voucher.safe_from_id,
            'safe_to_id': voucher.safe_to_id
        }
        
        # Add related entities
        if voucher.customer:
            result['customer'] = {'id': voucher.customer.id, 'name': voucher.customer.name}
        if voucher.supplier:
            result['supplier'] = {'id': voucher.supplier.id, 'name': voucher.supplier.name}
        
        db.close()
        return jsonify(result)
    
    elif request.method == 'PUT':
        data = request.json
        voucher.amount = data.get('amount', voucher.amount)
        voucher.description = data.get('description', voucher.description)
        db.commit()
        db.refresh(voucher)
        result = {
            'id': voucher.id,
            'voucher_number': voucher.voucher_number,
            'amount': voucher.amount
        }
        db.close()
        return jsonify(result)
    
    elif request.method == 'DELETE':
        db.delete(voucher)
        db.commit()
        db.close()
        return jsonify({'message': 'تم حذف السند بنجاح'})

# ============= الفئات =============
@app.route('/api/categories', methods=['GET', 'POST'])
def handle_categories():
    db = SessionLocal()
    
    if request.method == 'GET':
        categories = db.query(Category).all()
        result = [{
            'id': c.id,
            'name': c.name,
            'type': c.type
        } for c in categories]
        db.close()
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        category = Category(
            name=data['name'],
            type=data['type']
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        result = {
            'id': category.id,
            'name': category.name,
            'type': category.type
        }
        db.close()
        return jsonify(result), 201

# ============= السندات (الأهم) =============
@app.route('/api/vouchers', methods=['GET', 'POST'])
def handle_vouchers():
    db = SessionLocal()
    
    if request.method == 'GET':
        # فلترة حسب المعايير
        query = db.query(Voucher)
        
        # فلتر التاريخ
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        if date_from:
            query = query.filter(Voucher.date >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(Voucher.date <= datetime.fromisoformat(date_to))
        
        # فلتر رقم السند
        voucher_from = request.args.get('voucher_from')
        voucher_to = request.args.get('voucher_to')
        if voucher_from:
            query = query.filter(Voucher.voucher_number >= voucher_from)
        if voucher_to:
            query = query.filter(Voucher.voucher_number <= voucher_to)
        
        # فلتر النوع
        voucher_type = request.args.get('type')
        if voucher_type:
            query = query.filter(Voucher.voucher_type == voucher_type)
        
        # فلتر العميل/المورد
        customer_id = request.args.get('customer_id')
        supplier_id = request.args.get('supplier_id')
        if customer_id:
            query = query.filter(Voucher.customer_id == customer_id)
        if supplier_id:
            query = query.filter(Voucher.supplier_id == supplier_id)
        
        # تحديد عدد النتائج لتحسين الأداء
        limit = request.args.get('limit', 100, type=int)
        vouchers = query.order_by(Voucher.date.desc()).limit(limit).all()
        result = []
        
        for v in vouchers:
            voucher_data = {
                'id': v.id,
                'voucher_number': v.voucher_number,
                'voucher_type': v.voucher_type,
                'amount': v.amount,
                'description': v.description,
                'date': v.date.isoformat(),
                'customer': {'id': v.customer.id, 'name': v.customer.name} if v.customer else None,
                'supplier': {'id': v.supplier.id, 'name': v.supplier.name} if v.supplier else None,
                'safe_from': {'id': v.safe_from.id, 'name': v.safe_from.name} if v.safe_from else None,
                'safe_to': {'id': v.safe_to.id, 'name': v.safe_to.name} if v.safe_to else None,
                'category': {'id': v.category.id, 'name': v.category.name} if v.category else None
            }
            result.append(voucher_data)
        
        db.close()
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        
        # توليد رقم السند التلقائي
        voucher_number = generate_voucher_number(data['voucher_type'])
        
        # إنشاء السند
        voucher = Voucher(
            voucher_number=voucher_number,
            voucher_type=data['voucher_type'],
            amount=float(data['amount']),
            description=data.get('description', ''),
            date=datetime.fromisoformat(data['date']) if 'date' in data else datetime.now(),
            customer_id=data.get('customer_id'),
            supplier_id=data.get('supplier_id'),
            safe_from_id=data.get('safe_from_id'),
            safe_to_id=data.get('safe_to_id'),
            category_id=data.get('category_id')
        )
        
        db.add(voucher)
        db.commit()
        db.refresh(voucher)
        
        result = {
            'id': voucher.id,
            'voucher_number': voucher.voucher_number,
            'voucher_type': voucher.voucher_type,
            'amount': voucher.amount,
            'description': voucher.description,
            'date': voucher.date.isoformat()
        }
        
        db.close()
        return jsonify(result), 201

# ============= التقارير =============
@app.route('/api/reports/daily')
def daily_report():
    db = SessionLocal()
    date = request.args.get('date', datetime.now().date().isoformat())
    date_obj = datetime.fromisoformat(date).date()
    
    # السندات اليومية
    vouchers = db.query(Voucher).filter(
        Voucher.date >= datetime.combine(date_obj, datetime.min.time()),
        Voucher.date <= datetime.combine(date_obj, datetime.max.time())
    ).all()
    
    total_receipts = sum(v.amount for v in vouchers if v.voucher_type == 'receipt')
    total_payments = sum(v.amount for v in vouchers if v.voucher_type == 'payment')
    
    result = {
        'date': date,
        'total_receipts': total_receipts,
        'total_payments': total_payments,
        'net': total_receipts - total_payments,
        'vouchers_count': len(vouchers),
        'vouchers': [{
            'voucher_number': v.voucher_number,
            'type': v.voucher_type,
            'amount': v.amount,
            'description': v.description
        } for v in vouchers]
    }
    
    db.close()
    return jsonify(result)

@app.route('/api/reports/customer/<int:customer_id>')
def customer_statement(customer_id):
    db = SessionLocal()
    customer = db.query(Customer).filter_by(id=customer_id).first()
    
    if not customer:
        db.close()
        return jsonify({'error': 'Customer not found'}), 404
    
    # الحصول على الرصيد السابق
    date_from = request.args.get('date_from')
    previous_balance = 0
    if date_from:
        previous_balance = get_previous_balance('customer', customer_id, datetime.fromisoformat(date_from))
    
    # الحصول على الحركات
    query = db.query(Voucher).filter(Voucher.customer_id == customer_id)
    if date_from:
        query = query.filter(Voucher.date >= datetime.fromisoformat(date_from))
    date_to = request.args.get('date_to')
    if date_to:
        query = query.filter(Voucher.date <= datetime.fromisoformat(date_to))
    
    vouchers = query.order_by(Voucher.date).all()
    
    transactions = []
    running_balance = previous_balance
    
    for v in vouchers:
        if v.voucher_type == 'receipt':
            debit = v.amount
            credit = 0
            running_balance -= v.amount
        else:
            debit = 0
            credit = v.amount
            running_balance += v.amount
        
        transactions.append({
            'date': v.date.isoformat(),
            'voucher_number': v.voucher_number,
            'description': v.description,
            'debit': debit,
            'credit': credit,
            'balance': running_balance
        })
    
    result = {
        'customer': {
            'id': customer.id,
            'name': customer.name,
            'phone': customer.phone
        },
        'previous_balance': previous_balance,
        'current_balance': running_balance,
        'transactions': transactions
    }
    
    db.close()
    return jsonify(result)

@app.route('/api/reports/profit_loss')
def profit_loss_report():
    db = SessionLocal()
    
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    query = db.query(Voucher)
    if date_from:
        query = query.filter(Voucher.date >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(Voucher.date <= datetime.fromisoformat(date_to))
    
    vouchers = query.all()
    
    # حساب الإيرادات والمصروفات حسب الفئة
    income_by_category = {}
    expense_by_category = {}
    
    for v in vouchers:
        if v.category:
            if v.category.type == 'income':
                if v.category.name not in income_by_category:
                    income_by_category[v.category.name] = 0
                income_by_category[v.category.name] += v.amount
            elif v.category.type == 'expense':
                if v.category.name not in expense_by_category:
                    expense_by_category[v.category.name] = 0
                expense_by_category[v.category.name] += v.amount
    
    total_income = sum(income_by_category.values())
    total_expense = sum(expense_by_category.values())
    
    result = {
        'period': {
            'from': date_from,
            'to': date_to
        },
        'income': {
            'total': total_income,
            'by_category': income_by_category
        },
        'expenses': {
            'total': total_expense,
            'by_category': expense_by_category
        },
        'net_profit': total_income - total_expense
    }
    
    db.close()
    return jsonify(result)

# ============= البحث السريع =============
@app.route('/api/search')
def search():
    db = SessionLocal()
    query = request.args.get('q', '')
    
    results = {
        'customers': [],
        'suppliers': [],
        'vouchers': []
    }
    
    if query:
        # بحث في العملاء
        customers = db.query(Customer).filter(
            Customer.name.contains(query) | 
            Customer.phone.contains(query)
        ).limit(5).all()
        results['customers'] = [{
            'id': c.id,
            'name': c.name,
            'phone': c.phone
        } for c in customers]
        
        # بحث في الموردين
        suppliers = db.query(Supplier).filter(
            Supplier.name.contains(query) | 
            Supplier.phone.contains(query)
        ).limit(5).all()
        results['suppliers'] = [{
            'id': s.id,
            'name': s.name,
            'phone': s.phone
        } for s in suppliers]
        
        # بحث في السندات
        vouchers = db.query(Voucher).filter(
            Voucher.voucher_number.contains(query) |
            Voucher.description.contains(query)
        ).limit(10).all()
        results['vouchers'] = [{
            'id': v.id,
            'voucher_number': v.voucher_number,
            'type': v.voucher_type,
            'amount': v.amount
        } for v in vouchers]
    
    db.close()
    return jsonify(results)

# ============= الإحصائيات =============
@app.route('/api/dashboard')
def dashboard():
    db = SessionLocal()
    
    # إحصائيات اليوم
    today = datetime.now().date()
    today_vouchers = db.query(Voucher).filter(
        Voucher.date >= datetime.combine(today, datetime.min.time()),
        Voucher.date <= datetime.combine(today, datetime.max.time())
    ).all()
    
    today_receipts = sum(v.amount for v in today_vouchers if v.voucher_type == 'receipt')
    today_payments = sum(v.amount for v in today_vouchers if v.voucher_type == 'payment')
    
    # إحصائيات الشهر
    month_start = today.replace(day=1)
    month_vouchers = db.query(Voucher).filter(
        Voucher.date >= datetime.combine(month_start, datetime.min.time())
    ).all()
    
    month_receipts = sum(v.amount for v in month_vouchers if v.voucher_type == 'receipt')
    month_payments = sum(v.amount for v in month_vouchers if v.voucher_type == 'payment')
    
    # أرصدة الخزائن
    safes = db.query(Safe).all()
    safes_balances = []
    for safe in safes:
        balance = get_previous_balance('safe', safe.id)
        safes_balances.append({
            'id': safe.id,
            'name': safe.name,
            'balance': balance,
            'is_main': safe.is_main
        })
    
    # عدد العملاء والموردين
    customers_count = db.query(Customer).count()
    suppliers_count = db.query(Supplier).count()
    
    # آخر 5 سندات
    recent_vouchers = db.query(Voucher).order_by(Voucher.date.desc()).limit(5).all()
    recent = []
    for v in recent_vouchers:
        recent.append({
            'voucher_number': v.voucher_number,
            'type': v.voucher_type,
            'amount': v.amount,
            'date': v.date.isoformat()
        })
    
    result = {
        'today': {
            'receipts': today_receipts,
            'payments': today_payments,
            'net': today_receipts - today_payments,
            'count': len(today_vouchers)
        },
        'month': {
            'receipts': month_receipts,
            'payments': month_payments,
            'net': month_receipts - month_payments,
            'count': len(month_vouchers)
        },
        'safes': safes_balances,
        'customers_count': customers_count,
        'suppliers_count': suppliers_count,
        'recent_vouchers': recent
    }
    
    db.close()
    return jsonify(result)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)