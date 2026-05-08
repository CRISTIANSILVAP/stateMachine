import mongoose, { Schema, type Model } from 'mongoose'
import { ORDER_STATES, OrderState } from './OrderState'

/**
 * Representa todos los posibles eventos que puede registrar
 * una orden dentro del flujo de negocio.
 *
 * Cada evento describe una transición o acción importante
 * ocurrida durante el ciclo de vida de la orden.
 */
export type OrderEventType =
    | 'pendingBiometricalVerification'
    | 'noVerificationNeeded'
    | 'paymentFailed'
    | 'orderCancelled'
    | 'biometricalVerificationSuccessful'
    | 'verificationFailed'
    | 'orderCancelledByUser'
    | 'paymentSuccessful'
    | 'preparingShipment'
    | 'itemDispatched'
    | 'itemReceivedByCustomer'
    | 'deliveryIssue'
    | 'returnInitiatedByCustomer'
    | 'itemReceivedBack'
    | 'refundProcessed'

/**
 * Estructura de un evento dentro del historial de la orden.
 */
export type OrderEventLog = {
  /**
   * Tipo de evento ocurrido.
   */
  eventType: OrderEventType

  /**
   * Estado anterior de la orden.
   */
  fromState: OrderState

  /**
   * Nuevo estado al que transiciona la orden.
   */
  toState: OrderState

  /**
   * Información adicional relacionada con el evento.
   *
   * Ejemplo:
   * {
   *   reason: 'Pago rechazado',
   *   provider: 'Stripe'
   * }
   */
  metadata?: Record<string, unknown>

  /**
   * Fecha en la que ocurrió el evento.
   */
  createdAt: Date
}

/**
 * Propiedades base de una orden.
 */
type OrderAttributes = {
  /**
   * IDs de los productos asociados a la orden.
   */
  productIds: string[]

  /**
   * Valor total de la orden.
   */
  amount: number

  /**
   * Estado actual de la orden dentro de la máquina de estados.
   */
  state: OrderState

  /**
   * Historial de eventos y transiciones de estado.
   */
  eventLog: OrderEventLog[]
}

/**
 * Entidad completa de una orden.
 *
 * Incluye timestamps y el identificador público.
 */
export interface Order extends OrderAttributes {
  /**
   * Identificador único de la orden.
   */
  id: string

  /**
   * Fecha de creación del documento.
   */
  createdAt: Date

  /**
   * Fecha de última actualización del documento.
   */
  updatedAt: Date
}

/**
 * Datos requeridos para crear una nueva orden.
 */
export type CreateOrderInput = Pick<
    OrderAttributes,
    'productIds' | 'amount'
>

/**
 * Schema de MongoDB para almacenar eventos de la orden.
 *
 * Se usa como subdocumento embebido dentro de `eventLog`.
 */
const OrderEventLogSchema = new Schema<OrderEventLog>(
    {
      eventType: {
        type: String,
        required: true,
      },

      fromState: {
        type: String,
        enum: Object.values(OrderState),
        required: true,
      },

      toState: {
        type: String,
        enum: Object.values(OrderState),
        required: true,
      },

      metadata: {
        type: Schema.Types.Mixed,
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      /**
       * Evita que Mongo genere un _id por cada evento.
       */
      _id: false,
    }
)

/**
 * Schema principal de órdenes.
 */
const orderSchema = new Schema<OrderAttributes>(
    {
      /**
       * Lista de productos asociados a la orden.
       *
       * Debe contener al menos un elemento.
       */
      productIds: {
        type: [String],
        required: true,
        validate: {
          validator: (value: string[]) =>
              Array.isArray(value) && value.length > 0,

          message: 'Debe existir al menos un productId',
        },
      },

      /**
       * Monto total de la orden.
       *
       * No puede ser negativo.
       */
      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      /**
       * Estado actual de la orden.
       *
       * Se inicializa por defecto en Pending.
       */
      state: {
        type: String,
        enum: ORDER_STATES,
        required: true,
        default: OrderState.Pending,
      },

      /**
       * Historial completo de eventos asociados a la orden.
       */
      eventLog: {
        type: [OrderEventLogSchema],
        default: [],
      },
    },
    {
      /**
       * Nombre de la colección en MongoDB.
       */
      collection: 'orders',

      /**
       * Deshabilita el campo __v de Mongoose.
       */
      versionKey: false,

      /**
       * Agrega automáticamente:
       * - createdAt
       * - updatedAt
       */
      timestamps: true,

      /**
       * Personalización de la serialización JSON.
       *
       * Convierte `_id` en `id`.
       */
      toJSON: {
        transform: (_doc, ret) => {
          const output = ret as OrderAttributes & {
            _id?: mongoose.Types.ObjectId
            id?: string
          }

          if (output._id) {
            output.id = output._id.toString()
            delete output._id
          }

          return output
        },
      },

      /**
       * Personalización al convertir documentos a objetos planos.
       *
       * Convierte `_id` en `id`.
       */
      toObject: {
        transform: (_doc, ret) => {
          const output = ret as OrderAttributes & {
            _id?: mongoose.Types.ObjectId
            id?: string
          }

          if (output._id) {
            output.id = output._id.toString()
            delete output._id
          }

          return output
        },
      },
    }
)

/**
 * Modelo de Mongoose para órdenes.
 *
 * Reutiliza el modelo existente si ya fue registrado
 * para evitar errores durante hot reload o testing.
 */
export const OrderModel: Model<OrderAttributes> =
    (mongoose.models.Order as Model<OrderAttributes> | undefined) ??
    mongoose.model<OrderAttributes>('Order', orderSchema)