from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
import logging

from apps.users.permissions import IsAdmin
from apps.core.mixins import SoftDeleteMixin
from .models import InformacionGeneral
from .serializers import InformacionGeneralSerializer

logger = logging.getLogger('eltetu')


class InformacionGeneralListView(generics.ListAPIView):
    """
    Vista para listar información general.
    GET /api/info/general/
    
    Pública - no requiere autenticación.
    """
    queryset = InformacionGeneral.objects.filter(activo=True, fecha_eliminacion__isnull=True)
    serializer_class = InformacionGeneralSerializer
    permission_classes = [AllowAny]


class InformacionGeneralDetailView(generics.RetrieveAPIView):
    """
    Vista para obtener detalle de información por tipo.
    GET /api/info/general/{tipo}/
    
    Pública - no requiere autenticación.
    """
    queryset = InformacionGeneral.objects.filter(activo=True, fecha_eliminacion__isnull=True)
    serializer_class = InformacionGeneralSerializer
    permission_classes = [AllowAny]
    lookup_field = 'tipo'


class InformacionGeneralCreateUpdateView(generics.ListCreateAPIView):
    """
    Vista para crear/actualizar información general (solo admin).
    GET/POST /api/info/admin/
    """
    queryset = InformacionGeneral.objects.all()
    serializer_class = InformacionGeneralSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class InformacionGeneralAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para gestionar información general (solo admin).
    GET/PUT/DELETE /api/info/admin/{id}/
    
    Siempre realiza soft delete para mantener historial.
    """
    queryset = InformacionGeneral.objects.all()
    serializer_class = InformacionGeneralSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def perform_destroy(self, instance):
        """
        Siempre soft delete para información general (para mantener historial).
        """
        instance.soft_delete(usuario=self.request.user)
        logger.info(
            f'Información general #{instance.id} desactivada por usuario {self.request.user.email}'
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        Sobrescribe destroy para retornar mensaje apropiado.
        """
        instance = self.get_object()
        
        # Ejecutar soft delete
        self.perform_destroy(instance)
        
        return Response(
            {'message': 'Información general desactivada (soft delete).'},
            status=status.HTTP_200_OK
        )