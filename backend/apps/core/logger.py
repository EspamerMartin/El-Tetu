"""
Configuración de logging para el proyecto.
"""

import logging
import os
from pathlib import Path

# Directorio base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Directorio para logs
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)


def setup_logging():
    """
    Configura el sistema de logging del proyecto.
    """
    # Configuración del formato
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'
    
    # Configuración de niveles por módulo
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        datefmt=date_format,
        handlers=[
            # Handler para archivo
            logging.FileHandler(
                LOGS_DIR / 'django.log',
                encoding='utf-8'
            ),
            # Handler para consola (solo en desarrollo)
            logging.StreamHandler()
        ]
    )
    
    # Configurar niveles específicos por módulo
    logging.getLogger('django').setLevel(logging.WARNING)
    logging.getLogger('django.db.backends').setLevel(logging.WARNING)
    
    # Logger para la aplicación
    logger = logging.getLogger('eltetu')
    logger.setLevel(logging.INFO)
    
    return logger


# Crear logger principal
logger = setup_logging()

