import type { FastifyInstance } from 'fastify'
import { OrderController } from '../controllers/OrderController'
import OrderService from '../services/OrderService'

// Rutas HTTP de órdenes: lectura, creación y procesamiento de eventos.
export default async function orderRoutes(fastify: FastifyInstance) {
	const orderService = new OrderService()
	const orderController = new OrderController(orderService)

	fastify.get('/orders', orderController.getOrders)
	fastify.get('/orders/:id', orderController.getOrderById)
	fastify.post('/orders/create', orderController.createOrder)
	fastify.post('/orders/:id/events', orderController.processOrderEvent)
}


