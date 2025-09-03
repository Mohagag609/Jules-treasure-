from rest_framework import serializers
from .models import (
    Project, Phase, Partner, Supplier, Material,
    PartnerPayment, SupplierPayment
)

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'

class PhaseSerializer(serializers.ModelSerializer):
    materials = MaterialSerializer(many=True, read_only=True)

    class Meta:
        model = Phase
        fields = ('id', 'project', 'name', 'amount_required', 'materials')

class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = '__all__'

class PartnerPaymentSerializer(serializers.ModelSerializer):
    partner_name = serializers.StringRelatedField(source='partner')

    class Meta:
        model = PartnerPayment
        fields = ('id', 'project', 'partner', 'partner_name', 'amount', 'payment_date')


class SupplierPaymentSerializer(serializers.ModelSerializer):
    supplier_name = serializers.StringRelatedField(source='supplier')
    phase_name = serializers.StringRelatedField(source='phase')

    class Meta:
        model = SupplierPayment
        fields = ('id', 'project', 'supplier', 'supplier_name', 'phase', 'phase_name', 'amount', 'payment_date')

class ProjectSerializer(serializers.ModelSerializer):
    phases = PhaseSerializer(many=True, read_only=True)
    partners = PartnerSerializer(many=True, read_only=True)
    partner_payments = PartnerPaymentSerializer(many=True, read_only=True)
    supplier_payments = SupplierPaymentSerializer(many=True, read_only=True)
    treasury_balance = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)

    class Meta:
        model = Project
        fields = (
            'id', 'name', 'start_date', 'end_date', 'treasury_balance',
            'phases', 'partners', 'partner_payments', 'supplier_payments'
        )

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
