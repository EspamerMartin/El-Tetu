from django.contrib import admin
from .models import Promocion, PromocionItem


class PromocionItemInline(admin.TabularInline):
    """Inline para items de promoción."""
    model = PromocionItem
    extra = 1
    fields = ['producto', 'cantidad']
    autocomplete_fields = ['producto']


@admin.register(Promocion)
class PromocionAdmin(admin.ModelAdmin):
    """Admin para el modelo Promocion."""
    
    list_display = [
        'codigo', 'nombre', 'stock', 'tipo_control_stock',
        'descuento_porcentaje', 'descuento_fijo',
        'fecha_inicio', 'fecha_fin', 'activo'
    ]
    list_filter = ['tipo_control_stock', 'activo', 'fecha_inicio', 'fecha_fin']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['-fecha_creacion']
    inlines = [PromocionItemInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion', 'imagen')
        }),
        ('Stock y Control', {
            'fields': ('stock', 'stock_minimo', 'tipo_control_stock')
        }),
        ('Descuento', {
            'fields': ('descuento_porcentaje', 'descuento_fijo')
        }),
        ('Vigencia', {
            'fields': ('fecha_inicio', 'fecha_fin')
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
    )
    
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']


@admin.register(PromocionItem)
class PromocionItemAdmin(admin.ModelAdmin):
    """Admin para el modelo PromocionItem."""
    
    list_display = ['promocion', 'producto', 'cantidad']
    list_filter = ['promocion']
    search_fields = ['promocion__nombre', 'producto__nombre']
    autocomplete_fields = ['producto']
