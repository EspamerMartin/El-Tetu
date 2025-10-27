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
