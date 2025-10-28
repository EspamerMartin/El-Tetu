from django.contrib.auth import get_user_model

User = get_user_model()
email = 'admin@example.com'
password = 'admin123'

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(email=email, password=password, nombre='Admin', apellido='User')
    print('Superusuario creado:', email)
else:
    print('Superusuario ya existe:', email)

