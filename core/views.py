from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum

from .models import (
    Project, Phase, Partner, Supplier, Material,
    PartnerPayment, SupplierPayment
)
from .serializers import (
    ProjectSerializer, PhaseSerializer, PartnerSerializer, SupplierSerializer,
    MaterialSerializer, PartnerPaymentSerializer, SupplierPaymentSerializer
)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    @action(detail=True, methods=['get'])
    def settlement(self, request, pk=None):
        """
        Calculates the financial settlement for each partner in the project.
        """
        project = self.get_object()

        # 1. Calculate total project cost (sum of all payments to suppliers)
        total_cost = project.supplier_payments.aggregate(total=Sum('amount'))['total'] or 0

        settlement_data = []

        # 2. For each partner, calculate their share vs. what they paid
        for partner in project.partners.all():
            # Amount due from this partner based on their percentage
            amount_due = total_cost * (partner.percentage / 100)

            # Total amount this partner has actually paid
            total_paid = partner.payments.aggregate(total=Sum('amount'))['total'] or 0

            # Settlement difference
            settlement_amount = total_paid - amount_due

            status = "Balanced"
            if settlement_amount > 0:
                status = f"Owed {abs(settlement_amount)}"
            elif settlement_amount < 0:
                status = f"Owes {abs(settlement_amount)}"

            settlement_data.append({
                'partner_name': partner.name,
                'percentage': partner.percentage,
                'amount_due': amount_due,
                'total_paid': total_paid,
                'settlement_amount': settlement_amount,
                'status_ar': f"تسوية: {settlement_amount}", # Simple Arabic status
                'status_en': status
            })

        return Response(settlement_data)

class PhaseViewSet(viewsets.ModelViewSet):
    queryset = Phase.objects.all()
    serializer_class = PhaseSerializer

class PartnerViewSet(viewsets.ModelViewSet):
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer

class PartnerPaymentViewSet(viewsets.ModelViewSet):
    queryset = PartnerPayment.objects.all()
    serializer_class = PartnerPaymentSerializer

class SupplierPaymentViewSet(viewsets.ModelViewSet):
    queryset = SupplierPayment.objects.all()
    serializer_class = SupplierPaymentSerializer
