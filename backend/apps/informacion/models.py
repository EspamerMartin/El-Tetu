from django.db import models
from apps.core.models import SoftDeleteMixin, TimestampMixin


class InformacionGeneral(SoftDeleteMixin, TimestampMixin):
    """Modelo para información general de la aplicación."""
    
    TIPO_CHOICES = (
        ('terminos', 'Términos y Condiciones'),
        ('privacidad', 'Política de Privacidad'),
        ('quienes_somos', '¿Quiénes Somos?'),
        ('contacto', 'Contacto'),
        ('faq', 'Preguntas Frecuentes'),
        ('otro', 'Otro'),
    )
    
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        unique=True,
        verbose_name='Tipo'
    )
    titulo = models.CharField(max_length=200, verbose_name='Título')
    contenido = models.TextField(verbose_name='Contenido')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    class Meta:
        verbose_name = 'Información General'
        verbose_name_plural = 'Información General'
        ordering = ['tipo']
    
    def __str__(self):
        return f"{self.get_tipo_display()}"
