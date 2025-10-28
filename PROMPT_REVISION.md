# 🔍 PROMPT DE REVISIÓN - EL-TETU FASE 4

## Contexto del Proyecto

Eres un experto revisor de código especializado en React Native, TypeScript y arquitecturas móviles. Tu tarea es **auditar y validar** que el proyecto El-Tetu Mobile App haya completado correctamente las 4 fases de desarrollo según los requisitos establecidos.

---

## 📋 Información del Proyecto

**Nombre:** El-Tetu - Plataforma B2B/B2C  
**Tipo:** Aplicación móvil React Native (Expo)  
**Stack Técnico:**
- React Native 0.72.6 + Expo 49
- TypeScript 5.1.3
- React Native Paper 5.11.1 (Material Design)
- Redux Toolkit (auth, cart)
- React Navigation 6
- Axios (API integration)

**Repositorio:** `c:\Users\marti\Desktop\repos\Cloud\El-Tetu`

---

## 🎯 OBJETIVO DE LA REVISIÓN

Debes **verificar exhaustivamente** que se hayan completado las **4 fases del proyecto** según los documentos de requisitos. El desarrollador afirma haber completado el 100%, pero necesitamos validación independiente.

### Documentos de Referencia a Revisar

1. **`docs/contract.md`** - Contrato de API y endpoints requeridos
2. **`docs/rutas_mapping.md`** - Rutas y navegación requeridas
3. **`docs/assumptions.md`** - Supuestos técnicos y decisiones de diseño
4. **`docs/deliverables_checklist.md`** - Checklist de entregables por fase

---

## 🔍 TAREAS DE VALIDACIÓN

### PASO 1: Leer Documentación de Requisitos

**Acción:** Lee estos 4 documentos para entender QUÉ se debía entregar:

```
1. docs/contract.md - Verifica endpoints y estructura de API
2. docs/rutas_mapping.md - Verifica navegación y pantallas requeridas
3. docs/assumptions.md - Verifica supuestos técnicos
4. docs/deliverables_checklist.md - Verifica checklist de fases
```

**Output esperado:** Resume en una tabla qué se requería en cada fase.

---

### PASO 2: Verificar Estructura del Código

**Acción:** Explora la estructura de carpetas en `mobile/src/` y lista:

```bash
mobile/src/
├── screens/
│   ├── cliente/     # ¿Cuántas pantallas hay?
│   ├── vendedor/    # ¿Cuántas pantallas hay?
│   └── admin/       # ¿Cuántas pantallas hay?
├── components/      # ¿Qué componentes reutilizables existen?
├── hooks/           # ¿Qué custom hooks existen?
├── services/api/    # ¿Qué servicios API existen?
├── store/slices/    # ¿Qué slices de Redux existen?
├── navigation/      # ¿Cómo está estructurada la navegación?
└── theme/           # ¿Existe tematización?
```

**Output esperado:** 
- Listado completo de archivos en cada carpeta
- Comparación con lo requerido en `rutas_mapping.md`

---

### PASO 3: Auditoría de Pantallas por Módulo

#### MÓDULO CLIENTE (según docs, debería tener 7 pantallas)

**Acción:** Lee y analiza cada archivo en `mobile/src/screens/cliente/`:

1. **HomeScreen.tsx** - ¿Existe? ¿Tiene productos destacados?
2. **CatalogoScreen.tsx** - ¿Existe? ¿Tiene filtros categoría/subcategoría?
3. **ProductoDetalleScreen.tsx** - ¿Existe? ¿Tiene selector cantidad + agregar carrito?
4. **CarritoScreen.tsx** - ¿Existe? ¿Permite editar cantidades + checkout?
5. **MisPedidosScreen.tsx** - ¿Existe? ¿Muestra historial con estados?
6. **PedidoDetalleScreen.tsx** - ¿Existe? ¿Tiene DataTable + descarga PDF?
7. **PerfilScreen.tsx** - ¿Existe? ¿Permite editar perfil?

**Output esperado:**
```
✅ o ❌ para cada pantalla
- Si ❌: explicar qué falta
- Si ✅ parcial: detallar qué funcionalidades faltan
```

---

#### MÓDULO VENDEDOR (según docs, debería tener 6 pantallas)

**Acción:** Lee y analiza cada archivo en `mobile/src/screens/vendedor/`:

1. **VendedorHomeScreen.tsx** - ¿Dashboard con KPIs (clientes, pedidos, ventas)?
2. **ClientesListScreen.tsx** - ¿Lista con búsqueda triple (nombre/email/teléfono)?
3. **ClienteDetalleScreen.tsx** - ¿Info + historial de pedidos del cliente?
4. **PedidosListScreen.tsx** - ¿Filtros por 6 estados (Chips)?
5. **PedidoDetalleScreen.tsx** - ¿Cambiar estado + DataTable?
6. **NuevoPedidoScreen.tsx** - ¿3 pasos: cliente → productos → confirmar?

