# Hackaton El Comercio - Sillar Valley

Monorepo con backend y frontend.

```
.
├── backend/    Spring Boot 4.1 · Java 21 · Maven
└── frontend/   Next.js 16 · React 19 · Tailwind CSS 4 · shadcn/ui
```

## Requisitos

- JDK 21 (`JAVA_HOME` debe apuntar a Java 21)
- Node.js 22+

## Backend

```bash
cd backend
./mvnw spring-boot:run
```

Corre en http://localhost:8080 · health check en `/actuator/health`.
Las rutas bajo `/api/**` aceptan CORS desde `app.cors.allowed-origins` (por defecto http://localhost:3000).

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
