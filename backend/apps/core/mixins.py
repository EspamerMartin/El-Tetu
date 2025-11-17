"""
Mixins reutilizables para vistas y funcionalidad común.
"""

from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger('eltetu')


class SoftDeleteMixin:
    """
    Mixin para manejar eliminación híbrida (soft delete si tiene referencias, hard delete si no).
    
    Requiere que el modelo tenga el mixin SoftDeleteMixin de models.py.
    """
    
    def get_reference_checks(self, instance):
        """
        Retorna una lista de tuplas (related_manager, nombre_campo) para verificar referencias.
        Debe ser sobrescrito en las clases hijas para especificar qué relaciones verificar.
        
        Ejemplo:
            return [
                (instance.productos, 'productos'),
                (instance.subcategorias, 'subcategorias'),
            ]
        """
        return []
    
    def perform_destroy(self, instance):
        """
        Realiza eliminación híbrida: soft delete si tiene referencias, hard delete si no.
        """
        reference_checks = self.get_reference_checks(instance)
        tiene_referencias = False
        
        # Verificar todas las relaciones especificadas
        for related_manager, nombre_campo in reference_checks:
            if related_manager.exists():
                tiene_referencias = True
                logger.info(
                    f'Soft delete para {instance.__class__.__name__} #{instance.id}: '
                    f'tiene referencias en {nombre_campo}'
                )
                break
        
        if tiene_referencias:
            # Soft delete: desactivar en lugar de eliminar
            instance.soft_delete(usuario=self.request.user)
            logger.info(
                f'Soft delete realizado para {instance.__class__.__name__} #{instance.id} '
                f'por usuario {self.request.user.email}'
            )
        else:
            # Hard delete: eliminar físicamente
            instance.delete()
            logger.info(
                f'Hard delete realizado para {instance.__class__.__name__} #{instance.id} '
                f'por usuario {self.request.user.email}'
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        Sobrescribe destroy para retornar mensaje apropiado según el tipo de eliminación.
        """
        instance = self.get_object()
        
        # Verificar referencias antes de eliminar
        reference_checks = self.get_reference_checks(instance)
        tiene_referencias = any(
            related_manager.exists() 
            for related_manager, _ in reference_checks
        )
        
        # Ejecutar la eliminación (soft o hard)
        self.perform_destroy(instance)
        
        # Retornar respuesta apropiada
        if tiene_referencias:
            model_name = instance.__class__._meta.verbose_name
            return Response(
                {
                    'message': (
                        f'{model_name} desactivado (soft delete) porque tiene referencias. '
                        'Los datos se mantienen para mantener la integridad histórica.'
                    )
                },
                status=status.HTTP_200_OK
            )
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)

