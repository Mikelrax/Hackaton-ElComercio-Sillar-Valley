# Hackaton El Comercio - Sillar Valley

Monorepo con backend y frontend.

```
.
├── backend/    Spring Boot 4.1 · Java 21 · Maven · PostgreSQL · JWT
└── frontend/   Next.js 16 · React 19 · Tailwind CSS 4 · shadcn/ui
```

## Requisitos

- JDK 21 (`JAVA_HOME` debe apuntar a Java 21)
- PostgreSQL 16+
- Node.js 22+

## Backend

Crear la base local una sola vez (usuario y base `ayni`, contraseña `ayni`, solo para desarrollo):

```bash
psql -U postgres -h localhost -f backend/db/00_crear_base.sql
```

```bash
cd backend
./mvnw spring-boot:run
```

Corre en http://localhost:8080 · health check en `/actuator/health`. Flyway crea las tablas al arrancar y, con la base vacía, carga datos de ejemplo: moderador `900000001 / Moderador123`, vecinos `900000002` a `900000004 / Vecino1234`.

Autenticación con `Authorization: Bearer <token>` (se obtiene en `POST /api/auth/login`). Principales rutas: `/api/auth`, `/api/users`, `/api/posts`, `/api/responses`, `/api/uploads` y `/api/moderation` (solo moderadores).

## Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Corre en http://localhost:3000.

Agregar componentes de shadcn:

```bash
npx shadcn@latest add <componente>
```

## Despliegue

La app (**Ayni**) corre en Dokploy como un servicio Docker Compose con el `docker-compose.yml` de la raíz. Cada push a `main` dispara un deploy automático mediante un webhook de GitHub.

| Servicio | URL |
|---|---|
| App | https://aynibarrio.duckdns.org |
| Backend | https://api.aynibarrio.duckdns.org |

Variables de entorno configuradas en Dokploy:

- `NEXT_PUBLIC_API_URL`: URL pública del backend. Se fija al compilar el frontend, así que si cambia hay que volver a desplegar.
- `CORS_ALLOWED_ORIGINS`: URL de la app que puede llamar al backend (varias separadas por comas).
- `PUBLIC_BASE_URL`: URL pública del backend, para armar los enlaces de las imágenes subidas.
- `DB_PASSWORD`: contraseña de PostgreSQL (el servicio `db` del compose).
- `JWT_SECRET`: clave para firmar los tokens, de al menos 32 caracteres.
- `MODERATOR_INVITE_CODE`: código que convierte una cuenta nueva en moderador.

`DB_PASSWORD`, `JWT_SECRET` y `MODERATOR_INVITE_CODE` son obligatorias: sin ellas el deploy falla a propósito. `APP_SEED` queda en `false` en el compose, así que en producción no se crean cuentas de ejemplo.
