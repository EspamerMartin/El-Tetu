from django.db import models
from apps.productos.models import Producto


class Promocion(models.Model):
    """Modelo para promociones y descuentos."""
    
    TIPO_CHOICES = (
        ('caja_cerrada', 'Caja Cerrada'),
        ('combinable', 'Combinable'),
        ('descuento_porcentaje', 'Descuento Porcentaje'),
        ('descuento_fijo', 'Descuento Fijo'),
    )
    
    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    descripcion = models.TextField(verbose_name='Descripción')
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES, verbose_name='Tipo')
    
    # Productos aplicables
    productos = models.ManyToManyField(
        Producto,
        related_name='promociones',
        verbose_name='Productos',
        blank=True
    )
    
    # Condiciones
    cantidad_minima = models.IntegerField(
        default=1,
        verbose_name='Cantidad Mínima',
        help_text='Cantidad mínima de productos para aplicar la promoción'
    )
    cantidad_exacta = models.IntegerField(
        null=True,
        blank=True,
        verbose_name='Cantidad Exacta',
        help_text='Para promociones de caja cerrada'
    )
    
    # Descuento
    descuento_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Descuento (%)',
        help_text='Descuento en porcentaje (ej: 10.00 para 10%)'
    )
    descuento_fijo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Descuento Fijo',
        help_text='Descuento en valor fijo'
    )
    
    # Vigencia
    fecha_inicio = models.DateTimeField(verbose_name='Fecha de Inicio')
    fecha_fin = models.DateTimeField(verbose_name='Fecha de Fin')
    
    activo = models.BooleanField(default=True, verbose_name='Activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    
    class Meta:
        verbose_name = 'Promoción'
        verbose_name_plural = 'Promociones'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_display()})"
    
    def es_vigente(self):
        """Verifica si la promoción está vigente."""
        from django.utils import timezone
        now = timezone.now()
        return self.activo and self.fecha_inicio <= now <= self.fecha_fin
    
    def calcular_descuento(self, subtotal, cantidad=1):
        """
        Calcula el descuento aplicable.
        
        Args:
            subtotal: Subtotal del pedido/item
            cantidad: Cantidad de productos
            
        Returns:
            Monto del descuento
        """
        if not self.es_vigente():
            return 0
        
        # Verificar cantidad mínima
        if cantidad < self.cantidad_minima:
            return 0
        
        # Para caja cerrada, verificar cantidad exacta
        if self.tipo == 'caja_cerrada' and self.cantidad_exacta:
            if cantidad != self.cantidad_exacta:
                return 0
        
        # Calcular descuento
        if self.descuento_porcentaje:
            return subtotal * (self.descuento_porcentaje / 100)
        elif self.descuento_fijo:
            return min(self.descuento_fijo, subtotal)
        
        return 0
