from rest_framework import serializers
from .models import Categoria, Subcategoria, Producto, ListaPrecio, Marca, Promocion, PromocionItem


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
        fields = ['id', 'nombre', 'descripcion', 'url_imagen', 'activo', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


class SubcategoriaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Subcategoria."""
    
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    
    class Meta:
        model = Subcategoria
        fields = [
            'id', 'categoria', 'categoria_nombre', 'nombre',
            'descripcion', 'url_imagen', 'activo', 'fecha_creacion'
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


# ========== Promociones ==========

class PromocionItemSerializer(serializers.ModelSerializer):
    """Serializer para items de promoción (lectura)."""
    
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_imagen = serializers.URLField(source='producto.url_imagen', read_only=True)
    producto_precio = serializers.DecimalField(
        source='producto.precio_base', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    subtotal = serializers.SerializerMethodField()
    
    class Meta:
        model = PromocionItem
        fields = [
            'id', 'producto', 'producto_nombre', 'producto_imagen',
            'producto_precio', 'cantidad', 'subtotal'
        ]
        read_only_fields = ['id']
    
    def get_subtotal(self, obj):
        """Calcula el subtotal del item (precio * cantidad)."""
        if obj.producto:
            return str(obj.producto.precio_base * obj.cantidad)
        return '0'


class PromocionItemWriteSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar items de promoción."""
    
    class Meta:
        model = PromocionItem
        fields = ['producto', 'cantidad']
    
    def validate_cantidad(self, value):
        """Valida que la cantidad sea positiva."""
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0.")
        return value
    
    def validate_producto(self, value):
        """Valida que el producto esté activo."""
        if not value.activo:
            raise serializers.ValidationError("El producto no está activo.")
        return value


class PromocionListSerializer(serializers.ModelSerializer):
    """Serializer para listado de promociones (versión ligera)."""
    
    items_count = serializers.SerializerMethodField()
    precio_original = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    ahorro = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    porcentaje_descuento = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Promocion
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'url_imagen',
            'activo', 'fecha_inicio', 'fecha_fin', 'esta_vigente',
            'items_count', 'precio_original', 'ahorro', 'porcentaje_descuento',
            'fecha_creacion'
        ]
    
    def get_items_count(self, obj):
        """Cuenta total de productos en la promoción."""
        return sum(item.cantidad for item in obj.items.all())


class PromocionDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalle de promoción (versión completa)."""
    
    items = PromocionItemSerializer(many=True, read_only=True)
    precio_original = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    ahorro = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    porcentaje_descuento = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)
    esta_vigente = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Promocion
        fields = [
            'id', 'nombre', 'descripcion', 'precio', 'url_imagen',
            'activo', 'fecha_inicio', 'fecha_fin', 'esta_vigente',
            'items', 'precio_original', 'ahorro', 'porcentaje_descuento',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class PromocionCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar promociones."""
    
    items = PromocionItemWriteSerializer(many=True)
    
    class Meta:
        model = Promocion
        fields = [
            'nombre', 'descripcion', 'precio', 'url_imagen',
            'activo', 'fecha_inicio', 'fecha_fin', 'items'
        ]
    
    def validate_precio(self, value):
        """Valida que el precio sea positivo."""
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a 0.")
        return value
    
    def validate_items(self, value):
        """Valida que haya al menos un item."""
        if not value or len(value) == 0:
            raise serializers.ValidationError("La promoción debe tener al menos un producto.")
        return value
    
    def validate(self, data):
        """Valida fechas de vigencia."""
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')
        
        if fecha_inicio and fecha_fin:
            if fecha_fin <= fecha_inicio:
                raise serializers.ValidationError({
                    'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio.'
                })
        
        return data
    
    def create(self, validated_data):
        """Crea promoción con sus items."""
        items_data = validated_data.pop('items')
        promocion = Promocion.objects.create(**validated_data)
        
        for item_data in items_data:
            PromocionItem.objects.create(promocion=promocion, **item_data)
        
        return promocion
    
    def update(self, instance, validated_data):
        """Actualiza promoción y sus items."""
        items_data = validated_data.pop('items', None)
        
        # Actualizar campos de la promoción
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Si se proporcionaron items, reemplazarlos
        if items_data is not None:
            # Eliminar items anteriores
            instance.items.all().delete()
            
            # Crear nuevos items
            for item_data in items_data:
                PromocionItem.objects.create(promocion=instance, **item_data)
        
        return instance