**Output esperado:**
```
✅ o ❌ para cada pantalla
- Verificar que los KPIs se calculen correctamente
- Verificar que los 6 estados de pedido existan
- Verificar wizard de 3 pasos
```

---

#### MÓDULO ADMIN (según docs, debería tener 10 pantallas)

**Acción:** Lee y analiza cada archivo en `mobile/src/screens/admin/`:

1. **AdminHomeScreen.tsx** - ¿Dashboard con 4 KPIs globales?
2. **UsuariosListScreen.tsx** - ¿Lista con búsqueda + CRUD?
3. **UsuarioFormScreen.tsx** - ¿Formulario 6 campos + switch activo?
4. **ProductosListScreen.tsx** - ¿Lista con búsqueda + CRUD?
5. **ProductoFormScreen.tsx** - ¿Formulario 7 campos (nombre, código, stock, precios, etc.)?
6. **CategoriasListScreen.tsx** - ¿CRUD con Dialog inline?
7. **PromocionesListScreen.tsx** - ¿Lista con CRUD?
8. **PromocionFormScreen.tsx** - ¿Formulario con tipo, descuento %, activo?
9. **ConfiguracionesScreen.tsx** - ¿3 secciones: datos comercio, preferencias, info sistema?
10. **PedidosAdminListScreen.tsx** - ¿Vista global con filtros por estado?

**Output esperado:**
```
✅ o ❌ para cada pantalla
- Verificar 4 KPIs en AdminHome (usuarios, productos activos, pedidos mes, ventas mes)
- Verificar Dialog inline en CategoriasListScreen
- Verificar 3 secciones en ConfiguracionesScreen
```

---

### PASO 4: Validar Componentes Reutilizables

**Acción:** Lee `mobile/src/components/` y verifica:

```
¿Existen estos componentes?
1. ProductCard - ¿Se usa en 3+ pantallas?
2. PedidoCard - ¿Se usa en 4+ pantallas?
3. InputField - ¿Se usa en 7+ formularios?
4. ButtonPrimary - ¿Se usa en 10+ pantallas?
5. LoadingOverlay - ¿Se usa en 19 pantallas?
```

**Output esperado:**
```
Para cada componente:
- ✅ Existe y se reutiliza en X pantallas
- ❌ No existe o no se reutiliza
```

---

### PASO 5: Validar Custom Hooks

**Acción:** Lee `mobile/src/hooks/` y verifica:

```
¿Existe useFetch<T>?
- ¿Retorna { data, loading, error, refetch }?
- ¿Se usa en 15+ pantallas?
- ¿Maneja estados de carga correctamente?
```

**Output esperado:**
```
✅ o ❌ useFetch hook
- Contar en cuántas pantallas se usa (buscar imports)
```

---

### PASO 6: Validar Servicios API

**Acción:** Lee `mobile/src/services/api/` y verifica que existan:

```
1. authAPI.ts - login, register, logout, refresh
2. productosAPI.ts - getAll, getById, getByCategoria
3. pedidosAPI.ts - getAll, getById, create, updateEstado
4. promocionesAPI.ts - getAll, getById
5. clientesAPI.ts - getAll, getById, update
```

**Output esperado:**
```
Para cada servicio:
- ✅ Existe con todos los métodos requeridos
- ❌ Falta o tiene métodos incompletos
```

---

### PASO 7: Validar Navegación

**Acción:** Lee `mobile/src/navigation/` y verifica:

```
¿Existe RootNavigator?
- ¿Switch por user.rol?

¿Existe ClienteStack?
- ¿Bottom Tabs con 5 tabs?

¿Existe VendedorStack?
- ¿Drawer Navigator con 6 screens?

¿Existe AdminStack?
- ¿Drawer Navigator con 10 screens?
```

**Output esperado:**
```
✅ o ❌ para cada stack
- Verificar que los nombres de las pantallas coincidan con rutas_mapping.md
```

---

### PASO 8: Validar Redux Store

**Acción:** Lee `mobile/src/store/` y verifica:

```
¿Existe authSlice?
- user, token, isAuthenticated

¿Existe cartSlice?
- items[], addItem, removeItem, updateQuantity, clearCart
```

**Output esperado:**
```
✅ o ❌ para cada slice
- Verificar acciones y reducers
```

---

### PASO 9: Verificar Integración de API

**Acción:** Busca en el código:

```bash
# Buscar uso de Axios interceptors
grep -r "axios.interceptors" mobile/src/

# Buscar manejo de JWT
grep -r "Authorization" mobile/src/

# Buscar refresh token
grep -r "refresh" mobile/src/services/
```

**Output esperado:**
```
✅ Interceptores configurados
✅ JWT automático en headers
✅ Refresh token implementado
```

---

### PASO 10: Revisar Documentos Generados

