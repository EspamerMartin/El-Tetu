from django.contrib import admin
from .models import Promocion


@admin.register(Promocion)
class PromocionAdmin(admin.ModelAdmin):
    """Admin para el modelo Promocion."""
    
    list_display = [
        'nombre', 'tipo', 'descuento_porcentaje', 'descuento_fijo',
        'fecha_inicio', 'fecha_fin', 'activo'
    ]
    list_filter = ['tipo', 'activo', 'fecha_inicio', 'fecha_fin']
    search_fields = ['nombre', 'descripcion']
    ordering = ['-fecha_creacion']
    filter_horizontal = ['productos']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'tipo')
        }),
        ('Productos Aplicables', {
            'fields': ('productos',)
        }),
        ('Condiciones', {
            'fields': ('cantidad_minima', 'cantidad_exacta')
        }),
        ('Descuento', {
            'fields': ('descuento_porcentaje', 'descuento_fijo')
        }),
        ('Vigencia', {
            'fields': ('fecha_inicio', 'fecha_fin', 'activo')
        }),
    )
