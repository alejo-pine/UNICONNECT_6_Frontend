# Auditoria de Codigo — Mobile UniConnect
**Instrucciones para el equipo:** Pega este prompt completo en la IA de tu preferencia (ChatGPT, Gemini, Copilot, etc.). Luego, en el mismo chat, pega el codigo fuente de los archivos relevantes a tus HU asignadas (pantallas, componentes, servicios, navegacion). La IA generara el reporte. Guarda ese reporte como texto y subelo a la plataforma.

---

## PROMPT DE AUDITORIA — MOBILE

Actua como un arquitecto mobile senior con especialidad en React Native, patrones de diseno para aplicaciones moviles y UX nativa. Tu tarea es realizar una auditoria de codigo rigurosa y detallada de la aplicacion movil del proyecto **UniConnect**, desarrollada por estudiantes universitarios de Ingenieria de Software.

### Contexto del proyecto
UniConnect Mobile es la aplicacion movil de la plataforma universitaria:
- **Framework:** React Native con Expo (presuncion; ajustar si es diferente)
- **Navegacion:** React Navigation (Stack, Tab o Drawer)
- **Estado:** Hooks de React (useState, useReducer, useContext) y/o TanStack React Query
- **Comunicacion:** Fetch o Axios con la API REST del backend UniConnect
- **Plataformas objetivo:** iOS y Android
- **Sprint evaluado:** [COMPLETAR: Sprint 3 / Sprint 4]
- **Historias de usuario implementadas:** [COMPLETAR: ej. US-M01, US-M02, US-M03, ...]
- **Configuracion del equipo:** [COMPLETAR: Equipo completo / Pareja / Individual]
- **Integrantes:** [COMPLETAR: nombres]

### Archivos a auditar
El equipo debe pegar el codigo de los archivos relacionados con las HU implementadas:
- Pantallas (`screens/` o `pages/`)
- Componentes reutilizables (`components/`)
- Servicios y llamadas a API (`services/` o `api/`)
- Configuracion de navegacion
- Hooks personalizados si existen

---

## CRITERIOS DE EVALUACION (100 puntos)

Sé extremadamente riguroso. Una pantalla que simplemente renderiza una lista de datos sin estructura clara de patrones no merece mas del 35% del puntaje de su criterio. Para puntaje alto se requiere evidencia de decisiones arquitectonicas conscientes y codigo que un desarrollador mobile profesional reconoceria como bien estructurado.

---

### 1. PATRONES DE DISENO MOBILE (40 puntos — criterio principal)

#### 1.1 Patron Container / Presentational adaptado a mobile (8 pts)
- Las pantallas (`Screen`) actuan como contenedores que gestionan estado y logica, delegando UI a componentes presentacionales?
- Los componentes de UI son reutilizables y no estan acoplados a logica de negocio especifica?
- Se puede reutilizar un mismo componente visual en diferentes pantallas?

**Penalizar si:** cada pantalla es un monolito de 300+ lineas mezclando fetch, estado, logica y JSX nativo.

#### 1.2 Custom Hooks para logica reutilizable (8 pts)
- La logica de autenticacion, fetch, formularios o permisos esta extraida en custom hooks?
- Los hooks siguen las reglas de React Hooks?
- Se evita duplicar la misma logica de estado en multiples pantallas?

#### 1.3 Patron Navigator / Composite para navegacion (6 pts)
- La estructura de navegacion esta bien organizada (Stack dentro de Tab, navegacion anidada coherente)?
- Los parametros de navegacion (`route.params`) estan tipados o documentados?
- Se usa el patron de "pantalla puente" para navegacion condicionada por autenticacion?
- Las transiciones y headers de navegacion son consistentes en toda la app?

#### 1.4 Patron Facade para la capa de servicios (6 pts)
- Las llamadas a la API estan en un modulo de servicio separado, no directamente en las pantallas?
- Las funciones del servicio tienen nombres descriptivos de la accion de negocio?
- El manejo de tokens/autenticacion esta centralizado?

#### 1.5 Patron Observer / Reactive para datos en tiempo real (6 pts)
- Se usan mecanismos de actualizacion reactiva (polling, WebSockets, o React Query) para datos que cambian?
- Los efectos secundarios tienen cleanup functions para evitar memory leaks cuando el componente se desmonta?
- Se gestiona correctamente el ciclo de vida de la app (background/foreground)?

#### 1.6 Patron Strategy para adaptacion por plataforma (6 pts)
- Se usa `Platform.OS` o componentes especificos para adaptar comportamiento en iOS vs Android?
- Las diferencias de plataforma estan centralizadas (no esparcidas por todo el codigo)?
- Se usan estilos adaptativos (`StyleSheet.create` con plataforma)?

---

### 2. ARQUITECTURA MOBILE (20 puntos)

#### 2.1 Separacion de capas (8 pts)
- Existe separacion clara entre: presentacion (componentes/pantallas), logica de negocio (hooks/servicios) y acceso a datos (API/storage)?
- El estado de la app esta organizado de forma coherente (local vs global)?
- El modulo de navegacion esta separado de la logica de negocio?

