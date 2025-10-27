from django.contrib import admin
from .models import Categoria, Subcategoria, Producto


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    """Admin para el modelo Categoria."""
    
    list_display = ['nombre', 'activo', 'fecha_creacion']
    list_filter = ['activo', 'fecha_creacion']
    search_fields = ['nombre', 'descripcion']
    ordering = ['nombre']


@admin.register(Subcategoria)
class SubcategoriaAdmin(admin.ModelAdmin):
    """Admin para el modelo Subcategoria."""
    
    list_display = ['nombre', 'categoria', 'activo', 'fecha_creacion']
    list_filter = ['categoria', 'activo', 'fecha_creacion']
    search_fields = ['nombre', 'descripcion', 'categoria__nombre']
    ordering = ['categoria__nombre', 'nombre']


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    """Admin para el modelo Producto."""
    
    list_display = [
        'codigo', 'nombre', 'categoria', 'subcategoria',
        'precio_lista_3', 'precio_lista_4', 'stock', 'activo'
    ]
    list_filter = ['categoria', 'subcategoria', 'activo', 'fecha_creacion']
    search_fields = ['codigo', 'nombre', 'descripcion']
    ordering = ['nombre']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Categorización', {
            'fields': ('categoria', 'subcategoria')
        }),
        ('Precios', {
            'fields': ('precio_lista_3', 'precio_lista_4')
        }),
        ('Inventario', {
            'fields': ('stock', 'stock_minimo')
        }),
        ('Media', {
            'fields': ('imagen',)
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
    )
    
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
