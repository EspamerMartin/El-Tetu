"""
Configuración de Gunicorn para producción.
Este archivo centraliza la configuración del servidor WSGI.
"""
import multiprocessing
import os

# Puerto (Railway proporciona PORT, fallback a 8000)
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

# Número de workers
# Fórmula: (2 × CPU cores) + 1
# Para Plan Hobby con 8 vCPU: (2 × 8) + 1 = 17
# Railway Hobby: 8 vCPU, 8GB RAM - usamos 8 workers (1 por vCPU)
# Esto es conservador pero eficiente para el plan
cpu_count = multiprocessing.cpu_count()
workers = int(os.environ.get('GUNICORN_WORKERS', min(cpu_count * 2 + 1, 8)))
# Limitar a máximo 8 workers para balancear performance y memoria
if workers > 8:
    workers = 8

# Worker class
worker_class = 'sync'  # sync es adecuado para la mayoría de casos

# Timeouts
timeout = int(os.environ.get('GUNICORN_TIMEOUT', 120))  # 2 minutos para requests largos
graceful_timeout = int(os.environ.get('GUNICORN_GRACEFUL_TIMEOUT', 30))  # 30 segundos para shutdown graceful
keepalive = int(os.environ.get('GUNICORN_KEEPALIVE', 5))  # 5 segundos

# Logging
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')
accesslog = '-'  # stdout (Railway captura esto)
errorlog = '-'   # stderr (Railway captura esto)
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Performance
max_requests = int(os.environ.get('GUNICORN_MAX_REQUESTS', 1000))  # Reiniciar worker después de 1000 requests
max_requests_jitter = int(os.environ.get('GUNICORN_MAX_REQUESTS_JITTER', 50))  # Variación aleatoria

# Preload app (carga la app antes de fork workers - más eficiente)
preload_app = True

# User/Group (se configurará en Dockerfile)
# user = 'appuser'
# group = 'appuser'

