from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import CustomUser, Zona, HorarioCliente


# ========== Zona Serializers ==========

class ZonaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Zona."""
    
    class Meta:
        model = Zona
        fields = ['id', 'nombre', 'descripcion', 'activo', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


# ========== Horario Serializers ==========

class HorarioClienteSerializer(serializers.ModelSerializer):
    """Serializer para horarios de cliente (lectura)."""
    
    dia_semana_display = serializers.CharField(source='get_dia_semana_display', read_only=True)
    
    class Meta:
        model = HorarioCliente
        fields = ['id', 'dia_semana', 'dia_semana_display', 'hora_desde', 'hora_hasta']
        read_only_fields = ['id']


class HorarioClienteCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar horarios de cliente."""
    
    class Meta:
        model = HorarioCliente
        fields = ['dia_semana', 'hora_desde', 'hora_hasta']
    
    def validate(self, data):
        if data.get('hora_desde') and data.get('hora_hasta'):
            if data['hora_desde'] >= data['hora_hasta']:
                raise serializers.ValidationError({
                    'hora_hasta': 'La hora de fin debe ser posterior a la hora de inicio.'
                })
        return data


# ========== User Serializers ==========

class UserSerializer(serializers.ModelSerializer):
    """Serializer para el modelo CustomUser (lectura y para admin)."""
    
    full_name = serializers.ReadOnlyField()
    lista_precio_nombre = serializers.CharField(source='lista_precio.nombre', read_only=True, allow_null=True)
    zona_nombre = serializers.CharField(source='zona.nombre', read_only=True, allow_null=True)
    horarios = HorarioClienteSerializer(many=True, read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'nombre', 'apellido', 'full_name',
            'rol', 'telefono', 'direccion', 'cuit_dni',
            # Campos específicos de cliente
            'zona', 'zona_nombre', 'calle', 'entre_calles', 'numero', 'descripcion_ubicacion',
            'horarios',
            # Lista de precios
            'lista_precio', 'lista_precio_nombre',
            'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def update(self, instance, validated_data):
        """
        Actualiza el usuario. Si se está reactivando (is_active=True y estaba eliminado),
        usa el método restore() para limpiar fecha_eliminacion.
        """
        # Detectar si se está reactivando un usuario eliminado
        is_activating = validated_data.get('is_active', None) is True
        was_deleted = instance.is_deleted if hasattr(instance, 'is_deleted') else False
        
        # Si se está reactivando un usuario que estaba eliminado, usar restore()
        if is_activating and was_deleted:
            instance.restore()
            # Actualizar otros campos si existen
            for attr, value in validated_data.items():
                if attr != 'is_active':  # is_active ya se maneja en restore()
                    setattr(instance, attr, value)
            instance.save()
            return instance
        
        # Comportamiento normal de actualización
        return super().update(instance, validated_data)


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios (solo admin, permite cualquier rol)."""
    
    password = serializers.CharField(write_only=True, min_length=6)
    horarios = HorarioClienteCreateSerializer(many=True, required=False)
    
    class Meta:
        model = CustomUser
        fields = [
            'email', 'password', 'nombre', 'apellido',
            'rol', 'telefono', 'direccion', 'cuit_dni',
            # Campos específicos de cliente
            'zona', 'calle', 'entre_calles', 'numero', 'descripcion_ubicacion',
            'horarios',
            'is_active'
        ]
    
    def validate(self, data):
        """Valida campos obligatorios según el rol."""
        rol = data.get('rol', 'cliente')
        
        # Validaciones para CLIENTE
        if rol == 'cliente':
            required_cliente = ['zona', 'calle', 'numero', 'telefono', 'cuit_dni']
            missing = [f for f in required_cliente if not data.get(f)]
            if missing:
                raise serializers.ValidationError({
                    f: 'Este campo es obligatorio para clientes.'
                    for f in missing
                })
        
        # Validaciones para VENDEDOR
        if rol == 'vendedor':
            required_vendedor = ['telefono', 'cuit_dni']
            missing = [f for f in required_vendedor if not data.get(f)]
            if missing:
                raise serializers.ValidationError({
                    f: 'Este campo es obligatorio para vendedores.'
                    for f in missing
                })
        
        return data
    
    def create(self, validated_data):
        """Crea un nuevo usuario con la contraseña hasheada y horarios."""
        horarios_data = validated_data.pop('horarios', [])
        password = validated_data.pop('password')
        
        user = CustomUser(**validated_data)
        user.password = make_password(password)
        user.save()
        
        # Crear horarios si es cliente
        if validated_data.get('rol') == 'cliente' and horarios_data:
            for horario_data in horarios_data:
                HorarioCliente.objects.create(cliente=user, **horario_data)
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar usuarios (admin)."""
    
    horarios = HorarioClienteCreateSerializer(many=True, required=False)
    
    class Meta:
        model = CustomUser
        fields = [
            'nombre', 'apellido', 'rol', 'telefono', 'direccion', 'cuit_dni',
            # Campos específicos de cliente
            'zona', 'calle', 'entre_calles', 'numero', 'descripcion_ubicacion',
            'horarios',
            'lista_precio', 'is_active'
        ]
    
    def validate(self, data):
        """Valida campos obligatorios según el rol."""
        instance = self.instance
        rol = data.get('rol', instance.rol if instance else 'cliente')
        
        # Merge con datos existentes para validación parcial
        def get_value(field):
            if field in data:
                return data.get(field)
            return getattr(instance, field, None) if instance else None
        
        # Validaciones para CLIENTE
        if rol == 'cliente':
            required_cliente = ['zona', 'calle', 'numero', 'telefono', 'cuit_dni']
            missing = [f for f in required_cliente if not get_value(f)]
            if missing:
                raise serializers.ValidationError({
                    f: 'Este campo es obligatorio para clientes.'
                    for f in missing
                })
        
        # Validaciones para VENDEDOR
        if rol == 'vendedor':
            required_vendedor = ['telefono', 'cuit_dni']
            missing = [f for f in required_vendedor if not get_value(f)]
            if missing:
                raise serializers.ValidationError({
                    f: 'Este campo es obligatorio para vendedores.'
                    for f in missing
                })
        
        return data
    
    def update(self, instance, validated_data):
        """Actualiza usuario y sus horarios."""
        horarios_data = validated_data.pop('horarios', None)
        
        # Detectar si se está reactivando un usuario eliminado
        is_activating = validated_data.get('is_active', None) is True
        was_deleted = instance.is_deleted if hasattr(instance, 'is_deleted') else False
        
        if is_activating and was_deleted:
            instance.restore()
            for attr, value in validated_data.items():
                if attr != 'is_active':
                    setattr(instance, attr, value)
            instance.save()
        else:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
        
        # Actualizar horarios si se proporcionaron
        if horarios_data is not None and instance.rol == 'cliente':
            # Eliminar horarios existentes y crear nuevos
            instance.horarios.all().delete()
            for horario_data in horarios_data:
                HorarioCliente.objects.create(cliente=instance, **horario_data)
        
        return instance


class UserLoginSerializer(serializers.Serializer):
    """Serializer para login de usuarios."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña."""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    new_password_confirm = serializers.CharField(write_only=True, min_length=6)
    
    def validate(self, data):
        """Valida que las nuevas contraseñas coincidan."""
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password': 'Las contraseñas no coinciden.'
            })
        return data
