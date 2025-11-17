from django.contrib import admin
from .models import Pedido, PedidoItem


class PedidoItemInline(admin.TabularInline):
    """Inline para items de pedido."""
    model = PedidoItem
    extra = 0
    readonly_fields = ['subtotal', 'descuento']


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    """Admin para el modelo Pedido."""
    
    list_display = [
        'id', 'cliente', 'estado', 'lista_precio',
        'total', 'fecha_creacion'
    ]
    list_filter = ['estado', 'lista_precio', 'fecha_creacion']
    search_fields = ['cliente__email', 'cliente__nombre', 'cliente__apellido']
    ordering = ['-fecha_creacion']
    inlines = [PedidoItemInline]
    
    fieldsets = (
        ('Cliente', {
            'fields': ('cliente',)
        }),
        ('Detalles', {
            'fields': ('estado', 'lista_precio', 'notas')
        }),
        ('Totales', {
            'fields': ('subtotal', 'descuento_total', 'total')
        }),
        ('Fechas', {
            'fields': (
                'fecha_creacion', 'fecha_actualizacion',
                'fecha_confirmacion', 'fecha_entrega'
            )
        }),
    )
    
    readonly_fields = [
        'subtotal', 'descuento_total', 'total',
        'fecha_creacion', 'fecha_actualizacion',
        'fecha_confirmacion', 'fecha_entrega'
    ]


@admin.register(PedidoItem)
class PedidoItemAdmin(admin.ModelAdmin):
    """Admin para el modelo PedidoItem."""
    
    list_display = [
        'pedido', 'producto', 'cantidad',
        'precio_unitario', 'subtotal', 'descuento'
    ]
    list_filter = ['pedido__estado', 'fecha_creacion']
    search_fields = ['producto__nombre', 'pedido__id']
    readonly_fields = ['subtotal']
