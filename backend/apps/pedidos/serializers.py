from rest_framework import serializers
from apps.productos.serializers import ProductoListSerializer
from apps.promociones.serializers import PromocionSerializer
from .models import Pedido, PedidoItem


class PedidoItemSerializer(serializers.ModelSerializer):
    """Serializer para items de pedido (lectura)."""
    
    producto_detalle = ProductoListSerializer(source='producto', read_only=True)
    
    class Meta:
        model = PedidoItem
        fields = [
            'id', 'producto', 'producto_detalle', 'cantidad',
            'precio_unitario', 'subtotal', 'descuento', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'subtotal', 'descuento', 'fecha_creacion']


class PedidoItemCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear items de pedido."""
    
    class Meta:
        model = PedidoItem
        fields = ['producto', 'cantidad']
    
    def validate_cantidad(self, value):
        """Valida que la cantidad sea positiva."""
        if value <= 0:
            raise serializers.ValidationError('La cantidad debe ser mayor a 0.')
        return value
    
    def validate(self, data):
        """Valida stock disponible."""
        producto = data['producto']
        cantidad = data['cantidad']
        
        if not producto.activo:
            raise serializers.ValidationError({
                'producto': 'El producto no está disponible.'
            })
        
        if producto.stock < cantidad:
            raise serializers.ValidationError({
                'cantidad': f'Stock insuficiente. Disponible: {producto.stock}'
            })
        
        return data


class PedidoSerializer(serializers.ModelSerializer):
    """Serializer para pedido (lectura)."""
    
    items = PedidoItemSerializer(many=True, read_only=True)
    promociones_aplicadas_detalle = PromocionSerializer(
        source='promociones_aplicadas',
        many=True,
        read_only=True
    )
    cliente_nombre = serializers.CharField(source='cliente.full_name', read_only=True)
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'cliente_nombre', 'estado', 'lista_precio',
            'subtotal', 'descuento_total', 'total',
            'items', 'promociones_aplicadas_detalle', 'notas',
            'fecha_creacion', 'fecha_actualizacion',
            'fecha_confirmacion', 'fecha_entrega'
        ]
        read_only_fields = [
            'id', 'subtotal', 'descuento_total', 'total',
            'fecha_creacion', 'fecha_actualizacion',
            'fecha_confirmacion', 'fecha_entrega'
        ]


class PedidoCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear pedido."""
    
    items = PedidoItemCreateSerializer(many=True)
    
    class Meta:
        model = Pedido
        fields = ['cliente', 'lista_precio', 'items', 'notas']
    
    def validate_items(self, value):
        """Valida que haya al menos un item."""
        if not value:
            raise serializers.ValidationError('El pedido debe tener al menos un item.')
        return value
    
    def create(self, validated_data):
        """Crea pedido con items y aplica promociones."""
        items_data = validated_data.pop('items')
        
        # Crear pedido
        pedido = Pedido.objects.create(**validated_data)
        
        # Crear items
        for item_data in items_data:
            producto = item_data['producto']
            cantidad = item_data['cantidad']
            
            # Determinar precio según lista
            if pedido.lista_precio == 'lista_3':
                precio_unitario = producto.precio_lista_3
            else:
                precio_unitario = producto.precio_lista_4
            
            PedidoItem.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad,
                precio_unitario=precio_unitario
            )
        
        # Aplicar promociones y calcular totales
        pedido.aplicar_promociones()
        
        return pedido


class PedidoUpdateEstadoSerializer(serializers.ModelSerializer):
    """Serializer para actualizar estado del pedido."""
    
    class Meta:
        model = Pedido
        fields = ['estado']
    
    def validate_estado(self, value):
        """Valida transiciones de estado permitidas."""
        instance = self.instance
        
        if not instance:
            return value
        
        # Definir transiciones permitidas (solo PENDIENTE, CONFIRMADO, CANCELADO)
        transiciones_permitidas = {
            'PENDIENTE': ['CONFIRMADO', 'CANCELADO'],
            'CONFIRMADO': ['CANCELADO'],
            'CANCELADO': [],
        }
        
        if value not in transiciones_permitidas.get(instance.estado, []):
            raise serializers.ValidationError(
                f'No se puede cambiar de {instance.estado} a {value}.'
            )
        
        return value
    
    def update(self, instance, validated_data):
        """Actualiza estado y ejecuta lógica correspondiente."""
        nuevo_estado = validated_data.get('estado')
        
        if nuevo_estado == 'CONFIRMADO':
            instance.confirmar()
        elif nuevo_estado == 'CANCELADO':
            instance.cancelar()
        else:
            instance.estado = nuevo_estado
            instance.save()
        
        return instance
