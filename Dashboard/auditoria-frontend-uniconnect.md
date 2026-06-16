# Auditoria de Codigo — Frontend UniConnect
**Instrucciones para el equipo:** Pega este prompt completo en la IA de tu preferencia (ChatGPT, Gemini, Copilot, etc.). Luego, en el mismo chat, pega el codigo fuente de los componentes y servicios relevantes a tus HU asignadas. La IA generara el reporte. Guarda ese reporte como texto y subelo a la plataforma.

---

## PROMPT DE AUDITORIA — FRONTEND

Actua como un arquitecto frontend senior con especialidad en React, patrones de diseno para interfaces de usuario y arquitectura de aplicaciones web modernas. Tu tarea es realizar una auditoria de codigo rigurosa y detallada del frontend del proyecto **UniConnect**, desarrollado por estudiantes universitarios de Ingenieria de Software.

### Contexto del proyecto
UniConnect es una plataforma universitaria construida con:
- **Framework:** React 18 con componentes funcionales y Hooks (sin clases)
- **Build tool:** Vite
- **Estado del servidor:** TanStack React Query para cache y sincronizacion
- **Graficas:** Recharts
- **Editor MD:** @uiw/react-md-editor
- **Estilos:** CSS inline (style props), sin framework de UI externo
- **Comunicacion con API:** Fetch nativo en capa de servicios (`src/services/trackingApi.js`)
- **Sprint evaluado:** [COMPLETAR: Sprint 3 / Sprint 4]
- **Historias de usuario implementadas:** [COMPLETAR: ej. US-W01, US-W02, US-D01, ...]
- **Configuracion del equipo:** [COMPLETAR: Equipo completo / Pareja / Individual]
- **Integrantes:** [COMPLETAR: nombres]

### Archivos a auditar
El equipo debe pegar el contenido de los componentes React y servicios relacionados con las HU implementadas:
- Componentes en `src/components/` relacionados con sus HU
- Funciones en `src/services/trackingApi.js` relacionadas con sus HU
- Hooks personalizados en `src/hooks/` si existen

> **Importante:** Pega solo el codigo de los componentes y servicios que corresponden a las HU asignadas a tu equipo/pareja/persona.

---

## CRITERIOS DE EVALUACION (100 puntos)

Evalua cada criterio con una nota de 0 a la maxima indicada. Sé muy riguroso: una implementacion basica o casi automatica (escribir JSX sin estructura clara) no merece mas del 40% de los puntos de ese criterio. Para obtener puntaje alto se requiere evidencia de decisiones de diseno conscientes.

---

### 1. PATRONES DE DISENO EN REACT (40 puntos — criterio principal)

Evalua la presencia, correcta implementacion y justificacion de los siguientes patrones. Para cada patron encontrado, indica donde se aplica, si esta bien implementado y que mejoras necesita.

#### 1.1 Patron de Componentes Presentacionales vs Contenedores (8 pts)
- Existe separacion entre componentes que solo renderizan UI (presentacionales) y los que gestionan logica/estado (contenedores)?
- Los componentes presentacionales reciben todo via props y no hacen llamadas a la API?
- Los componentes contenedores delegan el renderizado a componentes hijos en lugar de mezclar JSX complejo con logica?

**Penalizar duramente si:** un solo componente tiene cientos de lineas mezclando state, fetch, logica de negocio y JSX.

#### 1.2 Custom Hooks — Extraccion de logica reutilizable (8 pts)
- La logica de estado reutilizable (fetching, formularios, filtros) esta extraida en custom hooks (`useXxx`)?
- Los hooks siguen las reglas de hooks de React (solo se llaman en el nivel superior)?
- Los hooks retornan objetos/tuplas con una interfaz clara y consistente?
- Se evita duplicar logica de estado identica en multiples componentes?

**Penalizar si:** toda la logica de estado esta incrustada directamente en los componentes sin extraerse.

#### 1.3 Patron Compound Components (6 pts)
- Para componentes complejos (modales, tabs, formularios multi-paso), se usa el patron de componentes compuestos?
- Los sub-componentes comparten estado via Context en lugar de prop drilling excesivo?
- La API del componente es intuitiva para quien lo usa?

#### 1.4 Patron Provider / Context API (6 pts)
- El estado global o compartido entre componentes distantes se maneja via Context?
- Los Context providers tienen una responsabilidad unica (no un Context que contiene todo)?
- Se evita prop drilling de mas de 2 niveles?

#### 1.5 Patron Facade en la capa de servicios (6 pts)
- Las llamadas a la API estan encapsuladas en `trackingApi.js` y los componentes no usan `fetch` directamente?
- Las funciones del servicio tienen nombres semanticos que expresan la intencion (`getSprintEvaluationWorkspace` vs `fetchData`)?
- Los componentes son independientes de los detalles HTTP (URL, headers, metodo)?

#### 1.6 Patron Observer / Reactive con React Query o useEffect (6 pts)
- Se usa TanStack React Query para sincronizacion de datos del servidor en lugar de useEffect + fetch manual?
- Si se usa useEffect para suscripciones, se limpian correctamente (cleanup function)?
- Los efectos secundarios estan correctamente gestionados sin memory leaks?

---

### 2. ARQUITECTURA DE COMPONENTES (20 puntos)

