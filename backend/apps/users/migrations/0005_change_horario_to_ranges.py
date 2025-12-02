from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_zona_customuser_calle_customuser_cuit_dni_and_more'),
    ]

    operations = [
        # Eliminar el modelo antiguo
        migrations.DeleteModel(
            name='HorarioCliente',
        ),
        # Recrear con la nueva estructura
        migrations.CreateModel(
            name='HorarioCliente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dia_semana', models.IntegerField(
                    choices=[(0, 'Lunes'), (1, 'Martes'), (2, 'Miércoles'), (3, 'Jueves'), (4, 'Viernes'), (5, 'Sábado'), (6, 'Domingo')],
                    verbose_name='Día de la semana'
                )),
                ('hora_desde', models.TimeField(verbose_name='Hora desde')),
                ('hora_hasta', models.TimeField(verbose_name='Hora hasta')),
                ('cliente', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='horarios',
                    to='users.customuser',
                    verbose_name='Cliente'
                )),
            ],
            options={
                'verbose_name': 'Horario de Cliente',
                'verbose_name_plural': 'Horarios de Clientes',
                'ordering': ['cliente', 'dia_semana', 'hora_desde'],
            },
        ),
    ]

