from rest_framework import serializers
from .models import Categoria, Subcategoria, Producto, ListaPrecio, Marca


class MarcaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Marca."""
    
    class Meta:
        model = Marca
        fields = ['id', 'nombre', 'descripcion', 'activo', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


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
    
    marca_nombre = serializers.CharField(source='marca.nombre', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    subcategoria_nombre = serializers.CharField(source='subcategoria.nombre', read_only=True)
    unidad_tamaño_display = serializers.CharField(source='get_unidad_tamaño_display', read_only=True)
    
    # Precio calculado según lista del usuario actual
    precio = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'codigo_barra', 'nombre', 'marca', 'marca_nombre',
            'categoria', 'categoria_nombre', 'subcategoria', 'subcategoria_nombre',
            'tamaño', 'unidad_tamaño', 'unidad_tamaño_display', 'unidades_caja',
            'precio_base', 'precio', 'tiene_stock',
            'activo', 'url_imagen'
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
    
    marca_nombre = serializers.CharField(source='marca.nombre', read_only=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    subcategoria_nombre = serializers.CharField(source='subcategoria.nombre', read_only=True)
    unidad_tamaño_display = serializers.CharField(source='get_unidad_tamaño_display', read_only=True)
    
    # Precio calculado según lista del usuario actual
    precio = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'codigo_barra', 'nombre', 'descripcion',
            'marca', 'marca_nombre',
            'categoria', 'categoria_nombre',
            'subcategoria', 'subcategoria_nombre',
            'tamaño', 'unidad_tamaño', 'unidad_tamaño_display', 'unidades_caja',
            'precio_base', 'precio',
            'tiene_stock',
            'url_imagen', 'activo',
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
            'codigo_barra', 'nombre', 'descripcion',
            'marca', 'categoria', 'subcategoria',
            'tamaño', 'unidad_tamaño', 'unidades_caja',
            'precio_base',
            'tiene_stock',
            'url_imagen', 'activo'
        ]
    
    def validate_codigo_barra(self, value):
        """Valida que el código de barra sea único (excepto para actualizaciones)."""
        if not value or not value.strip():
            raise serializers.ValidationError("El código de barra es obligatorio.")
        instance = self.instance
        if Producto.objects.filter(codigo_barra=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("Ya existe un producto con este código de barra.")
        return value.strip()
    
    def validate_precio_base(self, value):
        """Valida que el precio base sea positivo."""
        if value < 0:
            raise serializers.ValidationError("El precio base no puede ser negativo.")
        return value
    
    def validate_tamaño(self, value):
        """Valida que el tamaño sea positivo."""
        if value <= 0:
            raise serializers.ValidationError("El tamaño debe ser mayor a 0.")
        return value
    
    def validate_unidades_caja(self, value):
        """Valida que las unidades por caja sean positivas."""
        if value <= 0:
            raise serializers.ValidationError("Las unidades por caja deben ser mayor a 0.")
        return value
    
    def validate(self, data):
        """Valida que la subcategoría pertenezca a la categoría seleccionada."""
        # Obtener categoria de data o de la instancia (si es actualización)
        categoria = data.get('categoria', self.instance.categoria if self.instance else None)
        subcategoria = data.get('subcategoria', None)
        marca = data.get('marca', self.instance.marca if self.instance else None)
        
        # Validar que haya marca
        if not marca:
            raise serializers.ValidationError({
                'marca': 'La marca es obligatoria.'
            })
        
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
