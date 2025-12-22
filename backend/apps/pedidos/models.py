from django.db import models
from django.conf import settings
from apps.productos.models import Producto


class Pedido(models.Model):
    """Modelo para pedidos de clientes."""
    
    ESTADO_CHOICES = (
        ('PENDIENTE', 'Pendiente'),
        ('EN_PREPARACION', 'En Preparación'),
        ('FACTURADO', 'Facturado'),
        ('ENTREGADO', 'Entregado'),
        ('RECHAZADO', 'Rechazado'),
    )
    
    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pedidos',
        verbose_name='Cliente'
    )
    
    # Transportador asignado para la entrega
    transportador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pedidos_asignados',
        verbose_name='Transportador',
        help_text='Transportador asignado para entregar este pedido'
    )
    
    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado'
    )
    
    # Lista de precios utilizada en este pedido
    lista_precio = models.ForeignKey(
        'productos.ListaPrecio',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pedidos',
        verbose_name='Lista de Precio',
        help_text='Lista de precios aplicada. Null = Lista Base. Se establece en NULL si la lista se elimina.'
    )
    
    # Snapshots para preservar información histórica
    lista_precio_nombre_snapshot = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Nombre Lista (Snapshot)',
        help_text='Nombre de la lista de precios al momento de crear el pedido'
    )
    lista_precio_descuento_snapshot = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Descuento Lista (Snapshot)',
        help_text='Descuento de la lista de precios al momento de crear el pedido'
    )
    
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Subtotal'
    )
    
    descuento_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Descuento Total'
    )
    
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Total'
    )
    
    notas = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notas'
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name='Fecha de Actualización')
    fecha_confirmacion = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Confirmación')
    fecha_entrega = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Entrega')
    
    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"Pedido #{self.id} - {self.cliente.full_name} - {self.get_estado_display()}"
    
    def calcular_totales(self):
        """Calcula subtotal, descuentos y total del pedido."""
        items = self.items.all()
        
        self.subtotal = sum(item.subtotal for item in items if item.subtotal)
        self.descuento_total = sum(item.descuento for item in items if item.descuento)
        self.total = self.subtotal - self.descuento_total
        
        self.save()
    
    def aprobar(self):
        """
        Aprueba el pedido pasándolo a EN_PREPARACION.
        
        Verifica que los productos estén activos y con stock disponible.
        """
        from django.utils import timezone
        
        if self.estado != 'PENDIENTE':
            raise ValueError('Solo se pueden aprobar pedidos pendientes.')
        
        # Verificar que el pedido tenga productos válidos
        producto_ids = list(self.items.values_list('producto_id', flat=True).distinct())
        producto_ids = [pid for pid in producto_ids if pid is not None]
        
        if not producto_ids:
            raise ValueError('El pedido no tiene productos válidos.')
        
        # Verificar disponibilidad de productos
        productos = Producto.objects.filter(id__in=producto_ids)
        productos_dict = {p.id: p for p in productos}
        
        for item in self.items.all():
            if not item.producto_id:
                raise ValueError('No se puede aprobar un pedido con productos eliminados.')
            
            producto = productos_dict.get(item.producto_id)
            if not producto:
                raise ValueError(f'El producto del item {item.id} no existe o fue eliminado.')
            
            # Verificar que el producto esté activo y tenga stock
            if not producto.activo:
                raise ValueError(f'El producto "{producto.nombre}" no está disponible.')
            
            if not producto.tiene_stock:
                raise ValueError(f'El producto "{producto.nombre}" no tiene stock disponible.')
        
        # Actualizar estado del pedido
        self.estado = 'EN_PREPARACION'
        self.fecha_confirmacion = timezone.now()
        self.save()
    
    def facturar(self):
        """
        Marca el pedido como facturado.
        """
        if self.estado != 'EN_PREPARACION':
            raise ValueError('Solo se pueden facturar pedidos en preparación.')
        
        self.estado = 'FACTURADO'
        self.save()
    
    def entregar(self):
        """
        Marca el pedido como entregado.
        """
        from django.utils import timezone
        
        if self.estado != 'FACTURADO':
            raise ValueError('Solo se pueden entregar pedidos facturados.')
        
        self.estado = 'ENTREGADO'
        self.fecha_entrega = timezone.now()
        self.save()
    
    def rechazar(self):
        """
        Rechaza el pedido.
        """
        if self.estado == 'RECHAZADO':
            raise ValueError('El pedido ya está rechazado.')
        
        if self.estado == 'ENTREGADO':
            raise ValueError('No se puede rechazar un pedido ya entregado.')
        
        self.estado = 'RECHAZADO'
        self.save()


class PedidoItem(models.Model):
    """Modelo para items de un pedido."""
    
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Pedido'
    )
    
    producto = models.ForeignKey(
        Producto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pedido_items',
        verbose_name='Producto',
        help_text='Producto del pedido. Se establece en NULL si el producto se elimina.'
    )
    
    # Snapshots para preservar información histórica del producto
    producto_nombre_snapshot = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Nombre Producto (Snapshot)',
        help_text='Nombre del producto al momento de crear el item'
    )
    producto_codigo_snapshot = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Código Producto (Snapshot)',
        help_text='Código del producto al momento de crear el item'
    )
    
    cantidad = models.IntegerField(verbose_name='Cantidad')
    
    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio Unitario'
    )
    
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Subtotal'
    )
    
    descuento = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Descuento'
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    
    class Meta:
        verbose_name = 'Item de Pedido'
        verbose_name_plural = 'Items de Pedido'
        ordering = ['id']
    
    def __str__(self):
        producto_nombre = self.producto_nombre_snapshot or (self.producto.nombre if self.producto else "Producto eliminado")
        return f"{producto_nombre} x{self.cantidad}"
    
    def save(self, *args, **kwargs):
        """Calcula subtotal y guarda snapshots antes de guardar."""
        # Calcular subtotal
        if self.precio_unitario and self.cantidad:
            self.subtotal = self.precio_unitario * self.cantidad
        
        # Guardar snapshots del producto si existe y no están guardados
        if self.producto and not self.producto_nombre_snapshot:
            self.producto_nombre_snapshot = self.producto.nombre
            self.producto_codigo_snapshot = self.producto.codigo_barra
        
        super().save(*args, **kwargs)