#### 2.1 Principio de Responsabilidad Unica (8 pts)
- Cada componente hace una sola cosa?
- Los componentes con mas de 150 lineas estan justificados o deberian dividirse?
- La estructura de carpetas y nombres refleja la responsabilidad de cada componente?

#### 2.2 Composicion sobre herencia (6 pts)
- Se prefiere componer componentes en lugar de usar herencia (extends)?
- Los componentes son extensibles via children, render props o slots en lugar de flags/booleans que cambian su comportamiento radicalmente?

#### 2.3 Cohesion y acoplamiento (6 pts)
- Los componentes que cambian juntos estan ubicados cerca (alta cohesion)?
- Los componentes no dependen de detalles internos de otros componentes (bajo acoplamiento)?
- Se usa la prop `key` correctamente en listas?

---

### 3. GESTION DE ESTADO (15 puntos)

#### 3.1 Estado local vs global — Uso apropiado (6 pts)
- El estado que solo pertenece a un componente se maneja con useState local?
- El estado del servidor se maneja con React Query y no con useState + useEffect manual?
- Se evita elevar estado al nivel global cuando no es necesario?

#### 3.2 Correctitud de useEffect (5 pts)
- Todos los useEffect tienen un array de dependencias correcto (ni vacio sin razon, ni incompleto)?
- Se evita usar useEffect para derivar estado (en cambio se usa useMemo)?
- No hay loops infinitos potenciales por dependencias mal definidas?

#### 3.3 Inmutabilidad y actualizaciones de estado (4 pts)
- El estado nunca se muta directamente (siempre se usa `setState` o el setter del hook)?
- Las actualizaciones de arrays/objetos crean nuevas referencias en lugar de modificar las existentes?

---

### 4. RENDIMIENTO (15 puntos)

#### 4.1 Memoizacion apropiada (6 pts)
- Se usa `useMemo` para calculos costosos que dependen de props/state?
- Se usa `useCallback` para funciones pasadas como props a componentes hijos?
- Se usa `React.memo` para componentes que se rerenderizarian innecesariamente?
- **Penalizar tambien** si se usa `useMemo`/`useCallback` de forma innecesaria (premature optimization)?

#### 4.2 Renderizado de listas (5 pts)
- Todas las listas renderizadas con `.map()` tienen prop `key` unica y estable (no el indice si el orden puede cambiar)?
- Las listas largas (>50 items) usan virtualizacion o paginacion?

#### 4.3 Code splitting y carga diferida (4 pts)
- Los componentes pesados o de carga poco frecuente usan `React.lazy` + `Suspense`?
- Las imagenes y recursos pesados se cargan de forma diferida?

---

### 5. CALIDAD DE CODIGO Y UX (10 puntos)

#### 5.1 Manejo de estados de la UI (4 pts)
- Todos los componentes que hacen fetch muestran estado de carga (loading), error y estado vacio?
- Los formularios tienen validacion en el cliente antes de enviar?

#### 5.2 Nomenclatura y consistencia (3 pts)
- Los componentes usan PascalCase?
- Los hooks usan prefijo `use`?
- Los handlers de eventos usan prefijo `handle` o `on`?

#### 5.3 Accesibilidad basica (3 pts)
- Los botones tienen texto descriptivo o `aria-label`?
- Las imagenes tienen atributo `alt`?
- Los formularios tienen labels asociados a sus inputs?

---

## FORMATO DE SALIDA REQUERIDO

Genera el reporte en el siguiente formato markdown exacto:

```
# Reporte de Auditoria — Frontend UniConnect
**Sprint:** [Sprint N]
**Equipo:** [nombre del grupo]
**Historias auditadas:** [lista de US-IDs]
**Fecha:** [fecha actual]
**IA utilizada:** [nombre de la IA]

---

## Puntuacion Total: XX / 100

| Categoria                         | Puntaje | Maximo |
|-----------------------------------|---------|--------|
| Patrones de Diseno en React       |         | 40     |
| Arquitectura de Componentes       |         | 20     |
| Gestion de Estado                 |         | 15     |
| Rendimiento                       |         | 15     |
| Calidad de Codigo y UX            |         | 10     |
| **TOTAL**                         |         | **100**|

---

## 1. Patrones de Diseno en React (X/40)

### Presentacional vs Contenedor (X/8)
**Hallazgos:**
[descripcion concreta con nombres de componentes]

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

## 2. Arquitectura de Componentes (X/20)
[misma estructura]

## 3. Gestion de Estado (X/15)
[misma estructura]

## 4. Rendimiento (X/15)
[misma estructura]

## 5. Calidad de Codigo y UX (X/10)
[misma estructura]

---

## Resumen Ejecutivo
[Parrafo de 5-8 oraciones sobre el estado general del frontend, patrones usados o ausentes, y madurez tecnica del equipo.]

## Top 5 Mejoras Prioritarias
1. [la mas critica primero]
2.
3.
4.
5.

## Conclusion
[Evaluacion honesta y rigurosa de si el equipo demuestra comprension de la arquitectura de componentes React, patrones de diseno frontend y gestion de estado apropiada.]
```

---

**AHORA PEGA EL CODIGO A CONTINUACION DE ESTE MENSAJE**
