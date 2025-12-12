from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password, check_password
import logging

from .models import CustomUser, Zona, HorarioCliente
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserLoginSerializer,
    ChangePasswordSerializer,
    ZonaSerializer,
    HorarioClienteSerializer
)
from .permissions import IsAdmin
from apps.core.mixins import SoftDeleteMixin

logger = logging.getLogger('eltetu')


# ========== Zonas Views ==========

class ZonaListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear zonas.
    GET: Cualquier usuario autenticado puede ver zonas activas.
    POST: Solo admin puede crear zonas.
    """
    serializer_class = ZonaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtra zonas según el usuario."""
        user = self.request.user
        queryset = Zona.objects.all()
        
        # Solo admin puede ver zonas inactivas
        if not user.is_admin():
            queryset = queryset.filter(activo=True)
        else:
            # Admin puede filtrar por activo
            activo = self.request.query_params.get('activo', None)
            if activo is not None:
                activo_bool = activo.lower() in ('true', '1', 'yes')
                queryset = queryset.filter(activo=activo_bool)
        
        return queryset
    
    def get_permissions(self):
        """Solo admin puede crear zonas."""
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


class ZonaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar zona.
    GET: Cualquier usuario autenticado.
    PUT/DELETE: Solo admin.
    """
    queryset = Zona.objects.all()
    serializer_class = ZonaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Solo admin puede modificar zonas."""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


# ========== Auth Views ==========

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Vista para login de usuarios.
    POST /api/auth/login
    
    Body:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    
    Response:
    {
        "user": {...},
        "access": "...",
        "refresh": "..."
    }
    """
    serializer = UserLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    
    # Autenticar usuario
    user = authenticate(request, username=email, password=password)
    
    if user is None:
        return Response({
            'error': 'Credenciales inválidas.'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({
            'error': 'Usuario inactivo.'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Generar tokens JWT
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    Vista para obtener datos del usuario autenticado.
    GET /api/auth/me
    
    Headers:
    Authorization: Bearer <access_token>
    
    Response:
    {
        "id": 1,
        "email": "user@example.com",
        "nombre": "Juan",
        "apellido": "Pérez",
        "rol": "cliente",
        ...
    }
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """
    Vista para actualizar perfil del usuario autenticado.
    PUT /api/auth/profile
    
    Solo permite actualizar: nombre, apellido, telefono, direccion
    No permite cambiar: email, rol, is_active (solo admin puede)
    """
    # Remover campos que no se pueden modificar
    data = request.data.copy()
    data.pop('email', None)
    data.pop('rol', None)
    data.pop('is_active', None)
    data.pop('id', None)
    data.pop('date_joined', None)
    
    serializer = UserSerializer(request.user, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Vista para cambiar contraseña del usuario autenticado.
    POST /api/auth/change-password
    
    Body:
    {
        "old_password": "oldpass123",
        "new_password": "newpass123",
        "new_password_confirm": "newpass123"
    }
    """
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user = request.user
    
    # Verificar contraseña antigua
    if not check_password(serializer.validated_data['old_password'], user.password):
        return Response({
            'error': 'Contraseña actual incorrecta.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Actualizar contraseña
    user.password = make_password(serializer.validated_data['new_password'])
    user.save()
    
    return Response({
        'message': 'Contraseña actualizada exitosamente.'
    })


class UserListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear usuarios.
    GET: Admin y vendedores pueden ver usuarios.
    POST: Admin puede crear cualquier usuario, vendedor solo puede crear clientes.
    """
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Usa UserCreateSerializer para POST, UserSerializer para GET."""
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer
    
    def get_permissions(self):
        """Admin y vendedores pueden listar y crear (con restricciones)."""
        user = self.request.user
        if user.is_vendedor() or user.is_admin():
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]
    
    def get_queryset(self):
        """
        Filtra usuarios según rol del usuario autenticado y parámetros de query.
        
        Parámetros de query:
        - rol: Filtrar por rol ('admin', 'vendedor', 'cliente')
        - is_active: Filtrar por estado activo (true/false)
        - zona: Filtrar por zona (id)
        
        Permisos:
        - Admin: Puede ver todos los usuarios y usar cualquier filtro
        - Vendedor: Solo puede ver clientes activos (filtro de rol aplicado automáticamente)
        """
        user = self.request.user
        queryset = CustomUser.objects.all()
        
        # Si es vendedor, solo puede ver clientes activos
        if user.is_vendedor():
            queryset = queryset.filter(rol='cliente', is_active=True, fecha_eliminacion__isnull=True)
            
            # Vendedor puede filtrar por zona
            zona = self.request.query_params.get('zona', None)
            if zona:
                queryset = queryset.filter(zona_id=zona)
        # Si es admin, puede ver todos pero respetar filtros de query
        elif user.is_admin():
            # Aplicar filtros de query si existen
            rol = self.request.query_params.get('rol', None)
            is_active = self.request.query_params.get('is_active', None)
            zona = self.request.query_params.get('zona', None)
            
            if rol:
                # Validar que el rol sea válido
                valid_roles = ['admin', 'vendedor', 'cliente']
                if rol in valid_roles:
                    queryset = queryset.filter(rol=rol)
            
            if is_active is not None:
                # Convertir string a boolean
                is_active_bool = is_active.lower() in ('true', '1', 'yes')
                queryset = queryset.filter(is_active=is_active_bool)
            
            if zona:
                queryset = queryset.filter(zona_id=zona)
            
            # Ordenar: primero activos y no eliminados, luego por nombre
            queryset = queryset.order_by('-is_active', 'fecha_eliminacion', 'nombre', 'apellido')
        else:
            # Otros usuarios no pueden ver nada
            return CustomUser.objects.none()
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Crea un nuevo usuario y devuelve con UserSerializer completo.
        Vendedores solo pueden crear usuarios con rol 'cliente'.
        """
        user = request.user
        
        # Si es vendedor, validar que solo pueda crear clientes
        if user.is_vendedor():
            rol = request.data.get('rol', 'cliente')
            if rol != 'cliente':
                return Response(
                    {'error': 'Los vendedores solo pueden crear clientes.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_user = serializer.save()
        
        # Devolver con el serializer de lectura para incluir todos los campos
        return Response(
            UserSerializer(new_user).data, 
            status=status.HTTP_201_CREATED
        )


class UserDetailView(SoftDeleteMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar usuario.
    GET: Admin y vendedores pueden ver detalles.
    PUT/DELETE: Solo admin puede modificar/eliminar.
    """
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Usa UserUpdateSerializer para PUT/PATCH, UserSerializer para GET."""
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_permissions(self):
        """Vendedores pueden ver, solo admin puede modificar."""
        if self.request.method == 'GET':
            user = self.request.user
            if user.is_vendedor() or user.is_admin():
                return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]
    
    def get_reference_checks(self, instance):
        """Define las relaciones a verificar para soft delete."""
        return [
            (instance.pedidos, 'pedidos'),
        ]
    
    def update(self, request, *args, **kwargs):
        """Actualiza usuario y devuelve con UserSerializer completo."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Devolver con el serializer de lectura para incluir todos los campos
        return Response(UserSerializer(user).data)
