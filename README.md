# Dashboard Kanban (MVP) — n8n-ready

Tablero Kanban con login (JWT), tres columnas (Entrantes, En preparación, Entregados), 
actualizaciones en tiempo real con Socket.IO y webhooks para integrarse con n8n.

## Estructura
- `backend/` (Express + JSON file store)
- `frontend/` (React + Vite + @hello-pangea/dnd)
- `docker-compose.yml` (para levantar ambos)

## Variables de entorno (backend)
Copiar `.env.example` a `.env` si lo corrés fuera de Docker. Con Docker Compose podés pasarlas por `env`.

- `PORT` (default 3001)
- `JWT_SECRET`
- `CORS_ORIGIN` (separadas por coma)
- `N8N_STATUS_WEBHOOK` → URL del workflow en n8n para cambios de estado
- `N8N_FINALIZE_WEBHOOK` → URL del workflow en n8n para finalizados

## Correr local (sin Docker)
**Backend**
```bash
cd backend
cp .env.example .env
npm install
npm run start
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Abrir http://localhost:5173 y setear `VITE_API_URL=http://localhost:3001` si hace falta.

## Correr con Docker Compose
```bash
docker compose up --build -d
```
- Frontend: http://localhost:8080
- Backend: http://localhost:3001

## Endpoints (Backend)
- `POST /api/auth/login` → { username, password }
- `GET /api/orders` (Bearer token)
- `POST /api/orders/:id/status` (Bearer token) → { status: "incoming|preparing|delivered" }
- `POST /webhook/order` (n8n → backend) → { id?, title, details, color? } crea un pedido en "incoming"
- `POST /webhook/order-update` (n8n → backend) → { id, color?, details?, title? } actualiza y dispara evento

## Usuarios demo
- admin / admin123
- operario / operario123

## Integración con n8n
- Cuando movés una tarjeta: el backend llama `N8N_STATUS_WEBHOOK` con `{ id, status }`.
- Si el estado es `delivered`, llama `N8N_FINALIZE_WEBHOOK` con `{ id, status: 'delivered' }`.
- Para crear pedidos desde n8n, usar `POST /webhook/order`.
- Para cambiar color desde n8n, usar `POST /webhook/order-update` con `{ id, color: "#fef3c7" }` por ejemplo.

## Deploy con EasyPanel
1. Crear dos apps en EasyPanel: `kanban-backend` (construye `/backend`) y `kanban-frontend` (construye `/frontend`).
   - Para cada app, apuntá al repo y seleccioná la carpeta correcta como contexto de build.
2. Variables de entorno:
   - Backend: `JWT_SECRET`, `CORS_ORIGIN` (tu dominio del front), `N8N_*_WEBHOOK`.
   - Frontend: `VITE_API_URL` apuntando al dominio del backend.
3. Exponer puertos (backend 3001, frontend 80) y asignar dominios/SSL.

## Notas
- Este MVP usa un JSON (`backend/data/db.json`) para persistencia simple. Podés migrarlo a Postgres luego.
- `@hello-pangea/dnd` maneja el drag & drop. `socket.io` hace la actualización en vivo.
- Seguridad básica con JWT. Para producción real, agregar registro/gestión de usuarios, hashing de passwords, rate limiting, etc.
