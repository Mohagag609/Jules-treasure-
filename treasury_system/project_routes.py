# API Routes لنظام المشاريع

from flask import Blueprint, request, jsonify
from sqlalchemy import text
from database import SessionLocal
import datetime

project_bp = Blueprint('projects', __name__)

# ============= المشاريع =============
@project_bp.route('/api/projects', methods=['GET', 'POST'])
def handle_projects():
    db = SessionLocal()
    
    if request.method == 'GET':
        projects = db.execute(text("""
            SELECT p.*, s.name as safe_name,
                   COUNT(DISTINCT pp.partner_id) as partners_count,
                   COUNT(DISTINCT ph.id) as phases_count
            FROM projects p
            LEFT JOIN safes s ON p.safe_id = s.id
            LEFT JOIN project_partners pp ON p.id = pp.project_id
            LEFT JOIN project_phases ph ON p.id = ph.project_id
            GROUP BY p.id, s.name
            ORDER BY p.created_at DESC
        """)).fetchall()
        
        result = []
        for p in projects:
            result.append({
                'id': p.id,
                'name': p.name,
                'description': p.description,
                'safe_name': p.safe_name,
                'total_budget': p.total_budget,
                'total_invested': p.total_invested,
                'total_spent': p.total_spent,
                'total_revenue': p.total_revenue,
                'profit': p.total_revenue - p.total_spent,
                'partners_count': p.partners_count,
                'phases_count': p.phases_count,
                'status': p.status,
                'start_date': p.start_date.isoformat() if p.start_date else None,
                'end_date': p.end_date.isoformat() if p.end_date else None
            })
        
        db.close()
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        
        # إنشاء خزينة خاصة بالمشروع
        safe_result = db.execute(text("""
            INSERT INTO safes (name, type, is_container)
            VALUES (:name, 'project', false)
            RETURNING id
        """), {'name': f"خزينة {data['name']}"})
        db.commit()
        
        safe_id = safe_result.first().id
        
        # إنشاء المشروع
        result = db.execute(text("""
            INSERT INTO projects (name, description, safe_id, total_budget, status, start_date, end_date)
            VALUES (:name, :description, :safe_id, :budget, :status, :start_date, :end_date)
            RETURNING id
        """), {
            'name': data['name'],
            'description': data.get('description', ''),
            'safe_id': safe_id,
            'budget': data.get('total_budget', 0),
            'status': data.get('status', 'planning'),
            'start_date': data.get('start_date'),
            'end_date': data.get('end_date')
        })
        db.commit()
        
        project_id = result.first().id
        
        # إضافة الشركاء إن وجدوا
        if 'partners' in data:
            for partner in data['partners']:
                db.execute(text("""
                    INSERT INTO project_partners (project_id, partner_id, share_percentage, invested_amount)
                    VALUES (:project_id, :partner_id, :share, :amount)
                """), {
                    'project_id': project_id,
                    'partner_id': partner['partner_id'],
                    'share': partner['share_percentage'],
                    'amount': partner.get('invested_amount', 0)
                })
            db.commit()
        
        db.close()
        return jsonify({'id': project_id, 'message': 'تم إنشاء المشروع بنجاح'}), 201

