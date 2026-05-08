import { describe, expect, it, vi } from 'vitest'
import { AppError } from '../../src/handlers/AppError'
import type { CreateOrderInput, Order } from '../../src/models/Order'
import { OrderState } from '../../src/models/OrderState'
import OrderService from '../../src/services/OrderService'

function buildOrder(overrides?: Partial<Order>): Order {
	return {
		id: '507f191e810c19729de860ea',
		productIds: ['p-1'],
		amount: 500,
		state: OrderState.Pending,
		eventLog: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}
}

describe('OrderService', () => {
	it('retorna lista de ordenes', async () => {
		const repository = {
			findAll: vi.fn().mockResolvedValue([buildOrder()]),
			create: vi.fn(),
			findById: vi.fn(),
			applyTransition: vi.fn(),
		}
		const service = new OrderService(repository as never, {} as never, {} as never)
		const list = await service.getAll()
		expect(list).toHaveLength(1)
	})

	it('crea una orden valida', async () => {
		const repository = {
			create: vi.fn(),
			findAll: vi.fn(),
			findById: vi.fn(),
			applyTransition: vi.fn(),
		}
		const tickets = { createPaymentReviewTicket: vi.fn() }
		const stateService = { assertTransition: vi.fn() }
		const service = new OrderService(repository as never, tickets as never, stateService as never)

		const input: CreateOrderInput = { productIds: ['p-1'], amount: 30 }
		repository.create.mockResolvedValue(buildOrder({ amount: 30 }))

		const created = await service.create(input)
		expect(repository.create).toHaveBeenCalledWith(input)
		expect(created.amount).toBe(30)
	})

	it('valida payload de creacion invalido', async () => {
		const service = new OrderService({} as never, {} as never, {} as never)

		await expect(service.create({ productIds: [], amount: 30 })).rejects.toMatchObject({
			code: 'INVALID_ORDER_PRODUCT_IDS',
		})
		await expect(service.create({ productIds: ['ok'], amount: -1 })).rejects.toMatchObject({
			code: 'INVALID_ORDER_AMOUNT',
		})
	})

	it('lanza error cuando el id es invalido al consultar', async () => {
		const service = new OrderService({} as never, {} as never, {} as never)
		await expect(service.getById('bad-id')).rejects.toThrow(AppError)
	})

	it('lanza ORDER_NOT_FOUND al consultar una orden inexistente', async () => {
		const repository = {
			findById: vi.fn().mockResolvedValue(null),
			findAll: vi.fn(),
			create: vi.fn(),
			applyTransition: vi.fn(),
		}
		const service = new OrderService(repository as never, {} as never, {} as never)

		await expect(service.getById('507f191e810c19729de860ea')).rejects.toMatchObject({
			code: 'ORDER_NOT_FOUND',
		})
	})

	it('procesa una transicion valida y no crea ticket si amount <= 1000', async () => {
		const currentOrder = buildOrder({ amount: 900 })
		const updatedOrder = buildOrder({ state: OrderState.PendingPayment, amount: 900 })

		const repository = {
			findById: vi.fn().mockResolvedValue(currentOrder),
			applyTransition: vi.fn().mockResolvedValue(updatedOrder),
			findAll: vi.fn(),
			create: vi.fn(),
		}
		const tickets = { createPaymentReviewTicket: vi.fn() }
		const stateService = {
			assertTransition: vi.fn().mockReturnValue(OrderState.PendingPayment),
		}
		const service = new OrderService(repository as never, tickets as never, stateService as never)

		const result = await service.processEvent(currentOrder.id, 'noVerificationNeeded', { source: 'test' })

		expect(stateService.assertTransition).toHaveBeenCalledWith(OrderState.Pending, 'noVerificationNeeded')
		expect(repository.applyTransition).toHaveBeenCalled()
		expect(tickets.createPaymentReviewTicket).not.toHaveBeenCalled()
		expect(result.state).toBe(OrderState.PendingPayment)
	})

	it('lanza error en processEvent con id invalido', async () => {
		const service = new OrderService({} as never, {} as never, {} as never)
		await expect(service.processEvent('bad-id', 'noVerificationNeeded')).rejects.toMatchObject({
			code: 'INVALID_ORDER_ID',
		})
	})

	it('lanza ORDER_NOT_FOUND en processEvent', async () => {
		const repository = {
			findById: vi.fn().mockResolvedValue(null),
			applyTransition: vi.fn(),
			findAll: vi.fn(),
			create: vi.fn(),
		}
		const service = new OrderService(repository as never, {} as never, {} as never)

		await expect(service.processEvent('507f191e810c19729de860ea', 'noVerificationNeeded')).rejects.toMatchObject({
			code: 'ORDER_NOT_FOUND',
		})
	})

	it('crea ticket cuando paymentFailed supera umbral', async () => {
		const currentOrder = buildOrder({ amount: 2000 })
		const updatedOrder = buildOrder({ state: OrderState.Cancelled, amount: 2000 })
		const metadata = { reason: 'card-declined' }

		const repository = {
			findById: vi.fn().mockResolvedValue(currentOrder),
			applyTransition: vi.fn().mockResolvedValue(updatedOrder),
			findAll: vi.fn(),
			create: vi.fn(),
		}
		const tickets = { createPaymentReviewTicket: vi.fn().mockResolvedValue(undefined) }
		const stateService = {
			assertTransition: vi.fn().mockReturnValue(OrderState.Cancelled),
		}
		const service = new OrderService(repository as never, tickets as never, stateService as never)

		await service.processEvent(currentOrder.id, 'paymentFailed', metadata)

		expect(tickets.createPaymentReviewTicket).toHaveBeenCalledWith(currentOrder.id, 2000, metadata)
	})

	it('lanza conflicto cuando falla el update atomico', async () => {
		const currentOrder = buildOrder()
		const repository = {
			findById: vi.fn().mockResolvedValue(currentOrder),
			applyTransition: vi.fn().mockResolvedValue(null),
			findAll: vi.fn(),
			create: vi.fn(),
		}
		const stateService = {
			assertTransition: vi.fn().mockReturnValue(OrderState.PendingPayment),
		}
		const service = new OrderService(repository as never, {} as never, stateService as never)

		await expect(service.processEvent(currentOrder.id, 'noVerificationNeeded')).rejects.toMatchObject({
			code: 'ORDER_STATE_CONFLICT',
		})
	})
})

