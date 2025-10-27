from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class UserAdmin(BaseUserAdmin):
    """Admin personalizado para el modelo CustomUser."""
    
    list_display = ['email', 'nombre', 'apellido', 'rol', 'is_active', 'date_joined']
    list_filter = ['rol', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'nombre', 'apellido']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información Personal', {'fields': ('nombre', 'apellido', 'telefono', 'direccion')}),
        ('Permisos', {'fields': ('rol', 'is_active', 'is_staff', 'is_superuser')}),
        ('Fechas', {'fields': ('date_joined', 'last_login')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'nombre', 'apellido', 'rol', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']
