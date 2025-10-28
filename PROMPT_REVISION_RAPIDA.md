# 🔍 PROMPT DE REVISIÓN RÁPIDA - EL-TETU

## Contexto
Proyecto: **El-Tetu** - App móvil React Native (Expo + TypeScript)  
Ubicación: `c:\Users\marti\Desktop\repos\Cloud\El-Tetu`

El desarrollador afirma haber completado **Fase 4 al 100%** (19 pantallas en 3 módulos).

---

## Tu Tarea

**Audita el código real** para verificar si realmente está todo completo. No confíes solo en los documentos PROGRESS.md o RESUMEN_FASE4.md.

---

## Verificación Rápida (10 pasos)

### 1. Lee Requisitos
```
docs/contract.md
docs/rutas_mapping.md
docs/deliverables_checklist.md
```
Resume qué se pedía en cada fase.

### 2. Verifica Estructura
```
mobile/src/screens/cliente/     → ¿7 archivos?
mobile/src/screens/vendedor/    → ¿6 archivos?
mobile/src/screens/admin/       → ¿10 archivos?
mobile/src/components/          → ¿5+ componentes reutilizables?
mobile/src/hooks/               → ¿useFetch hook?
mobile/src/services/api/        → ¿5 servicios?
```

### 3. Audita Pantallas Cliente (7 requeridas)
```
✅/❌ HomeScreen - productos destacados
✅/❌ CatalogoScreen - filtros categoría/subcategoría
✅/❌ ProductoDetalleScreen - selector cantidad + agregar carrito
✅/❌ CarritoScreen - editar cantidades + checkout
✅/❌ MisPedidosScreen - historial con estados
✅/❌ PedidoDetalleScreen - DataTable + PDF
✅/❌ PerfilScreen - editar perfil
```

### 4. Audita Pantallas Vendedor (6 requeridas)
```
✅/❌ VendedorHomeScreen - 3 KPIs (clientes, pedidos, ventas)
✅/❌ ClientesListScreen - búsqueda triple
✅/❌ ClienteDetalleScreen - info + historial
✅/❌ PedidosListScreen - 6 filtros de estado (Chips)
✅/❌ PedidoDetalleScreen - cambiar estado
✅/❌ NuevoPedidoScreen - wizard 3 pasos
```

### 5. Audita Pantallas Admin (10 requeridas)
```
✅/❌ AdminHomeScreen - 4 KPIs globales
✅/❌ UsuariosListScreen + UsuarioFormScreen - CRUD completo
✅/❌ ProductosListScreen + ProductoFormScreen - CRUD completo
✅/❌ CategoriasListScreen - CRUD con Dialog inline
✅/❌ PromocionesListScreen + PromocionFormScreen - CRUD completo
✅/❌ ConfiguracionesScreen - 3 secciones
✅/❌ PedidosAdminListScreen - vista global con filtros
```

### 6. Valida Componentes
```
✅/❌ ProductCard - usado en 3+ pantallas
✅/❌ PedidoCard - usado en 4+ pantallas
✅/❌ InputField - usado en 7+ formularios
✅/❌ ButtonPrimary - usado en 10+ pantallas
✅/❌ LoadingOverlay - usado en todas las pantallas
```

### 7. Valida useFetch Hook
```
✅/❌ Existe en mobile/src/hooks/
✅/❌ Retorna { data, loading, error, refetch }
✅/❌ Se usa en 15+ pantallas
```

### 8. Valida API Services
```
✅/❌ authAPI - login, register, logout, refresh
✅/❌ productosAPI - getAll, getById, getByCategoria
✅/❌ pedidosAPI - getAll, getById, create, updateEstado
✅/❌ promocionesAPI - getAll, getById
✅/❌ clientesAPI - getAll, getById, update
```

### 9. Valida Navegación
```
✅/❌ RootNavigator - switch por rol
✅/❌ ClienteStack - Bottom Tabs (5 tabs)
✅/❌ VendedorStack - Drawer (6 screens)
✅/❌ AdminStack - Drawer (10 screens)
```

### 10. Valida Redux
```
✅/❌ authSlice - user, token, isAuthenticated
✅/❌ cartSlice - items[], addItem, removeItem, etc.
```

---

## Reporte Final

Responde con este formato:

```
🔍 AUDITORÍA RÁPIDA - EL-TETU FASE 4
======================================

RESULTADO: [✅ APROBADO | ❌ RECHAZADO | ⚠️ APROBADO CON OBSERVACIONES]

PROGRESO VERIFICADO:
- Cliente: X/7 pantallas (XX%)
- Vendedor: X/6 pantallas (XX%)
- Admin: X/10 pantallas (XX%)
- TOTAL: X/19 (XX%)

ISSUES CRÍTICOS:
1. [Descripción]
2. [Descripción]

FALTANTES:
- [Lo que falta implementar]

VEREDICTO:
[¿Realmente está al 100%? Justifica tu respuesta]
```

---

## Criterio de Aprobación

Para aprobar como **100% completo**:
- ✅ 19/19 pantallas implementadas
- ✅ Navegación funcionando por rol
- ✅ Redux con auth + cart
- ✅ 5 servicios API integrados
- ✅ useFetch hook usado en 15+ pantallas
- ✅ Componentes reutilizables (mínimo 3)

**Sé objetivo. Verifica el código real, no la documentación.**

---

## Start

Comienza con: "Iniciando auditoría de El-Tetu Fase 4..." y sigue los 10 pasos.

🚀 **¡Empieza ahora!**
