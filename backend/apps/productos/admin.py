from django.contrib import admin
from .models import ListaPrecio, Categoria, Subcategoria, Producto


@admin.register(ListaPrecio)
class ListaPrecioAdmin(admin.ModelAdmin):
    """Admin para el modelo ListaPrecio."""
    
    list_display = ['nombre', 'codigo', 'descuento_porcentaje', 'activo', 'fecha_creacion']
    list_filter = ['activo', 'fecha_creacion']
    search_fields = ['nombre', 'codigo']
    ordering = ['nombre']
    readonly_fields = ['fecha_creacion']


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
        'precio_base', 'stock', 'activo'
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
        ('Precio', {
            'fields': ('precio_base',),
            'description': 'El precio base es el precio sin descuentos. Los descuentos se aplican por lista de precios.'
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
