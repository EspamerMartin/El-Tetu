from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password, check_password

from .models import CustomUser
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    ChangePasswordSerializer
)
from .permissions import IsAdmin


class RegisterView(generics.CreateAPIView):
    """
    Vista para registro de nuevos usuarios.
    POST /api/auth/register
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


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
    POST: Solo admin puede crear usuarios.
    """
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Usa UserCreateSerializer para POST, UserSerializer para GET."""
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer
    
    def get_permissions(self):
        """Vendedores pueden listar, solo admin puede crear."""
        user = self.request.user
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        if user.is_vendedor() or user.is_admin():
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]
    
    def get_queryset(self):
        """Admin ve todos (incluyendo eliminados), vendedores solo clientes activos."""
        user = self.request.user
        
        if user.is_admin():
            return CustomUser.objects.all()
        
        if user.is_vendedor():
            return CustomUser.objects.filter(rol='cliente', is_active=True, fecha_eliminacion__isnull=True)
        
        return CustomUser.objects.none()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar usuario.
    GET: Admin y vendedores pueden ver detalles.
    PUT/DELETE: Solo admin puede modificar/eliminar.
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Vendedores pueden ver, solo admin puede modificar."""
        if self.request.method == 'GET':
            user = self.request.user
            if user.is_vendedor() or user.is_admin():
                return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdmin()]
    
    def perform_destroy(self, instance):
        """
        Eliminación híbrida: soft delete si tiene referencias, hard delete si no.
        """
        # Verificar si tiene referencias en pedidos
        tiene_referencias = instance.pedidos.exists()
        
        if tiene_referencias:
            # Soft delete: desactivar en lugar de eliminar
            instance.soft_delete(usuario=self.request.user)
        else:
            # Hard delete: eliminar físicamente
            instance.delete()
    
    def destroy(self, request, *args, **kwargs):
        """
        Sobrescribe destroy para retornar mensaje apropiado según el tipo de eliminación.
        """
        from rest_framework.response import Response
        from rest_framework import status
        
        instance = self.get_object()
        
        # Verificar si tiene referencias antes de eliminar
        tiene_referencias = instance.pedidos.exists()
        
        # Ejecutar la eliminación (soft o hard)
        self.perform_destroy(instance)
        
        # Retornar respuesta apropiada
        if tiene_referencias:
            return Response(
                {'message': 'Usuario desactivado (soft delete) porque tiene referencias en pedidos.'},
                status=status.HTTP_200_OK
            )
        else:
            return Response(status=status.HTTP_204_NO_CONTENT)
