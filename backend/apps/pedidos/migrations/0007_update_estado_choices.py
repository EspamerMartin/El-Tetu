# Generated manually - Update estado choices

from django.db import migrations, models


def migrate_estados_forward(apps, schema_editor):
    """Migrar estados antiguos a nuevos."""
    Pedido = apps.get_model('pedidos', 'Pedido')
    
    # CONFIRMADO -> EN_PREPARACION
    Pedido.objects.filter(estado='CONFIRMADO').update(estado='EN_PREPARACION')
    
    # CANCELADO -> RECHAZADO
    Pedido.objects.filter(estado='CANCELADO').update(estado='RECHAZADO')


def migrate_estados_backward(apps, schema_editor):
    """Revertir estados (para rollback)."""
    Pedido = apps.get_model('pedidos', 'Pedido')
    
    # EN_PREPARACION -> CONFIRMADO
    Pedido.objects.filter(estado='EN_PREPARACION').update(estado='CONFIRMADO')
    
    # FACTURADO -> CONFIRMADO (no hay equivalente exacto)
    Pedido.objects.filter(estado='FACTURADO').update(estado='CONFIRMADO')
    
    # ENTREGADO -> CONFIRMADO (no hay equivalente exacto)
    Pedido.objects.filter(estado='ENTREGADO').update(estado='CONFIRMADO')
    
    # RECHAZADO -> CANCELADO
    Pedido.objects.filter(estado='RECHAZADO').update(estado='CANCELADO')


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0006_pedido_lista_precio_descuento_snapshot_and_more'),
    ]

    operations = [
        # Primero migrar los datos
        migrations.RunPython(migrate_estados_forward, migrate_estados_backward),
        
        # Luego cambiar el campo
        migrations.AlterField(
            model_name='pedido',
            name='estado',
            field=models.CharField(
                choices=[
                    ('PENDIENTE', 'Pendiente'),
                    ('EN_PREPARACION', 'En Preparación'),
                    ('FACTURADO', 'Facturado'),
                    ('ENTREGADO', 'Entregado'),
                    ('RECHAZADO', 'Rechazado'),
                ],
                default='PENDIENTE',
                max_length=15,
                verbose_name='Estado',
            ),
        ),
    ]

