from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    login_view,
    me_view,
    update_profile_view,
    change_password_view,
    UserListCreateView,
    UserDetailView,
)

urlpatterns = [
    # Autenticación
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', me_view, name='me'),
    path('profile/', update_profile_view, name='update_profile'),
    path('change-password/', change_password_view, name='change_password'),
    
    # Gestión de usuarios (admin)
    path('users/', UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
]