@project_bp.route('/api/projects/<int:project_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_project(project_id):
    db = SessionLocal()
    
    if request.method == 'GET':
        # معلومات المشروع
        project = db.execute(text("""
            SELECT p.*, s.name as safe_name, s.balance as safe_balance
            FROM projects p
            LEFT JOIN safes s ON p.safe_id = s.id
            WHERE p.id = :id
        """), {'id': project_id}).first()
        
        if not project:
            db.close()
            return jsonify({'error': 'المشروع غير موجود'}), 404
        
        # الشركاء
        partners = db.execute(text("""
            SELECT pt.*, pp.share_percentage, pp.invested_amount
            FROM project_partners pp
            JOIN partners pt ON pp.partner_id = pt.id
            WHERE pp.project_id = :project_id
        """), {'project_id': project_id}).fetchall()
        
        # المراحل
        phases = db.execute(text("""
            SELECT * FROM project_phases
            WHERE project_id = :project_id
            ORDER BY phase_number
        """), {'project_id': project_id}).fetchall()
        
        result = {
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'safe': {
                'id': project.safe_id,
                'name': project.safe_name,
                'balance': project.safe_balance
            },
            'total_budget': project.total_budget,
            'total_invested': project.total_invested,
            'total_spent': project.total_spent,
            'total_revenue': project.total_revenue,
            'profit': project.total_revenue - project.total_spent,
            'status': project.status,
            'start_date': project.start_date.isoformat() if project.start_date else None,
            'end_date': project.end_date.isoformat() if project.end_date else None,
            'partners': [{
                'id': p.id,
                'name': p.name,
                'phone': p.phone,
                'share_percentage': p.share_percentage,
                'invested_amount': p.invested_amount,
                'expected_return': (p.share_percentage / 100) * (project.total_revenue - project.total_spent)
            } for p in partners],
            'phases': [{
                'id': ph.id,
                'name': ph.name,
                'phase_number': ph.phase_number,
                'budget': ph.budget,
                'spent': ph.spent,
                'revenue': ph.revenue,
                'completion': ph.completion_percentage,
                'status': ph.status
            } for ph in phases]
        }
        
        db.close()
        return jsonify(result)
    
    elif request.method == 'DELETE':
        # حذف المشروع وكل ما يتعلق به
        db.execute(text("DELETE FROM projects WHERE id = :id"), {'id': project_id})
        db.commit()
        db.close()
        return jsonify({'message': 'تم حذف المشروع بنجاح'})

# ============= المراحل =============
@project_bp.route('/api/projects/<int:project_id>/phases', methods=['GET', 'POST'])
def handle_phases(project_id):
    db = SessionLocal()
    
    if request.method == 'GET':
        phases = db.execute(text("""
            SELECT ph.*, 
                   COUNT(DISTINCT ps.supplier_id) as suppliers_count,
                   SUM(ps.contract_amount) as total_contracts,
                   SUM(ps.paid_amount) as total_paid
            FROM project_phases ph
            LEFT JOIN phase_suppliers ps ON ph.id = ps.phase_id
            WHERE ph.project_id = :project_id
            GROUP BY ph.id
            ORDER BY ph.phase_number
        """), {'project_id': project_id}).fetchall()
        
        result = []
        for ph in phases:
            result.append({
                'id': ph.id,
                'name': ph.name,
                'description': ph.description,
                'phase_number': ph.phase_number,
                'budget': ph.budget,
                'spent': ph.spent,
                'revenue': ph.revenue,
                'profit': ph.revenue - ph.spent,
                'completion': ph.completion_percentage,
                'status': ph.status,
                'suppliers_count': ph.suppliers_count,
                'total_contracts': ph.total_contracts or 0,
                'total_paid': ph.total_paid or 0,
                'remaining': (ph.total_contracts or 0) - (ph.total_paid or 0)
            })
        
        db.close()
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        
        result = db.execute(text("""
            INSERT INTO project_phases 
            (name, description, project_id, phase_number, budget, status, start_date, end_date)
            VALUES (:name, :description, :project_id, :phase_number, :budget, :status, :start_date, :end_date)
            RETURNING id
        """), {
            'name': data['name'],
            'description': data.get('description', ''),
            'project_id': project_id,
            'phase_number': data.get('phase_number', 1),
            'budget': data.get('budget', 0),
            'status': data.get('status', 'pending'),
            'start_date': data.get('start_date'),
            'end_date': data.get('end_date')
        })
        db.commit()
        
        phase_id = result.first().id
        db.close()
        return jsonify({'id': phase_id, 'message': 'تم إنشاء المرحلة بنجاح'}), 201

@project_bp.route('/api/phases/<int:phase_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_phase(phase_id):
    db = SessionLocal()
    
    if request.method == 'GET':
        # معلومات المرحلة
        phase = db.execute(text("""
            SELECT ph.*, p.name as project_name
            FROM project_phases ph
            JOIN projects p ON ph.project_id = p.id
            WHERE ph.id = :id
        """), {'id': phase_id}).first()
        
        if not phase:
            db.close()
            return jsonify({'error': 'المرحلة غير موجودة'}), 404
        
        # الموردين
        suppliers = db.execute(text("""
            SELECT s.*, ps.contract_amount, ps.paid_amount, ps.service_type,
                   (ps.contract_amount - ps.paid_amount) as remaining
            FROM phase_suppliers ps
            JOIN suppliers s ON ps.supplier_id = s.id
            WHERE ps.phase_id = :phase_id
        """), {'phase_id': phase_id}).fetchall()
        
        # مدفوعات الشركاء في هذه المرحلة
        partner_payments = db.execute(text("""
            SELECT pp.*, pt.name as partner_name
            FROM partner_payments pp
            JOIN partners pt ON pp.partner_id = pt.id
            WHERE pp.phase_id = :phase_id
            ORDER BY pp.date DESC
        """), {'phase_id': phase_id}).fetchall()
        
        result = {
            'id': phase.id,
            'name': phase.name,
            'description': phase.description,
            'project_name': phase.project_name,
            'phase_number': phase.phase_number,
            'budget': phase.budget,
            'spent': phase.spent,
            'revenue': phase.revenue,
            'profit': phase.revenue - phase.spent,
            'completion': phase.completion_percentage,
            'status': phase.status,
            'suppliers': [{
                'id': s.id,
                'name': s.name,
                'phone': s.phone,
                'service_type': s.service_type,
                'contract_amount': s.contract_amount,
                'paid_amount': s.paid_amount,
                'remaining': s.remaining
            } for s in suppliers],
            'partner_payments': [{
                'id': pp.id,
                'partner_name': pp.partner_name,
                'amount': pp.amount,
                'payment_type': pp.payment_type,
                'date': pp.date.isoformat() if pp.date else None,
                'description': pp.description
            } for pp in partner_payments]
        }
        
        db.close()
        return jsonify(result)

# ============= الشركاء =============
@project_bp.route('/api/partners', methods=['GET', 'POST'])
def handle_partners():
    db = SessionLocal()
    
    if request.method == 'GET':
        partners = db.execute(text("""
            SELECT p.*, 
                   COUNT(DISTINCT pp.project_id) as projects_count,
                   SUM(pp.invested_amount) as total_invested
            FROM partners p
            LEFT JOIN project_partners pp ON p.id = pp.partner_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        """)).fetchall()
        
        result = []
        for p in partners:
            result.append({
                'id': p.id,
                'name': p.name,
                'phone': p.phone,
                'email': p.email,
                'partner_type': p.partner_type,
                'projects_count': p.projects_count,
                'total_invested': p.total_invested or 0
            })
        
        db.close()
        return jsonify(result)
    
    elif request.method == 'POST':
        data = request.json
        
        result = db.execute(text("""
            INSERT INTO partners (name, phone, email, address, national_id, partner_type)
            VALUES (:name, :phone, :email, :address, :national_id, :partner_type)
            RETURNING id
        """), {
            'name': data['name'],
            'phone': data.get('phone'),
            'email': data.get('email'),
            'address': data.get('address'),
            'national_id': data.get('national_id'),
            'partner_type': data.get('partner_type', 'individual')
        })
        db.commit()
        
        partner_id = result.first().id
        db.close()
        return jsonify({'id': partner_id, 'message': 'تم إضافة الشريك بنجاح'}), 201

# ============= ربط الموردين بالمراحل =============
@project_bp.route('/api/phases/<int:phase_id>/suppliers', methods=['POST'])
def add_supplier_to_phase(phase_id):
    db = SessionLocal()
    data = request.json
    
    try:
        db.execute(text("""
            INSERT INTO phase_suppliers 
            (phase_id, supplier_id, contract_amount, service_type)
            VALUES (:phase_id, :supplier_id, :contract_amount, :service_type)
        """), {
            'phase_id': phase_id,
            'supplier_id': data['supplier_id'],
            'contract_amount': data.get('contract_amount', 0),
            'service_type': data.get('service_type', '')
        })
        db.commit()
        db.close()
        return jsonify({'message': 'تم ربط المورد بالمرحلة بنجاح'}), 201
    except Exception as e:
        db.close()
        return jsonify({'error': str(e)}), 400

# ============= الإدخال السريع للسندات =============
@project_bp.route('/api/quick-voucher', methods=['POST'])
def quick_voucher():
    db = SessionLocal()
    data = request.json
    
    try:
        # توليد رقم السند
        last_voucher = db.execute(text(
            "SELECT voucher_number FROM vouchers ORDER BY id DESC LIMIT 1"
        )).first()
        
        if last_voucher:
            last_num = int(last_voucher.voucher_number.split('-')[1])
            voucher_number = f"V-{last_num + 1:06d}"
        else:
            voucher_number = "V-000001"
        
        # إنشاء السند
        result = db.execute(text("""
            INSERT INTO vouchers 
            (voucher_number, voucher_type, amount, description, date, 
             project_id, phase_id, supplier_id, customer_id, safe_from_id, safe_to_id)
            VALUES (:voucher_number, :voucher_type, :amount, :description, :date,
                    :project_id, :phase_id, :supplier_id, :customer_id, :safe_from_id, :safe_to_id)
            RETURNING id
        """), {
            'voucher_number': voucher_number,
            'voucher_type': data['voucher_type'],
            'amount': data['amount'],
            'description': data.get('description', ''),
            'date': data.get('date', datetime.date.today()),
            'project_id': data.get('project_id'),
            'phase_id': data.get('phase_id'),
            'supplier_id': data.get('supplier_id'),
            'customer_id': data.get('partner_id'),  # الشركاء بدل العملاء
            'safe_from_id': data.get('safe_from_id'),
            'safe_to_id': data.get('safe_to_id')
        })
        
        voucher_id = result.first().id
        
        # تحديث أرصدة المشروع والمرحلة
        if data.get('phase_id'):
            if data['voucher_type'] == 'payment':
                # دفعة لمورد
                db.execute(text("""
                    UPDATE project_phases 
                    SET spent = spent + :amount
                    WHERE id = :phase_id
                """), {'amount': data['amount'], 'phase_id': data['phase_id']})
                
                # تحديث المدفوع للمورد
                if data.get('supplier_id'):
                    db.execute(text("""
                        UPDATE phase_suppliers
                        SET paid_amount = paid_amount + :amount
                        WHERE phase_id = :phase_id AND supplier_id = :supplier_id
                    """), {
                        'amount': data['amount'],
                        'phase_id': data['phase_id'],
                        'supplier_id': data['supplier_id']
                    })
                    
            elif data['voucher_type'] == 'receipt':
                # إيراد من المرحلة
                db.execute(text("""
                    UPDATE project_phases 
                    SET revenue = revenue + :amount
                    WHERE id = :phase_id
                """), {'amount': data['amount'], 'phase_id': data['phase_id']})
        
        # تحديث أرصدة المشروع الكلية
        if data.get('project_id'):
            if data['voucher_type'] == 'payment':
                db.execute(text("""
                    UPDATE projects 
                    SET total_spent = total_spent + :amount
                    WHERE id = :project_id
                """), {'amount': data['amount'], 'project_id': data['project_id']})
            elif data['voucher_type'] == 'receipt':
                db.execute(text("""
                    UPDATE projects 
                    SET total_revenue = total_revenue + :amount
                    WHERE id = :project_id
                """), {'amount': data['amount'], 'project_id': data['project_id']})
        
        db.commit()
        db.close()
        
        return jsonify({
            'id': voucher_id,
            'voucher_number': voucher_number,
            'message': 'تم إنشاء السند بنجاح'
        }), 201
        
    except Exception as e:
        db.rollback()
        db.close()
        return jsonify({'error': str(e)}), 400

# ============= تقارير المشاريع =============
@project_bp.route('/api/projects/<int:project_id>/report')
def project_report(project_id):
    db = SessionLocal()
    
    # تقرير شامل عن المشروع
    report = db.execute(text("""
        SELECT 
            p.*,
            COUNT(DISTINCT pp.partner_id) as partners_count,
            COUNT(DISTINCT ph.id) as phases_count,
            COUNT(DISTINCT v.id) as vouchers_count,
            SUM(CASE WHEN v.voucher_type = 'receipt' THEN v.amount ELSE 0 END) as total_receipts,
            SUM(CASE WHEN v.voucher_type = 'payment' THEN v.amount ELSE 0 END) as total_payments
        FROM projects p
        LEFT JOIN project_partners pp ON p.id = pp.project_id
        LEFT JOIN project_phases ph ON p.id = ph.project_id
        LEFT JOIN vouchers v ON p.id = v.project_id
        WHERE p.id = :project_id
        GROUP BY p.id
    """), {'project_id': project_id}).first()
    
    if not report:
        db.close()
        return jsonify({'error': 'المشروع غير موجود'}), 404
    
    # تفاصيل كل مرحلة
    phases_details = db.execute(text("""
        SELECT 
            ph.*,
            COUNT(DISTINCT ps.supplier_id) as suppliers_count,
            SUM(ps.contract_amount) as total_contracts,
            SUM(ps.paid_amount) as total_paid,
            COUNT(DISTINCT v.id) as vouchers_count
        FROM project_phases ph
        LEFT JOIN phase_suppliers ps ON ph.id = ps.phase_id
        LEFT JOIN vouchers v ON ph.id = v.phase_id
        WHERE ph.project_id = :project_id
        GROUP BY ph.id
        ORDER BY ph.phase_number
    """), {'project_id': project_id}).fetchall()
    
    # تفاصيل الشركاء
    partners_details = db.execute(text("""
        SELECT 
            pt.*,
            pp.share_percentage,
            pp.invested_amount,
            COUNT(DISTINCT pmt.id) as payments_count,
            SUM(CASE WHEN pmt.payment_type = 'investment' THEN pmt.amount ELSE 0 END) as total_invested_payments,
            SUM(CASE WHEN pmt.payment_type = 'withdrawal' THEN pmt.amount ELSE 0 END) as total_withdrawals
        FROM project_partners pp
        JOIN partners pt ON pp.partner_id = pt.id
        LEFT JOIN partner_payments pmt ON pt.id = pmt.partner_id AND pmt.project_id = :project_id
        WHERE pp.project_id = :project_id
        GROUP BY pt.id, pp.share_percentage, pp.invested_amount
    """), {'project_id': project_id}).fetchall()
    
    result = {
        'project': {
            'id': report.id,
            'name': report.name,
            'status': report.status,
            'total_budget': report.total_budget,
            'total_invested': report.total_invested,
            'total_spent': report.total_spent,
            'total_revenue': report.total_revenue,
            'profit': report.total_revenue - report.total_spent,
            'roi': ((report.total_revenue - report.total_spent) / report.total_invested * 100) if report.total_invested > 0 else 0,
            'partners_count': report.partners_count,
            'phases_count': report.phases_count,
            'vouchers_count': report.vouchers_count
        },
        'phases': [{
            'name': ph.name,
            'phase_number': ph.phase_number,
            'budget': ph.budget,
            'spent': ph.spent,
            'revenue': ph.revenue,
            'profit': ph.revenue - ph.spent,
            'completion': ph.completion_percentage,
            'status': ph.status,
            'suppliers_count': ph.suppliers_count,
            'total_contracts': ph.total_contracts or 0,
            'total_paid': ph.total_paid or 0,
            'remaining': (ph.total_contracts or 0) - (ph.total_paid or 0)
        } for ph in phases_details],
        'partners': [{
            'name': pt.name,
            'share_percentage': pt.share_percentage,
            'invested_amount': pt.invested_amount,
            'total_invested_payments': pt.total_invested_payments or 0,
            'total_withdrawals': pt.total_withdrawals or 0,
            'current_balance': pt.invested_amount + 
                             (pt.share_percentage / 100 * (report.total_revenue - report.total_spent)) - 
                             (pt.total_withdrawals or 0),
            'expected_profit': pt.share_percentage / 100 * (report.total_revenue - report.total_spent)
        } for pt in partners_details]
    }
    
    db.close()
    return jsonify(result)