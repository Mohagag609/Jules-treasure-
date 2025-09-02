from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from sqlalchemy.orm import Session
from database import *
from datetime import datetime, timedelta
import json
import io
# التقارير PDF و Excel سيتم إضافتها لاحقاً
import os

app = Flask(__name__)
CORS(app)

# Initialize database on startup
init_db()

# الصفحة الرئيسية
@app.route('/')
def index():
    return render_template('index.html')

# ============= العملاء =============
@app.route('/api/customers', methods=['GET', 'POST'])
def handle_customers():
    db = SessionLocal()
    
    if request.method == 'GET':
        customers = db.query(Customer).all()
        result = []
        for c in customers:
            # حساب الرصيد الحالي
            balance = get_previous_balance('customer', c.id)
            result.append({
                'id': c.id,
                'name': c.name,
                'phone': c.phone,
                'address': c.address,
                'balance': balance,
                'created_at': c.created_at.isoformat()
            })
        db.close()
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        customer = Customer(
            name=data['name'],
            phone=data.get('phone', ''),
            address=data.get('address', '')
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        result = {
            'id': customer.id,
            'name': customer.name,
            'phone': customer.phone,
            'address': customer.address,
            'balance': 0
        }
        db.close()
        return jsonify(result), 201

@app.route('/api/customers/<int:customer_id>', methods=['PUT', 'DELETE'])
def handle_customer(customer_id):
    db = SessionLocal()
    customer = db.query(Customer).filter_by(id=customer_id).first()
    
    if not customer:
        db.close()
        return jsonify({'error': 'Customer not found'}), 404
    
    if request.method == 'PUT':
        data = request.json
        customer.name = data.get('name', customer.name)
        customer.phone = data.get('phone', customer.phone)
        customer.address = data.get('address', customer.address)
        db.commit()
        db.close()
        return jsonify({'message': 'Customer updated successfully'})
    
    elif request.method == 'DELETE':
        db.delete(customer)
        db.commit()
        db.close()
        return jsonify({'message': 'Customer deleted successfully'})

# ============= الموردين =============
@app.route('/api/suppliers', methods=['GET', 'POST'])
def handle_suppliers():
    db = SessionLocal()
    
    if request.method == 'GET':
        suppliers = db.query(Supplier).all()
        result = []
        for s in suppliers:
            balance = get_previous_balance('supplier', s.id)
            result.append({
                'id': s.id,
                'name': s.name,
                'phone': s.phone,
                'address': s.address,
                'balance': balance,
                'created_at': s.created_at.isoformat()
            })
        db.close()
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        supplier = Supplier(
            name=data['name'],
            phone=data.get('phone', ''),
            address=data.get('address', '')
        )
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        result = {
            'id': supplier.id,
            'name': supplier.name,
            'phone': supplier.phone,
            'address': supplier.address,
            'balance': 0
        }
        db.close()
        return jsonify(result), 201

# ============= الخزائن =============
@app.route('/api/safes', methods=['GET', 'POST'])
def handle_safes():
    db = SessionLocal()
    
    if request.method == 'GET':
        safes = db.query(Safe).all()
        result = []
        for s in safes:
            balance = get_previous_balance('safe', s.id)
            result.append({
                'id': s.id,
                'name': s.name,
                'type': s.type,
                'balance': balance,
                'is_main': s.is_main,
                'created_at': s.created_at.isoformat()
            })
        db.close()
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        safe = Safe(
            name=data['name'],
            type=data.get('type', 'branch'),
            is_main=data.get('is_main', False)
        )
        db.add(safe)
        db.commit()
        db.refresh(safe)
        result = {
            'id': safe.id,
            'name': safe.name,
            'type': safe.type,
            'balance': 0,
            'is_main': safe.is_main
        }
        db.close()
        return jsonify(result), 201

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
        
        vouchers = query.order_by(Voucher.date.desc()).all()
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