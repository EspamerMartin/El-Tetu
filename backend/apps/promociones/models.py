from django.db import models
from apps.productos.models import Producto


class Promocion(models.Model):
    """Modelo para promociones como productos compuestos."""
    
    TIPO_CONTROL_STOCK_CHOICES = (
        ('stock', 'Por Stock'),
        ('fecha', 'Por Fecha'),
        ('ambos', 'Stock y Fecha'),
    )
    
    # Información básica
    codigo = models.CharField(max_length=50, unique=True, verbose_name='Código')
    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    
    # Imagen
    imagen = models.ImageField(
        upload_to='promociones/',
        blank=True,
        null=True,
        verbose_name='Imagen'
    )
    
    # Stock y control
    stock = models.IntegerField(default=0, verbose_name='Stock')
    stock_minimo = models.IntegerField(default=0, verbose_name='Stock Mínimo')
    tipo_control_stock = models.CharField(
        max_length=10,
        choices=TIPO_CONTROL_STOCK_CHOICES,
        default='stock',
        verbose_name='Tipo de Control de Stock',
        help_text='Cómo se controla la disponibilidad de la promoción'
    )
    
    # Descuento global
    descuento_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Descuento (%)',
        help_text='Descuento porcentual sobre la suma de productos'
    )
    descuento_fijo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Descuento Fijo',
        help_text='Descuento fijo sobre la suma de productos'
    )
    
    # Vigencia (para control por fecha)
    fecha_inicio = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Inicio')
    fecha_fin = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Fin')
    
    # Estado
    activo = models.BooleanField(default=True, verbose_name='Activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name='Fecha de Actualización')
    
    class Meta:
        verbose_name = 'Promoción'
        verbose_name_plural = 'Promociones'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
    
    @property
    def tiene_stock(self):
        """Verifica si la promoción tiene stock disponible."""
        if self.tipo_control_stock in ('fecha', 'ambos'):
            # Si es por fecha, verificar vigencia
            from django.utils import timezone
            ahora = timezone.now()
            if self.fecha_inicio and self.fecha_fin:
                if not (self.fecha_inicio <= ahora <= self.fecha_fin):
                    return False
        
        if self.tipo_control_stock in ('stock', 'ambos'):
            # Si es por stock, verificar stock
            if self.stock <= 0:
                return False
        
        # Validar stock de productos individuales
        return self.validar_stock_productos()
    
    def validar_stock_productos(self):
        """Valida que todos los productos tengan stock suficiente."""
        for item in self.items.all():
            if item.producto.stock < item.cantidad:
                return False
        return True
    
    def calcular_precio_base(self, lista_precio=None):
        """
        Calcula el precio base sumando los productos incluidos.
        
        Args:
            lista_precio: Lista de precios a aplicar (opcional)
            
        Returns:
            Precio base sin descuento
        """
        precio_total = 0
        for item in self.items.all():
            precio_producto = item.producto.get_precio_lista(lista_precio)
            precio_total += precio_producto * item.cantidad
        return precio_total
    
    def calcular_precio_final(self, lista_precio=None):
        """
        Calcula el precio final aplicando el descuento.
        
        Args:
            lista_precio: Lista de precios a aplicar (opcional)
            
        Returns:
            Precio final con descuento aplicado
        """
        precio_base = self.calcular_precio_base(lista_precio)
        
        # Aplicar descuento
        if self.descuento_porcentaje:
            descuento = precio_base * (self.descuento_porcentaje / 100)
        elif self.descuento_fijo:
            descuento = min(self.descuento_fijo, precio_base)
        else:
            descuento = 0
        
        return precio_base - descuento
    
    def descontar_stock(self, cantidad=1):
        """Descuenta stock de la promoción y de los productos incluidos."""
        if not self.tiene_stock:
            return False
        
        # Descontar stock de la promoción (si aplica)
        if self.tipo_control_stock in ('stock', 'ambos'):
            if self.stock < cantidad:
                return False
            self.stock -= cantidad
            self.save()
        
        # Descontar stock de productos individuales
        for item in self.items.all():
            if not item.producto.descontar_stock(item.cantidad * cantidad):
                return False
        
        return True
    
    def aumentar_stock(self, cantidad=1):
        """Aumenta stock de la promoción."""
        if self.tipo_control_stock in ('stock', 'ambos'):
            self.stock += cantidad
            self.save()
    
    @property
    def stock_bajo(self):
        """Verifica si el stock está por debajo del mínimo."""
        return self.stock <= self.stock_minimo


class PromocionItem(models.Model):
    """Modelo intermedio para productos incluidos en una promoción con cantidad."""
    
    promocion = models.ForeignKey(
        Promocion,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Promoción'
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name='promociones_incluidas',
        verbose_name='Producto'
    )
    cantidad = models.IntegerField(
        default=1,
        verbose_name='Cantidad',
        help_text='Cantidad de este producto en la promoción'
    )
    
    class Meta:
        verbose_name = 'Item de Promoción'
        verbose_name_plural = 'Items de Promoción'
        unique_together = ['promocion', 'producto']
        ordering = ['producto__nombre']
    
    def __str__(self):
        return f"{self.promocion.nombre} - {self.producto.nombre} x{self.cantidad}"
