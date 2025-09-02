# cashbook/views.py
from django.contrib.auth.decorators import login_required, permission_required
from django.shortcuts import render, redirect
from django.db.models import Sum, Q
from .models import CashTransaction, CashBox
from .forms import CashTransactionForm

from decimal import Decimal

def dashboard(request):
    # --- Real database logic is commented out for now ---
    # boxes = CashBox.objects.filter(is_active=True)
    # context = {
    #     "boxes": [(b, b.balance) for b in boxes],
    #     "in_today": CashTransaction.objects.filter(txn_type__in=["receipt","transfer_in"], status="approved").aggregate(Sum("amount"))["amount__sum"] or 0,
    #     "out_today": CashTransaction.objects.filter(txn_type__in=["payment","transfer_out"], status="approved").aggregate(Sum("amount"))["amount__sum"] or 0,
    # }

    # --- Fake data for UI development ---
    class MockBox:
        def __init__(self, name, currency):
            self.name = name
            self.currency = currency

    fake_boxes_data = [
        (MockBox("الخزنة الرئيسية", "EGP"), Decimal("15750.50")),
        (MockBox("خزنة فرع الإسكندرية", "EGP"), Decimal("8300.00")),
        (MockBox("خزنة العهدة", "USD"), Decimal("1200.00")),
    ]

    in_today = Decimal("2500.00")
    out_today = Decimal("850.75")
    net_today = in_today - out_today

    context = {
        "boxes": fake_boxes_data,
        "in_today": in_today,
        "out_today": out_today,
        "net_today": net_today,
    }
    return render(request, "cashbook/dashboard.html", context)

@login_required
def txn_list(request):
    qs = CashTransaction.objects.select_related("cashbox","category","partner")
    q = request.GET._get("q")
    if q:
        qs = qs.filter(Q(voucher_no__icontains=q) | Q(description__icontains=q))
    status = request.GET.get("status")
    if status:
        qs = qs.filter(status=status)
    return render(request, "cashbook/txn_list.html", {"txns": qs[:200]})

@login_required
def txn_create(request):
    if request.method == "POST":
        form = CashTransactionForm(request.POST)
        if form.is_valid():
            obj = form.save(commit=False)
            obj.created_by = request.user
            obj.status = "draft"
            obj.save()
            return redirect("txn_list")
    else:
        form = CashTransactionForm()
    return render(request, "cashbook/txn_form.html", {"form": form})

@permission_required("cashbook.change_cashtransaction")
def txn_approve(request, pk):
    obj = CashTransaction.objects.get(pk=pk)
    obj.status = "approved"
    obj.approved_by = request.user
    obj.save()
    return redirect("txn_list")
