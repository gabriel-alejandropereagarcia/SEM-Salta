# SEM Salta Digital — Billetera Virtual sobre WhatsApp

Sistema de Estacionamiento Medido para la Ciudad de Salta, Argentina.  
Propuesta para Ordenanza 12.170 — PunaTech 2026.

## Arquitectura

```
Conductor (WhatsApp)  ←→  Backend (Express/TS)  ←→  Supabase (PostgreSQL + Realtime)
                                                   ↕
Permisionario (PWA Next.js)  ←←  Realtime Updates  ←←  Sesiones/cambios
```

## Componentes

| Directorio | Descripción |
|---|---|
| `supabase/` | Migraciones SQL (tablas, triggers, RLS, Realtime) |
| `backend/` | Node.js + TypeScript + Express (WhatsApp bot + MP API) |
| `pwa-permisionario/` | Next.js PWA para permisionarios (tiempo real) |
| `PROPOSAL.md` | Propuesta técnica completa |

## Quick Start

### 1. Base de datos (Supabase)

Ejecutar `supabase/migrations/001_initial_schema.sql` en el SQL Editor de Supabase.

### 2. Backend

```bash
cd backend
cp .env.example .env   # Completar credenciales
npm install
npm run dev
```

Endpoints principales:
- `GET/POST /webhook/whatsapp` — Webhook de Meta WhatsApp
- `POST /api/mp/create-preference` — Crear preferencia de pago
- `POST /api/mp/webhook` — Webhook de Mercado Pago
- `GET /api/zonas` — Listar zonas
- `GET /api/zonas/:cuc/sesiones-activas` — Sesiones activas por zona
- `POST /api/permisionarios/:id/pago-efectivo` — Registrar pago en efectivo
- `POST /api/test/seed` — Crear datos de demo
- `POST /api/test/estacionar` — Simular estacionamiento
- `POST /api/test/fin` — Simular finalización

### 3. PWA Permisionario

```bash
cd pwa-permisionario
cp .env.example .env.local   # Completar credenciales
npm install
npm run dev
```

- `/` — Landing page con simulador WhatsApp interactivo
- `/dashboard` — Dashboard del permisionario (requiere login)
- `/cuenta-corriente` — Historial de transacciones
- `/login` — Login por legajo

### 4. Datos de prueba

```bash
# Crear permisionario y usuario demo
curl -X POST http://localhost:3000/api/test/seed

# Cargar saldo al conductor
curl -X POST http://localhost:3000/api/test/cargar-saldo \
  -H "Content-Type: application/json" \
  -d '{"telefono":"5493875555123","monto":10000}'

# Simular estacionamiento
curl -X POST http://localhost:3000/api/test/estacionar \
  -H "Content-Type: application/json" \
  -d '{"telefono":"5493875555123","cuc":"A12","patente":"ABC123D"}'
```

## Comandos WhatsApp

| Comando | Ejemplo | Descripción |
|---|---|---|
| `ESTACIONAR <ZONA> <PATENTE>` | `ESTACIONAR A12 ABC123D` | Iniciar sesión |
| `FIN` | `FIN` | Finalizar sesión |
| `SALDO` | `SALDO` | Consultar saldo |
| `RECARGAR <MONTO>` | `RECARGAR 5000` | Generar link de pago MP |
| `TARIFAS` | `TARIFAS` | Ver tarifas vigentes |
| `AYUDA` | `AYUDA` | Ver comandos disponibles |

## Tarifas (Ordenanza 12.170)

| Vehículo | Tarifa base | Tarifa digital (20% desc.) | Permisionario | Comisión municipal |
|---|---|---|---|---|
| Auto | $700/h | $560/h | $560/h crédito | $140/h (efectivo) |
| Moto | $300/h | $240/h | $240/h crédito | $60/h (efectivo) |

## Tecnologías

- **WhatsApp Business API** (Meta Cloud) — Canal conversacional
- **Node.js + TypeScript + Express** — Backend
- **Supabase** (PostgreSQL + RLS + Realtime) — Base de datos y WebSockets
- **Next.js 14 (App Router)** — PWA del permisionario
- **Mercado Pago SDK** — Procesamiento de pagos
- **TailwindCSS** — Estilos