**Acción:** Lee estos archivos y verifica coherencia:

```
1. PROGRESS.md - ¿Refleja 100% de progreso?
2. RESUMEN_FASE4.md - ¿Detalla las 19 pantallas?
3. FASE4_COMPLETADA.md - ¿Estadísticas correctas?
4. README.md - ¿Actualizado con módulo Admin?
```

**Output esperado:**
```
✅ Documentación completa y coherente
❌ Inconsistencias encontradas (detallar)
```

---

## 📊 REPORTE FINAL ESPERADO

Después de completar los 10 pasos, genera este reporte:

### 1. Resumen Ejecutivo

```
ESTADO GENERAL: [APROBADO ✅ | RECHAZADO ❌ | APROBADO CON OBSERVACIONES ⚠️]

Progreso real verificado:
- Módulo Cliente: X/7 pantallas (XX%)
- Módulo Vendedor: X/6 pantallas (XX%)
- Módulo Admin: X/10 pantallas (XX%)
- TOTAL: X/19 pantallas (XX%)
```

### 2. Tabla de Validación Detallada

```markdown
| Componente | Requerido | Implementado | Estado | Observaciones |
|------------|-----------|--------------|--------|---------------|
| HomeScreen | ✅ | ✅/❌ | ✅/❌/⚠️ | ... |
| useFetch hook | ✅ | ✅/❌ | ✅/❌/⚠️ | ... |
| ... | ... | ... | ... | ... |
```

### 3. Issues Críticos Encontrados

```
CRÍTICO:
- [ ] Issue 1: Descripción detallada
- [ ] Issue 2: Descripción detallada

IMPORTANTE:
- [ ] Issue 3: Descripción detallada

MENOR:
- [ ] Issue 4: Descripción detallada
```

### 4. Funcionalidades Faltantes

```
Si el progreso NO es 100%, listar:
1. Pantalla X faltante
2. Componente Y incompleto
3. Funcionalidad Z no implementada
```

### 5. Calidad del Código

```
Evaluar:
- ✅/❌ TypeScript strict mode
- ✅/❌ Patrones consistentes
- ✅/❌ Componentes reutilizables
- ✅/❌ Error handling
- ✅/❌ Comentarios inline
```

### 6. Recomendaciones

```
PRIORITARIAS:
1. ...
2. ...

MEJORAS:
1. ...
2. ...
```

### 7. Veredicto Final

```
¿El proyecto cumple con las 4 fases completadas al 100%?

[ ] SÍ - Todo implementado según requisitos
[ ] NO - Faltan X pantallas/componentes
[ ] PARCIAL - Implementado pero con observaciones

Justificación:
...
```

---

## 🎯 CRITERIOS DE APROBACIÓN

Para que la Fase 4 sea considerada **100% COMPLETADA**, debe cumplir:

### Obligatorios (todos ✅)
- [ ] 19 pantallas implementadas (7 Cliente + 6 Vendedor + 6 Admin mínimo)
- [ ] Navegación multi-stack funcionando (por rol)
- [ ] Redux con authSlice y cartSlice
- [ ] Integración con API (5 servicios)
- [ ] Componentes reutilizables (mínimo 3)
- [ ] Custom hook useFetch
- [ ] Material Design con React Native Paper
- [ ] TypeScript en todos los archivos

### Deseables (80%+ para aprobar)
- [ ] Error handling consistente
- [ ] Loading states en todas las pantallas
- [ ] Formularios con validación
- [ ] CRUD completo en Admin
- [ ] Dashboards con KPIs reales
- [ ] Filtros y búsquedas funcionales

---

## 🚨 IMPORTANTE

**Sé estricto y objetivo.** No apruebes funcionalidades a medias. Si una pantalla existe pero le faltan features clave, márcala como ⚠️ o ❌.

**No te bases en los documentos de progreso generados** (PROGRESS.md, RESUMEN_FASE4.md). Estos pueden estar desactualizados o ser incorrectos. **Verifica el código real.**

**Prioriza los requisitos de `docs/`** sobre cualquier otra documentación.

---

## 📝 FORMATO DE RESPUESTA

Empieza tu respuesta con:

```
🔍 AUDITORÍA DE CÓDIGO - EL-TETU FASE 4
Fecha: [fecha actual]
Auditor: GitHub Copilot (sesión fresca)

========================================
PASO 1: LECTURA DE REQUISITOS
========================================
[Tu análisis aquí]

========================================
PASO 2: ESTRUCTURA DEL CÓDIGO
========================================
[Tu análisis aquí]

...

========================================
REPORTE FINAL
========================================
[Tu veredicto aquí]
```

---

## 🎯 TU MISIÓN

Eres el **quality gate** final. Tu trabajo es **validar o invalidar** la afirmación de que la Fase 4 está completa al 100%. 

**Sé minucioso. Sé crítico. Sé justo.**

¡Comienza la auditoría! 🚀
