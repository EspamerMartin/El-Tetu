from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.auth.hashers import make_password
from apps.core.models import SoftDeleteMixin


class Zona(models.Model):
    """Modelo para las zonas de reparto/entrega."""
    
    nombre = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    descripcion = models.TextField(blank=True, null=True, verbose_name='Descripción')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    
    class Meta:
        verbose_name = 'Zona'
        verbose_name_plural = 'Zonas'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class CustomUserManager(BaseUserManager):
    """Manager personalizado para el modelo CustomUser."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Crea y guarda un usuario con el email y password dados."""
        if not email:
            raise ValueError('El email es obligatorio')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.password = make_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Crea y guarda un superusuario con el email y password dados."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin, SoftDeleteMixin):
    """Modelo de usuario personalizado con email como identificador único."""
    
    ROLES = (
        ('admin', 'Administrador'),
        ('vendedor', 'Vendedor'),
        ('cliente', 'Cliente'),
    )
    
    email = models.EmailField(unique=True, verbose_name='Email')
    nombre = models.CharField(max_length=100, verbose_name='Nombre')
    apellido = models.CharField(max_length=100, verbose_name='Apellido')
    rol = models.CharField(max_length=20, choices=ROLES, default='cliente', verbose_name='Rol')
    telefono = models.CharField(max_length=20, blank=True, null=True, verbose_name='Teléfono')
    direccion = models.TextField(blank=True, null=True, verbose_name='Dirección')
    
    # Campo compartido para vendedor y cliente
    cuit_dni = models.CharField(max_length=20, blank=True, null=True, verbose_name='CUIT/DNI')
    
    # Campos específicos para CLIENTE
    zona = models.ForeignKey(
        Zona,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clientes_zona',
        verbose_name='Zona'
    )
    calle = models.CharField(max_length=200, blank=True, null=True, verbose_name='Calle')
    entre_calles = models.CharField(max_length=200, blank=True, null=True, verbose_name='Entre calles')
    numero = models.CharField(max_length=20, blank=True, null=True, verbose_name='Número')
    descripcion_ubicacion = models.TextField(blank=True, null=True, verbose_name='Descripción de ubicación')
    
    # Lista de precios asignada (null = usa lista base)
    lista_precio = models.ForeignKey(
        'productos.ListaPrecio',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clientes',
        verbose_name='Lista de Precios',
        help_text='Si no se asigna, usa la lista base sin descuentos'
    )
    
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    is_staff = models.BooleanField(default=False, verbose_name='Staff')
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de registro')
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre', 'apellido']
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.email} ({self.get_rol_display()})"
    
    @property
    def full_name(self):
        """Retorna el nombre completo del usuario."""
        return f"{self.nombre} {self.apellido}"
    
    def is_admin(self):
        """Verifica si el usuario es admin."""
        return self.rol == 'admin'
    
    def is_vendedor(self):
        """Verifica si el usuario es vendedor."""
        return self.rol == 'vendedor'
    
    def is_cliente(self):
        """Verifica si el usuario es cliente."""
        return self.rol == 'cliente'


class HorarioCliente(models.Model):
    """Horarios de apertura y cierre por día de la semana para clientes."""
    
    DIAS_SEMANA = (
        (0, 'Lunes'),
        (1, 'Martes'),
        (2, 'Miércoles'),
        (3, 'Jueves'),
        (4, 'Viernes'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    )
    
    cliente = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='horarios',
        verbose_name='Cliente'
    )
    dia_semana = models.IntegerField(choices=DIAS_SEMANA, verbose_name='Día de la semana')
    horario_apertura = models.TimeField(verbose_name='Horario de apertura')
    horario_cierre = models.TimeField(verbose_name='Horario de cierre')
    cerrado = models.BooleanField(default=False, verbose_name='Cerrado')
    
    class Meta:
        verbose_name = 'Horario de Cliente'
        verbose_name_plural = 'Horarios de Clientes'
        ordering = ['cliente', 'dia_semana']
        unique_together = ['cliente', 'dia_semana']
    
    def __str__(self):
        if self.cerrado:
            return f"{self.cliente.email} - {self.get_dia_semana_display()}: Cerrado"
        return f"{self.cliente.email} - {self.get_dia_semana_display()}: {self.horario_apertura} - {self.horario_cierre}"
