from django.urls import path
from .views import (
    InformacionGeneralListView,
    InformacionGeneralDetailView,
    InformacionGeneralCreateUpdateView,
    InformacionGeneralAdminDetailView,
)

urlpatterns = [
    # Rutas públicas
    path('general/', InformacionGeneralListView.as_view(), name='info_general_list'),
    path('general/<str:tipo>/', InformacionGeneralDetailView.as_view(), name='info_general_detail'),
    
    # Rutas admin
    path('admin/', InformacionGeneralCreateUpdateView.as_view(), name='info_admin_list_create'),
    path('admin/<int:pk>/', InformacionGeneralAdminDetailView.as_view(), name='info_admin_detail'),
]
