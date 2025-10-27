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
    user = authenticate(request, email=email, password=password)
    
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
    """
    serializer = UserSerializer(request.user, data=request.data, partial=True)
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
    Vista para listar y crear usuarios (solo admin).
    GET/POST /api/auth/users
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        """Filtrar usuarios según rol."""
        queryset = super().get_queryset()
        rol = self.request.query_params.get('rol', None)
        
        if rol:
            queryset = queryset.filter(rol=rol)
        
        return queryset


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para obtener, actualizar y eliminar usuario (solo admin).
    GET/PUT/DELETE /api/auth/users/{id}
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
