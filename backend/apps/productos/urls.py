from django.urls import path
from .views import (
    MarcaListCreateView,
    MarcaDetailView,
    CategoriaListCreateView,
    CategoriaDetailView,
    SubcategoriaListCreateView,
    SubcategoriaDetailView,
    ProductoListCreateView,
    ProductoDetailView,
    PromocionListCreateView,
    PromocionDetailView,
    PromocionActivasView,
)
from .views_listas import (
    ListaPrecioListCreateView,
    ListaPrecioDetailView,
)

urlpatterns = [
    # Listas de Precios
    path('listas-precios/', ListaPrecioListCreateView.as_view(), name='lista_precio_list_create'),
    path('listas-precios/<int:pk>/', ListaPrecioDetailView.as_view(), name='lista_precio_detail'),
    
    # Marcas
    path('marcas/', MarcaListCreateView.as_view(), name='marca_list_create'),
    path('marcas/<int:pk>/', MarcaDetailView.as_view(), name='marca_detail'),
    
    # Categorías
    path('categorias/', CategoriaListCreateView.as_view(), name='categoria_list_create'),
    path('categorias/<int:pk>/', CategoriaDetailView.as_view(), name='categoria_detail'),
    
    # Subcategorías
    path('subcategorias/', SubcategoriaListCreateView.as_view(), name='subcategoria_list_create'),
    path('subcategorias/<int:pk>/', SubcategoriaDetailView.as_view(), name='subcategoria_detail'),
    
    # Promociones
    path('promociones/', PromocionListCreateView.as_view(), name='promocion_list_create'),
    path('promociones/activas/', PromocionActivasView.as_view(), name='promocion_activas'),
    path('promociones/<int:pk>/', PromocionDetailView.as_view(), name='promocion_detail'),
    
    # Productos
    path('', ProductoListCreateView.as_view(), name='producto_list_create'),
    path('<int:pk>/', ProductoDetailView.as_view(), name='producto_detail'),
]
