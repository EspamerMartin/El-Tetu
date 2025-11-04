from django.urls import path
from .views import (
    PedidoListCreateView,
    PedidoDetailView,
    update_estado_view,
    rechazar_pedido_view,
    export_pdf_view,
)

urlpatterns = [
    path('', PedidoListCreateView.as_view(), name='pedido_list_create'),
    path('<int:pk>/', PedidoDetailView.as_view(), name='pedido_detail'),
    path('<int:pk>/estado/', update_estado_view, name='pedido_update_estado'),
    path('<int:pk>/rechazar/', rechazar_pedido_view, name='pedido_rechazar'),
    path('<int:pk>/pdf/', export_pdf_view, name='pedido_export_pdf'),
]
