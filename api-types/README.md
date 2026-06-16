# Uniconnect Frontend API Types

Este paquete contiene los tipos TypeScript autogenerados y clientes Zod basados en la especificación OpenAPI de los microservicios del backend.

## Uso

Este paquete es importado por los proyectos web (`Dashboard`) y móvil (`Mobile`) mediante una referencia local en su `package.json`.

```typescript
import { AuthTypes, AuthSchemas } from 'api-types';

// Uso de tipos (DTOs)
const userProfile: AuthTypes.components['schemas']['ProfileData'] = { ... };

// Uso de validación con Zod
const validResponse = AuthSchemas.getStatusResponseSchema.parse(rawData);
```

## Scripts disponibles

- `npm run generate`: Regenera los archivos TypeScript y Zod a partir de los `openapi.json` almacenados en el backend.
- `npm run build`: Compila los archivos generados a JavaScript y `.d.ts` en la carpeta `dist`.

## Mantenimiento

Recuerda que esta carpeta **nunca** debe ser modificada a mano. Si los contratos de la API cambian en el backend, debes:
1. Ejecutar el script generador de Swagger en el backend.
2. Ejecutar `npm run generate && npm run build` dentro de esta carpeta.
3. Verificar los errores de compilación de TypeScript en los proyectos que consumen este paquete.
