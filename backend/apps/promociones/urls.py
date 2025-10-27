from django.urls import path
from .views import PromocionListCreateView, PromocionDetailView

urlpatterns = [
    path('', PromocionListCreateView.as_view(), name='promocion_list_create'),
    path('<int:pk>/', PromocionDetailView.as_view(), name='promocion_detail'),
]
