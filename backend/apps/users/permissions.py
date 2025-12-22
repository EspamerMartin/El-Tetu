from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permiso personalizado para permitir solo a usuarios admin.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.rol == 'admin'


class IsAdminOrVendedor(permissions.BasePermission):
    """
    Permiso personalizado para permitir solo a usuarios admin o vendedor.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol in ['admin', 'vendedor']
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permiso personalizado para permitir solo al propietario o admin.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin tiene acceso total
        if request.user.rol == 'admin':
            return True
        
        # El usuario puede ver/editar solo sus propios objetos
        return obj == request.user or (hasattr(obj, 'cliente') and obj.cliente == request.user)


class IsTransportador(permissions.BasePermission):
    """
    Permiso personalizado para permitir solo a usuarios transportador.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.rol == 'transportador'


class IsAdminOrTransportador(permissions.BasePermission):
    """
    Permiso personalizado para permitir a admin o transportador.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol in ['admin', 'transportador']
        )


class CanCreateUser(permissions.BasePermission):
    """
    Permiso para controlar quién puede crear usuarios.
    - Admin: puede crear usuarios de cualquier rol
    - Vendedor: solo puede crear usuarios con rol 'cliente'
    - Otros: no pueden crear usuarios
    """
    message = 'No tiene permisos para crear este tipo de usuario.'
    
    def has_permission(self, request, view):
        user = request.user
        
        if not user or not user.is_authenticated:
            return False
        
        # Admin puede crear cualquier usuario
        if user.rol == 'admin':
            return True
        
        # Vendedor solo puede crear clientes
        if user.rol == 'vendedor':
            # Obtener el rol del usuario a crear (default: cliente)
            rol_to_create = request.data.get('rol', 'cliente')
            if rol_to_create != 'cliente':
                self.message = 'Los vendedores solo pueden crear clientes.'
                return False
            return True
        
        # Otros roles no pueden crear usuarios
        return False