#### 2.2 Manejo de estado offline y persistencia (6 pts)
- La app maneja correctamente la ausencia de conexion (mensajes de error, retry)?
- Si hay datos que deben persistir (tokens, preferencias), se usa AsyncStorage u otro mecanismo apropiado?
- Se valida la sesion antes de hacer llamadas a la API?

#### 2.3 Estructura de carpetas y organizacion (6 pts)
- La estructura de carpetas es intuitiva y escalable?
- Los archivos estan organizados por feature o por tipo de manera consistente?
- Se evitan dependencias circulares entre modulos?

---

### 3. RENDIMIENTO MOBILE (15 puntos)

#### 3.1 Optimizacion de listas (6 pts)
- Se usa `FlatList` o `SectionList` en lugar de `ScrollView` con `.map()` para listas largas?
- Se implementa `keyExtractor` correcto?
- Se usan `getItemLayout`, `initialNumToRender` o `windowSize` para listas grandes?
- Se evita renderizar componentes pesados en cada item de lista?

#### 3.2 Memoizacion y prevencion de re-renders (5 pts)
- Se usa `React.memo` para componentes que se rerenderizarian sin cambios en sus props?
- Se usa `useCallback` para handlers pasados a componentes hijos?
- Se usa `useMemo` para calculos costosos?

#### 3.3 Imagenes y assets (4 pts)
- Las imagenes tienen dimensiones definidas (evita layout shifts)?
- Se usa caching de imagenes (expo-image, react-native-fast-image o similar)?
- Los assets estaticos estan optimizados para movil?

---

### 4. UX Y EXPERIENCIA NATIVA (15 puntos)

#### 4.1 Feedback al usuario (6 pts)
- Todos los estados asincrono (loading, error, exito) tienen feedback visual?
- Se usan ActivityIndicator, Skeleton screens o spinners mientras carga?
- Los errores de red muestran mensajes amigables con opcion de reintentar?

#### 4.2 Comportamiento nativo (5 pts)
- Los gestos de swipe, pull-to-refresh y back button funcionan correctamente?
- El teclado no cubre los inputs (uso de KeyboardAvoidingView)?
- El scroll es fluido (sin jank)?

#### 4.3 Accesibilidad mobile (4 pts)
- Se usan `accessibilityLabel` en elementos interactivos?
- El contraste de colores es suficiente?
- Los elementos tocables tienen un area minima de 44x44 puntos?

---

### 5. CALIDAD DE CODIGO (10 puntos)

#### 5.1 Manejo de errores (4 pts)
- Se usan try/catch alrededor de llamadas a API?
- Los errores de red vs errores de servidor se manejan de forma diferente?
- La app no crashea silenciosamente?

#### 5.2 Nomenclatura y consistencia (3 pts)
- Componentes en PascalCase, hooks con prefijo `use`, constantes en UPPER_CASE?
- Los estilos estan en `StyleSheet.create` y no como objetos inline?

#### 5.3 Seguridad basica mobile (3 pts)
- Los tokens de autenticacion se almacenan en SecureStore (Expo) o Keychain, no en AsyncStorage plano?
- No se exponen credenciales o endpoints sensibles en el codigo del bundle?
- Se valida la respuesta del servidor antes de usarla?

---

## FORMATO DE SALIDA REQUERIDO

Genera el reporte en el siguiente formato markdown exacto:

```
# Reporte de Auditoria — Mobile UniConnect
**Sprint:** [Sprint N]
**Equipo:** [nombre del grupo]
**Historias auditadas:** [lista de US-IDs]
**Fecha:** [fecha actual]
**IA utilizada:** [nombre de la IA]

---

## Puntuacion Total: XX / 100

| Categoria                  | Puntaje | Maximo |
|----------------------------|---------|--------|
| Patrones de Diseno Mobile  |         | 40     |
| Arquitectura Mobile        |         | 20     |
| Rendimiento Mobile         |         | 15     |
| UX y Experiencia Nativa    |         | 15     |
| Calidad de Codigo          |         | 10     |
| **TOTAL**                  |         | **100**|

---

## 1. Patrones de Diseno Mobile (X/40)

### Container / Presentational (X/8)
**Hallazgos:**
[descripcion concreta con nombres de pantallas/componentes]

**Fortalezas:**
- [punto 1]

**Debilidades:**
- [punto 1]

**Codigo problematico (si aplica):**
```jsx
// lineas que ilustran el problema
```

**Recomendacion:**
- [accion concreta]

[repetir para cada patron]

---

## 2. Arquitectura Mobile (X/20)
[misma estructura]

## 3. Rendimiento Mobile (X/15)
[misma estructura]

## 4. UX y Experiencia Nativa (X/15)
[misma estructura]

## 5. Calidad de Codigo (X/10)
[misma estructura]

---

## Resumen Ejecutivo
[Parrafo de 5-8 oraciones sobre el estado general de la app, patrones usados o ausentes, madurez tecnica del equipo y adecuacion para produccion.]

## Top 5 Mejoras Prioritarias
1. [la mas critica primero]
2.
3.
4.
5.

## Conclusion
[Evaluacion honesta de si el equipo demuestra comprension de la arquitectura mobile, patrones de diseno y las particularidades de desarrollar para iOS/Android con React Native.]
```

---

**AHORA PEGA EL CODIGO A CONTINUACION DE ESTE MENSAJE**
