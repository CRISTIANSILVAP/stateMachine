import mongoose from 'mongoose'
import {
	OrderModel,
	type CreateOrderInput,
	type Order,
	type OrderEventLog,
	type OrderEventType,
} from '../models/Order'
import { OrderState } from '../models/OrderState'

/**
 * Tipo interno utilizado para representar
 * la estructura JSON retornada por Mongoose.
 */
type OrderJSON = {
	_id?: mongoose.Types.ObjectId
	id?: string
	productIds: string[]
	amount: number
	state: OrderState
	eventLog: OrderEventLog[]
	createdAt: Date
	updatedAt: Date
}

/**
 * Datos requeridos para ejecutar
 * una transición de estado sobre una orden.
 */
type ApplyTransitionInput = {
	orderId: string
	expectedState: OrderState
	nextState: OrderState
	eventType: OrderEventType
	metadata?: Record<string, unknown>
}

/**
 * Repositorio encargado de encapsular
 * toda la lógica de acceso y manipulación
 * de órdenes en MongoDB.
 *
 * Este patrón ayuda a:
 * - Separar la lógica de persistencia.
 * - Centralizar consultas.
 * - Facilitar testing.
 * - Evitar lógica de base de datos en servicios/controladores.
 */
export default class OrderRepository {

	/**
	 * Obtiene todas las órdenes almacenadas.
	 * @returns Lista de órdenes.
	 */
	async findAll(): Promise<Order[]> {
		const docs = await OrderModel.find()
			.sort({ createdAt: -1 })
			.exec()

		/**
		 * Se transforma cada documento
		 * usando el método privado `toOrder`
		 * para mantener una estructura consistente.
		 */
		return docs.map((doc) =>
			this.toOrder(doc.toJSON() as unknown as OrderJSON)
		)
	}

	/**
	 * Busca una orden por su ID.
	 * @param id ID de la orden.
	 * @returns Orden encontrada o null.
	 */
	async findById(id: string): Promise<Order | null> {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return null
		}
		const doc = await OrderModel.findById(id).exec()
		return doc
			? this.toOrder(doc.toJSON() as unknown as OrderJSON)
			: null
	}

	/**
	 * Crea una nueva orden.
	 *
	 * Qué hace:
	 * 1. Inserta una nueva orden en MongoDB.
	 * 2. Inicializa automáticamente:
	 *    - state = Pending
	 *    - eventLog = []
	 * 3. Retorna la orden creada.
	 *
	 * @param data Datos básicos de la orden.
	 * @returns Orden creada.
	 */
	async create(data: CreateOrderInput): Promise<Order> {
		const doc = await OrderModel.create({
			/**
			 * Productos incluidos en la orden.
			 */
			productIds: data.productIds,

			/**
			 * Valor total de la compra.
			 */
			amount: data.amount,

			/**
			 * Estado inicial obligatorio.
			 */
			state: OrderState.Pending,

			/**
			 * Historial vacío inicialmente.
			 */
			eventLog: [],
		})

		/**
		 * Convierte el documento retornado
		 * a la entidad de dominio.
		 */
		return this.toOrder(doc.toJSON() as unknown as OrderJSON)
	}

	/**
	 * Ejecuta una transición de estado.
	 * Este método es el núcleo de la máquina de estados.
	 * Qué hace:
	 * 1. Valida el ID.
	 * 2. Construye un evento de transición.
	 * 3. Verifica que la orden esté
	 *    actualmente en `expectedState`.
	 * 4. Actualiza el estado.
	 * 5. Agrega el evento al historial.
	 * 6. Retorna la orden actualizada.
	 * @param input Información de transición.
	 * @returns Orden actualizada o null.
	 */
	async applyTransition(
		input: ApplyTransitionInput
	): Promise<Order | null> {
		if (!mongoose.Types.ObjectId.isValid(input.orderId)) {
			return null
		}
		/**
		 * Construcción del evento
		 * que quedará registrado en el historial.
		 */
		const eventLog: OrderEventLog = {
			eventType: input.eventType,
			fromState: input.expectedState,
			toState: input.nextState,
			createdAt: new Date(),
		}

		/**
		 * Se agrega metadata opcional
		 * únicamente si fue enviada.
		 */
		if (input.metadata !== undefined) {
			eventLog.metadata = input.metadata
		}

		/**
		 * Actualización atómica:
		 *
		 * SOLO actualiza si:
		 * - el _id coincide
		 * - el estado actual coincide con expectedState
		 *
		 * Esto evita transiciones inválidas
		 * o problemas de concurrencia.
		 */
		const doc = await OrderModel.findOneAndUpdate(
			{
				_id: input.orderId,
				state: input.expectedState,
			},
			{
				$set: {
					state: input.nextState,
				},
				$push: {
					eventLog,
				},
			},
			{
				returnDocument: 'after',
				runValidators: true,
			}
		).exec()
		return doc
			? this.toOrder(doc.toJSON() as unknown as OrderJSON)
			: null
	}

	/**
	 * Convierte un documento serializado
	 * de MongoDB en una entidad `Order`.
	 *
	 * Qué hace:
	 * - Normaliza el campo `id`.
	 * - Garantiza estructura consistente.
	 * - Oculta detalles internos de MongoDB.

	 * @param data Documento serializado.
	 * @returns Entidad Order.
	 */
	private toOrder(data: OrderJSON): Order {
		return {
			id: data.id ?? data._id?.toString() ?? '',
			productIds: data.productIds,
			amount: data.amount,
			state: data.state,
			eventLog: data.eventLog ?? [],
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
		}
	}
}