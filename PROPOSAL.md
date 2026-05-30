# SEM Salta — Propuesta Técnica PunaTech 2026

## Sistema de Estacionamiento Medido — Billetera Virtual sobre WhatsApp

---

## 1. Flujo Completo de Pago para el Conductor

### 1.1 Registro e Ingreso

El conductor no necesita descargar ninguna aplicación. Todo el flujo ocurre dentro de WhatsApp, el canal de mensajería con mayor penetración en Argentina (94% de la población).

```
Conductor envíe un mensaje al número oficial del SEM Salta
    │
    ├─ Si es primera vez → Se crea automáticamente un perfil
    │   con saldo $0 en la billetera virtual
    │
    └─ Si ya existe → Se recupera su perfil y saldo actual
```

**Principio de diseño**: Cero fricción. No hay registro previo, no hay formularios, no hay descargas. El primer mensaje crea la cuenta.

### 1.2 Flujo de Estacionamiento Digital (pago con billetera)

```
┌──────────────────────────────────────────────────────────┐
│  CONDUCTOR ENTRANTE                                      │
│                                                          │
│  1. El conductor estaciona en una cuadra con cartel SEM  │
│  2. Lee el Código Único de Cuadra (CUC) en el cartel    │
│     Ejemplo: "A12"                                       │
│  3. Envía por WhatsApp:                                  │
│     ESTACIONAR A12 ABC123D                               │
│     o (con tipo explícito):                              │
│     ESTACIONAR A12 ABC123D MOTO                          │
│                                                          │
│  ─── SISTEMA VERIFICA ───                                │
│  ✓ Zona A12 existe                                      │
│  ✓ No hay sesión activa previa                          │
│  ✓ Hay lugares disponibles en la zona                   │
│  ✓ Saldo suficiente ($560 mín. auto / $240 mín. moto)   │
│                                                          │
│  ─── RESPUESTA DEL BOT ───                               │
│  ✅ Estacionamiento iniciado                             │
│  🚗 Patente: ABC123D                                    │
│  📍 Zona: A12                                           │
│  🕐 Hasta: 14:30                                        │
│  📱 Pago digital - 20% descuento aplicado               │
│                                                          │
│  Escribí FIN cuando quieras terminar.                    │
│                                                          │
│  NOTA: No se descuenta saldo en este momento.           │
│  Se reserva el equivalente a 1 hora y se ajusta al     │
│  finalizar según el tiempo real consumido.              │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  CONDUCTOR SALIENTE                                      │
│                                                          │
│  El conductor envía: FIN                                 │
│                                                          │
│  ─── SISTEMA CALCULA ───                                 │
│  Tiempo total: 1h 23min                                 │
│  - Primera hora: $560 (tarifa digital auto)              │
│  - Excedente 23min → 2 fracciones de 15min              │
│    (con tolerancia de 5min se descuenta 3min)           │
│    = 2 × ($560/4) = $280                                │
│  - Total: $560 + $280 = $840                             │
│                                                          │
│  ─── RESPUESTA DEL BOT ───                               │
│  🏁 Estacionamiento finalizado                           │
│  🚗 Patente: ABC123D                                    │
│  ⏱ Duración: 1h 23min                                   │
│  💰 Costo: $840                                          │
│  📄 Saldo restante: $4.160                              │
│                                                          │
│  ¡Gracias por usar SEM Digital! 🙏                      │
│                                                          │
│  ─── CLEARING AUTOMÁTICO ───                            │
│  → Permisionario recibe CRÉDITO: $560/h × horas        │
│  → Municipalidad recibe vía impuestos (no en este flujo) │
└──────────────────────────────────────────────────────────┘
```

### 1.3 Flujo de Recarga de Saldo (Mercado Pago)

```
Conductor envía: RECARGAR 5000

    ─── SISTEMA ───
    Se genera una Preferencia de pago en Mercado Pago
    con el monto solicitado.

    ─── RESPUESTA DEL BOT ───
    💳 Recarga de saldo
    Monto: $5.000

    Pagá en el siguiente link:
    https://mpago.la/abc123

    El saldo se acreditará automáticamente.

    ─── WEBHOOK MP → SISTEMA ───
    Mercado Pago notifica pago aprobado
    → Se actualiza saldo_billetera en Supabase
    → Se inserta registro en cargas_saldo
    → Bot envía mensaje de confirmación:
      "✅ Recarga exitosa. Se cargaron $5.000."
```

