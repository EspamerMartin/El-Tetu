from rest_framework import serializers
from .models import Categoria, Subcategoria, Producto, ListaPrecio


class ListaPrecioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo ListaPrecio."""
    
    class Meta:
        model = ListaPrecio
        fields = ['id', 'nombre', 'codigo', 'descuento_porcentaje', 'activo', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


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
    
    # Precio calculado según lista del usuario actual
    precio = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'codigo', 'nombre', 'categoria', 'categoria_nombre',
            'subcategoria', 'subcategoria_nombre', 'precio_base', 'precio',
            'stock', 'tiene_stock', 'stock_bajo',
            'activo', 'imagen'
        ]
    
    def get_precio(self, obj):
        """Calcula el precio según la lista del usuario."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            lista_precio = getattr(request.user, 'lista_precio', None)
            return str(obj.get_precio_lista(lista_precio))
        return str(obj.precio_base)


class ProductoDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de producto (versión completa)."""
    
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    subcategoria_nombre = serializers.CharField(source='subcategoria.nombre', read_only=True)
    tiene_stock = serializers.ReadOnlyField()
    stock_bajo = serializers.ReadOnlyField()
    
    # Precio calculado según lista del usuario actual
    precio = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'categoria', 'categoria_nombre',
            'subcategoria', 'subcategoria_nombre',
            'precio_base', 'precio',
            'stock', 'stock_minimo', 'tiene_stock', 'stock_bajo',
            'imagen', 'activo',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']
    
    def get_precio(self, obj):
        """Calcula el precio según la lista del usuario."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            lista_precio = getattr(request.user, 'lista_precio', None)
            return str(obj.get_precio_lista(lista_precio))
        return str(obj.precio_base)


class ProductoCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar productos."""
    
    class Meta:
        model = Producto
        fields = [
            'codigo', 'nombre', 'descripcion',
            'categoria', 'subcategoria',
            'precio_base',
            'stock', 'stock_minimo',
            'imagen', 'activo'
        ]
    
    def validate_codigo(self, value):
        """Valida que el código sea único (excepto para actualizaciones)."""
        if not value or not value.strip():
            raise serializers.ValidationError("El código es obligatorio.")
        instance = self.instance
        if Producto.objects.filter(codigo=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("Ya existe un producto con este código.")
        return value.strip()
    
    def validate_precio_base(self, value):
        """Valida que el precio base sea positivo."""
        if value < 0:
            raise serializers.ValidationError("El precio base no puede ser negativo.")
        return value
    
    def validate(self, data):
        """Valida que la subcategoría pertenezca a la categoría seleccionada."""
        # Obtener categoria de data o de la instancia (si es actualización)
        categoria = data.get('categoria', self.instance.categoria if self.instance else None)
        subcategoria = data.get('subcategoria', None)
        
        # Validar que haya categoría
        if not categoria:
            raise serializers.ValidationError({
                'categoria': 'La categoría es obligatoria.'
            })
        
        # Si se proporciona subcategoría, validar que pertenezca a la categoría
        if subcategoria:
            if subcategoria.categoria != categoria:
                raise serializers.ValidationError({
                    'subcategoria': 'La subcategoría debe pertenecer a la categoría seleccionada.'
                })
        
        return data
