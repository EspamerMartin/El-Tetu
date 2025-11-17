from django.db import models
from decimal import Decimal
from apps.core.models import SoftDeleteMixin, TimestampMixin


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
    
    codigo = models.CharField(max_length=50, unique=True, verbose_name='Código')
    nombre = models.CharField(max_length=200, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    
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
    
    # Precio base (sin descuentos)
    precio_base = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Precio Base',
        help_text='Precio sin descuentos'
    )
    
    stock = models.IntegerField(default=0, verbose_name='Stock')
    stock_minimo = models.IntegerField(default=0, verbose_name='Stock Mínimo')
    
    imagen = models.ImageField(
        upload_to='productos/',
        blank=True,
        null=True,
        verbose_name='Imagen'
    )
    
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
    
    def get_precio_lista(self, lista_precio=None):
        """
        Obtiene el precio según la lista de precios.
        Si no se proporciona lista, retorna el precio base.
        """
        if lista_precio and lista_precio.activo:
            return lista_precio.calcular_precio(self.precio_base)
        return self.precio_base
    
    @property
    def tiene_stock(self):
        """Verifica si el producto tiene stock disponible."""
        return self.stock > 0
    
    @property
    def stock_bajo(self):
        """Verifica si el stock está por debajo del mínimo."""
        return self.stock <= self.stock_minimo
    
    def descontar_stock(self, cantidad):
        """Descuenta stock del producto."""
        if self.stock >= cantidad:
            self.stock -= cantidad
            self.save()
            return True
        return False
    
    def aumentar_stock(self, cantidad):
        """Aumenta stock del producto."""
        self.stock += cantidad
        self.save()