### 1.4 Flujo Alternativo: Pago en Efectivo al Permisionario

```
Conductor no tiene saldo/wifi/app
    │
    ├─ El conductor le paga en efectivo al permisionario
    │  (como funciona hoy, pero ahora con registro digital)
    │
    └─ El permisionario registra el pago desde su PWA:
       ├─ Ingresa patente + tipo de vehículo
       ├─ Se crea la sesión con metodo_pago = "efectivo"
       └─ Se genera un DÉBITO automático en la cuenta
          corriente del permisionario por la comisión
          municipal (20% de la tarifa base):
          • Auto: $140/h (20% de $700)
          • Moto: $60/h (20% de $300)

    Esto garantiza que la Municipalidad siempre cobra su
    comisión, independientemente del medio de pago.
```

### 1.5 Flujo de Consultas

| Comando | Respuesta |
|---------|-----------|
| `SALDO` | Muestra saldo disponible en la billetera |
| `TARIFAS` | Muestra tarifas vigentes con descuento digital |
| `AYUDA` | Lista todos los comandos disponibles |
| Cualquier otro texto | Si tiene sesión activa, muestra su estado + ayuda |

---

## 2. Rol del Permisionario y Garantía de Continuidad

### 2.1 Rol en el Nuevo Sistema

El permisionario es un **agente activo** del sistema, no un pasivo receptor. Sus funciones son:

| Función | Detalle |
|---------|---------|
| **Control de presencia** | Ve en tiempo real qué autos están en su cuadra (vía PWA con Supabase Realtime) |
| **Registro de efectivo** | Cuando un conductor paga en efectivo, el permisionario lo registra digitalmente desde la PWA |
| **Verificación** | Puede consultar si un vehículo tiene sesión activa o no |
| **Cobro de digital** | No necesita hacer nada — los pagos digitales se acreditan automáticamente en su cuenta corriente |

### 2.2 Modelo de Cuenta Corriente Virtual (Clearing)

```
┌─────────────────────────────────────────────────┐
│  CUENTA CORRIENTE DEL PERMISIONARIO             │
│                                                 │
│  CRÉDITOS (pagos digitales en su zona):         │
│  ┌───────────────────────────────────────────┐ │
│  │ Auto ABC123 - Digital  +$560 (1h)         │ │
│  │ Moto DEF456 - Digital  +$240 (1h)         │ │
│  │ Auto GHI789 - Digital  +$700 (1h 15min)   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  DÉBITOS (comisión municipal por efectivo):     │
│  ┌───────────────────────────────────────────┐ │
│  │ Auto JKL012 - Efectivo  -$140 (1h)        │ │
│  │ Moto MNO345 - Efectivo  -$60 (1h)         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  SALDO: +$1.300                                │
│                                                 │
│  → Se liquida periódicamente (semanal/quincenal)│
│  → Se transfiere a cuenta bancaria del permis.  │
└─────────────────────────────────────────────────┘
```

### 2.3 Garantía de Continuidad Económica

**Principio fundamental**: El permisionario SIEMPRE percibe el equivalente al 80% de la tarifa base por cada hora de estacionamiento, sin importar el medio de pago.

| Escenario | Conductor paga | Permisionario recibe | Municipalidad recibe |
|-----------|---------------|---------------------|---------------------|
| Digital (auto) | $560/h (con 20% descuento) | $560/h crédito | La diferencia la absorbe el sistema (la ganancia del permisionario es la misma) |
| Efectivo (auto) | $700/h al permisionario | $560/h neto (se descuenta $140 débito comisión) | $140/h comisión |
| Digital (moto) | $240/h (con 20% descuento) | $240/h crédito | Ídem |
| Efectivo (moto) | $300/h al permisionario | $240/h neto (se descuenta $60 débito comisión) | $60/h comisión |

**Resultado**: El permisionario gana exactamente lo mismo por digital que por efectivo. El descuento del 20% lo absorbe la municipalidad como incentivo para la adopción digital, no el permisionario.

