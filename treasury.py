# -*- coding: utf-8 -*-

class Treasury:
    """
    يمثل خزنة فردية لها اسم ورصيد.
    هذه الفئة معدلة للعمل مع تطبيق ويب (بدون أوامر طباعة).
    """
    def __init__(self, name, initial_balance=0):
        """
        المنشئ لـ class الخزنة.
        """
        if not isinstance(initial_balance, (int, float)) or initial_balance < 0:
            raise ValueError("لا يمكن أن يكون الرصيد الأولي سالبًا")
        self.name = name
        self.balance = initial_balance

    def deposit(self, amount):
        """
        إضافة مبلغ إلى رصيد الخزنة.
        تُرجع True عند النجاح، وتطلق ValueError عند الفشل.
        """
        if not isinstance(amount, (int, float)) or amount <= 0:
            raise ValueError("يجب أن يكون مبلغ الإيداع رقمًا موجبًا")
        self.balance += amount
        return True

    def withdraw(self, amount):
        """
        سحب مبلغ من رصيد الخزنة.
        تُرجع True عند النجاح، وتطلق ValueError عند الفشل.
        """
        if not isinstance(amount, (int, float)) or amount <= 0:
            raise ValueError("يجب أن يكون مبلغ السحب رقمًا موجبًا")
        if amount > self.balance:
            raise ValueError(f"رصيد غير كافٍ في '{self.name}' لسحب {amount}")
        self.balance -= amount
        return True

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
        self.all_treasuries = {self.name: self}

    def add_sub_treasury(self, sub_treasury):
        """
        إضافة خزنة فرعية إلى الخزينة الرئيسية.
        """
        if not isinstance(sub_treasury, Treasury) or isinstance(sub_treasury, MainTreasury):
            raise TypeError("يمكن إضافة خزائن من نوع Treasury فقط (وليست MainTreasury)")
        self.sub_treasuries.append(sub_treasury)
        self.all_treasuries[sub_treasury.name] = sub_treasury

    def get_total_balance(self):
        """
        حساب الرصيد الإجمالي (رصيد الخزنة الرئيسية + أرصدة كل الخزائن الفرعية).
        """
        return self.balance + sum(sub.balance for sub in self.sub_treasuries)

    def transfer(self, from_treasury_name, to_treasury_name, amount):
        """
        تحويل مبلغ من خزنة إلى أخرى باستخدام أسمائهم.
        """
        if from_treasury_name not in self.all_treasuries:
            raise ValueError(f"الخزنة المصدر '{from_treasury_name}' غير موجودة.")
        if to_treasury_name not in self.all_treasuries:
            raise ValueError(f"الخزنة الهدف '{to_treasury_name}' غير موجودة.")

        from_treasury = self.all_treasuries[from_treasury_name]
        to_treasury = self.all_treasuries[to_treasury_name]

        from_treasury.withdraw(amount)
        to_treasury.deposit(amount)
        return True

    def __str__(self):
        return f"الخزنة الرئيسية: {self.name}, الرصيد الخاص: {self.balance}, الرصيد الإجمالي: {self.get_total_balance()}"
