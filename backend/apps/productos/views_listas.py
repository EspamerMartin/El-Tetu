from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import IsAdmin
from .models import ListaPrecio
from .serializers import ListaPrecioSerializer


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
        """Admin ve todas, otros solo activas."""
        queryset = super().get_queryset()
        if not self.request.user.is_admin():
            queryset = queryset.filter(activo=True)
        return queryset
    
    def get_permissions(self):
        """Solo admin puede crear listas."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class ListaPrecioDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar lista de precios.
    GET/PUT/DELETE /api/productos/listas-precios/{id}/
    """
    queryset = ListaPrecio.objects.all()
    serializer_class = ListaPrecioSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