### 2.4 PWA del Permisionario — Pantallas

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  DASHBOARD      │  │  REGISTRO       │  │  CUENTA         │
│                 │  │  EFECTIVO       │  │  CORRIENTE       │
│ ┌─────────────┐ │  │                 │  │                 │
│ │ Saldo:      │ │  │ Patente: ____   │  │ Saldo: $1.300  │
│ │ $1.300      │ │  │ Tipo: 🚗 🏍    │  │                 │
│ │ Zona: A12   │ │  │                 │  │ +$560 Digital   │
│ │ 8/20 autos  │ │  │ [Registrar]     │  │ +$240 Digital   │
│ └─────────────┘ │  │                 │  │ -$140 Comisión  │
│                 │  │                 │  │ -$60 Comisión   │
│ ┌─────────────┐ │  │                 │  │                 │
│ │ ABC123D 🚗  │ │  │                 │  │ [Ver más...]    │
│ │ 13:00→14:00 │ │  │                 │  │                 │
│ │ 📱 Digital   │ │  │                 │  │                 │
│ ├─────────────┤ │  │                 │  │                 │
│ │ DEF456 🏍   │ │  │                 │  │                 │
│ │ 13:15→14:15 │ │  │                 │  │                 │
│ │ 💵 Efectivo  │ │  │                 │  │                 │
│ └─────────────┘ │  │                 │  │                 │
│                 │  │                 │  │                 │
│ 💵 Registrar   │  │                 │  │                 │
│ Efectivo       │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 3. Mecanismo de Registro Digital del Pago en Efectivo

### 3.1 Flujo Completo

```
Escenario: Un conductor se estaciona y quiere pagar en efectivo.

   CONDUCTOR                                    PERMISIONARIO
       │                                              │
       │  "Quiero pagar en efectivo"                  │
       │─────────────────────────────────────────────►│
       │                                              │
       │                                              │  Abre PWA → "Registrar Pago Efectivo"
       │                                              │  Ingresa: Patente ABC123D, Tipo: Auto
       │                                              │  Presiona: [Registrar]
       │                                              │
       │                                  SISTEMA (automático):
       │                                  1. Crea sesión con metodo_pago = "efectivo"
       │                                  2. Genera DÉBITO en cuenta corriente
       │                                     del permisionario: -$140 (20% tarifa base auto)
       │                                  3. Puja en Supabase Realtime
       │                                     → el auto aparece en el dashboard en tiempo real
       │                                              │
       │  "Estacionado,_zone A12, hasta las 15:00"    │
       │◄─────────────────────────────────────────────│
       │                                              │
       │  (El conductor NO usa WhatsApp en este caso) │
       │                                              │
       │                                                  CUANDO EL AUTO SE VA:
       │                                              │
       │                                  El permisionario marca FIN
       │                                  desde la PWA, o el sistema
       │                                  finaliza automáticamente
       │                                  al pasar la hora.
       │                                              │
       │                                  SISTEMA: Calcula costo final
       │                                  • Si <= 1h: comisión = 1h × $140
       │                                  • Si > 1h: se ajusta proporcionalmente
       │                                  • Se actualiza DÉBITO en cuenta corriente
       │                                              │
```

### 3.2 Características del Registro Digital de Efectivo

| Característica | Detalle |
|---|---|
| **Trazabilidad** | Cada pago en efectivo genera un registro en `sesiones_estacionamiento` con `metodo_pago = 'efectivo'` |
| **Comisión automática** | El 20% de la tarifa base se debita automáticamente de la cuenta corriente del permisionario como comisión municipal |
| **Control de capacidad** | El auto se registra en tiempo real y ocupa un lugar de la cuadra — evita sobrecupo |
| **Doble control** | La Inspectoría Municipal puede verificar sesiones activas desde cualquier dispositivo |
| **Finalización** | El permisionario marca FIN desde la PWA, o el sistema auto-finaliza al pasar el tiempo estimado |
| **Auditoría completa** | La tabla `transacciones` con tipo `debito` documenta cada comisión cobrada |

### 3.3 Prevención de Evasión

- **Sin sesión = infracción**: Si un inspector no encuentra una sesión activa para un vehículo estacionado, labra acta de infracción
- **Control cruzado**: El inspector puede consultar la zona en tiempo real y comparar autos físicos vs. sesiones digitales
- **Notificación**: Si un auto se estaciona sin sesión, el permisionario recibe alerta para registrar

---

## 4. Stack Tecnológico

### 4.1 Arquitectura General

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  CONDUCTOR   │     │ PERMISIONARIO│     │ INSPECTOR     │
│  (WhatsApp)  │     │  (PWA Web)   │     │  (Futuro)     │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       │ Mensajes           │ HTTP/WS            │ HTTP
       ▼                    ▼                     ▼
