from rest_framework import serializers
import logging

from apps.productos.serializers import ProductoListSerializer
from apps.productos.models import Producto
from .models import Pedido, PedidoItem

logger = logging.getLogger('eltetu')


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
        return obj.producto_codigo_snapshot or (obj.producto.codigo_barra if obj.producto else None)


class PedidoItemCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear items de pedido."""
    
    class Meta:
        model = PedidoItem
        fields = ['producto', 'cantidad']
    
    def validate_cantidad(self, value):
        """Valida que la cantidad sea positiva y tenga un mínimo."""
        if value < 1:
            raise serializers.ValidationError('La cantidad mínima es 1.')
        return value
    
    def validate(self, data):
        """Valida stock disponible y disponibilidad del producto."""
        producto_value = data.get('producto')
        cantidad = data.get('cantidad')
        
        if not producto_value:
            raise serializers.ValidationError({
                'producto': 'Debe especificar un producto válido.'
            })
        
        # Extraer ID si es un objeto Producto, o usar directamente si es un ID
        if isinstance(producto_value, Producto):
            producto_id = producto_value.id
            producto = producto_value
        else:
            producto_id = producto_value
            # Obtener el objeto Producto desde la base de datos
            try:
                producto = Producto.objects.get(pk=producto_id)
            except Producto.DoesNotExist:
                raise serializers.ValidationError({
                    'producto': 'El producto especificado no existe.'
                })
        
        # Actualizar data con el ID para asegurar que se guarde correctamente
        data['producto'] = producto_id
        
        # Verificar si el producto está activo
        if not producto.activo:
            logger.warning(
                f'Intento de agregar producto inactivo al pedido: {producto.nombre} (ID: {producto.id})'
            )
            raise serializers.ValidationError({
                'producto': f'El producto "{producto.nombre}" no está disponible actualmente.'
            })
        
        # Verificar si el producto fue eliminado (soft delete)
        if hasattr(producto, 'is_deleted') and producto.is_deleted:
            logger.warning(
                f'Intento de agregar producto eliminado al pedido: {producto.nombre} (ID: {producto.id})'
            )
            raise serializers.ValidationError({
                'producto': f'El producto "{producto.nombre}" ya no está disponible.'
            })
        
        # Validar que el producto tenga stock disponible
        if not producto.tiene_stock:
            logger.warning(
                f'Producto sin stock: {producto.nombre} (ID: {producto.id})'
            )
            raise serializers.ValidationError({
                'producto': f'El producto "{producto.nombre}" no tiene stock disponible.'
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
        """Crea pedido con items, validando stock antes de crear."""
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
        
        # Validar stock de todos los items ANTES de crear el pedido (evita race conditions)
        for item_data in items_data:
            producto_value = item_data.get('producto')
            cantidad = item_data.get('cantidad')
            
            if not producto_value:
                raise serializers.ValidationError({
                    'items': 'Todos los items deben tener un producto válido.'
                })
            
            # Obtener objeto Producto si es ID, o usar directamente si es objeto
            if isinstance(producto_value, Producto):
                producto = producto_value
            else:
                try:
                    producto = Producto.objects.get(pk=producto_value)
                except Producto.DoesNotExist:
                    raise serializers.ValidationError({
                        'items': f'El producto con ID {producto_value} no existe.'
                    })
            
            # Verificar disponibilidad del producto
            if not producto.activo:
                raise serializers.ValidationError({
                    'items': f'El producto "{producto.nombre}" no está disponible.'
                })
            
            # Verificar que el producto tenga stock disponible
            if not producto.tiene_stock:
                logger.error(
                    f'Error al crear pedido: Producto sin stock - {producto.nombre}'
                )
                raise serializers.ValidationError({
                    'items': f'El producto "{producto.nombre}" no tiene stock disponible.'
                })
            
            # Asegurar que item_data tenga el objeto Producto para uso posterior
            item_data['producto'] = producto
        
        # Crear pedido
        pedido = Pedido.objects.create(**validated_data)
        logger.info(
            f'Pedido #{pedido.id} creado por cliente {cliente.email} '
            f'con {len(items_data)} items'
        )
        
        # Crear items con snapshots
        for item_data in items_data:
            # producto ya es un objeto Producto (asegurado en la validación anterior)
            producto = item_data.get('producto')
            cantidad = item_data.get('cantidad')
            
            # Asegurar que producto es un objeto Producto
            if not isinstance(producto, Producto):
                # Si por alguna razón no es un objeto, obtenerlo
                try:
                    producto = Producto.objects.get(pk=producto)
                except Producto.DoesNotExist:
                    logger.error(f'Producto con ID {producto} no existe al crear item')
                    continue
            
            # Calcular precio según la lista del pedido
            precio_unitario = producto.get_precio_lista(pedido.lista_precio)
            
            # Crear item con snapshots
            PedidoItem.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
                producto_nombre_snapshot=producto.nombre,
                producto_codigo_snapshot=producto.codigo_barra
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
