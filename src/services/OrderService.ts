import { AppError } from '../handlers/AppError'
import type { CreateOrderInput, Order, OrderEventType } from '../models/Order'
import OrderRepository from '../repositories/OrderRepository'
import SupportTicketRepository from '../repositories/SupportTicketRepository'
import OrderStateService from './OrderStateService'
import { isValidObjectId } from '../utils/objectId'

type EventContext = {
	order: Order
	metadata?: Record<string, unknown>
}

type EventHandler = (context: EventContext) => Promise<void>

/**
 * Servicio de órdenes.
 * Coordina validaciones, transiciones de estado, persistencia y reglas extra como tickets de soporte.
 */
export default class OrderService {
	private readonly eventHandlers: Partial<Record<OrderEventType, EventHandler>>

	constructor(
		private readonly repository = new OrderRepository(),
		private readonly supportTicketRepository = new SupportTicketRepository(),
		private readonly stateService = new OrderStateService(),
	) {
		this.eventHandlers = {
			paymentFailed: async ({ order, metadata }) => {
				if (order.amount > 1000) {
					await this.supportTicketRepository.createPaymentReviewTicket(order.id, order.amount, metadata)
				}
			},
		}
	}

	/** Devuelve todas las órdenes almacenadas. */
	async getAll(): Promise<Order[]> {
		return this.repository.findAll()
	}

	/** Obtiene una orden por id y valida que exista. */
	async getById(id: string): Promise<Order> {
		this.ensureValidId(id)

		const order = await this.repository.findById(id)
		if (!order) {
			throw new AppError(404, 'ORDER_NOT_FOUND', 'Orden no encontrada')
		}

		return order
	}

	/** Crea una orden nueva con estado inicial `Pending`. */
	async create(data: CreateOrderInput): Promise<Order> {
		this.ensureValidCreateInput(data)
		return this.repository.create(data)
	}

	/**
	 * Procesa un evento de la máquina de estados.
	 * Valida el id, calcula la transición, persiste el cambio y ejecuta reglas específicas por evento.
	 */
	async processEvent(
		orderId: string,
		eventType: OrderEventType,
		metadata?: Record<string, unknown>,
	): Promise<Order> {
		this.ensureValidId(orderId)

		const order = await this.repository.findById(orderId)
		if (!order) {
			throw new AppError(404, 'ORDER_NOT_FOUND', 'Orden no encontrada')
		}

		const nextState = this.stateService.assertTransition(order.state, eventType)
		const updated = await this.repository.applyTransition({
			orderId,
			expectedState: order.state,
			nextState,
			eventType,
			...(metadata !== undefined ? { metadata } : {}),
		})

		if (!updated) {
			throw new AppError(409, 'ORDER_STATE_CONFLICT', 'La orden cambió de estado mientras se procesaba el evento')
		}

		await this.runEventHandler(eventType, updated, metadata)
		return updated
	}

	/** Ejecuta lógica complementaria asociada a un evento concreto. */
	private async runEventHandler(
		eventType: OrderEventType,
		order: Order,
		metadata?: Record<string, unknown>,
	): Promise<void> {
		const handler = this.eventHandlers[eventType]
		if (handler) {
			await handler({
				order,
				...(metadata !== undefined ? { metadata } : {}),
			})
		}
	}

	/** Valida que el id tenga formato de ObjectId antes de consultar la base. */
	private ensureValidId(id: string): void {
		if (!isValidObjectId(id)) {
			throw new AppError(400, 'INVALID_ORDER_ID', 'El id de la orden no es válido')
		}
	}

	/** Valida el payload de creación de orden. */
	private ensureValidCreateInput(data: CreateOrderInput): void {
		if (!Array.isArray(data.productIds) || data.productIds.length === 0) {
			throw new AppError(400, 'INVALID_ORDER_PRODUCT_IDS', 'Debes enviar al menos un productId')
		}

		if (data.productIds.some((productId) => productId.trim().length === 0)) {
			throw new AppError(400, 'INVALID_ORDER_PRODUCT_IDS', 'Todos los productIds deben ser strings válidos')
		}

		if (!Number.isFinite(data.amount) || data.amount < 0) {
			throw new AppError(400, 'INVALID_ORDER_AMOUNT', 'El amount debe ser un número válido mayor o igual a 0')
		}
	}
}

