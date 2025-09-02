# cashbook/forms.py
from django import forms
from .models import CashTransaction

class CashTransactionForm(forms.ModelForm):
    class Meta:
        model = CashTransaction
        fields = ["cashbox","txn_type","date","category","partner","description","amount"]
