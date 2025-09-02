# cashbook/views.py
from django.contrib.auth.decorators import login_required, permission_required
from django.shortcuts import render, redirect
from django.db.models import Sum, Q
from .models import CashTransaction, CashBox
from .forms import CashTransactionForm

def dashboard(request):
    boxes = CashBox.objects.filter(is_active=True)
    # today = CashTransaction.objects.filter(date__exact=request.GET.get("date")) # This variable is not used in the context
    context = {
        "boxes": [(b, b.balance) for b in boxes],
        "in_today": CashTransaction.objects.filter(txn_type__in=["receipt","transfer_in"], status="approved").aggregate(Sum("amount"))["amount__sum"] or 0,
        "out_today": CashTransaction.objects.filter(txn_type__in=["payment","transfer_out"], status="approved").aggregate(Sum("amount"))["amount__sum"] or 0,
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
