from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    login_view,
    me_view,
    update_profile_view,
    change_password_view,
    UserListCreateView,
    UserDetailView,
    ZonaListCreateView,
    ZonaDetailView,
)

urlpatterns = [
    # Autenticación (sin registro público - usuarios solo se crean desde admin)
    path('login/', login_view, name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', me_view, name='me'),
    path('profile/', update_profile_view, name='update_profile'),
    path('change-password/', change_password_view, name='change_password'),
    
    # Gestión de usuarios (admin)
    path('users/', UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    
    # Zonas
    path('zonas/', ZonaListCreateView.as_view(), name='zona_list_create'),
    path('zonas/<int:pk>/', ZonaDetailView.as_view(), name='zona_detail'),
]
