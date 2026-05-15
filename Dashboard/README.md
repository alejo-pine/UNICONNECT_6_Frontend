# UniConnect — Dashboard

Panel de administración y visualización web para la plataforma UniConnect, construido con **React**, **TypeScript** y **Vite**.

---

## 🚀 Pipeline CI/CD

El proyecto implementa un flujo de integración y despliegue continuo automatizado mediante **GitHub Actions** y **Fly.io**, diseñado para garantizar la estabilidad y seguridad del código en producción.

### Flujo de Trabajo (Main Branch)

Cada `push` a la rama `main` dispara automáticamente el pipeline en el siguiente orden:

1.  **Tests Unitarios**: Ejecución de la suite de pruebas con Vitest. Si alguna prueba falla, el flujo se detiene inmediatamente.
2.  **Build Docker**: Creación de la imagen de contenedor utilizando los `build-args` configurados para inyectar variables de entorno de Vite.
3.  **Deploy**: Despliegue de la nueva imagen en la infraestructura de Fly.io.

> [!IMPORTANT]
> Los Pull Requests a `main` también activan la ejecución de tests para validar cambios antes del merge, pero **no** disparan el despliegue automático.

---

## 🔐 Seguridad y Configuración

### GitHub Secrets

Para proteger la infraestructura y las credenciales, utilizamos **GitHub Secrets**. Nunca se deben subir archivos `.env` al repositorio (verificados en `.gitignore`).

**Secrets requeridos:**
*   `FLY_API_TOKEN`: Token de autenticación de Fly.io para autorizar el despliegue.
*   `VITE_*`: Variables de entorno para el build de frontend (API URLs, Auth0 Config, Supabase keys, etc.).

**Cómo configurar un nuevo Secret:**
1.  Navega a la pestaña **Settings** de tu repositorio en GitHub.
2.  En el menú lateral, selecciona **Secrets and variables** > **Actions**.
3.  Haz clic en **New repository secret**.
4.  Ingresa el nombre (ej. `FLY_API_TOKEN`) y su valor correspondiente.

---

## 🛠️ Comandos de Operación (Fly.io)

### Autenticación Local
Si necesitas operar el servicio desde tu terminal local:
```bash
fly auth login
```

### Despliegue Manual (Emergencia/Pruebas)
Aunque el pipeline automatiza esto, puedes forzar un despliegue manual si tienes los permisos adecuados:
```bash
fly deploy --remote-only
```

---

## 📋 Requisitos de Desarrollo

*   **Node.js**: v20 o superior.
*   **Variables de Entorno**: Copiar `.env.example` a `.env` y configurar los valores locales.

```bash
cp .env.example .env
npm install
npm run dev
```
