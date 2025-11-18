# Generated manually
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def create_default_marca(apps, schema_editor):
    """Crea una marca por defecto para migración de datos."""
    Marca = apps.get_model('productos', 'Marca')
    Marca.objects.get_or_create(
        id=1,
        defaults={
            'nombre': 'Sin Marca',
            'descripcion': 'Marca temporal para productos sin marca asignada',
            'activo': True,
        }
    )


def copy_codigo_to_codigo_barra(apps, schema_editor):
    """Copia los valores de codigo a codigo_barra."""
    Producto = apps.get_model('productos', 'Producto')
    for producto in Producto.objects.all():
        if hasattr(producto, 'codigo') and producto.codigo:
            producto.codigo_barra = producto.codigo
            producto.save(update_fields=['codigo_barra'])


class Migration(migrations.Migration):

    dependencies = [
        ('productos', '0004_categoria_eliminado_por_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Crear modelo Marca
        migrations.CreateModel(
            name='Marca',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha_eliminacion', models.DateTimeField(blank=True, help_text='Fecha en que se desactivó este registro', null=True, verbose_name='Fecha de Eliminación')),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True, verbose_name='Fecha de Actualización')),
                ('nombre', models.CharField(max_length=100, unique=True, verbose_name='Nombre')),
                ('descripcion', models.TextField(blank=True, null=True, verbose_name='Descripción')),
                ('activo', models.BooleanField(default=True, verbose_name='Activo')),
                ('eliminado_por', models.ForeignKey(blank=True, help_text='Usuario que desactivó este registro', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_eliminados', to=settings.AUTH_USER_MODEL, verbose_name='Eliminado Por')),
            ],
            options={
                'verbose_name': 'Marca',
                'verbose_name_plural': 'Marcas',
                'ordering': ['nombre'],
            },
        ),
        
        # 2. Crear marca por defecto
        migrations.RunPython(create_default_marca, reverse_code=migrations.RunPython.noop),
        
        # 3. Renombrar campo codigo a codigo_barra
        migrations.RenameField(
            model_name='producto',
            old_name='codigo',
            new_name='codigo_barra',
        ),
        
        # 4. Agregar nuevos campos al modelo Producto
        migrations.AddField(
            model_name='producto',
            name='tamaño',
            field=models.DecimalField(decimal_places=2, default=1.0, help_text='Tamaño del producto', max_digits=10, verbose_name='Tamaño'),
        ),
        migrations.AddField(
            model_name='producto',
            name='unidad_tamaño',
            field=models.CharField(choices=[('ud', 'Unidad'), ('ml', 'Mililitros'), ('l', 'Litros'), ('g', 'Gramos'), ('kg', 'Kilogramos'), ('cm', 'Centímetros'), ('m', 'Metros')], default='ud', help_text='Unidad de medida del tamaño', max_length=10, verbose_name='Unidad de Tamaño'),
        ),
        migrations.AddField(
            model_name='producto',
            name='unidades_caja',
            field=models.IntegerField(default=1, help_text='Cantidad de unidades por caja', verbose_name='Unidades por Caja'),
        ),
        
        # 5. Reemplazar campo imagen por url_imagen
        migrations.RemoveField(
            model_name='producto',
            name='imagen',
        ),
        migrations.AddField(
            model_name='producto',
            name='url_imagen',
            field=models.URLField(blank=True, help_text='URL de la imagen del producto (ej: S3)', null=True, verbose_name='URL de Imagen'),
        ),
        
        # 6. Agregar campo marca (nullable temporalmente para permitir migración)
        migrations.AddField(
            model_name='producto',
            name='marca',
            field=models.ForeignKey(default=1, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='productos', to='productos.marca', verbose_name='Marca'),
        ),
    ]

