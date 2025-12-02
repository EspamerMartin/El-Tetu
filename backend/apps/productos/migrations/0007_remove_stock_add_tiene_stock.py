# Generated migration for converting stock (integer) to tiene_stock (boolean)

from django.db import migrations, models


def convert_stock_to_boolean(apps, schema_editor):
    """
    Convierte el campo stock numérico a tiene_stock booleano.
    - stock > 0 → tiene_stock = True
    - stock = 0 → tiene_stock = False
    """
    Producto = apps.get_model('productos', 'Producto')
    
    # Actualizar productos con stock > 0 a tiene_stock = True
    Producto.objects.filter(stock__gt=0).update(tiene_stock=True)
    
    # Actualizar productos con stock = 0 a tiene_stock = False
    Producto.objects.filter(stock=0).update(tiene_stock=False)


def reverse_conversion(apps, schema_editor):
    """
    Reversión: convierte tiene_stock a stock numérico.
    - tiene_stock = True → stock = 1
    - tiene_stock = False → stock = 0
    """
    Producto = apps.get_model('productos', 'Producto')
    
    Producto.objects.filter(tiene_stock=True).update(stock=1)
    Producto.objects.filter(tiene_stock=False).update(stock=0)


class Migration(migrations.Migration):

    dependencies = [
        ('productos', '0006_alter_producto_codigo_barra'),
    ]

    operations = [
        # 1. Agregar el campo tiene_stock con default=True
        migrations.AddField(
            model_name='producto',
            name='tiene_stock',
            field=models.BooleanField(
                default=True,
                verbose_name='Tiene Stock',
                help_text='Indica si el producto tiene stock disponible'
            ),
        ),
        
        # 2. Ejecutar la conversión de datos
        migrations.RunPython(convert_stock_to_boolean, reverse_conversion),
        
        # 3. Eliminar campo stock_minimo
        migrations.RemoveField(
            model_name='producto',
            name='stock_minimo',
        ),
        
        # 4. Eliminar campo stock
        migrations.RemoveField(
            model_name='producto',
            name='stock',
        ),
    ]

