"""
Excepciones personalizadas para el proyecto.
Centraliza los mensajes de error y facilita el manejo consistente.
"""


class NoStockError(Exception):
    """Excepción cuando un producto no tiene stock disponible."""
    
    def __init__(self, producto_nombre: str):
        self.producto_nombre = producto_nombre
        message = f'El producto "{producto_nombre}" no tiene stock disponible.'
        super().__init__(message)


class InvalidStateTransitionError(Exception):
    """Excepción cuando se intenta una transición de estado inválida."""
    
    def __init__(self, estado_actual: str, estado_nuevo: str):
        self.estado_actual = estado_actual
        self.estado_nuevo = estado_nuevo
        message = f'No se puede cambiar de {estado_actual} a {estado_nuevo}.'
        super().__init__(message)


class BusinessValidationError(Exception):
    """Excepción para errores de validación de negocio."""
    
    def __init__(self, message: str, field: str = None):
        self.message = message
        self.field = field
        super().__init__(message)


class ProductNotAvailableError(Exception):
    """Excepción cuando un producto no está disponible."""
    
    def __init__(self, producto_nombre: str, reason: str = "El producto no está activo"):
        self.producto_nombre = producto_nombre
        self.reason = reason
        message = f'{producto_nombre}: {reason}'
        super().__init__(message)