┌──────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ WA Bot   │  │ MP Ctrl  │  │ REST API  │              │
│  │ Controller│  │ Controller│  │ Routes    │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │              │              │                      │
│  ┌────┴──────────────┴──────────────┴─────┐              │
│  │           SERVICES LAYER                │              │
│  │  ┌────────┐ ┌────────┐ ┌────────┐      │              │
│  │  │Parking │ │Wallet  │ │Clearing│      │              │
│  │  │Service │ │Service │ │Service │      │              │
│  │  └────────┘ └────────┘ └────────┘      │              │
│  └─────────────────────────────────────────┘              │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                  │
│                                                          │
│  ┌──────┐ ┌──────────┐ ┌───────┐ ┌─────────┐            │
│  │Zonas │ │Sesiones  │ │Usuarios│ │Transacc. │            │
│  └──────┘ └────┬─────┘ └───────┘ └─────────┘            │
│                │                                         │
│          Realtime                                         │
│          (WebSockets)                                     │
│                │                                         │
└────────────────┼────────────────────────────────────────┘
                 │
                 ▼
          PWA del Permisionario
          (actualizaciones en vivo)
```

### 4.2 Justificación de Cada Decisión Tecnológica

| Tecnología | Justificación |
|---|---|
| **WhatsApp Business API** (Meta Cloud) | 94% de penetración en Argentina. Cero fricción: no requiere descargar app ni registrarse. Conversacional e intuitivo. Mensajes bidireccionales con webhook para respuestas automáticas. |
| **Node.js + Express + TypeScript** | Ecosistema con mejor soporte para APIs de WhatsApp y Mercado Pago. TypeScript agrega seguridad de tipos en un sistema financiero. Express es lightweight y suficiente para un MVP. |
| **Supabase (PostgreSQL)** | Base de datos relacional robusta para el modelo de clearing financiero. RLS nativo para seguridad por rol. Realtime vía WebSockets para actualizar la PWA sin polling. Escalable para el volumen de una ciudad de 700K habitantes. |
| **Supabase Realtime** | Sustituye la necesidad de Socket.io o servidores WebSocket custom. Las suscripciones a `sesiones_estacionamiento` filtradas por `id_zona` permiten que cada permisionario solo reciba actualizaciones de SU cuadra. Escalado automático. |
| **Next.js (App Router)** | SSR para velocidad de carga en dispositivos móviles. App Router para code splitting automático. PWA installable desde el navegador. Ideal para la demo y futuro crecimiento. |
| **Mercado Pago SDK** | Procesador de pagos con mayor adopción en Argentina (70%+). Checkout Pro con redirect: no necesita manejar datos de tarjeta. Webhook para notificación asincrónica de pagos aprobados. |
| **Row Level Security (RLS)** | Cada permisionario solo accede a datos de su zona. El service_role del backend opera sin restricciones. Los usuarios WA solo acceden a sus propias sesiones. Capa de seguridad a nivel de base de datos, no solo aplicación. |

### 4.3 Modelo de Datos — Diagrama ER

```
┌─────────┐      ┌──────────────────┐      ┌──────────────┐
│  ZONAS  │◄─────│ SESIONES_ESTAC.  │──────►│ USUARIOS_WA │
│         │ 1:N  │                  │  N:1  │              │
│ cuc PK  │      │ patente          │       │ telefono PK  │
│ nombre  │      │ tipo_vehiculo    │       │ saldo_billet.│
│ capacid. │      │ estado           │       └──────┬───────┘
└─────────┘      │ metodo_pago      │              │
                 │ hora_inicio/fin  │              │
                 │ costo_total      │              │
                 └────────┬─────────┘              │
                          │                         │
                    ┌─────┴──────┐                  │
                    │            │                  │
              ┌─────┴─────┐    │                  ▼
              │PERMISIONA.│    │           ┌──────────────┐
              │           │    │           │CARGAS_SALDO  │
              │ legajo PK │    │           │              │
              │ saldo_cc   │    │           │ monto        │
              │ id_zona FK │    │           │ mp_pref_id   │
              └─────┬─────┘    │           │ mp_pay_id    │
                    │          │           │ estado       │
                    │          │           └──────────────┘
                    ▼          │
              ┌──────────┐    │
              │TRANSACC.  │    │
              │           │    │
              │ tipo      │◄───┘
              │ monto     │
              │ descrip.  │
              │ id_sesion │
              └──────────┘
