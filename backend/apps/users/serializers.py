from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    """Serializer para el modelo CustomUser."""
    
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'nombre', 'apellido', 'full_name',
            'rol', 'telefono', 'direccion', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para registro de nuevos usuarios."""
    
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = CustomUser
        fields = [
            'email', 'password', 'password_confirm',
            'nombre', 'apellido', 'rol', 'telefono', 'direccion'
        ]
    
    def validate(self, data):
        """Valida que las contraseñas coincidan."""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password': 'Las contraseñas no coinciden.'
            })
        return data
    
    def create(self, validated_data):
        """Crea un nuevo usuario con la contraseña hasheada."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = CustomUser(**validated_data)
        user.password = make_password(password)
        user.save()
        
        return user


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
