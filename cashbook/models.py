# cashbook/models.py
import uuid
from decimal import Decimal
from django.db import models, transaction
from django.contrib.auth.models import User
from django.utils import timezone

CURRENCY_CHOICES = (("EGP", "EGP"), ("USD", "USD"),)
TXN_TYPE = (
    ("receipt", "Receipt"),      # قبض (إيراد)
    ("payment", "Payment"),      # صرف (مصروف)
    ("transfer_out", "Transfer Out"),
    ("transfer_in", "Transfer In"),
)
TXN_STATUS = (("draft", "Draft"), ("approved", "Approved"), ("void", "Void"))
CATEGORY_KIND = (("income", "Income"), ("expense", "Expense"), ("transfer", "Transfer"))
PARTNER_KIND = (("customer", "Customer"), ("supplier", "Supplier"), ("other", "Other"))

class CashBox(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="EGP")
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def balance(self):
        # رصيد لحظي = افتتاحي + مجموع المقبوضات - المصروفات + صافي التحويلات المعتمدة
        qs = CashTransaction.objects.filter(cashbox=self, status="approved")
        in_sum = qs.filter(txn_type__in=["receipt","transfer_in"]).aggregate(models.Sum("amount"))["amount__sum"] or Decimal("0.00")
        out_sum = qs.filter(txn_type__in=["payment","transfer_out"]).aggregate(models.Sum("amount"))["amount__sum"] or Decimal("0.00")
        return self.opening_balance + in_sum - out_sum

class Partner(models.Model):
    name = models.CharField(max_length=150)
    kind = models.CharField(max_length=10, choices=PARTNER_KIND, default="other")
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)

    def __str__(self): return self.name

class Category(models.Model):
    name = models.CharField(max_length=120)
    kind = models.CharField(max_length=10, choices=CATEGORY_KIND)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children")
    def __str__(self): return self.name

def voucher_prefix(cashbox: CashBox):
    year = timezone.now().year
    return f"{cashbox.code}-{year}"

class CashTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cashbox = models.ForeignKey(CashBox, on_delete=models.PROTECT, related_name="transactions")
    txn_type = models.CharField(max_length=20, choices=TXN_TYPE)
    status = models.CharField(max_length=10, choices=TXN_STATUS, default="draft")
    date = models.DateField(default=timezone.now)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL)
    partner = models.ForeignKey(Partner, null=True, blank=True, on_delete=models.SET_NULL)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="EGP")
    rate_to_base = models.DecimalField(max_digits=12, decimal_places=6, default=Decimal("1.000000"))  # لو عايز عملات
    voucher_no = models.CharField(max_length=30, unique=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="created_txns")
    approved_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.PROTECT, related_name="approved_txns")
    linked_txn = models.OneToOneField("self", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-date", "-voucher_no"]

    def __str__(self):
        return f"{self.voucher_no} | {self.get_txn_type_display()} | {self.amount}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.txn_type in ["transfer_in","transfer_out"] and (self.category and self.category.kind != "transfer"):
            raise ValidationError("تحويلات لازم تبقى على فئة من نوع Transfer.")
        if self.txn_type == "payment" and self.status == "approved":
            # منع السالب لو النظام لا يسمح
            if self.cashbox.balance < self.amount:
                raise ValidationError("الرصيد لا يكفي لإتمام الصرف.")

    def save(self, *args, **kwargs):
        creating = self._state.adding
        if creating and not self.voucher_no:
            prefix = voucher_prefix(self.cashbox)
            last = CashTransaction.objects.filter(voucher_no__startswith=prefix).order_by("-voucher_no").first()
            seq = int(last.voucher_no.split("-")[-1]) + 1 if last else 1
            self.voucher_no = f"{prefix}-{seq:06d}"
        super().save(*args, **kwargs)

    @staticmethod
    def transfer(from_box: CashBox, to_box: CashBox, amount: Decimal, user: User, description=""):
        with transaction.atomic():
            out_txn = CashTransaction.objects.create(
                cashbox=from_box, txn_type="transfer_out", status="approved",
                amount=amount, description=description, created_by=user, approved_by=user,
                category=Category.objects.filter(kind="transfer").first()
            )
            in_txn = CashTransaction.objects.create(
                cashbox=to_box, txn_type="transfer_in", status="approved",
                amount=amount, description=f"Transfer from {from_box.name}. {description}",
                created_by=user, approved_by=user, category=out_txn.category
            )
            out_txn.linked_txn = in_txn
            out_txn.save()
            in_txn.linked_txn = out_txn
            in_txn.save()
            return out_txn, in_txn

class PeriodClose(models.Model):
    cashbox = models.ForeignKey(CashBox, on_delete=models.PROTECT)
    month = models.PositiveSmallIntegerField()  # 1..12
    year = models.PositiveSmallIntegerField()
    closed_by = models.ForeignKey(User, on_delete=models.PROTECT)
    closed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("cashbox","month","year")
