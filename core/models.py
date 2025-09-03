from django.db import models
from django.db.models import Sum

class Project(models.Model):
    name = models.CharField(max_length=255, verbose_name="اسم المشروع")
    start_date = models.DateField(verbose_name="تاريخ البدء")
    end_date = models.DateField(verbose_name="تاريخ الانتهاء المتوقع")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def treasury_balance(self):
        """Calculates the current treasury balance for the project."""
        total_income = self.partner_payments.aggregate(total=Sum('amount'))['total'] or 0
        total_expense = self.supplier_payments.aggregate(total=Sum('amount'))['total'] or 0
        return total_income - total_expense

class Phase(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='phases', verbose_name="المشروع")
    name = models.CharField(max_length=255, verbose_name="اسم المرحلة")
    amount_required = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="المبلغ الإجمالي المطلوب")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.project.name} - {self.name}"

class Partner(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='partners', verbose_name="المشروع")
    name = models.CharField(max_length=255, verbose_name="اسم الشريك")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="نسبة الشريك") # e.g., 50.00 for 50%
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Supplier(models.Model):
    name = models.CharField(max_length=255, verbose_name="اسم المورد")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Material(models.Model):
    phase = models.ForeignKey(Phase, on_delete=models.CASCADE, related_name='materials', verbose_name="المرحلة")
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='materials', verbose_name="المورد")
    name = models.CharField(max_length=255, verbose_name="اسم البند/المادة")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="الكمية")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="سعر الوحدة")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_price(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return self.name

class PartnerPayment(models.Model):
    """Incoming payments from partners."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='partner_payments', verbose_name="المشروع")
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='payments', verbose_name="الشريك")
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="المبلغ المدفوع")
    payment_date = models.DateField(verbose_name="تاريخ الدفع")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment from {self.partner.name} of {self.amount}"

class SupplierPayment(models.Model):
    """Outgoing payments to suppliers."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='supplier_payments', verbose_name="المشروع")
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='payments', verbose_name="المورد")
    phase = models.ForeignKey(Phase, on_delete=models.CASCADE, related_name='payments', verbose_name="المرحلة")
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="المبلغ المدفوع")
    payment_date = models.DateField(verbose_name="تاريخ الدفع")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment to {self.supplier.name} of {self.amount}"
