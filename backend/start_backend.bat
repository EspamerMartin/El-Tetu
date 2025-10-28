@echo off
cd /d "%~dp0"
echo Iniciando Django en 0.0.0.0:8000...
python manage.py runserver 0.0.0.0:8000
pause
