"""
Modelos base y mixins para funcionalidad común.
"""
from django.db import models
from django.utils import timezone
from django.conf import settings


class SoftDeleteMixin(models.Model):
    """
    Mixin para soft delete (eliminación lógica).
    Permite desactivar registros en lugar de eliminarlos físicamente.
    """
    fecha_eliminacion = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Eliminación',
        help_text='Fecha en que se desactivó este registro'
    )
    eliminado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_eliminados',
        verbose_name='Eliminado Por',
        help_text='Usuario que desactivó este registro'
    )
    
    class Meta:
        abstract = True
    
    def soft_delete(self, usuario=None):
        """
        Realiza soft delete del registro.
        Si el modelo tiene campo 'activo', lo establece en False.
        Si el modelo tiene campo 'is_active', lo establece en False.
        """
        if hasattr(self, 'activo'):
            self.activo = False
        elif hasattr(self, 'is_active'):
            self.is_active = False
        
        self.fecha_eliminacion = timezone.now()
        if usuario:
            self.eliminado_por = usuario
        self.save()
    
    def restore(self):
        """
        Restaura un registro que fue soft deleted.
        """
        if hasattr(self, 'activo'):
            self.activo = True
        elif hasattr(self, 'is_active'):
            self.is_active = True
        
        self.fecha_eliminacion = None
        self.eliminado_por = None
        self.save()
    
    @property
    def is_deleted(self):
        """Verifica si el registro fue soft deleted."""
        return self.fecha_eliminacion is not None


class TimestampMixin(models.Model):
    """
    Mixin para timestamps automáticos.
    """
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de Actualización'
    )
    
    class Meta:
        abstract = True

