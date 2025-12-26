from django.db import models
from decimal import Decimal
from apps.core.models import SoftDeleteMixin, TimestampMixin


class Marca(SoftDeleteMixin, TimestampMixin):
    """Modelo para marcas de productos."""
    
    nombre = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    class Meta:
        verbose_name = 'Marca'
        verbose_name_plural = 'Marcas'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class ListaPrecio(SoftDeleteMixin, TimestampMixin):
    """Modelo para listas de precios con descuentos."""
    
    nombre = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    codigo = models.CharField(max_length=50, unique=True, verbose_name='Código')
    descuento_porcentaje = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name='Descuento (%)',
        help_text='Porcentaje de descuento aplicado sobre el precio base'
    )
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    class Meta:
        verbose_name = 'Lista de Precio'
        verbose_name_plural = 'Listas de Precios'
        ordering = ['nombre']
    
    def __str__(self):
        if self.descuento_porcentaje > 0:
            return f"{self.nombre} ({self.descuento_porcentaje}% desc.)"
        return self.nombre
    
    def calcular_precio(self, precio_base):
        """Calcula el precio aplicando el descuento de esta lista."""
        if self.descuento_porcentaje > 0:
            factor = Decimal('1') - (self.descuento_porcentaje / Decimal('100'))
            return precio_base * factor
        return precio_base


class Categoria(SoftDeleteMixin, TimestampMixin):
    """Modelo para categorías de productos."""
    
    nombre = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    url_imagen = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL de Imagen',
        help_text='URL de la imagen de la categoría (ej: S3)'
    )
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Subcategoria(SoftDeleteMixin, TimestampMixin):
    """Modelo para subcategorías de productos."""
    
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,
        related_name='subcategorias',
        verbose_name='Categoría'
    )
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    url_imagen = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL de Imagen',
        help_text='URL de la imagen de la subcategoría (ej: S3)'
    )
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    class Meta:
        verbose_name = 'Subcategoría'
        verbose_name_plural = 'Subcategorías'
        ordering = ['categoria__nombre', 'nombre']
        unique_together = ['categoria', 'nombre']
    
    def __str__(self):
        return f"{self.categoria.nombre} - {self.nombre}"


class Producto(SoftDeleteMixin, TimestampMixin):
    """Modelo para productos del catálogo."""
    
    UNIDAD_CHOICES = [
        ('ud', 'Unidad'),
        ('ml', 'Mililitros'),
        ('l', 'Litros'),
        ('g', 'Gramos'),
        ('kg', 'Kilogramos'),
        ('cm', 'Centímetros'),
        ('m', 'Metros'),
    ]
    
    codigo_barra = models.CharField(
        max_length=100, 
        unique=True, 
        verbose_name='Código de Barra',
        help_text='Código de barras único del producto',
        default='0000000000000'
    )
    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    
    marca = models.ForeignKey(
        Marca,
        on_delete=models.PROTECT,
        related_name='productos',
        verbose_name='Marca',
        null=True,
        default=1
    )
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name='productos',
        verbose_name='Categoría'
    )
    subcategoria = models.ForeignKey(
        Subcategoria,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='productos',
        verbose_name='Subcategoría'
    )
    
    tamaño = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Tamaño',
        help_text='Tamaño del producto',
        default=1.0
    )
    unidad_tamaño = models.CharField(
        max_length=10,
        choices=UNIDAD_CHOICES,
        verbose_name='Unidad de Tamaño',
        help_text='Unidad de medida del tamaño',
        default='ud'
    )
    unidades_caja = models.IntegerField(
        default=1,
        verbose_name='Unidades por Caja',
        help_text='Cantidad de unidades por caja'
    )
    
    # Precio base (sin descuentos)
    precio_base = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Precio Base',
        help_text='Precio sin descuentos'
    )
    
    tiene_stock = models.BooleanField(
        default=True,
        verbose_name='Tiene Stock',
        help_text='Indica si el producto tiene stock disponible'
    )
    
    url_imagen = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL de Imagen',
        help_text='URL de la imagen del producto (ej: S3)'
    )
    
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.codigo_barra} - {self.nombre}"
    
    def get_precio_lista(self, lista_precio=None):
        """
        Obtiene el precio según la lista de precios.
        Si no se proporciona lista, retorna el precio base.
        """
        if lista_precio and lista_precio.activo:
            return lista_precio.calcular_precio(self.precio_base)
        return self.precio_base


class Promocion(SoftDeleteMixin, TimestampMixin):
    """
    Modelo para promociones (combos de productos con precio especial).
    
    Una promoción agrupa varios productos con un precio fijo especial,
    más bajo que la suma de los precios individuales.
    """
    
    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    
    # Precio fijo de la promoción
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio',
        help_text='Precio fijo de la promoción'
    )
    
    url_imagen = models.URLField(
        blank=True,
        null=True,
        verbose_name='URL de Imagen',
        help_text='URL de la imagen de la promoción (ej: S3)'
    )
    
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    # Campos para vigencia (opcionales - para uso futuro)
    fecha_inicio = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Inicio',
        help_text='Fecha desde la cual la promoción está vigente (opcional)'
    )
    fecha_fin = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Fecha de Fin',
        help_text='Fecha hasta la cual la promoción está vigente (opcional)'
    )
    
    class Meta:
        verbose_name = 'Promoción'
        verbose_name_plural = 'Promociones'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return self.nombre
    
    @property
    def esta_vigente(self):
        """
        Verifica si la promoción está vigente según las fechas.
        Si no tiene fechas definidas, se considera siempre vigente.
        """
        from django.utils import timezone
        ahora = timezone.now()
        
        # Si no tiene fechas, está vigente
        if not self.fecha_inicio and not self.fecha_fin:
            return True
        
        # Verificar fecha de inicio
        if self.fecha_inicio and ahora < self.fecha_inicio:
            return False
        
        # Verificar fecha de fin
        if self.fecha_fin and ahora > self.fecha_fin:
            return False
        
        return True
    
    @property
    def precio_original(self):
        """
        Calcula la suma de los precios originales de los productos.
        Útil para mostrar el ahorro.
        """
        total = Decimal('0')
        for item in self.items.all():
            if item.producto:
                total += item.producto.precio_base * item.cantidad
        return total
    
    @property
    def ahorro(self):
        """Calcula el ahorro respecto al precio original."""
        return self.precio_original - self.precio
    
    @property
    def porcentaje_descuento(self):
        """Calcula el porcentaje de descuento."""
        if self.precio_original > 0:
            return ((self.precio_original - self.precio) / self.precio_original * 100).quantize(Decimal('0.1'))
        return Decimal('0')


class PromocionItem(models.Model):
    """
    Item de una promoción (relación entre promoción y producto con cantidad).
    """
    
    promocion = models.ForeignKey(
        Promocion,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Promoción'
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name='en_promociones',
        verbose_name='Producto'
    )
    cantidad = models.PositiveIntegerField(
        default=1,
        verbose_name='Cantidad',
        help_text='Cantidad de este producto incluida en la promoción'
    )
    
    class Meta:
        verbose_name = 'Item de Promoción'
        verbose_name_plural = 'Items de Promoción'
        unique_together = ['promocion', 'producto']
        ordering = ['id']
    
    def __str__(self):
        return f"{self.cantidad}x {self.producto.nombre}"
