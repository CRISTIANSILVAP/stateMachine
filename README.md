# State Machine API - Sistema de Gestión de Órdenes

## ¿Qué es este proyecto?

Este es un **API REST implementada con TypeScript, Fastify y MongoDB** que gestiona **órdenes de compra usando una máquina de estados**. 

La idea principal es que cada orden pasa por diferentes estados (Pending → PendingPayment → Confirmed → Processing → Shipped → Delivered) según los eventos que ocurren en el sistema. Por ejemplo, cuando recibimos un evento `paymentSuccessful`, la orden cambia de `PendingPayment` a `Confirmed`.


## Características principales

 **Máquina de estados completa** con 11 estados posibles  
 **API REST** para crear órdenes y procesar eventos  
 **Gestión de Productos** (CRUD)  
 **Tickets de soporte automáticos** cuando un pago falla en órdenes >$1000  
 **Persistencia en MongoDB** con actualización atómica (previene condiciones de carrera)  
 **Concurrencia segura** - soporta múltiples órdenes simultáneamente  
 **Tests completos** con cobertura >96% (55 tests)  
 **CORS configurado** para conectar con frontend en Vite  
 **Documentación en el código** con JSDoc  

---
## Demostración en video

[![Estado de máquina de órdenes - Demo](https://img.youtube.com/vi/zOa9p6CRm4A/0.jpg)](https://youtu.be/zOa9p6CRm4A)

**[Mira el video completo de demostración aquí](https://youtu.be/zOa9p6CRm4A)**


En el video verás:
- Crear un producto
- Crear una orden
- Procesar eventos (cambios de estado)
- Consultar el historial completo de eventos
- Manejo de errores (transiciones inválidas)

## Instalación

### Requisitos previos

- **Node.js** v20 o superior
- **MongoDB** corriendo localmente o una cadena de conexión remota (Atlas, etc.)
- **npm** (v8 o superior)

### Pasos

1. **Clonar o descargar el proyecto**

```bash
cd stateMachine
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copia el archivo de ejemplo y rellena con tus valores:

```bash
cp .env.example .env
```

El archivo `.env` debería verse así:

```env
# URLs de conexión
MONGODB_URI=mongodb://localhost:27017/stateMachine
FRONTEND_URL=http://localhost:5173

# Opcionales (tienen defaults)
PORT=5000
NODE_ENV=development
MONGODB_DB_NAME=stateMachine
PAYMENT_REVIEW_THRESHOLD=1000
LOG_LEVEL=info
```

### Variables de entorno explicadas

- **`MONGODB_URI`** (obligatorio) → Cómo conectar a tu MongoDB. Ej: `mongodb://localhost:27017/stateMachine` para local o la URI de MongoDB Atlas
- **`FRONTEND_URL`** (obligatorio) → URL del frontend que está permitido acceder a esta API (para CORS)
- **`PORT`** (default 5000) → Puerto donde escucha el servidor
- **`NODE_ENV`** (default development) → Entorno: `development`, `production`, `test`
- **`PAYMENT_REVIEW_THRESHOLD`** (default 1000) → Monto en USD a partir del cual se crea un ticket de soporte si el pago falla

---

## Ejecutar el proyecto

### Modo desarrollo

```bash
npm run dev
```

El servidor arranca en `http://localhost:5000` con **nodemon** (reinicia automáticamente con cambios).

### Modo producción

```bash
npm run build
npm run start
```

Primero compila TypeScript a `dist/`, luego ejecuta el código compilado.

### Tests

```bash
# Ejecutar todos los tests una sola vez
npm run test

# Modo watch (re-ejecuta automáticamente)
npm run test:watch

# Con reporte de cobertura
npm run test:cov
```

---

## Estructura del proyecto

```
src/
├── App.ts                    # Punto de entrada, configura Fastify y rutas
├── controllers/
│   ├── OrderController.ts    # Handlers HTTP de órdenes
│   └── ProductController.ts  # Handlers HTTP de productos
├── services/
│   ├── OrderService.ts       # Lógica de negocio de órdenes
│   ├── OrderStateService.ts  # Máquina de estados
│   └── ProductService.ts     # Lógica de negocio de productos
├── repositories/
│   ├── OrderRepository.ts    # Acceso a datos de órdenes
│   ├── ProductRepository.ts  # Acceso a datos de productos
│   └── SupportTicketRepository.ts  # Creación de tickets
├── models/
│   ├── Order.ts              # Esquema Mongoose de órdenes
│   ├── OrderState.ts         # Enum de estados
│   ├── Product.ts            # Esquema Mongoose de productos
│   └── SupportTicket.ts      # Esquema Mongoose de tickets
├── routes/
│   ├── OrderRoutes.ts        # Rutas de órdenes
│   └── ProductRoutes.ts      # Rutas de productos
├── handlers/
│   └── AppError.ts           # Clase para errores de negocio
├── utils/
│   └── objectId.ts           # Helper para validar IDs de MongoDB
└── plugins/
    └── mongodb.ts            # Conexión a MongoDB

test/
├── controllers/              # Tests de controladores
├── services/                 # Tests de servicios
├── repositories/             # Tests de repositorios
├── models/                   # Tests de modelos
├── routes/                   # Tests de rutas
└── helpers/
    └── mongoMemory.ts        # Setup de MongoDB en memoria para tests
```

---

## ¿Qué es una máquina de estados?

Una **máquina de estados** es un patrón de diseño que:

1. Define **estados posibles** (Pending, Confirmed, Shipped, etc.)
2. Define **transiciones válidas** (de qué estado puedo ir a qué otro)
3. Rechaza **transiciones inválidas** (ej: no puedo pasar de Delivered directamente a Pending)

### Ejemplo de transiciones en este proyecto

```
Pending → OnHold (si hace falta biometric verification)
Pending → PendingPayment (si no hace falta verificación)
Pending → Cancelled (si el pago falla)

OnHold → PendingPayment (si la verificación fue exitosa)

PendingPayment → Confirmed (si el pago fue exitoso)

Confirmed → Processing (cuando empieza a prepararse el envío)

Processing → Shipped (cuando se despacha)

Shipped → Delivered (cuando llega al cliente)
Shipped → OnHold (si hay problema de entrega)

Delivered → Returning (si el cliente inicia un retorno)
```

Y además: **`orderCancelledByUser` funciona desde casi cualquier estado** (menos desde Delivered, Returned, Refunded).

---

## Endpoints principales

### Órdenes

#### Crear una orden
```http
POST http://localhost:5000/orders/create

Body:
{
  "productIds": ["66f1a1111111111111111111"],
  "amount": 1500
}

Response (201):
{
  "id": "66f1b2222222222222222222",
  "productIds": ["66f1a1111111111111111111"],
  "amount": 1500,
  "state": "Pending",
  "eventLog": [],
  "createdAt": "2026-05-07T10:00:00Z",
  "updatedAt": "2026-05-07T10:00:00Z"
}
```

#### Obtener todas las órdenes
```http
GET http://localhost:5000/orders
```

#### Obtener una orden por ID
```http
GET http://localhost:5000/orders/66f1b2222222222222222222
```

#### Procesar un evento en una orden
```http
POST http://localhost:5000/orders/66f1b2222222222222222222/events

Body:
{
  "eventType": "noVerificationNeeded",
  "metadata": {
    "source": "postman"
  }
}

Response (200):
{
  "id": "66f1b2222222222222222222",
  "productIds": ["66f1a1111111111111111111"],
  "amount": 1500,
  "state": "PendingPayment",  ← CAMBIÓ de Pending a PendingPayment
  "eventLog": [
    {
      "eventType": "noVerificationNeeded",
      "fromState": "Pending",
      "toState": "PendingPayment",
      "createdAt": "2026-05-07T10:00:05Z"
    }
  ],
  "createdAt": "2026-05-07T10:00:00Z",
  "updatedAt": "2026-05-07T10:00:05Z"
}
```

### Productos

#### Crear un producto
```http
POST http://localhost:5000/products/create

Body:
{
  "name": "Laptop Gaming",
  "price": 1500,
  "stock": 10
}
```

#### Obtener todos los productos
```http
GET http://localhost:5000/products
```

#### Actualizar un producto
```http
PUT http://localhost:5000/products/66f1a1111111111111111111

Body:
{
  "stock": 8
}
```

#### Eliminar un producto
```http
DELETE http://localhost:5000/products/66f1a1111111111111111111
```

---

## Características especiales

### 1. Tickets de soporte automáticos

Cuando ocurre `paymentFailed` en una orden con monto > $1000, se crea automáticamente un **ticket de soporte**:

```json
{
  "id": "66f1c3333333333333333333",
  "orderId": "66f1b2222222222222222222",
  "amount": 1500,
  "reason": "paymentFailed-over-threshold",
  "metadata": {...},
  "createdAt": "2026-05-07T10:00:05Z"
}
```

Así el equipo de soporte sabe que hay un pago fallido en una orden importante.

### 2. Actualización atómica (sin condiciones de carrera)

Cuando dos requests intentan cambiar el estado de la misma orden al mismo tiempo:

- El primero **gana** y cambia el estado
- El segundo recibe error `409 CONFLICT` (porque el estado ya no es el que esperaba)

Esto es seguro para procesar órdenes concurrentemente.

### 3. Historial de eventos (event log)

Cada orden tiene un `eventLog` que registra **todos los eventos que le han pasado**:

```json
"eventLog": [
  {
    "eventType": "noVerificationNeeded",
    "fromState": "Pending",
    "toState": "PendingPayment",
    "createdAt": "2026-05-07T10:00:05Z"
  },
  {
    "eventType": "paymentSuccessful",
    "fromState": "PendingPayment",
    "toState": "Confirmed",
    "metadata": { "transactionId": "tx_123" },
    "createdAt": "2026-05-07T10:00:10Z"
  }
]
```

Así puedes auditar todo lo que le pasó a una orden.

---

## Tests

El proyecto incluye **55 tests** con cobertura >96%:

- ✅ Tests de **servicios** (lógica de negocio)
- ✅ Tests de **repositorios** (con MongoDB en memoria)
- ✅ Tests de **controladores** (validación de requests)
- ✅ Tests de **modelos** (esquemas de Mongoose)
- ✅ Tests de **rutas** (registro correcto de endpoints)

Ejecutar:

```bash
npm run test       # Una sola vez
npm run test:cov   # Con reporte de cobertura
```

---

## Patrón de arquitectura

Este proyecto sigue **3 capas claras**:

### 1. Controllers (Capa HTTP)
Reciben requests, parsean datos, delegan al servicio.

```typescript
async processOrderEvent(request, reply) {
  const order = await this.service.processEvent(...)
  return reply.send(order)
}
```

### 2. Services (Capa de negocio)
Contienen la lógica: validaciones, máquina de estados, reglas especiales.

```typescript
async processEvent(orderId, eventType, metadata) {
  const nextState = this.stateService.assertTransition(...)
  const updated = await this.repository.applyTransition(...)
  await this.runEventHandler(eventType, updated, metadata)
  return updated
}
```

### 3. Repositories (Capa de datos)
Interactúan con MongoDB, nunca con la lógica de negocio.

```typescript
async applyTransition(input) {
  const doc = await OrderModel.findOneAndUpdate(...)
  return this.toOrder(doc)
}
```




