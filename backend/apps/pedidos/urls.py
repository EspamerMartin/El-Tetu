from django.urls import path
from .views import (
    PedidoListCreateView,
    PedidoDetailView,
    update_estado_view,
    rechazar_pedido_view,
    # Vistas de transportador
    PedidoTransportadorListView,
    PedidoTransportadorDetailView,
    entregar_pedido_transportador_view,
    asignar_transportador_view,
    listar_transportadores_view,
    # PDF
    descargar_pdf_view,
    # Dashboard
    estadisticas_admin_view,
    estadisticas_vendedor_view,
)

urlpatterns = [
    path('', PedidoListCreateView.as_view(), name='pedido_list_create'),
    path('estadisticas/admin/', estadisticas_admin_view, name='estadisticas_admin'),
    path('estadisticas/vendedor/', estadisticas_vendedor_view, name='estadisticas_vendedor'),
    path('<int:pk>/', PedidoDetailView.as_view(), name='pedido_detail'),
    path('<int:pk>/estado/', update_estado_view, name='pedido_update_estado'),
    path('<int:pk>/rechazar/', rechazar_pedido_view, name='pedido_rechazar'),
    path('<int:pk>/asignar-transportador/', asignar_transportador_view, name='pedido_asignar_transportador'),
    path('<int:pk>/pdf/', descargar_pdf_view, name='pedido_pdf'),
    # Lista de transportadores disponibles (para asignar)
    path('transportadores/', listar_transportadores_view, name='listar_transportadores'),
    # Endpoints para transportador
    path('transportador/', PedidoTransportadorListView.as_view(), name='pedido_transportador_list'),
    path('transportador/<int:pk>/', PedidoTransportadorDetailView.as_view(), name='pedido_transportador_detail'),
    path('transportador/<int:pk>/entregar/', entregar_pedido_transportador_view, name='pedido_transportador_entregar'),
]

