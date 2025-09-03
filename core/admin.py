from django.contrib import admin
from .models import (
    Project, Phase, Partner, Supplier, Material,
    PartnerPayment, SupplierPayment
)

# Inlines for better related model management
class PhaseInline(admin.TabularInline):
    model = Phase
    extra = 1  # Show one extra blank form for new phases

class PartnerInline(admin.TabularInline):
    model = Partner
    extra = 1

class MaterialInline(admin.TabularInline):
    model = Material
    extra = 1

class PartnerPaymentInline(admin.TabularInline):
    model = PartnerPayment
    extra = 1

class SupplierPaymentInline(admin.TabularInline):
    model = SupplierPayment
    extra = 1

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'treasury_balance')
    search_fields = ('name',)
    inlines = [PhaseInline, PartnerInline, PartnerPaymentInline, SupplierPaymentInline]

@admin.register(Phase)
class PhaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'amount_required')
    list_filter = ('project',)
    search_fields = ('name',)
    inlines = [MaterialInline]

@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ('name', 'project', 'percentage')
    list_filter = ('project',)
    search_fields = ('name',)

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    search_fields = ('name',)

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('name', 'phase', 'supplier', 'quantity', 'unit_price', 'total_price')
    list_filter = ('phase', 'supplier')
    search_fields = ('name',)
    readonly_fields = ('total_price',)

@admin.register(PartnerPayment)
class PartnerPaymentAdmin(admin.ModelAdmin):
    list_display = ('partner', 'project', 'amount', 'payment_date')
    list_filter = ('project', 'partner', 'payment_date')
    search_fields = ('partner__name',)

@admin.register(SupplierPayment)
class SupplierPaymentAdmin(admin.ModelAdmin):
    list_display = ('supplier', 'phase', 'project', 'amount', 'payment_date')
    list_filter = ('project', 'phase', 'supplier', 'payment_date')
    search_fields = ('supplier__name',)
