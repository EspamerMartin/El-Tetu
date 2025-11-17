from rest_framework import serializers
from apps.productos.serializers import ProductoListSerializer
from apps.productos.models import ListaPrecio
from .models import Pedido, PedidoItem


class PedidoItemSerializer(serializers.ModelSerializer):
    """Serializer para items de pedido (lectura)."""
    
    producto_detalle = ProductoListSerializer(source='producto', read_only=True, allow_null=True)
    producto_nombre = serializers.SerializerMethodField()
    producto_codigo = serializers.SerializerMethodField()
    
    class Meta:
        model = PedidoItem
        fields = [
            'id', 'producto', 'producto_detalle', 
            'producto_nombre', 'producto_codigo',
            'cantidad', 'precio_unitario', 'subtotal', 
            'descuento', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'subtotal', 'descuento', 'fecha_creacion']
    
    def get_producto_nombre(self, obj):
        """Retorna el nombre del producto desde snapshot o del objeto."""
        return obj.producto_nombre_snapshot or (obj.producto.nombre if obj.producto else "Producto eliminado")
    
    def get_producto_codigo(self, obj):
        """Retorna el código del producto desde snapshot o del objeto."""
        return obj.producto_codigo_snapshot or (obj.producto.codigo if obj.producto else None)


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
        producto = data.get('producto')
        cantidad = data.get('cantidad')
        
        if not producto:
            raise serializers.ValidationError({
                'producto': 'Debe especificar un producto.'
            })
        
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
    cliente_nombre = serializers.CharField(source='cliente.full_name', read_only=True)
    lista_precio_nombre = serializers.SerializerMethodField()
    lista_precio_descuento = serializers.SerializerMethodField()
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'cliente_nombre', 'estado', 'lista_precio',
            'lista_precio_nombre', 'lista_precio_descuento',
            'subtotal', 'descuento_total', 'total',
            'items', 'notas',
            'fecha_creacion', 'fecha_actualizacion',
            'fecha_confirmacion', 'fecha_entrega'
        ]
        read_only_fields = [
            'id', 'subtotal', 'descuento_total', 'total',
            'fecha_creacion', 'fecha_actualizacion',
            'fecha_confirmacion', 'fecha_entrega'
        ]
    
    def get_lista_precio_nombre(self, obj):
        """Retorna el nombre de la lista desde snapshot o del objeto."""
        return obj.lista_precio_nombre_snapshot or (obj.lista_precio.nombre if obj.lista_precio else "Lista Base")
    
    def get_lista_precio_descuento(self, obj):
        """Retorna el descuento de la lista desde snapshot o del objeto."""
        if obj.lista_precio_descuento_snapshot is not None:
            return obj.lista_precio_descuento_snapshot
        return obj.lista_precio.descuento_porcentaje if obj.lista_precio else 0


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
        """Crea pedido con items."""
        items_data = validated_data.pop('items')
        cliente = validated_data.get('cliente')
        
        # Si no se especifica lista_precio, usar la del cliente (o None para lista base)
        if 'lista_precio' not in validated_data or validated_data['lista_precio'] is None:
            validated_data['lista_precio'] = getattr(cliente, 'lista_precio', None)
        
        # Guardar snapshots de lista de precios antes de crear el pedido
        lista_precio = validated_data.get('lista_precio')
        if lista_precio:
            validated_data['lista_precio_nombre_snapshot'] = lista_precio.nombre
            validated_data['lista_precio_descuento_snapshot'] = lista_precio.descuento_porcentaje
        
        # Crear pedido
        pedido = Pedido.objects.create(**validated_data)
        
        # Crear items con snapshots
        for item_data in items_data:
            producto = item_data.get('producto')
            cantidad = item_data.get('cantidad')
            
            if not producto:
                raise serializers.ValidationError({
                    'items': 'Todos los items deben tener un producto válido.'
                })
            
            # Calcular precio según la lista del pedido
            precio_unitario = producto.get_precio_lista(pedido.lista_precio)
            
            # Crear item con snapshots
            PedidoItem.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
                producto_nombre_snapshot=producto.nombre,
                producto_codigo_snapshot=producto.codigo
            )
        
        # Calcular totales
        pedido.calcular_totales()
        
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
