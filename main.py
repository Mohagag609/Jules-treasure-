# -*- coding: utf-8 -*-

from treasury import Treasury, MainTreasury

def main():
    """
    الوظيفة الرئيسية لتشغيل المثال التوضيحي لنظام الخزينة الهرمية.
    """
    print("--- بدء إعداد نظام الخزينة الهرمية ---")

    # 1. إنشاء الخزنة الرئيسية برصيد أولي
    # لنفترض أن الشركة تبدأ برصيد 50,000 في الخزنة الرئيسية
    main_safe = MainTreasury("الخزنة الرئيسية للشركة", 50000)

    # 2. إنشاء الخزائن الفرعية بأرصدة أولية تساوي صفر
    project_safe = Treasury("خزنة المشروع أ")
    suppliers_safe = Treasury("خزنة الموردين")
    expenses_safe = Treasury("خزنة المصروفات اليومية")

    # 3. ربط الخزائن الفرعية بالخزينة الرئيسية
    main_safe.add_sub_treasury(project_safe)
    main_safe.add_sub_treasury(suppliers_safe)
    main_safe.add_sub_treasury(expenses_safe)

    # طباعة التقرير الأولي بعد الإعداد
    main_safe.generate_report()

    # 4. تخصيص مبالغ من الخزنة الرئيسية إلى الخزائن الفرعية (تسوية)
    print("\n--- بدء تخصيص الأموال للخزائن الفرعية ---")
    MainTreasury.transfer(main_safe, project_safe, 10000) # تخصيص 10,000 للمشروع
    MainTreasury.transfer(main_safe, suppliers_safe, 5000) # تخصيص 5,000 للموردين
    MainTreasury.transfer(main_safe, expenses_safe, 2000) # تخصيص 2,000 للمصروفات

    # طباعة التقرير بعد تخصيص الأموال
    main_safe.generate_report()

    # 5. محاكاة عمليات الصرف من الخزائن الفرعية
    print("\n--- محاكاة عمليات الصرف ---")

    # صرف من خزنة المشروع
    project_safe.withdraw(3000)

    # صرف من خزنة الموردين
    suppliers_safe.withdraw(1000)

    # صرف من خزنة المصروفات اليومية
    expenses_safe.withdraw(500)

    # 6. طباعة التقرير النهائي
    print("\n--- التقرير النهائي بعد عمليات الصرف ---")
    main_safe.generate_report()


if __name__ == "__main__":
    main()
