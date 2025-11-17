from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'codigo']
    ordering_fields = ['nombre', 'descuento_porcentaje']
    ordering = ['-activo', 'fecha_eliminacion', 'nombre']
    
    def get_queryset(self):
        """Admin ve todas (incluyendo eliminadas), otros solo activas y no eliminadas."""
        queryset = super().get_queryset()
        if not self.request.user.is_admin():
            queryset = queryset.filter(activo=True, fecha_eliminacion__isnull=True)
        # El ordenamiento por defecto ya está configurado en 'ordering' para priorizar activos
        # Si hay un ordenamiento personalizado, se aplicará pero siempre respetando primero activo
        ordering_param = self.request.query_params.get('ordering', None)
        if ordering_param:
            # Si hay ordenamiento personalizado, agregar primero el ordenamiento por activo
            ordering_list = ordering_param.split(',') if ',' in ordering_param else [ordering_param]
            # Asegurar que activo y fecha_eliminacion vengan primero
            if '-activo' not in ordering_list and 'activo' not in ordering_list:
                ordering_list.insert(0, '-activo')
            if 'fecha_eliminacion' not in ordering_list and '-fecha_eliminacion' not in ordering_list:
                ordering_list.insert(1, 'fecha_eliminacion')
            queryset = queryset.order_by(*ordering_list)
        
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