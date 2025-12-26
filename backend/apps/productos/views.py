from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import logging

from apps.users.permissions import IsAdmin, IsAdminOrVendedor
from apps.core.mixins import SoftDeleteMixin
from .models import Categoria, Subcategoria, Producto, Marca, Promocion
from .serializers import (
    CategoriaSerializer,
    SubcategoriaSerializer,
    ProductoListSerializer,
    ProductoDetailSerializer,
    ProductoCreateUpdateSerializer,
    MarcaSerializer,
    PromocionListSerializer,
    PromocionDetailSerializer,
    PromocionCreateUpdateSerializer,
)

logger = logging.getLogger('eltetu')


# ========== Marcas ==========

class MarcaListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear marcas.
    GET/POST /api/productos/marcas/
    """
    serializer_class = MarcaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activo']
    search_fields = ['nombre']
    
    def get_queryset(self):
        """Admin ve todas (incluyendo eliminadas), otros solo activas y no eliminadas."""
        queryset = Marca.objects.all()
        if not self.request.user.is_admin():
            queryset = queryset.filter(activo=True, fecha_eliminacion__isnull=True)
        return queryset.order_by('-activo', 'fecha_eliminacion', 'nombre')
    
    def get_permissions(self):
        """Solo admin puede crear marcas."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class MarcaDetailView(SoftDeleteMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar marca.
    GET/PUT/DELETE /api/productos/marcas/{id}/
    """
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_reference_checks(self, instance):
        """Define las relaciones a verificar para soft delete."""
        return [
            (instance.productos, 'productos'),
        ]


# ========== Categorías ==========

class CategoriaListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear categorías.
    GET/POST /api/productos/categorias/
    """
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['activo']
    
    def get_queryset(self):
        """Admin ve todas (incluyendo eliminadas), otros solo activas y no eliminadas."""
        queryset = Categoria.objects.all()
        if not self.request.user.is_admin():
            queryset = queryset.filter(activo=True, fecha_eliminacion__isnull=True)
        # Ordenar: primero activas y no eliminadas, luego por nombre
        return queryset.order_by('-activo', 'fecha_eliminacion', 'nombre')
    
    def get_permissions(self):
        """Solo admin puede crear categorías."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class CategoriaDetailView(SoftDeleteMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar categoría.
    GET/PUT/DELETE /api/productos/categorias/{id}/
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_reference_checks(self, instance):
        """Define las relaciones a verificar para soft delete."""
        return [
            (instance.productos, 'productos'),
            (instance.subcategorias, 'subcategorias'),
        ]


# ========== Subcategorías ==========

class SubcategoriaListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear subcategorías.
    GET/POST /api/productos/subcategorias/
    """
    serializer_class = SubcategoriaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categoria', 'activo']
    
    def get_queryset(self):
        """Admin ve todas (incluyendo eliminadas), otros solo activas y no eliminadas."""
        queryset = Subcategoria.objects.select_related('categoria')
        if not self.request.user.is_admin():
            queryset = queryset.filter(activo=True, fecha_eliminacion__isnull=True)
        # Ordenar: primero activas y no eliminadas, luego por nombre
        return queryset.order_by('-activo', 'fecha_eliminacion', 'nombre')
    
    def get_permissions(self):
        """Solo admin puede crear subcategorías."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class SubcategoriaDetailView(SoftDeleteMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar subcategoría.
    GET/PUT/DELETE /api/productos/subcategorias/{id}/
    """
    queryset = Subcategoria.objects.all()
    serializer_class = SubcategoriaSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_reference_checks(self, instance):
        """Define las relaciones a verificar para soft delete."""
        return [
            (instance.productos, 'productos'),
        ]


# ========== Productos ==========

class ProductoListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear productos.
    GET/POST /api/productos/
    
    Filtros disponibles:
    - marca: ID de marca
    - categoria: ID de categoría
    - subcategoria: ID de subcategoría
    - tiene_stock: filtrar por disponibilidad (true/false)
    - search: búsqueda por nombre o código de barra
    """
    queryset = Producto.objects.select_related('marca', 'categoria', 'subcategoria')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['marca', 'categoria', 'subcategoria', 'activo', 'tiene_stock']
    search_fields = ['nombre', 'codigo_barra', 'descripcion'] 
    ordering_fields = ['nombre', 'codigo_barra', 'tiene_stock'] 
    ordering = ['-activo', 'fecha_eliminacion', 'nombre']
    
    def paginate_queryset(self, queryset):
        """Desactiva la paginación completamente para este endpoint."""
        return None
    
    def list(self, request, *args, **kwargs):
        """
        Sobrescribe list() para devolver todos los resultados sin paginar.
        Cuando paginate_queryset retorna None, DRF devuelve un array directo.
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def get_serializer_class(self):
        """Usa serializer ligero para listado, completo para creación."""
        if self.request.method == 'POST':
            return ProductoCreateUpdateSerializer
        return ProductoListSerializer
    
    def get_serializer_context(self):
        """Pasa el request al serializer para calcular precios."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        """Filtra productos según parámetros."""
        queryset = super().get_queryset()
        
        # Filtrar solo activos y no eliminados (a menos que sea admin)
        if not self.request.user.is_admin():
            queryset = queryset.filter(activo=True, fecha_eliminacion__isnull=True)
        
        # Filtro por disponibilidad (legacy - usa tiene_stock)
        disponible = self.request.query_params.get('disponible', None)
        if disponible and disponible.lower() == 'true':
            queryset = queryset.filter(tiene_stock=True)
        
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
        """Solo admin puede crear productos."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class ProductoDetailView(SoftDeleteMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar producto.
    GET/PUT/DELETE /api/productos/{id}/
    """
    queryset = Producto.objects.select_related('marca', 'categoria', 'subcategoria')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Usa serializer de detalle para GET, de creación/actualización para PUT."""
        if self.request.method in ['PUT', 'PATCH']:
            return ProductoCreateUpdateSerializer
        return ProductoDetailSerializer
    
    def get_serializer_context(self):
        """Pasa el request al serializer para calcular precios."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        """Solo admin puede actualizar/eliminar productos."""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
    
    def get_reference_checks(self, instance):
        """Define las relaciones a verificar para soft delete."""
        return [
            (instance.pedido_items, 'pedido_items'),
        ]


# ========== Promociones ==========

class PromocionListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear promociones.
    GET/POST /api/productos/promociones/
    
    Filtros disponibles:
    - activo: true/false
    - search: búsqueda por nombre
    
    Admin y vendedor pueden crear promociones.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'descripcion']
    
    def get_queryset(self):
        """
        Admin ve todas (incluyendo eliminadas), otros solo activas y vigentes.
        """
        queryset = Promocion.objects.prefetch_related('items__producto')
        
        if self.request.user.is_admin() or self.request.user.is_vendedor():
            # Admin/vendedor ven todas
            return queryset.order_by('-activo', 'fecha_eliminacion', '-fecha_creacion')
        else:
            # Clientes solo ven activas, no eliminadas
            queryset = queryset.filter(activo=True, fecha_eliminacion__isnull=True)
            return queryset.order_by('-fecha_creacion')
    
    def get_serializer_class(self):
        """Usa serializer de creación para POST."""
        if self.request.method == 'POST':
            return PromocionCreateUpdateSerializer
        return PromocionListSerializer
    
    def get_permissions(self):
        """Admin y vendedor pueden crear promociones."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminOrVendedor()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Crea promoción y retorna con serializer de detalle."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        logger.info(
            f'Promoción "{instance.nombre}" creada por usuario {request.user.email}'
        )
        
        # Retornar con serializer de detalle
        return Response(
            PromocionDetailSerializer(instance).data,
            status=201
        )


class PromocionDetailView(SoftDeleteMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar promoción.
    GET/PUT/DELETE /api/productos/promociones/{id}/
    """
    queryset = Promocion.objects.prefetch_related('items__producto')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Usa serializer de detalle para GET, de actualización para PUT."""
        if self.request.method in ['PUT', 'PATCH']:
            return PromocionCreateUpdateSerializer
        return PromocionDetailSerializer
    
    def get_permissions(self):
        """Admin y vendedor pueden actualizar/eliminar promociones."""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdminOrVendedor()]
        return [IsAuthenticated()]
    
    def get_reference_checks(self, instance):
        """
        Define las relaciones a verificar para soft delete.
        Por ahora no hay referencias (pedidos con promociones vendrán después).
        """
        return []
    
    def update(self, request, *args, **kwargs):
        """Actualiza promoción y retorna con serializer de detalle."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        
        logger.info(
            f'Promoción "{instance.nombre}" actualizada por usuario {request.user.email}'
        )
        
        return Response(PromocionDetailSerializer(instance).data)


class PromocionActivasView(generics.ListAPIView):
    """
    Vista para listar solo promociones activas y vigentes.
    GET /api/productos/promociones/activas/
    
    Esta vista es para el catálogo público (clientes).
    Solo muestra promociones:
    - activas (activo=True)
    - no eliminadas
    - vigentes (dentro de fechas de inicio/fin o sin fechas)
    """
    serializer_class = PromocionListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna solo promociones activas y vigentes."""
        from django.utils import timezone
        from django.db.models import Q
        
        ahora = timezone.now()
        
        return Promocion.objects.filter(
            activo=True,
            fecha_eliminacion__isnull=True
        ).filter(
            # Sin fechas definidas O dentro del rango
            Q(fecha_inicio__isnull=True, fecha_fin__isnull=True) |
            Q(fecha_inicio__isnull=True, fecha_fin__gte=ahora) |
            Q(fecha_inicio__lte=ahora, fecha_fin__isnull=True) |
            Q(fecha_inicio__lte=ahora, fecha_fin__gte=ahora)
        ).prefetch_related(
            'items__producto'
        ).order_by('-fecha_creacion')
