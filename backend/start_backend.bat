@echo off
cd /d "%~dp0"

echo ================================================================================
echo   EL TETU - BACKEND INITIALIZATION
echo ================================================================================
echo.

REM Verificar si existe la base de datos
if not exist "db.sqlite3" (
    echo [1/4] Creando base de datos...
    python manage.py migrate
    echo.
) else (
    echo [1/4] Base de datos existente, verificando migraciones...
    python manage.py migrate
    echo.
)

REM Crear usuarios de prueba
echo [2/4] Inicializando usuarios de prueba...
python init_users.py
echo.

REM Cargar datos desde Excel si existe
echo [2.5/4] Cargando datos desde datos.xlsx...
python load_datos_excel.py || echo "No se encontró datos.xlsx o hubo un error (continuando...)"
echo.

REM Recolectar archivos estaticos
echo [3/4] Recolectando archivos estaticos...
python manage.py collectstatic --noinput
echo.

REM Iniciar servidor
echo [4/4] Iniciando servidor Django...
echo.
echo ================================================================================
echo   Servidor corriendo en: http://0.0.0.0:8000
echo   Admin panel: http://localhost:8000/admin
echo   API docs: http://localhost:8000/api
echo ================================================================================
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
python manage.py runserver 0.0.0.0:8000
