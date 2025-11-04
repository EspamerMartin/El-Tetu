# 🚀 El Tetu - Guía de Inicio

## 📋 Opciones para iniciar el proyecto

### **Opción 1: Inicio Automático (Recomendado)**
```bash
# Desde la raíz del proyecto
start.bat
```
**✅ Esto abrirá automáticamente:**
- Backend en `http://0.0.0.0:8000`
- Frontend mobile con Expo

---

### **Opción 2: Solo Backend**
```bash
cd backend
start_backend.bat
```
**Características:**
- ✅ Crea la base de datos automáticamente
- ✅ Ejecuta migraciones
- ✅ Inicializa usuarios de prueba
- ✅ Recolecta archivos estáticos
- ✅ Inicia servidor en `0.0.0.0:8000`

**Formas alternativas de iniciar el backend:**

```bash
# Desarrollo con hot-reload (localhost)
python manage.py runserver

# Desarrollo accesible desde red local (para mobile)
python manage.py runserver 0.0.0.0:8000

# Desarrollo en puerto personalizado
python manage.py runserver 0.0.0.0:3000

# Producción con Gunicorn (instalar primero: pip install gunicorn)
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

---

### **Opción 3: Solo Frontend Mobile**
```bash
cd mobile
npm start
```

---

## 🗄️ Base de Datos

### **SQLite (Por defecto - Actual)**
- **Ubicación:** `backend/db.sqlite3`
- **Configuración:** Se crea automáticamente al ejecutar `start_backend.bat`
- **Ventajas:** 
  - ✅ Sin instalación adicional
  - ✅ Ideal para desarrollo
  - ✅ Portable
- **Desventajas:**
  - ❌ No recomendado para producción
  - ❌ Límite de concurrencia

### **PostgreSQL (Recomendado para producción)**

1. Instalar PostgreSQL
2. Crear base de datos:
   ```sql
   CREATE DATABASE eltetu_db;
   CREATE USER eltetu_user WITH PASSWORD 'tu_password';
   GRANT ALL PRIVILEGES ON DATABASE eltetu_db TO eltetu_user;
   ```
3. Crear archivo `.env` en `backend/`:
   ```env
   DATABASE_URL=postgresql://eltetu_user:tu_password@localhost:5432/eltetu_db
   SECRET_KEY=tu_secret_key_super_segura
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   ```
4. Ejecutar migraciones:
   ```bash
   python manage.py migrate
   ```

### **MySQL (Alternativa)**

1. Instalar MySQL
2. Crear base de datos:
   ```sql
   CREATE DATABASE eltetu_db;
   CREATE USER 'eltetu_user'@'localhost' IDENTIFIED BY 'tu_password';
   GRANT ALL PRIVILEGES ON eltetu_db.* TO 'eltetu_user'@'localhost';
   ```
3. Instalar driver:
   ```bash
   pip install mysqlclient
   ```
4. Actualizar `.env`:
   ```env
   DATABASE_URL=mysql://eltetu_user:tu_password@localhost:3306/eltetu_db
   ```

---

## 👥 Usuarios de Prueba

Al ejecutar `start_backend.bat`, se crean automáticamente estos usuarios

## 🛠️ Comandos Útiles

### Backend (Django)
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario manualmente
python manage.py createsuperuser

# Inicializar usuarios de prueba
python init_users.py

# Abrir shell de Django
python manage.py shell

# Limpiar base de datos (CUIDADO: borra todo)
del db.sqlite3
python manage.py migrate
```

### Frontend (React Native)
```bash
# Instalar dependencias
npm install

# Iniciar Expo
npm start

# Limpiar cache
npm start -- --clear

# Construir APK (Android)
npm run build:android
```

---

## 🔧 Solución de Problemas

### **El backend no inicia**
1. Verificar que Python esté instalado: `python --version`
2. Instalar dependencias: `pip install -r requirements.txt`
3. Verificar migraciones: `python manage.py migrate`

### **El mobile no conecta al backend**
1. Asegurarse que el backend esté en `0.0.0.0:8000`
2. Verificar que estén en la misma red WiFi
3. Revisar la IP en `mobile/src/services/api/apiClient.ts`

### **Error de base de datos bloqueada (SQLite)**
1. Cerrar todas las conexiones
2. Reiniciar el servidor Django

---

## 📦 Estructura de Archivos

```
El-Tetu/
├── start.bat                 # Iniciar todo (backend + frontend)
├── backend/
│   ├── start_backend.bat    # Iniciar solo backend
│   ├── init_users.py        # Crear usuarios de prueba
│   ├── db.sqlite3           # Base de datos SQLite
│   └── manage.py
└── mobile/
    ├── start.bat            # Iniciar solo frontend
    └── package.json
```

---

## 🌐 URLs Importantes

- **API Backend:** `http://0.0.0.0:8000/api`
- **Admin Django:** `http://localhost:8000/admin`
- **Documentación API:** `http://localhost:8000/api/docs` (si está configurado)

---

¡Listo para desarrollar! 🎉
