from django.contrib import admin
from .models import InformacionGeneral


@admin.register(InformacionGeneral)
class InformacionGeneralAdmin(admin.ModelAdmin):
    """Admin para el modelo InformacionGeneral."""
    
    list_display = ['tipo', 'titulo', 'activo', 'fecha_actualizacion']
    list_filter = ['tipo', 'activo']
    search_fields = ['titulo', 'contenido']
    ordering = ['tipo']
    
    fieldsets = (
        ('Información', {
            'fields': ('tipo', 'titulo', 'contenido')
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
    )
    
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']
