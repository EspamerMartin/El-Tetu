from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
import logging

from apps.users.permissions import IsAdmin
from apps.core.mixins import SoftDeleteMixin
from .models import ListaPrecio
from .serializers import ListaPrecioSerializer

logger = logging.getLogger('eltetu')


class ListaPrecioListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear listas de precios.
    GET/POST /api/productos/listas-precios/
    """
    queryset = ListaPrecio.objects.all()
    serializer_class = ListaPrecioSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'codigo']
    ordering_fields = ['nombre', 'descuento_porcentaje']
    ordering = ['nombre']
    
    def get_queryset(self):
        """Admin ve todas (incluyendo eliminadas), otros solo activas y no eliminadas."""
        queryset = super().get_queryset()
        if not self.request.user.is_admin():
            queryset = queryset.filter(activo=True, fecha_eliminacion__isnull=True)
        return queryset
    
    def get_permissions(self):
        """Solo admin puede crear listas."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class ListaPrecioDetailView(SoftDeleteMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar lista de precios.
    GET/PUT/DELETE /api/productos/listas-precios/{id}/
    """
    queryset = ListaPrecio.objects.all()
    serializer_class = ListaPrecioSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_reference_checks(self, instance):
        """Define las relaciones a verificar para soft delete."""
        return [
            (instance.pedidos, 'pedidos'),
            (instance.clientes, 'clientes'),
        ]