```

### 4.4 Flujo de Datos en Tiempo Real

```
WhatsApp ──► Webhook ──► Parking Service ──► INSERT en sesiones_estacionamiento
                                                          │
                                                    Supabase Realtime
                                                          │
                                                          ▼
                                              PWA Permisionario
                                              (se actualiza automáticamente)
```

---

## 5. Demo Funcional

### 5.1 Cómo ejecutar la demo

```bash
# 1. Configurar Supabase
# Copiar el contenido de supabase/migrations/001_initial_schema.sql
# al SQL Editor de Supabase y ejecutar

# 2. Backend
cd backend
cp .env.example .env
# Completar las credenciales en .env
npm install
npm run dev

# 3. PWA Permisionario
cd pwa-permisionario
cp .env.example .env.local
# Completar las credenciales en .env.local
npm install
npm run dev
```

### 5.2 Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/webhook/whatsapp` | Verificación del webhook de Meta |
| POST | `/webhook/whatsapp` | Recepción de mensajes de WhatsApp |
| POST | `/api/mp/create-preference` | Crear preferencia de pago MP |
| POST | `/api/mp/webhook` | Webhook de notificación de MP |
| GET | `/api/zonas` | Listar todas las zonas |
| GET | `/api/zonas/:cuc/sesiones-activas` | Sesiones activas de una zona |
| GET | `/api/permisionarios/:id/saldo` | Saldo de cuenta corriente |
| GET | `/api/permisionarios/:id/transacciones` | Historial de transacciones |
| POST | `/api/permisionarios/:id/pago-efectivo` | Registrar pago en efectivo |
| GET | `/api/health` | Health check |

### 5.3 Simulación del flujo completo

**Sin WhatsApp real (testing manual):**

```bash
# Crear usuario WA
curl -X POST http://localhost:3000/api/test/create-user \
  -H "Content-Type: application/json" \
  -d '{"telefono": "5493875555123"}'

# Simular estacionamiento
curl -X POST http://localhost:3000/api/test/estacionar \
  -H "Content-Type: application/json" \
  -d '{"telefono": "5493875555123", "cuc": "A12", "patente": "ABC123D"}'

# Consultar sesiones activas de zona A12
curl http://localhost:3000/api/zonas/A12/sesiones-activas

# Finalizar estacionamiento
curl -X POST http://localhost:3000/api/test/fin \
  -H "Content-Type: application/json" \
  -d '{"telefono": "5493875555123"}'
```

**PWA del Permisionario:**
1. Abrir `http://localhost:3001/login`
2. Ingresar legajo de permisionario (crear uno en Supabase o usar seed data)
3. Ver dashboard en tiempo real
4. Registrar pagos en efectivo
5. Ver cuenta corriente

---

## 6. Escalabilidad y Mejoras Futuras

| Mejora | Descripción | Prioridad |
|---|---|---|
| **Geolocalización** | Enviar ubicación del conductor y resolver automáticamente el CUC | Alta |
| **QR en cartelería** | Código QR en cada cartel SEM que abre WhatsApp con el CUC pre-llenado | Alta |
| **Notificaciones proactive** | Aviso 10 min antes de vencer la sesión | Media |
| **Renovación automática** | Opción de renovar por 1h más con un solo comando | Media |
| **Inspectoría móvil** | App para inspectores con escaneo de patentes | Media |
| **Dashboard municipal** | Panel de control con métricas en tiempo real | Baja |
| **Integración con SVT** | Consulta de dominio para validar patentes | Baja |
| **Múltiples medios de pago** | Integrar con Ualá, bancos digitales | Baja |

---

## 7. Consideraciones de Seguridad

- **RLS**: Supabase Row Level Security garantiza que cada permisionario solo accede a su zona
- **Service Role**: El backend usa service_role para operaciones administrativas, pero las PWA usan anon key con RLS
- **Idempotencia**: Los webhooks de Mercado Pago se procesan idempotentemente usando `mp_payment_id`
- **Validación de patentes**: Se validan formatos argentinos (ABC123, AB123CD)
- **Saldo no negativo**: CHECK constraint en `saldo_billetera >= 0`
- **Webhook verification**: Token de verificación para el webhook de Meta

---

*Propuesta presentada por PunaTech — Hackathon Gobierno Abierto 2026*