# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, redirect, url_for, flash
from treasury import Treasury, MainTreasury

# --- إعداد التطبيق والخزائن ---
app = Flask(__name__)
app.secret_key = 'super-secret-key-for-demo'

# إعداد كائنات الخزينة مرة واحدة عند بدء التطبيق
main_safe = MainTreasury("الخزنة الرئيسية للشركة", 33000)
project_safe = Treasury("خزنة المشروع أ", 7000)
suppliers_safe = Treasury("خزنة الموردين", 4000)
expenses_safe = Treasury("خزنة المصروفات اليومية", 1500)

main_safe.add_sub_treasury(project_safe)
main_safe.add_sub_treasury(suppliers_safe)
main_safe.add_sub_treasury(expenses_safe)
# ------------------------------------

@app.route('/')
def index():
    """
    يعرض الصفحة الرئيسية مع تقرير الخزينة.
    """
    return render_template('index.html', main_treasury=main_safe)

@app.route('/transaction', methods=['POST'])
def handle_transaction():
    """
    يعالج جميع أنواع المعاملات (إيداع، سحب، تحويل) من النماذج.
    """
    try:
        # استخراج البيانات المشتركة
        action = request.form.get('action')
        amount = float(request.form.get('amount'))

        if action == 'deposit' or action == 'withdraw':
            treasury_name = request.form.get('treasury_name')
            target_treasury = main_safe.all_treasuries.get(treasury_name)

            if not target_treasury:
                flash(f"خطأ: الخزنة '{treasury_name}' غير موجودة.", 'danger')
                return redirect(url_for('index'))

            if action == 'deposit':
                target_treasury.deposit(amount)
                flash(f"تم إيداع {amount} بنجاح في '{treasury_name}'.", 'success')

            elif action == 'withdraw':
                target_treasury.withdraw(amount)
                flash(f"تم سحب {amount} بنجاح من '{treasury_name}'.", 'success')

        elif action == 'transfer':
            from_treasury_name = request.form.get('from_treasury')
            to_treasury_name = request.form.get('to_treasury')

            main_safe.transfer(from_treasury_name, to_treasury_name, amount)
            flash(f"تم تحويل {amount} بنجاح من '{from_treasury_name}' إلى '{to_treasury_name}'.", 'success')

    except (ValueError, TypeError) as e:
        # التقاط الأخطاء من treasury.py أو من تحويل النوع
        flash(f"حدث خطأ: {e}", 'danger')

    except Exception as e:
        # التقاط أي أخطاء غير متوقعة
        flash(f"حدث خطأ غير متوقع: {e}", 'danger')

    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
