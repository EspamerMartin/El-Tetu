# Desarrollo Local vs Producción

## 📋 Resumen de Diferencias

### Desarrollo Local (Tu Setup Actual)
- **Base de datos**: SQLite (`db.sqlite3`)
- **Servidor**: `python manage.py runserver 0.0.0.0:8000`
- **Frontend**: `npm start` (Expo)
- **Dependencias mínimas**: Solo las necesarias para desarrollo

### Producción (Docker/Railway)
- **Base de datos**: PostgreSQL
- **Servidor**: Gunicorn (WSGI server para producción)
- **Frontend**: Build estático o servido por CDN
- **Dependencias completas**: Todas las del `requirements.txt`

---

## 🔧 Dependencias Explicadas

### ¿Por qué Pillow?
**Pillow** es una librería para procesamiento de imágenes. Se usa cuando:
- Subes imágenes de productos
- Django procesa thumbnails
- Generas reportes con imágenes

**En desarrollo local**: Si no subes imágenes, puede que no la necesites inmediatamente, pero Django la requiere si tienes campos `ImageField` en tus modelos.

**En producción**: Siempre necesaria porque el Dockerfile instala todas las dependencias.

### ¿Por qué Gunicorn?
**Gunicorn** es un servidor WSGI HTTP para Python. Es el equivalente a usar `runserver` pero para producción.

**En desarrollo local**: 
- Usas `python manage.py runserver` (servidor de desarrollo de Django)
- Es más lento pero tiene auto-reload y mejor debugging

**En producción**:
- Usas `gunicorn` (servidor de producción)
- Es más rápido, más seguro, soporta múltiples workers
- Se configura en el Dockerfile: `gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3`

---

## 📁 Estructura del Proyecto

```
El-Tetu/
├── backend/
│   ├── db.sqlite3              # Base de datos local (SQLite)
│   ├── manage.py
│   ├── requirements.txt         # Todas las dependencias (dev + prod)
│   ├── Dockerfile              # Configuración para producción
│   ├── start_backend.bat       # Script para desarrollo local
│   ├── generar_sql_desde_csv.py          # Para PostgreSQL
│   ├── generar_sql_desde_csv_sqlite.py   # Para SQLite (desarrollo)
│   └── cargar_datos_sqlite.py  # Cargar SQL en SQLite
├── mobile/
│   └── npm start                # Expo para desarrollo
└── docker-compose.yml        # Para producción con Docker
```

---

## 🚀 Cómo Cargar Datos en SQLite (Desarrollo Local)

### Opción 1: Usando el script Python (Recomendado)

```bash
cd backend
python cargar_datos_sqlite.py datos_sqlite.sql
```

### Opción 2: Usando sqlite3 directamente

```bash
cd backend
sqlite3 db.sqlite3 < datos_sqlite.sql
```

### Opción 3: Desde Python/Django

```bash
cd backend
python manage.py shell
```

Luego en el shell:
```python
from django.db import connection
with open('datos_sqlite.sql', 'r') as f:
    connection.cursor().executescript(f.read())
```

---

## 🔄 Flujo de Trabajo Recomendado

### Desarrollo Local
1. **Iniciar backend**: `python manage.py runserver 0.0.0.0:8000`
2. **Iniciar frontend**: `npm start` (en mobile/)
3. **Cargar datos**: `python cargar_datos_sqlite.py datos_sqlite.sql`
4. **Trabajar normalmente** con SQLite

### Antes de Deployar
1. **Generar SQL para PostgreSQL**: `python generar_sql_desde_csv.py datos.csv 10`
2. **Probar en Docker local** (opcional):
   ```bash
   docker-compose up
   ```
3. **Cargar datos en PostgreSQL** (en Railway o donde esté desplegado)

---

## 📝 Notas Importantes

### SQLite vs PostgreSQL

| Característica | SQLite | PostgreSQL |
|---------------|--------|------------|
| **Sintaxis ON CONFLICT** | `INSERT OR IGNORE` | `ON CONFLICT DO NOTHING` |
| **Funciones de fecha** | `datetime('now')` | `NOW()` |
| **Booleanos** | `1` o `0` | `true` o `false` |
| **Transacciones** | `BEGIN TRANSACTION` | `BEGIN` |

Por eso hay **dos scripts separados**:
- `generar_sql_desde_csv.py` → Para PostgreSQL (producción)
- `generar_sql_desde_csv_sqlite.py` → Para SQLite (desarrollo)

### ¿Necesito todas las dependencias en desarrollo?

**No necesariamente**, pero es recomendable tenerlas porque:
- Evita problemas cuando cambies a producción
- Algunas dependencias se usan indirectamente (ej: Pillow para ImageField)
- Es mejor tener un entorno consistente

Si quieres un `requirements-dev.txt` más ligero, puedes crear uno, pero ten cuidado porque Django puede requerir algunas dependencias incluso en desarrollo.

---

## 🐳 Dockerfile Explicado

```dockerfile
# Usa Python 3.11
FROM python:3.11-slim

# Instala dependencias del sistema (para PostgreSQL y compilación)
RUN apt-get update && apt-get install -y \
    postgresql-client \      # Cliente para PostgreSQL
    build-essential \         # Para compilar algunas librerías Python
    libpq-dev                 # Headers de PostgreSQL

# Instala TODAS las dependencias de requirements.txt
RUN pip install -r requirements.txt

# Al iniciar el contenedor:
# 1. Ejecuta migraciones
# 2. Recolecta archivos estáticos
# 3. Crea usuarios iniciales
# 4. Inicia Gunicorn (servidor de producción)
CMD ["/app/entrypoint.sh"]
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar PostgreSQL en desarrollo local?
Sí, pero SQLite es más simple para desarrollo. Si quieres usar PostgreSQL localmente:
```bash
docker-compose up db  # Solo la base de datos
# Luego configura DATABASE_URL en .env
```

### ¿Por qué el servidor debe correr en 0.0.0.0:8000?
Para que la app móvil (Expo) pueda conectarse desde tu red local. Si usas `127.0.0.1`, solo funcionará desde la misma máquina.

### ¿Necesito Docker para desarrollo?
No, solo para producción o si quieres probar el entorno completo. Para desarrollo local, `runserver` es suficiente.

---

## 📚 Recursos

- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)
- [SQLite vs PostgreSQL](https://www.sqlite.org/whentouse.html)

