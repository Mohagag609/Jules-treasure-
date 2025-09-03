from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, PhaseViewSet, PartnerViewSet, SupplierViewSet,
    MaterialViewSet, PartnerPaymentViewSet, SupplierPaymentViewSet
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'projects', ProjectViewSet)
router.register(r'phases', PhaseViewSet)
router.register(r'partners', PartnerViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'materials', MaterialViewSet)
router.register(r'partner-payments', PartnerPaymentViewSet)
router.register(r'supplier-payments', SupplierPaymentViewSet)

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('', include(router.urls)),
]
