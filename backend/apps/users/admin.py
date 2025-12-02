from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomUser, Zona, HorarioCliente


@admin.register(Zona)
class ZonaAdmin(admin.ModelAdmin):
    """Admin para el modelo Zona."""
    
    list_display = ['nombre', 'activo', 'fecha_creacion']
    list_filter = ['activo', 'fecha_creacion']
    search_fields = ['nombre', 'descripcion']
    ordering = ['nombre']


class HorarioClienteInline(admin.TabularInline):
    """Inline para horarios de cliente."""
    
    model = HorarioCliente
    extra = 1
    fields = ['dia_semana', 'hora_desde', 'hora_hasta']


@admin.register(HorarioCliente)
class HorarioClienteAdmin(admin.ModelAdmin):
    """Admin para el modelo HorarioCliente."""
    
    list_display = ['cliente', 'dia_semana', 'hora_desde', 'hora_hasta']
    list_filter = ['dia_semana']
    search_fields = ['cliente__email', 'cliente__nombre']
    ordering = ['cliente', 'dia_semana', 'hora_desde']


@admin.register(CustomUser)
class UserAdmin(BaseUserAdmin):
    """Admin personalizado para el modelo CustomUser."""
    
    list_display = ['email', 'nombre', 'apellido', 'rol', 'zona', 'lista_precio', 'is_active', 'date_joined']
    list_filter = ['rol', 'zona', 'lista_precio', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'nombre', 'apellido', 'cuit_dni']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información Personal', {'fields': ('nombre', 'apellido', 'telefono', 'cuit_dni')}),
        ('Dirección (Cliente)', {'fields': ('zona', 'calle', 'entre_calles', 'numero', 'descripcion_ubicacion', 'direccion')}),
        ('Configuración Comercial', {'fields': ('lista_precio',)}),
        ('Permisos', {'fields': ('rol', 'is_active', 'is_staff', 'is_superuser')}),
        ('Fechas', {'fields': ('date_joined', 'last_login')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nombre', 'apellido', 'rol', 'telefono', 'cuit_dni', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']
    inlines = [HorarioClienteInline]
