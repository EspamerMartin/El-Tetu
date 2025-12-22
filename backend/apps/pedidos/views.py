from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.db.models import Case, When, IntegerField
import logging

from apps.users.permissions import IsAdminOrVendedor, IsTransportador
from .models import Pedido
from .serializers import (
    PedidoSerializer,
    PedidoCreateSerializer,
    PedidoUpdateEstadoSerializer,
    PedidoTransportadorSerializer,
    PedidoAsignarTransportadorSerializer,
)
from .pdf_generator import generar_remito_pdf

logger = logging.getLogger('eltetu')


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
        )
        
        # Filtrar según rol
        if user.is_cliente():
            # Cliente solo ve sus pedidos
            queryset = queryset.filter(cliente=user)
        # Vendedor y admin ven todos los pedidos (sin filtro adicional)
        
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
        
        # Filtro por fecha de creación
        fecha_creacion = self.request.query_params.get('fecha_creacion', None)
        if fecha_creacion:
            # Formato esperado: YYYY-MM-DD
            queryset = queryset.filter(fecha_creacion__date=fecha_creacion)
        
        # Ordenar: primero pedidos activos, luego por fecha de creación (más recientes primero)
        # Usar Case/When para ordenar: activos primero, entregados después, rechazados al final
        return queryset.annotate(
            estado_orden=Case(
                When(estado='PENDIENTE', then=0),
                When(estado='EN_PREPARACION', then=1),
                When(estado='FACTURADO', then=2),
                When(estado='ENTREGADO', then=3),
                When(estado='RECHAZADO', then=4),
                default=5,
                output_field=IntegerField()
            )
        ).order_by('estado_orden', '-fecha_creacion')
    
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
        logger.info(
            f'Pedido #{pedido.id} creado por usuario {request.user.email} '
            f'con {pedido.items.count()} items'
        )
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
        "estado": "EN_PREPARACION" | "FACTURADO" | "ENTREGADO" | "RECHAZADO"
    }
    
    Transiciones permitidas:
    - PENDIENTE -> EN_PREPARACION (aprobar) o RECHAZADO
    - EN_PREPARACION -> FACTURADO o RECHAZADO
    - FACTURADO -> ENTREGADO o RECHAZADO
    """
    pedido = get_object_or_404(Pedido, pk=pk)
    
    serializer = PedidoUpdateEstadoSerializer(pedido, data=request.data)
    serializer.is_valid(raise_exception=True)
    
    try:
        serializer.save()
        logger.info(
            f'Estado del pedido #{pedido.id} actualizado a {pedido.estado} '
            f'por usuario {request.user.email}'
        )
        return Response(PedidoSerializer(pedido).data)
    except ValueError as e:
        logger.warning(
            f'Error al actualizar estado del pedido #{pedido.id}: {str(e)}'
        )
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdminOrVendedor])
def rechazar_pedido_view(request, pk):
    """
    Vista para rechazar un pedido (cambiar estado a RECHAZADO).
    PUT /api/pedidos/{id}/rechazar/
    
    Solo admin y vendedor pueden rechazar pedidos.
    No se pueden rechazar pedidos ya rechazados o entregados.
    """
    pedido = get_object_or_404(Pedido, pk=pk)
    
    if pedido.estado == 'RECHAZADO':
        return Response(
            {'error': 'No se puede rechazar un pedido ya rechazado.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if pedido.estado == 'ENTREGADO':
        return Response(
            {'error': 'No se puede rechazar un pedido ya entregado.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        pedido.rechazar()
        logger.info(
            f'Pedido #{pedido.id} rechazado por usuario {request.user.email}'
        )
        return Response(
            PedidoSerializer(pedido).data,
            status=status.HTTP_200_OK
        )
    except ValueError as e:
        logger.warning(
            f'Error al rechazar pedido #{pedido.id}: {str(e)}'
        )
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ========== Vistas para Transportador ==========

class PedidoTransportadorListView(generics.ListAPIView):
    """
    Vista para listar pedidos asignados al transportador.
    GET /api/pedidos/transportador/
    
    Solo muestra pedidos FACTURADOS asignados al transportador autenticado.
    """
    serializer_class = PedidoTransportadorSerializer
    permission_classes = [IsAuthenticated, IsTransportador]
    
    def get_queryset(self):
        """Filtra pedidos asignados al transportador actual."""
        user = self.request.user
        queryset = Pedido.objects.select_related(
            'cliente', 'cliente__zona'
        ).prefetch_related(
            'items__producto',
            'cliente__horarios'
        ).filter(
            transportador=user,
            estado='FACTURADO'  # Solo pedidos listos para entregar
        )
        
        # Ordenar por fecha de creación (más antiguos primero para entregar)
        return queryset.order_by('fecha_creacion')


class PedidoTransportadorDetailView(generics.RetrieveAPIView):
    """
    Vista para obtener detalle de un pedido asignado al transportador.
    GET /api/pedidos/transportador/{id}/
    """
    serializer_class = PedidoTransportadorSerializer
    permission_classes = [IsAuthenticated, IsTransportador]
    
    def get_queryset(self):
        """Solo pedidos asignados al transportador actual."""
        user = self.request.user
        return Pedido.objects.select_related(
            'cliente', 'cliente__zona'
        ).prefetch_related(
            'items__producto',
            'cliente__horarios'
        ).filter(transportador=user)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsTransportador])
def entregar_pedido_transportador_view(request, pk):
    """
    Vista para que el transportador marque un pedido como entregado.
    PUT /api/pedidos/transportador/{id}/entregar/
    
    Solo puede entregar pedidos que le fueron asignados y están facturados.
    """
    user = request.user
    pedido = get_object_or_404(Pedido, pk=pk, transportador=user)
    
    if pedido.estado != 'FACTURADO':
        return Response(
            {'error': 'Solo se pueden entregar pedidos facturados.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        pedido.entregar()
        logger.info(
            f'Pedido #{pedido.id} entregado por transportador {user.email}'
        )
        return Response(
            PedidoTransportadorSerializer(pedido).data,
            status=status.HTTP_200_OK
        )
    except ValueError as e:
        logger.warning(
            f'Error al entregar pedido #{pedido.id}: {str(e)}'
        )
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrVendedor])
def listar_transportadores_view(request):
    """
    Vista para listar transportadores disponibles.
    GET /api/pedidos/transportadores/
    
    Retorna lista simplificada de transportadores activos para asignar a pedidos.
    """
    from apps.users.models import CustomUser
    
    transportadores = CustomUser.objects.filter(
        rol='transportador',
        is_active=True,
        fecha_eliminacion__isnull=True
    ).values('id', 'nombre', 'apellido', 'email', 'telefono')
    
    # Agregar full_name
    result = [
        {
            'id': t['id'],
            'nombre': t['nombre'],
            'apellido': t['apellido'],
            'full_name': f"{t['nombre']} {t['apellido']}",
            'email': t['email'],
            'telefono': t['telefono'],
        }
        for t in transportadores
    ]
    
    return Response(result, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdminOrVendedor])
def asignar_transportador_view(request, pk):
    """
    Vista para asignar un transportador a un pedido.
    PUT /api/pedidos/{id}/asignar-transportador/
    
    Body:
    {
        "transportador": <id_transportador>
    }
    
    Solo admin y vendedor pueden asignar transportadores.
    """
    pedido = get_object_or_404(Pedido, pk=pk)
    
    serializer = PedidoAsignarTransportadorSerializer(pedido, data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    transportador = pedido.transportador
    transportador_info = f'{transportador.full_name} ({transportador.email})' if transportador else 'ninguno'
    
    logger.info(
        f'Transportador asignado al pedido #{pedido.id}: {transportador_info} '
        f'por usuario {request.user.email}'
    )
    
    return Response(PedidoSerializer(pedido).data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminOrVendedor])
def descargar_pdf_view(request, pk):
    """
    Vista para descargar el PDF de remito de un pedido.
    GET /api/pedidos/{id}/pdf/
    
    Retorna un archivo PDF con el remito del pedido.
    Solo admin y vendedor pueden descargar PDFs.
    """
    pedido = get_object_or_404(
        Pedido.objects.select_related(
            'cliente', 'cliente__zona', 'transportador', 'lista_precio'
        ).prefetch_related('items__producto'),
        pk=pk
    )
    
    try:
        # Generar PDF
        pdf_buffer = generar_remito_pdf(pedido)
        
        # Crear respuesta HTTP con el PDF
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="remito_pedido_{pedido.id}.pdf"'
        
        logger.info(
            f'PDF del pedido #{pedido.id} descargado por usuario {request.user.email}'
        )
        
        return response
        
    except Exception as e:
        logger.error(f'Error al generar PDF del pedido #{pedido.id}: {str(e)}')
        return Response(
            {'error': 'Error al generar el PDF'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
