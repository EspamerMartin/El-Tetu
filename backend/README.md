# El-Tetu Backend

API RESTful construida con Django 4.2 y Django REST Framework.

## 🚀 Inicio Rápido

### Con Docker (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Ejecutar migraciones
docker-compose exec backend python manage.py migrate

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# Cargar datos iniciales
docker-compose exec backend python manage.py loaddata initial_data
```

### Sin Docker

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp ../.env.example ../.env
# Editar .env con tus credenciales

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver
```

## 📁 Estructura

```
backend/
├── config/              # Configuración principal de Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── users/          # Autenticación y usuarios
│   ├── productos/      # Catálogo de productos
│   ├── pedidos/        # Gestión de pedidos
│   ├── promociones/    # Sistema de promociones
│   └── informacion/    # Información general
├── manage.py
├── requirements.txt
└── Dockerfile
```

## 🔑 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login (retorna access + refresh tokens)
- `POST /api/auth/refresh` - Renovar access token
- `GET /api/auth/me` - Obtener usuario autenticado

### Productos
- `GET /api/productos/` - Listar productos (con filtros)
- `GET /api/productos/{id}/` - Detalle de producto
- `POST /api/productos/` - Crear producto (admin)
- `PUT /api/productos/{id}/` - Actualizar producto (admin)
- `DELETE /api/productos/{id}/` - Eliminar producto (admin)

### Pedidos
- `GET /api/pedidos/` - Listar pedidos
- `POST /api/pedidos/` - Crear pedido
- `GET /api/pedidos/{id}/` - Detalle de pedido
- `PUT /api/pedidos/{id}/` - Actualizar estado de pedido
- `GET /api/pedidos/{id}/pdf/` - Exportar comprobante PDF

### Promociones
- `GET /api/promociones/` - Listar promociones activas

### Información
- `GET /api/info/general/` - Obtener información general

Ver [docs/contract.md](../docs/contract.md) para documentación completa.

## 🛠️ Comandos Útiles

```bash
# Crear nueva app
python manage.py startapp nombre_app

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Shell interactivo
python manage.py shell

# Colectar archivos estáticos
python manage.py collectstatic

# Cargar fixtures
python manage.py loaddata apps/users/fixtures/initial_data.json

# Crear fixture desde DB
python manage.py dumpdata users --indent 2 > apps/users/fixtures/users.json
```

## 🔐 Seguridad

- Passwords hasheadas con Django's `make_password()`
- Autenticación JWT con SimpleJWT
- CORS configurado para desarrollo y producción
- Variables sensibles en `.env`
- SQL injection prevention (Django ORM)

## 🚢 Deploy a Railway

1. Conectar repositorio en Railway
2. Crear servicio PostgreSQL
3. Configurar variables de entorno:
   ```
   DATABASE_URL=postgresql://...
   SECRET_KEY=tu-secret-key-seguro
   DEBUG=False
   ALLOWED_HOSTS=*.railway.app
   ```
4. Railway detectará automáticamente el Dockerfile
5. Ejecutar migraciones después del deploy:
   ```bash
   railway run python manage.py migrate
   railway run python manage.py createsuperuser
   ```

## 📊 Modelos

### Usuario (CustomUser)
- email, nombre, apellido, rol (admin/vendedor/cliente)
- telefono, direccion

### Producto
- nombre, codigo, descripcion
- categoria, subcategoria
- precio_lista_3, precio_lista_4
- stock, activo

### Pedido
- cliente, fecha_creacion, estado
- lista_precio, total
- promociones_aplicadas

### PedidoItem
- pedido, producto, cantidad
- precio_unitario, subtotal

### Promocion
- tipo (caja_cerrada/combinable)
- condiciones, descuento
- fecha_inicio, fecha_fin, activo

Ver [docs/contract.md](../docs/contract.md) para schemas completos.

## 📝 Licencia

Propietario - El-Tetu © 2025
