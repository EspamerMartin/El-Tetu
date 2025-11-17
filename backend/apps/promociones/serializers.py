from rest_framework import serializers
from .models import Promocion, PromocionItem
from apps.productos.models import Producto
from apps.productos.serializers import ProductoListSerializer


class PromocionItemSerializer(serializers.ModelSerializer):
    """Serializer para items de promoción."""
    
    producto = ProductoListSerializer(read_only=True)
    producto_id = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all(),
        source='producto',
        write_only=True
    )
    
    class Meta:
        model = PromocionItem
        fields = ['id', 'producto', 'producto_id', 'cantidad']
        read_only_fields = ['id']


class PromocionSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Promocion."""
    
    items = PromocionItemSerializer(many=True, read_only=True)
    items_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text='Lista de productos con cantidades: [{"producto_id": 1, "cantidad": 2}]'
    )
    
    # Campos calculados
    precio_base = serializers.SerializerMethodField()
    precio_final = serializers.SerializerMethodField()
    tiene_stock = serializers.ReadOnlyField()
    stock_bajo = serializers.ReadOnlyField()
    
    # Información de productos incluidos
    productos_nombres = serializers.SerializerMethodField()
    total_productos = serializers.SerializerMethodField()
    
    class Meta:
        model = Promocion
        fields = [
            'id', 'codigo', 'nombre', 'descripcion',
            'imagen', 'stock', 'stock_minimo', 'tipo_control_stock',
            'descuento_porcentaje', 'descuento_fijo',
            'fecha_inicio', 'fecha_fin',
            'activo', 'fecha_creacion', 'fecha_actualizacion',
            'items', 'items_data',
            'precio_base', 'precio_final',
            'tiene_stock', 'stock_bajo',
            'productos_nombres', 'total_productos'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']
    
    def get_precio_base(self, obj):
        """Calcula el precio base según la lista del usuario."""
        request = self.context.get('request')
        lista_precio = None
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            lista_precio = getattr(request.user, 'lista_precio', None)
        return str(obj.calcular_precio_base(lista_precio))
    
    def get_precio_final(self, obj):
        """Calcula el precio final con descuento según la lista del usuario."""
        request = self.context.get('request')
        lista_precio = None
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            lista_precio = getattr(request.user, 'lista_precio', None)
        return str(obj.calcular_precio_final(lista_precio))
    
    def get_productos_nombres(self, obj):
        """Obtiene nombres de los productos incluidos."""
        return [f"{item.producto.nombre} x{item.cantidad}" for item in obj.items.all()]
    
    def get_total_productos(self, obj):
        """Obtiene el total de productos incluidos."""
        return sum(item.cantidad for item in obj.items.all())
    
    def create(self, validated_data):
        """Crea la promoción con sus items."""
        items_data = validated_data.pop('items_data', [])
        promocion = Promocion.objects.create(**validated_data)
        
        # Crear items
        for item_data in items_data:
            PromocionItem.objects.create(
                promocion=promocion,
                producto_id=item_data['producto_id'],
                cantidad=item_data.get('cantidad', 1)
            )
        
        return promocion
    
    def update(self, instance, validated_data):
        """Actualiza la promoción y sus items."""
        items_data = validated_data.pop('items_data', None)
        
        # Actualizar campos básicos
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar items si se proporcionan
        if items_data is not None:
            # Eliminar items existentes
            instance.items.all().delete()
            
            # Crear nuevos items
            for item_data in items_data:
                PromocionItem.objects.create(
                    promocion=instance,
                    producto_id=item_data['producto_id'],
                    cantidad=item_data.get('cantidad', 1)
                )
        
        return instance
