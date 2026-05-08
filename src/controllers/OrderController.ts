import { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateOrderInput, OrderEventType } from '../models/Order'
import OrderService from '../services/OrderService'

type OrderParams = {
	id: string
}

type OrderEventBody = {
	eventType: OrderEventType
	metadata?: Record<string, unknown>
}

/**
 * Controller HTTP de órdenes.
 * Solo traduce requests/responses y delega la lógica al servicio.
 */
class OrderController {
	constructor(private readonly service: OrderService) {}

	/** Devuelve todas las órdenes almacenadas. */
	getOrders = async (_request: FastifyRequest, reply: FastifyReply) => {
		const orders = await this.service.getAll()
		return reply.send(orders)
	}

	/** Obtiene una orden por su id. */
	getOrderById = async (
		request: FastifyRequest<{ Params: OrderParams }>,
		reply: FastifyReply
	) => {
		const order = await this.service.getById(request.params.id)
		return reply.send(order)
	}

	/** Crea una nueva orden con estado inicial `Pending`. */
	createOrder = async (
		request: FastifyRequest<{ Body: CreateOrderInput }>,
		reply: FastifyReply
	) => {
		const order = await this.service.create(request.body)
		return reply.code(201).send(order)
	}

	/** Procesa un evento de estado sobre una orden existente. */
	processOrderEvent = async (
		request: FastifyRequest<{ Params: OrderParams; Body: OrderEventBody }>,
		reply: FastifyReply
	) => {
		const order = await this.service.processEvent(
			request.params.id,
			request.body.eventType,
			request.body.metadata,
		)
		return reply.send(order)
	}
}

export { OrderController }


