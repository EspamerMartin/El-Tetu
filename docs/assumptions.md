# Supuestos Técnicos y Decisiones de Diseño - El-Tetu

## 1. Arquitectura General

### Backend
- **Django 4.2** como framework principal por su robustez y ORM completo
- **Django REST Framework** para API RESTful
- **PostgreSQL** como base de datos relacional por su confiabilidad y soporte en Railway
- **JWT** para autenticación stateless y escalable
- **Docker** para desarrollo y deploy consistente

### Frontend
- **React Native con Expo** para desarrollo cross-platform rápido
- **TypeScript** para type safety y mejor DX
- **Redux Toolkit** para manejo de estado global predecible
- **React Navigation** como estándar de facto para navegación

### Infraestructura
- **Railway** para hosting por su simplicidad y integración con PostgreSQL
- **Docker Compose** para ambiente de desarrollo local
- Un solo ambiente (producción) inicialmente

---

## 2. Decisiones de Diseño del Backend

### Autenticación y Autorización

**Decisión:** JWT con SimpleJWT
- **Por qué:** Stateless, escalable, compatible con mobile
- **Alternativa descartada:** Sessions (requiere state en servidor)

**Decisión:** Tres roles fijos (admin, vendedor, cliente)
- **Por qué:** Simplicidad, cubre todos los casos de uso actuales
- **Futuro:** Sistema de permisos granular si se requiere

### Modelos de Datos

**Decisión:** CustomUser con email como identificador único
- **Por qué:** Email es más user-friendly que username
- **Implementación:** `AbstractBaseUser` + `BaseUserManager`

**Decisión:** Precios por lista (Lista 3 y Lista 4)
- **Por qué:** Requerimiento de negocio B2B/B2C
- **Flexibilidad:** Campo `lista_precio` en Pedido

**Decisión:** Stock controlado a nivel de Producto
- **Por qué:** Simplifica gestión de inventario
- **Limitación:** No soporta múltiples bodegas (futuro)

**Decisión:** Aplicación automática de promociones
- **Por qué:** Mejor UX, reduce errores manuales
- **Implementación:** Método `aplicar_promociones()` en modelo Pedido

### API Design

**Decisión:** RESTful con paginación por defecto
- **Por qué:** Estándar de industria, fácil de consumir
- **Configuración:** PageNumberPagination con 50 items/página

**Decisión:** Endpoints separados por rol
- **Por qué:** Claridad y seguridad
- **Ejemplo:** `/api/auth/users/` solo para admin

**Decisión:** Filtros via query params
- **Por qué:** Simplicidad y compatibilidad
- **Implementación:** django-filter + DRF filters

---

## 3. Decisiones de Diseño del Frontend

### Estado Global

**Decisión:** Redux Toolkit para auth y carrito
- **Por qué:** Predecible, DevTools, persist con AsyncStorage
- **Alternativa:** Context API (menos robusto para casos complejos)

### Persistencia

**Decisión:** AsyncStorage para tokens y carrito
- **Por qué:** Nativo de React Native, simple
- **Seguridad:** Tokens en storage seguro en producción (Expo SecureStore)

### Navegación

**Decisión:** Stacks separados por rol
- **Por qué:** Mejor UX, componentes específicos por rol
- **Implementación:** RootNavigator decide stack según `user.rol`

**Decisión:** Bottom Tabs para Cliente, Drawer para Admin/Vendedor
- **Por qué:** Bottom tabs más intuitivo en mobile para clientes frecuentes
- **Admin/Vendedor:** Drawer permite más opciones sin saturar UI

### UI/UX

**Decisión:** React Native Paper
- **Por qué:** Material Design, componentes completos, theming
- **Alternativa:** NativeBase (evaluada, Paper elegida por mejor docs)

**Decisión:** Modo claro por defecto, oscuro preparado
- **Por qué:** Mayoría prefiere claro, oscuro disponible en settings

---

## 4. Flujo de Negocio

### Creación de Pedidos

1. Cliente selecciona productos → Carrito (local)
2. Confirma pedido → POST `/api/pedidos/`
3. Backend calcula precios según `lista_precio`
4. Backend aplica promociones automáticamente
5. Backend retorna pedido con totales
6. Estado inicial: `PENDIENTE`

### Confirmación y Stock

**Decisión:** Stock se descuenta al CONFIRMAR, no al crear
- **Por qué:** Permite cancelación sin afectar inventario
- **Implementación:** Método `confirmar()` en modelo Pedido
- **Validación:** Verifica stock antes de confirmar

### Promociones

**Decisión:** Promociones se aplican al crear pedido
- **Por qué:** Transparencia para el cliente
- **Recalculo:** Si se edita pedido pendiente (futuro)

---

## 5. Seguridad

### Passwords

**Decisión:** Hash con Django's `make_password()`
- **Por qué:** Bcrypt, salt automático, probado
- **Validación:** Django password validators activos

### CORS

**Decisión:** Whitelist de origins
- **Desarrollo:** localhost:8081, localhost:19006
- **Producción:** Dominio de app móvil

### Permisos

**Decisión:** Permisos personalizados (IsAdmin, IsAdminOrVendedor, IsOwnerOrAdmin)
- **Por qué:** DRF permissions no cubren roles personalizados
- **Ventaja:** Reutilizable y declarativo

