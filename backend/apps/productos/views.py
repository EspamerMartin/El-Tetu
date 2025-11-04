from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.users.permissions import IsAdmin
from .models import Categoria, Subcategoria, Producto
from .serializers import (
    CategoriaSerializer,
    SubcategoriaSerializer,
    ProductoListSerializer,
    ProductoDetailSerializer,
    ProductoCreateUpdateSerializer,
)


# ========== Categorías ==========

class CategoriaListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear categorías.
    GET/POST /api/productos/categorias/
    """
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Admin ve todas, otros solo activas."""
        if self.request.user.is_admin():
            return Categoria.objects.all()
        return Categoria.objects.filter(activo=True)
    
    def get_permissions(self):
        """Solo admin puede crear categorías."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class CategoriaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar categoría.
    GET/PUT/DELETE /api/productos/categorias/{id}/
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


# ========== Subcategorías ==========

class SubcategoriaListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear subcategorías.
    GET/POST /api/productos/subcategorias/
    """
    serializer_class = SubcategoriaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categoria']
    
    def get_queryset(self):
        """Admin ve todas, otros solo activas."""
        queryset = Subcategoria.objects.select_related('categoria')
        if self.request.user.is_admin():
            return queryset
        return queryset.filter(activo=True)
    
    def get_permissions(self):
        """Solo admin puede crear subcategorías."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class SubcategoriaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar subcategoría.
    GET/PUT/DELETE /api/productos/subcategorias/{id}/
    """
    queryset = Subcategoria.objects.all()
    serializer_class = SubcategoriaSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


# ========== Productos ==========

class ProductoListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear productos.
    GET/POST /api/productos/
    
    Filtros disponibles:
    - categoria: ID de categoría
    - subcategoria: ID de subcategoría
    - stock: mínimo stock disponible
    - search: búsqueda por nombre o código
    """
    queryset = Producto.objects.select_related('categoria', 'subcategoria')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'subcategoria', 'activo']
    search_fields = ['nombre', 'codigo', 'descripcion']
    ordering_fields = ['nombre', 'codigo', 'precio_lista_3', 'precio_lista_4', 'stock']
    ordering = ['nombre']
    
    def get_serializer_class(self):
        """Usa serializer ligero para listado, completo para creación."""
        if self.request.method == 'POST':
            return ProductoCreateUpdateSerializer
        return ProductoListSerializer
    
    def get_queryset(self):
        """Filtra productos según parámetros."""
        queryset = super().get_queryset()
        
        # Filtrar solo activos (a menos que sea admin)
        if not self.request.user.is_admin():
            queryset = queryset.filter(activo=True)
        
        # Filtro por stock mínimo
        stock_min = self.request.query_params.get('stock_min', None)
        if stock_min:
            queryset = queryset.filter(stock__gte=stock_min)
        
        # Filtro por disponibilidad
        disponible = self.request.query_params.get('disponible', None)
        if disponible and disponible.lower() == 'true':
            queryset = queryset.filter(stock__gt=0)
        
        return queryset
    
    def get_permissions(self):
        """Solo admin puede crear productos."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class ProductoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar producto.
    GET/PUT/DELETE /api/productos/{id}/
    """
    queryset = Producto.objects.select_related('categoria', 'subcategoria')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Usa serializer de detalle para GET, de creación/actualización para PUT."""
        if self.request.method in ['PUT', 'PATCH']:
            return ProductoCreateUpdateSerializer
        return ProductoDetailSerializer
    
    def get_permissions(self):
        """Solo admin puede actualizar/eliminar productos."""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
