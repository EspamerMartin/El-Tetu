from django.urls import path
from .views import (
    CategoriaListCreateView,
    CategoriaDetailView,
    SubcategoriaListCreateView,
    SubcategoriaDetailView,
    ProductoListCreateView,
    ProductoDetailView,
)

urlpatterns = [
    # Categorías
    path('categorias/', CategoriaListCreateView.as_view(), name='categoria_list_create'),
    path('categorias/<int:pk>/', CategoriaDetailView.as_view(), name='categoria_detail'),
    
    # Subcategorías
    path('subcategorias/', SubcategoriaListCreateView.as_view(), name='subcategoria_list_create'),
    path('subcategorias/<int:pk>/', SubcategoriaDetailView.as_view(), name='subcategoria_detail'),
    
    # Productos
    path('', ProductoListCreateView.as_view(), name='producto_list_create'),
    path('<int:pk>/', ProductoDetailView.as_view(), name='producto_detail'),
]
