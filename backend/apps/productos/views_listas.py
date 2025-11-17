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


class ListaPrecioDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar lista de precios.
    GET/PUT/DELETE /api/productos/listas-precios/{id}/
    """
    queryset = ListaPrecio.objects.all()
    serializer_class = ListaPrecioSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def perform_destroy(self, instance):
        """
        Eliminación híbrida: soft delete si tiene referencias, hard delete si no.
        """
        # Verificar si tiene referencias en pedidos o usuarios
        tiene_referencias = instance.pedidos.exists() or instance.clientes.exists()
        
        if tiene_referencias:
            # Soft delete: desactivar en lugar de eliminar
            instance.soft_delete(usuario=self.request.user)
        else:
            # Hard delete: eliminar físicamente
            instance.delete()
    
    def destroy(self, request, *args, **kwargs):
        """
        Sobrescribe destroy para retornar mensaje apropiado según el tipo de eliminación.
        """
        from rest_framework.response import Response
        from rest_framework import status
        
        instance = self.get_object()
        
        # Verificar si tiene referencias antes de eliminar
        tiene_referencias = instance.pedidos.exists() or instance.clientes.exists()
        
        # Ejecutar la eliminación (soft o hard)
        self.perform_destroy(instance)
        
        # Retornar respuesta apropiada
        if tiene_referencias:
            return Response(
                {'message': 'Lista de precios desactivada (soft delete) porque tiene referencias en pedidos o usuarios.'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)