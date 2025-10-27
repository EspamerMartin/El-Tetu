from django.db import models
from django.conf import settings
from apps.productos.models import Producto
from apps.promociones.models import Promocion


class Pedido(models.Model):
    """Modelo para pedidos de clientes."""
    
    ESTADO_CHOICES = (
        ('PENDIENTE', 'Pendiente'),
        ('CONFIRMADO', 'Confirmado'),
        ('EN_CAMINO', 'En Camino'),
        ('ENTREGADO', 'Entregado'),
        ('CANCELADO', 'Cancelado'),
    )
    
    LISTA_PRECIO_CHOICES = (
        ('lista_3', 'Lista 3'),
        ('lista_4', 'Lista 4'),
    )
    
    cliente = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pedidos',
        verbose_name='Cliente'
    )
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado'
    )
    
    lista_precio = models.CharField(
        max_length=10,
        choices=LISTA_PRECIO_CHOICES,
        default='lista_3',
        verbose_name='Lista de Precio'
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
    
    promociones_aplicadas = models.ManyToManyField(
        Promocion,
        related_name='pedidos',
        blank=True,
        verbose_name='Promociones Aplicadas'
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
        
        self.subtotal = sum(item.subtotal for item in items)
        self.descuento_total = sum(item.descuento for item in items)
        self.total = self.subtotal - self.descuento_total
        
        self.save()
    
    def aplicar_promociones(self):
        """Aplica promociones vigentes a los items del pedido."""
        from django.utils import timezone
        
        # Obtener promociones vigentes
        promociones = Promocion.objects.filter(
            activo=True,
            fecha_inicio__lte=timezone.now(),
            fecha_fin__gte=timezone.now()
        )
        
        promociones_aplicadas = []
        
        for item in self.items.all():
            # Buscar promociones aplicables al producto
            promociones_producto = promociones.filter(productos=item.producto)
            
            for promocion in promociones_producto:
                descuento = promocion.calcular_descuento(item.subtotal, item.cantidad)
                if descuento > 0:
                    item.descuento = descuento
                    item.save()
                    promociones_aplicadas.append(promocion)
        
        # Asociar promociones aplicadas
        if promociones_aplicadas:
            self.promociones_aplicadas.set(promociones_aplicadas)
        
        # Recalcular totales
        self.calcular_totales()
    
    def confirmar(self):
        """Confirma el pedido y descuenta stock."""
        from django.utils import timezone
        
        if self.estado != 'PENDIENTE':
            raise ValueError('Solo se pueden confirmar pedidos pendientes.')
        
        # Verificar stock antes de confirmar
        for item in self.items.all():
            if item.producto.stock < item.cantidad:
                raise ValueError(f'Stock insuficiente para {item.producto.nombre}')
        
        # Descontar stock
        for item in self.items.all():
            item.producto.descontar_stock(item.cantidad)
        
        self.estado = 'CONFIRMADO'
        self.fecha_confirmacion = timezone.now()
        self.save()
    
    def cancelar(self):
        """Cancela el pedido y restaura stock si fue confirmado."""
        if self.estado in ['ENTREGADO', 'CANCELADO']:
            raise ValueError('No se puede cancelar un pedido entregado o ya cancelado.')
        
        # Si estaba confirmado, restaurar stock
        if self.estado == 'CONFIRMADO':
            for item in self.items.all():
                item.producto.aumentar_stock(item.cantidad)
        
        self.estado = 'CANCELADO'
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
        on_delete=models.PROTECT,
        related_name='pedido_items',
        verbose_name='Producto'
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
        return f"{self.producto.nombre} x{self.cantidad}"
    
    def save(self, *args, **kwargs):
        """Calcula subtotal antes de guardar."""
        self.subtotal = self.precio_unitario * self.cantidad
        super().save(*args, **kwargs)
