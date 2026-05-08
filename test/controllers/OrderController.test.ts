import { describe, expect, it, vi } from 'vitest'
import { OrderController } from '../../src/controllers/OrderController'
import { OrderState } from '../../src/models/OrderState'

function mockReply() {
	const reply = {
		send: vi.fn(),
		code: vi.fn(),
	}
	reply.code.mockReturnValue(reply)
	return reply
}

describe('OrderController', () => {
	it('getOrders retorna lista de ordenes', async () => {
		const service = {
			create: vi.fn(),
			getAll: vi.fn().mockResolvedValue([{ id: '1' }]),
			getById: vi.fn(),
			processEvent: vi.fn(),
		}
		const controller = new OrderController(service as never)
		const reply = mockReply()

		await controller.getOrders({} as never, reply as never)
		expect(service.getAll).toHaveBeenCalled()
		expect(reply.send).toHaveBeenCalledWith([{ id: '1' }])
	})

	it('getOrderById retorna orden por id', async () => {
		const service = {
			create: vi.fn(),
			getAll: vi.fn(),
			getById: vi.fn().mockResolvedValue({ id: 'o-1' }),
			processEvent: vi.fn(),
		}
		const controller = new OrderController(service as never)
		const reply = mockReply()

		await controller.getOrderById({ params: { id: 'o-1' } } as never, reply as never)
		expect(service.getById).toHaveBeenCalledWith('o-1')
		expect(reply.send).toHaveBeenCalledWith({ id: 'o-1' })
	})

	it('createOrder responde 201 con la orden creada', async () => {
		const service = {
			create: vi.fn().mockResolvedValue({ id: '1', state: OrderState.Pending }),
			getAll: vi.fn(),
			getById: vi.fn(),
			processEvent: vi.fn(),
		}
		const controller = new OrderController(service as never)
		const reply = mockReply()

		await controller.createOrder({ body: { productIds: ['p-1'], amount: 10 } } as never, reply as never)

		expect(service.create).toHaveBeenCalledWith({ productIds: ['p-1'], amount: 10 })
		expect(reply.code).toHaveBeenCalledWith(201)
		expect(reply.send).toHaveBeenCalledWith({ id: '1', state: OrderState.Pending })
	})

	it('processOrderEvent delega al servicio con params y body', async () => {
		const service = {
			create: vi.fn(),
			getAll: vi.fn(),
			getById: vi.fn(),
			processEvent: vi.fn().mockResolvedValue({ id: '1', state: OrderState.Confirmed }),
		}
		const controller = new OrderController(service as never)
		const reply = mockReply()

		await controller.processOrderEvent(
			{
				params: { id: 'order-1' },
				body: { eventType: 'paymentSuccessful', metadata: { tx: 'x' } },
			} as never,
			reply as never
		)

		expect(service.processEvent).toHaveBeenCalledWith('order-1', 'paymentSuccessful', { tx: 'x' })
		expect(reply.send).toHaveBeenCalledWith({ id: '1', state: OrderState.Confirmed })
	})
})

