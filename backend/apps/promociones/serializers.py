from rest_framework import serializers
from .models import Promocion


class PromocionSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Promocion."""
    
    productos_nombres = serializers.SerializerMethodField()
    es_vigente = serializers.ReadOnlyField()
    
    class Meta:
        model = Promocion
        fields = [
            'id', 'nombre', 'descripcion', 'tipo',
            'productos', 'productos_nombres',
            'cantidad_minima', 'cantidad_exacta',
            'descuento_porcentaje', 'descuento_fijo',
            'fecha_inicio', 'fecha_fin',
            'activo', 'es_vigente', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']
    
    def get_productos_nombres(self, obj):
        """Obtiene nombres de los productos aplicables."""
        return [p.nombre for p in obj.productos.all()]
