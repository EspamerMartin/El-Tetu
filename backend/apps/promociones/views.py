from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from apps.users.permissions import IsAdmin
from .models import Promocion
from .serializers import PromocionSerializer


class PromocionListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear promociones.
    GET/POST /api/promociones/
    """
    queryset = Promocion.objects.all()
    serializer_class = PromocionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtra promociones activas y con stock para no-admin."""
        queryset = super().get_queryset()
        
        # Solo admin puede ver todas las promociones
        if not self.request.user.is_admin():
            queryset = queryset.filter(activo=True)
            # El filtro de vigencia y stock se hace en el serializer con tiene_stock
        
        return queryset.prefetch_related('items__producto')
    
    def get_serializer_context(self):
        """Pasa el request al serializer para calcular precios según lista."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        """Solo admin puede crear promociones."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class PromocionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar promoción.
    GET/PUT/DELETE /api/promociones/{id}/
    """
    queryset = Promocion.objects.all()
    serializer_class = PromocionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Optimiza la consulta."""
        return super().get_queryset().prefetch_related('items__producto')
    
    def get_serializer_context(self):
        """Pasa el request al serializer para calcular precios según lista."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        """Solo admin puede actualizar/eliminar promociones."""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