---

## 6. Performance

### Optimizaciones Implementadas

**Queries:**
- `select_related()` para ForeignKeys
- `prefetch_related()` para M2M
- Índices en campos frecuentemente filtrados (futuro)

**Paginación:**
- Limitada a 50 items por defecto
- Cliente hace scroll infinito

**Caching:**
- No implementado inicialmente
- Futuro: Redis para catálogo y promociones

---

## 7. Limitaciones Conocidas

### Backend

1. **Un solo servidor:** No load balancing
2. **No caché:** Todas las queries a DB
3. **Stock simple:** No soporta múltiples bodegas
4. **Promociones básicas:** Solo caja cerrada y combinable
5. **Sin webhooks:** Para integración de pagos (futuro)

### Frontend

1. **Sin offline mode:** Requiere conexión constante
2. **No push notifications:** Solo polling (futuro)
3. **Sin biometría:** Login solo con email/password
4. **Imágenes:** Upload desde admin web, no desde app

---

## 8. Futuras Mejoras

### Alta Prioridad

- [ ] Tests unitarios y de integración
- [ ] CI/CD con GitHub Actions
- [ ] Push notifications (Expo Notifications)
- [ ] Biometría para login
- [ ] Modo offline básico

### Media Prioridad

- [ ] Integración de pagos (MercadoPago/Stripe)
- [ ] Chat vendedor-cliente
- [ ] Dashboard analytics
- [ ] Reportes exportables (PDF/Excel)
- [ ] Sistema de trazabilidad avanzado

### Baja Prioridad

- [ ] Multi-idioma (i18n)
- [ ] Multi-moneda
- [ ] Múltiples bodegas
- [ ] Gestión de devoluciones
- [ ] Programa de fidelización

---

## 9. Consideraciones de Deploy

### Railway

**Por qué Railway:**
- Setup simple de PostgreSQL
- Auto-deploy desde GitHub
- Variables de entorno fáciles
- Logs accesibles

**Limitaciones:**
- Plan gratuito limitado (upgrade necesario para producción)
- No auto-scaling (manual)

### Alternativas Evaluadas

- **Heroku:** Más caro post-free tier
- **AWS/GCP:** Más complejo para scope inicial
- **DigitalOcean:** Buena opción futura para scaling

---

## 10. Stack de Dependencias

### Backend Core

```python
Django==4.2.7
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.0
psycopg2-binary==2.9.9
```

### Backend Utilidades

```python
python-decouple==3.8          # Variables de entorno
django-cors-headers==4.3.0     # CORS
django-filter==23.5            # Filtros avanzados
dj-database-url==2.1.0         # Parse DATABASE_URL
gunicorn==21.2.0               # WSGI server
whitenoise==6.6.0              # Static files
Pillow==10.1.0                 # Imágenes
reportlab==4.0.7               # PDF generation
```

### Frontend Core

```json
{
  "expo": "~49.0.0",
  "react": "18.2.0",
  "react-native": "0.72.0",
  "typescript": "^5.1.0"
}
```

### Frontend Utilidades

```json
{
  "@react-navigation/native": "^6.1.0",
  "@reduxjs/toolkit": "^1.9.0",
  "react-redux": "^8.1.0",
  "axios": "^1.5.0",
  "@react-native-async-storage/async-storage": "^1.19.0",
  "react-native-paper": "^5.10.0"
}
```

---

## 11. Variables de Entorno Requeridas

### Backend (.env)

```bash
SECRET_KEY=                    # Django secret
DEBUG=False                    # Producción
ALLOWED_HOSTS=                 # Dominios permitidos
DATABASE_URL=                  # PostgreSQL URL
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
CORS_ALLOWED_ORIGINS=          # Origins del frontend
```

### Frontend (mobile/.env)

```bash
EXPO_PUBLIC_API_URL=           # URL del backend
```

---

## 12. Notas de Implementación

### CustomUser

El modelo usa `email` como `USERNAME_FIELD` en lugar de username. Esto requiere:
- Custom `CustomUserManager`
- `REQUIRED_FIELDS = ['nombre', 'apellido']`

### Migraciones

Orden recomendado:
1. `users`
2. `productos` (categorías primero)
3. `promociones`
4. `pedidos` (depende de users, productos, promociones)
5. `informacion`

### Fixtures

Para datos iniciales, crear fixtures en `apps/<app>/fixtures/`:
- `initial_users.json` - Usuarios de prueba
- `initial_categorias.json` - Categorías básicas
- `initial_productos.json` - Productos de ejemplo
- `initial_promociones.json` - Promociones de prueba

---

## 13. Testing Strategy (Futuro)

### Backend
- **Unit tests:** Modelos, serializers, utilidades
- **Integration tests:** Endpoints completos
- **Coverage target:** > 80%

### Frontend
- **Unit tests:** Redux slices, utilidades
- **Component tests:** Pantallas críticas
- **E2E:** Flujo completo de pedido

---

## Conclusión

Este documento refleja las decisiones tomadas al momento de la implementación inicial. Se recomienda revisarlo y actualizarlo conforme el proyecto evolucione.
