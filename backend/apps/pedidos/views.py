from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from apps.users.permissions import IsAdminOrVendedor
from .models import Pedido
from .serializers import (
    PedidoSerializer,
    PedidoCreateSerializer,
    PedidoUpdateEstadoSerializer,
)


class PedidoListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear pedidos.
    GET/POST /api/pedidos/
    
    Filtros:
    - mine=true: solo pedidos del usuario autenticado
    - estado: filtrar por estado
    - cliente: ID del cliente (solo admin/vendedor)
    """
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtra pedidos según rol y parámetros."""
        user = self.request.user
        queryset = Pedido.objects.select_related('cliente').prefetch_related(
            'items__producto',
            'promociones_aplicadas'
        )
        
        # Filtrar según rol
        if user.is_cliente():
            # Cliente solo ve sus pedidos
            queryset = queryset.filter(cliente=user)
        elif user.is_vendedor():
            # Vendedor ve todos los pedidos
            pass
        
        # Filtro por "mine"
        mine = self.request.query_params.get('mine', None)
        if mine and mine.lower() == 'true':
            queryset = queryset.filter(cliente=user)
        
        # Filtro por estado
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
        
        # Filtro por cliente (solo admin/vendedor)
        if user.is_admin() or user.is_vendedor():
            cliente_id = self.request.query_params.get('cliente', None)
            if cliente_id:
                queryset = queryset.filter(cliente_id=cliente_id)
        
        return queryset.order_by('-fecha_creacion')
    
    def get_serializer_class(self):
        """Usa serializer de creación para POST."""
        if self.request.method == 'POST':
            return PedidoCreateSerializer
        return PedidoSerializer
    
    def perform_create(self, serializer):
        """Asigna cliente al crear pedido."""
        user = self.request.user
        
        # Si el usuario es cliente, asignar automáticamente
        if user.is_cliente():
            serializer.save(cliente=user)
        else:
            # Admin/vendedor pueden especificar cliente
            serializer.save()
    
    def create(self, request, *args, **kwargs):
        """Sobrescribe create para retornar PedidoSerializer en la respuesta."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Retornar con PedidoSerializer completo
        pedido = serializer.instance
        output_serializer = PedidoSerializer(pedido)
        headers = self.get_success_headers(output_serializer.data)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class PedidoDetailView(generics.RetrieveAPIView):
    """
    Vista para obtener detalle de pedido.
    GET /api/pedidos/{id}/
    """
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtra pedidos según permisos."""
        user = self.request.user
        queryset = Pedido.objects.select_related('cliente').prefetch_related(
            'items__producto',
            'promociones_aplicadas'
        )
        
        # Cliente solo ve sus pedidos
        if user.is_cliente():
            queryset = queryset.filter(cliente=user)
        
        return queryset


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdminOrVendedor])
def update_estado_view(request, pk):
    """
    Vista para actualizar estado de pedido.
    PUT /api/pedidos/{id}/estado/
    
    Body:
    {
        "estado": "CONFIRMADO"
    }
    """
    pedido = get_object_or_404(Pedido, pk=pk)
    
    serializer = PedidoUpdateEstadoSerializer(pedido, data=request.data)
    serializer.is_valid(raise_exception=True)
    
    try:
        serializer.save()
        return Response(PedidoSerializer(pedido).data)
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_pdf_view(request, pk):
    """
    Vista para exportar comprobante de pedido en PDF.
    GET /api/pedidos/{id}/pdf/
    """
    user = request.user
    
    # Obtener pedido
    pedido = get_object_or_404(Pedido, pk=pk)
    
    # Verificar permisos
    if user.is_cliente() and pedido.cliente != user:
        return Response(
            {'error': 'No tiene permisos para ver este pedido.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Generar PDF
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from io import BytesIO
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Contenido del PDF
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, 750, "El-Tetu - Comprobante de Pedido")
    
    p.setFont("Helvetica", 12)
    y = 700
    p.drawString(100, y, f"Pedido #{pedido.id}")
    y -= 20
    p.drawString(100, y, f"Cliente: {pedido.cliente.full_name}")
    y -= 20
    p.drawString(100, y, f"Estado: {pedido.get_estado_display()}")
    y -= 20
    p.drawString(100, y, f"Fecha: {pedido.fecha_creacion.strftime('%d/%m/%Y %H:%M')}")
    y -= 40
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(100, y, "Items:")
    y -= 20
    
    p.setFont("Helvetica", 10)
    for item in pedido.items.all():
        p.drawString(120, y, f"{item.producto.nombre} x{item.cantidad} - ${item.subtotal}")
        y -= 15
    
    y -= 20
    p.setFont("Helvetica-Bold", 12)
    p.drawString(100, y, f"Subtotal: ${pedido.subtotal}")
    y -= 20
    p.drawString(100, y, f"Descuento: ${pedido.descuento_total}")
    y -= 20
    p.drawString(100, y, f"TOTAL: ${pedido.total}")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="pedido_{pedido.id}.pdf"'
    
    return response
