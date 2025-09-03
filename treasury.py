# -*- coding: utf-8 -*-

class Treasury:
    """
    يمثل خزنة فردية لها اسم ورصيد.
    """
    def __init__(self, name, initial_balance=0):
        """
        المنشئ لـ class الخزنة.

        :param name: اسم الخزنة (مثال: "خزنة المصروفات اليومية").
        :param initial_balance: الرصيد الأولي للخزنة.
        """
        if initial_balance < 0:
            raise ValueError("لا يمكن أن يكون الرصيد الأولي سالبًا")
        self.name = name
        self.balance = initial_balance

    def deposit(self, amount):
        """
        إضافة مبلغ إلى رصيد الخزنة.

        :param amount: المبلغ المراد إضافته.
        """
        if amount <= 0:
            raise ValueError("يجب أن يكون مبلغ الإيداع أكبر من صفر")
        self.balance += amount
        print(f"تم إيداع {amount} في '{self.name}'. الرصيد الجديد: {self.balance}")

    def withdraw(self, amount):
        """
        سحب مبلغ من رصيد الخزنة.

        :param amount: المبلغ المراد سحبه.
        """
        if amount <= 0:
            raise ValueError("يجب أن يكون مبلغ السحب أكبر من صفر")
        if amount > self.balance:
            raise ValueError(f"رصيد غير كافٍ في '{self.name}' لسحب {amount}")
        self.balance -= amount
        print(f"تم سحب {amount} من '{self.name}'. الرصيد الجديد: {self.balance}")

    def __str__(self):
        return f"الخزنة: {self.name}, الرصيد: {self.balance}"


class MainTreasury(Treasury):
    """
    يمثل الخزنة الرئيسية التي تدير مجموعة من الخزائن الفرعية.
    """
    def __init__(self, name, initial_balance=0):
        """
        المنشئ لـ class الخزنة الرئيسية.
        """
        super().__init__(name, initial_balance)
        self.sub_treasuries = []

    def add_sub_treasury(self, sub_treasury):
        """
        إضافة خزنة فرعية إلى الخزينة الرئيسية.
        """
        if not isinstance(sub_treasury, Treasury) or isinstance(sub_treasury, MainTreasury):
            raise TypeError("يمكن إضافة خزائن من نوع Treasury فقط (وليست MainTreasury)")
        self.sub_treasuries.append(sub_treasury)
        print(f"تمت إضافة الخزنة الفرعية '{sub_treasury.name}' إلى '{self.name}'.")

    def get_total_balance(self):
        """
        حساب الرصيد الإجمالي (رصيد الخزنة الرئيسية + أرصدة كل الخزائن الفرعية).
        """
        total = self.balance
        for sub in self.sub_treasuries:
            total += sub.balance
        return total

    @staticmethod
    def transfer(from_treasury, to_treasury, amount):
        """
        تحويل مبلغ من خزنة إلى أخرى.
        """
        print(f"\n-- بدء عملية التحويل --")
        print(f"من: '{from_treasury.name}' (الرصيد الحالي: {from_treasury.balance})")
        print(f"إلى: '{to_treasury.name}' (الرصيد الحالي: {to_treasury.balance})")
        print(f"المبلغ: {amount}")

        from_treasury.withdraw(amount)
        to_treasury.deposit(amount)

        print(f"-- انتهت عملية التحويل بنجاح --")

    def generate_report(self):
        """
        إنشاء وطباعة تقرير مفصل عن الخزينة الرئيسية والخزائن الفرعية.
        """
        print("\n" + "="*40)
        print(f"تقرير الخزينة الهرمية - '{self.name}'")
        print("="*40)
        print(f"الخزنة الرئيسية: {self.name}")
        print(f"  - الرصيد الخاص بالخزنة الرئيسية: {self.balance}")
        print("\nالخزائن الفرعية:")
        if not self.sub_treasuries:
            print("  - لا توجد خزائن فرعية.")
        else:
            for sub in self.sub_treasuries:
                print(f"  - {sub}")
        print("-"*40)
        print(f"** الرصيد الإجمالي لجميع الخزائن: {self.get_total_balance()} **")
        print("="*40 + "\n")

    def __str__(self):
        return f"الخزنة الرئيسية: {self.name}, الرصيد الخاص: {self.balance}, الرصيد الإجمالي: {self.get_total_balance()}"
