# project/urls.py
from django.contrib import admin
from django.urls import path
from cashbook import views as cb

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', cb.dashboard, name='dashboard'),
    path('txns/', cb.txn_list, name='txn_list'),
    path('txns/new/', cb.txn_create, name='txn_create'),
    path('txns/<uuid:pk>/approve/', cb.txn_approve, name='txn_approve'),
]
