from rest_framework import serializers
from .models import Categoria, Subcategoria, Producto


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Categoria."""
    
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'activo', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


class SubcategoriaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Subcategoria."""
    
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    
    class Meta:
        model = Subcategoria
        fields = [
            'id', 'categoria', 'categoria_nombre', 'nombre',
            'descripcion', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion']


class ProductoListSerializer(serializers.ModelSerializer):
    """Serializer para listado de productos (versión ligera)."""
    
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    subcategoria_nombre = serializers.CharField(source='subcategoria.nombre', read_only=True)
    tiene_stock = serializers.ReadOnlyField()
    stock_bajo = serializers.ReadOnlyField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'codigo', 'nombre', 'categoria', 'categoria_nombre',
            'subcategoria', 'subcategoria_nombre', 'precio_lista_3',
            'precio_lista_4', 'stock', 'tiene_stock', 'stock_bajo',
            'activo', 'imagen'
        ]


class ProductoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de producto (versión completa)."""
    
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    subcategoria_nombre = serializers.CharField(source='subcategoria.nombre', read_only=True)
    tiene_stock = serializers.ReadOnlyField()
    stock_bajo = serializers.ReadOnlyField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'categoria', 'categoria_nombre',
            'subcategoria', 'subcategoria_nombre',
            'precio_lista_3', 'precio_lista_4',
            'stock', 'stock_minimo', 'tiene_stock', 'stock_bajo',
            'imagen', 'activo',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class ProductoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar productos."""
    
    class Meta:
        model = Producto
        fields = [
            'codigo', 'nombre', 'descripcion',
            'categoria', 'subcategoria',
            'precio_lista_3', 'precio_lista_4',
            'stock', 'stock_minimo',
            'imagen', 'activo'
        ]
    
    def validate_codigo(self, value):
        """Valida que el código sea único (excepto para actualizaciones)."""
        instance = self.instance
        if Producto.objects.filter(codigo=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("Ya existe un producto con este código.")
        return value
    
    def validate(self, data):
        """Valida que la subcategoría pertenezca a la categoría seleccionada."""
        if 'subcategoria' in data and 'categoria' in data:
            if data['subcategoria'] and data['subcategoria'].categoria != data['categoria']:
                raise serializers.ValidationError({
                    'subcategoria': 'La subcategoría debe pertenecer a la categoría seleccionada.'
                })
        return data
