from rest_framework import serializers
import logging

from apps.productos.serializers import ProductoListSerializer
from apps.productos.models import Producto, Promocion
from apps.users.serializers import HorarioClienteSerializer
from .models import Pedido, PedidoItem

logger = logging.getLogger('eltetu')


class PedidoItemSerializer(serializers.ModelSerializer):
    """Serializer para items de pedido (lectura)."""
    
    producto_detalle = ProductoListSerializer(source='producto', read_only=True, allow_null=True)
    producto_nombre = serializers.SerializerMethodField()
    producto_codigo = serializers.SerializerMethodField()
    es_promocion = serializers.SerializerMethodField()
    
    class Meta:
        model = PedidoItem
        fields = [
            'id', 'producto', 'promocion', 'producto_detalle', 
            'producto_nombre', 'producto_codigo', 'es_promocion',
            'cantidad', 'precio_unitario', 'subtotal', 
            'descuento', 'fecha_creacion'
        ]
        read_only_fields = ['id', 'subtotal', 'descuento', 'fecha_creacion']
    
    def get_producto_nombre(self, obj):
        """Retorna el nombre del producto/promoción desde snapshot o del objeto."""
        if obj.producto_nombre_snapshot:
            return obj.producto_nombre_snapshot
        if obj.promocion:
            return f"[PROMO] {obj.promocion.nombre}"
        if obj.producto:
            return obj.producto.nombre
        return "Item eliminado"
    
    def get_producto_codigo(self, obj):
        """Retorna el código del producto desde snapshot o del objeto."""
        return obj.producto_codigo_snapshot or (obj.producto.codigo_barra if obj.producto else None)
    
    def get_es_promocion(self, obj):
        """Indica si el item es una promoción."""
        return obj.promocion is not None


class PedidoItemCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear items de pedido (producto o promoción)."""
    
    # Ambos opcionales, pero uno debe estar presente
    producto = serializers.IntegerField(required=False, allow_null=True)
    promocion = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = PedidoItem
        fields = ['producto', 'promocion', 'cantidad']
    
    def validate_cantidad(self, value):
        """Valida que la cantidad sea positiva y tenga un mínimo."""
        if value < 1:
            raise serializers.ValidationError('La cantidad mínima es 1.')
        return value
    
    def validate(self, data):
        """Valida stock/disponibilidad del producto o promoción."""
        producto_value = data.get('producto')
        promocion_value = data.get('promocion')
        # cantidad se valida en validate_cantidad, aquí no se necesita
        
        # Debe haber exactamente uno de los dos
        if not producto_value and not promocion_value:
            raise serializers.ValidationError({
                'non_field_errors': 'Debe especificar un producto o una promoción.'
            })
        
        if producto_value and promocion_value:
            raise serializers.ValidationError({
                'non_field_errors': 'No puede especificar producto y promoción a la vez.'
            })
        
        # Validar PRODUCTO
        if producto_value:
            if isinstance(producto_value, Producto):
                producto = producto_value
            else:
                try:
                    producto = Producto.objects.get(pk=producto_value)
                except Producto.DoesNotExist:
                    raise serializers.ValidationError({
                        'producto': 'El producto especificado no existe.'
                    })
            
            data['producto'] = producto.id
            data['_producto_obj'] = producto  # Para uso interno
            
            if not producto.activo:
                logger.warning(
                    f'Intento de agregar producto inactivo al pedido: {producto.nombre} (ID: {producto.id})'
                )
                raise serializers.ValidationError({
                    'producto': f'El producto "{producto.nombre}" no está disponible actualmente.'
                })
            
            if hasattr(producto, 'is_deleted') and producto.is_deleted:
                raise serializers.ValidationError({
                    'producto': f'El producto "{producto.nombre}" ya no está disponible.'
                })
            
            if not producto.tiene_stock:
                logger.warning(f'Producto sin stock: {producto.nombre} (ID: {producto.id})')
                raise serializers.ValidationError({
                    'producto': f'El producto "{producto.nombre}" no tiene stock disponible.'
                })
        
        # Validar PROMOCIÓN
        if promocion_value:
            if isinstance(promocion_value, Promocion):
                promocion = promocion_value
            else:
                try:
                    promocion = Promocion.objects.get(pk=promocion_value)
                except Promocion.DoesNotExist:
                    raise serializers.ValidationError({
                        'promocion': 'La promoción especificada no existe.'
                    })
            
            data['promocion'] = promocion.id
            data['_promocion_obj'] = promocion  # Para uso interno
            
            if not promocion.activo:
                logger.warning(
                    f'Intento de agregar promoción inactiva al pedido: {promocion.nombre} (ID: {promocion.id})'
                )
                raise serializers.ValidationError({
                    'promocion': f'La promoción "{promocion.nombre}" no está disponible actualmente.'
                })
            
            if not promocion.esta_vigente:
                raise serializers.ValidationError({
                    'promocion': f'La promoción "{promocion.nombre}" no está vigente.'
                })
            
            # Verificar que los productos de la promoción estén disponibles
            for item in promocion.items.all():
                if not item.producto.activo or not item.producto.tiene_stock:
                    raise serializers.ValidationError({
                        'promocion': f'El producto "{item.producto.nombre}" de la promoción no está disponible.'
                    })
        
        return data


class PedidoSerializer(serializers.ModelSerializer):
    """Serializer para pedido (lectura)."""
    
    items = PedidoItemSerializer(many=True, read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.full_name', read_only=True)
    transportador_nombre = serializers.CharField(source='transportador.full_name', read_only=True, allow_null=True)
    lista_precio_nombre = serializers.SerializerMethodField()
    lista_precio_descuento = serializers.SerializerMethodField()
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'cliente_nombre', 'estado',
            'transportador', 'transportador_nombre',
            'lista_precio', 'lista_precio_nombre', 'lista_precio_descuento',
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
        """Crea pedido con items (productos o promociones), validando stock antes de crear."""
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
        
        # Validar y preparar items ANTES de crear el pedido
        items_preparados = []
        for item_data in items_data:
            producto_value = item_data.get('producto')
            promocion_value = item_data.get('promocion')
            cantidad = item_data.get('cantidad')
            
            # Usar objetos cacheados del serializer si existen
            producto_obj = item_data.get('_producto_obj')
            promocion_obj = item_data.get('_promocion_obj')
            
            if producto_value and not producto_obj:
                # Es un item de producto
                if isinstance(producto_value, Producto):
                    producto_obj = producto_value
                else:
                    try:
                        producto_obj = Producto.objects.get(pk=producto_value)
                    except Producto.DoesNotExist:
                        raise serializers.ValidationError({
                            'items': f'El producto con ID {producto_value} no existe.'
                        })
                
                if not producto_obj.activo:
                    raise serializers.ValidationError({
                        'items': f'El producto "{producto_obj.nombre}" no está disponible.'
                    })
                
                if not producto_obj.tiene_stock:
                    raise serializers.ValidationError({
                        'items': f'El producto "{producto_obj.nombre}" no tiene stock disponible.'
                    })
                
                items_preparados.append({
                    'tipo': 'producto',
                    'objeto': producto_obj,
                    'cantidad': cantidad
                })
            
            elif promocion_value and not promocion_obj:
                # Es un item de promoción
                if isinstance(promocion_value, Promocion):
                    promocion_obj = promocion_value
                else:
                    try:
                        promocion_obj = Promocion.objects.get(pk=promocion_value)
                    except Promocion.DoesNotExist:
                        raise serializers.ValidationError({
                            'items': f'La promoción con ID {promocion_value} no existe.'
                        })
                
                if not promocion_obj.activo or not promocion_obj.esta_vigente:
                    raise serializers.ValidationError({
                        'items': f'La promoción "{promocion_obj.nombre}" no está disponible.'
                    })
                
                items_preparados.append({
                    'tipo': 'promocion',
                    'objeto': promocion_obj,
                    'cantidad': cantidad
                })
            
            elif producto_obj:
                items_preparados.append({
                    'tipo': 'producto',
                    'objeto': producto_obj,
                    'cantidad': cantidad
                })
            
            elif promocion_obj:
                items_preparados.append({
                    'tipo': 'promocion',
                    'objeto': promocion_obj,
                    'cantidad': cantidad
                })
            
            else:
                raise serializers.ValidationError({
                    'items': 'Cada item debe tener un producto o una promoción.'
                })
        
        # Crear pedido
        pedido = Pedido.objects.create(**validated_data)
        logger.info(
            f'Pedido #{pedido.id} creado por cliente {cliente.email} '
            f'con {len(items_preparados)} items'
        )
        
        # Crear items con snapshots
        for item_prep in items_preparados:
            tipo = item_prep['tipo']
            obj = item_prep['objeto']
            cantidad = item_prep['cantidad']
            
            if tipo == 'producto':
                # Item de producto individual
                precio_unitario = obj.get_precio_lista(pedido.lista_precio)
                PedidoItem.objects.create(
                    pedido=pedido,
                    producto=obj,
                    promocion=None,
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    producto_nombre_snapshot=obj.nombre,
                    producto_codigo_snapshot=obj.codigo_barra
                )
            else:
                # Item de promoción (precio fijo, sin descuento de lista)
                PedidoItem.objects.create(
                    pedido=pedido,
                    producto=None,
                    promocion=obj,
                    cantidad=cantidad,
                    precio_unitario=obj.precio,
                    producto_nombre_snapshot=f"[PROMO] {obj.nombre}",
                    producto_codigo_snapshot=None
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
        
        # Definir transiciones permitidas
        # PENDIENTE -> EN_PREPARACION (aprobar) o RECHAZADO
        # EN_PREPARACION -> FACTURADO o RECHAZADO
        # FACTURADO -> ENTREGADO o RECHAZADO
        # ENTREGADO -> (estado final)
        # RECHAZADO -> (estado final)
        transiciones_permitidas = {
            'PENDIENTE': ['EN_PREPARACION', 'RECHAZADO'],
            'EN_PREPARACION': ['FACTURADO', 'RECHAZADO'],
            'FACTURADO': ['ENTREGADO', 'RECHAZADO'],
            'ENTREGADO': [],
            'RECHAZADO': [],
        }
        
        if value not in transiciones_permitidas.get(instance.estado, []):
            raise serializers.ValidationError(
                f'No se puede cambiar de {instance.estado} a {value}.'
            )
        
        return value
    
    def update(self, instance, validated_data):
        """Actualiza estado y ejecuta lógica correspondiente."""
        nuevo_estado = validated_data.get('estado')
        
        if nuevo_estado == 'EN_PREPARACION':
            instance.aprobar()
        elif nuevo_estado == 'FACTURADO':
            instance.facturar()
        elif nuevo_estado == 'ENTREGADO':
            instance.entregar()
        elif nuevo_estado == 'RECHAZADO':
            instance.rechazar()
        else:
            instance.estado = nuevo_estado
            instance.save()
        
        return instance


# ========== Serializers para Transportador ==========

class ClienteInfoTransportadorSerializer(serializers.Serializer):
    """
    Serializer para información del cliente visible por el transportador.
    Incluye datos de contacto, dirección y horarios de entrega.
    """
    id = serializers.IntegerField(read_only=True)
    nombre = serializers.CharField(read_only=True)
    apellido = serializers.CharField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    telefono = serializers.CharField(read_only=True, allow_null=True)
    # Datos de dirección
    direccion = serializers.CharField(read_only=True, allow_null=True)
    zona_nombre = serializers.CharField(source='zona.nombre', read_only=True, allow_null=True)
    calle = serializers.CharField(read_only=True, allow_null=True)
    entre_calles = serializers.CharField(read_only=True, allow_null=True)
    numero = serializers.CharField(read_only=True, allow_null=True)
    descripcion_ubicacion = serializers.CharField(read_only=True, allow_null=True)
    # Horarios de atención
    horarios = HorarioClienteSerializer(many=True, read_only=True)


class PedidoTransportadorSerializer(serializers.ModelSerializer):
    """
    Serializer de pedido para el transportador.
    Incluye información detallada del cliente para facilitar la entrega.
    """
    
    items = PedidoItemSerializer(many=True, read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.full_name', read_only=True)
    cliente_info = ClienteInfoTransportadorSerializer(source='cliente', read_only=True)
    lista_precio_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Pedido
        fields = [
            'id', 'cliente', 'cliente_nombre', 'cliente_info',
            'estado', 'lista_precio', 'lista_precio_nombre',
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


class PedidoAsignarTransportadorSerializer(serializers.ModelSerializer):
    """Serializer para asignar un transportador a un pedido."""
    
    class Meta:
        model = Pedido
        fields = ['transportador']
    
    def validate_transportador(self, value):
        """Valida que el usuario sea transportador."""
        if value and value.rol != 'transportador':
            raise serializers.ValidationError(
                'El usuario asignado debe tener rol de transportador.'
            )
        return value
