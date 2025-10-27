from rest_framework import serializers
from .models import InformacionGeneral


class InformacionGeneralSerializer(serializers.ModelSerializer):
    """Serializer para el modelo InformacionGeneral."""
    
    class Meta:
        model = InformacionGeneral
        fields = [
            'id', 'tipo', 'titulo', 'contenido',
            'activo', 'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']
