# UniConnect

Aplicación móvil universitaria desarrollada para la **Universidad de Caldas** que facilita la conexión entre estudiantes, permitiéndoles compartir información académica, gestionar su perfil y descubrir compañeros con intereses afines.

## Tecnologías

| Categoría      | Tecnología                         |
| -------------- | ---------------------------------- |
| Framework      | React Native 0.81 + Expo SDK 54    |
| Lenguaje       | TypeScript ~5.9                    |
| Navegación     | Expo Router 6 (file-based routing) |
| Estado global  | Zustand 5                          |
| Imágenes       | expo-image                         |
| Autenticación  | expo-auth-session (Google OAuth)   |
| Backend client | Supabase JS 2.x                    |
| Animaciones    | react-native-reanimated 4          |

## Estructura del Proyecto

```
├── app/                            # Rutas (Expo Router file-based)
│   ├── _layout.tsx                 # Layout raíz con Stack principal
│   ├── +not-found.tsx              # Pantalla 404
│   ├── (tabs)/                     # Navegación por pestañas
│   │   ├── _layout.tsx             # Configuración de tabs
│   │   ├── index.tsx               # Inicio
│   │   ├── explore.tsx             # Explorar
│   │   └── profile.tsx             # Perfil (vista)
│   ├── (onboarding)/               # Flujo de primer ingreso
│   │   ├── _layout.tsx             # Layout onboarding
│   │   └── complete-profile.tsx    # Completar perfil tras registro
│   └── profile/                    # Rutas de perfil (modales/stack)
│       ├── _layout.tsx             # Layout con header
│       ├── edit-profile.tsx        # Edición de perfil
│       └── completeInformation.tsx # Completar información
├── src/
│   ├── features/
│   │   └── profile/                # Módulo de perfil
│   │       ├── screens/            # Pantallas principales
│   │       ├── components/         # Componentes del módulo
│   │       ├── hooks/              # Lógica de formularios
│   │       └── types/              # Tipos TypeScript
│   ├── components/                 # Componentes reutilizables (UI)
│   ├── services/                   # Servicios de API
│   ├── store/                      # Estado global (Zustand)
│   ├── hooks/                      # Hooks compartidos
│   └── theme/                      # Paleta de colores
├── assets/                         # Imágenes y fuentes
├── app.json                        # Configuración de Expo
└── eas.json                        # Configuración de EAS Build
```

## Funcionalidades Implementadas (Sprint 1)

### Módulo de Perfil

Módulo completo de gestión del perfil universitario con dos modos de uso:

- **Vista de perfil** — Pantalla de solo lectura que muestra avatar, nombre, carrera, semestre, teléfono y materias actuales. Se carga dinámicamente desde el backend mediante `profileService`.
- **Edición de perfil** — Formulario reutilizable (`EditProfileScreen`) con:
  - Selector de avatar (integración con `expo-image-picker`)
  - Selector de carrera (14 carreras de la Universidad de Caldas)
  - Selector de semestre (1–10)
  - Campo de teléfono de contacto
  - Gestor de materias (agregar/eliminar con modal)
  - Validación de campos obligatorios
  - Soporte automático para dark mode

- **Onboarding** — Flujo de primer completado de perfil tras el registro. Reutiliza `EditProfileScreen` con el prop `isOnboarding` y redirige a la pantalla principal al finalizar.

**Componentes del módulo:**

| Componente            | Descripción                                       |
| --------------------- | ------------------------------------------------- |
| `ProfileViewScreen`   | Pantalla de visualización del perfil              |
| `EditProfileScreen`   | Pantalla de edición (onboarding y edición normal) |
| `ProfileHeader`       | Avatar circular con botón de editar foto          |
| `AcademicInfoSection` | Selects de carrera y semestre                     |
| `ContactInfoSection`  | Campo de teléfono                                 |
| `SubjectsSection`     | Gestión de materias (agregar/eliminar)            |
| `SubjectsDisplay`     | Tags de materias en vista de lectura              |
| `ProfileInfoItem`     | Ítem genérico de información                      |
| `SectionHeader`       | Encabezado de sección reutilizable                |
| `SaveButton`          | Botón de guardar con estado de carga              |

### Navegación

- **Tab Bar** con tres pestañas: Inicio, Explorar y Perfil
- **Stack Navigation** para rutas de edición y onboarding
- **Typed Routes** habilitadas para seguridad de tipos en navegación

### Estado Global

Store de autenticación con Zustand (`authStore.ts`):

- Flag `needsCompleteProfile` para controlar el flujo de onboarding
- Acciones `setNeedsCompleteProfile` y `markProfileAsComplete`

### Servicios de API

`profileService.ts` con endpoints listos para integrar con el backend:

- `getProfileById(id, token)` — Obtener perfil por ID
- `updateProfile(id, data, token)` — Actualizar perfil
- `updateProfileSubjects(id, subjectIds, token)` — Gestionar materias
- `uploadAvatar(id, uri, token)` — Subir foto de perfil

La URL del backend se resuelve automáticamente usando `Constants.expoConfig.hostUri` en desarrollo.

### Paleta de Colores

| Color            | Hex       | Uso                       |
| ---------------- | --------- | ------------------------- |
| Primary          | `#00284D` | Headers, botones, acentos |
| Gold             | `#C5A059` | Detalles secundarios      |
| Background Light | `#F8F9FA` | Fondo modo claro          |
| Background Dark  | `#0F172A` | Fondo modo oscuro         |

## Requisitos Previos

- [Node.js](https://nodejs.org/) v18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) instalado en el dispositivo móvil
- Cuenta de [Expo](https://expo.dev/)

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd UNICONNECT_2_Frontend

# Instalar dependencias
npm install
```

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_API_TOKEN=<token-del-backend>
EXPO_PUBLIC_TEST_USER_ID=<id-de-usuario-para-pruebas>
```

## Ejecución

```bash
# Iniciar servidor de desarrollo
npx expo start

# Iniciar con caché limpio
npx expo start --clear

# Verificar salud del proyecto
npx expo doctor
```

Escanear el código QR con **Expo Go** en el dispositivo.

## Scripts Disponibles

| Script               | Comando                    | Descripción                      |
| -------------------- | -------------------------- | -------------------------------- |
| `start`              | `npx expo start`           | Inicia el servidor de desarrollo |
| `lint`               | `npx expo lint`            | Ejecuta ESLint                   |
| `android`            | `npx expo start --android` | Inicia en emulador Android       |
| `ios`                | `npx expo start --ios`     | Inicia en simulador iOS          |
| `draft`              | Workflow EAS               | Publica preview update           |
| `development-builds` | Workflow EAS               | Crea builds de desarrollo        |
| `deploy`             | Workflow EAS               | Despliega a producción           |

## Build y Despliegue

El proyecto está configurado con **EAS Build** para compilación nativa:

```bash
# Build de desarrollo
npx eas-cli@latest build --profile development --platform android

# Build de preview
npx eas-cli@latest build --profile preview --platform android

# Build de producción
npx eas-cli@latest build --profile production --platform android
```

## Equipo

| Integrante | Módulo                                        |
| ---------- | --------------------------------------------- |
| Alejandro  | Autenticación con Google OAuth                |
| Compañero  | Módulo de perfil (vista, edición, onboarding) |

## Licencia

Proyecto académico — Universidad de Caldas, Ingeniería de Sistemas.
