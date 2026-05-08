import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import SupportTicketRepository from '../../src/repositories/SupportTicketRepository'
import { clearMemoryMongo, connectMemoryMongo, disconnectMemoryMongo } from '../helpers/mongoMemory'

describe('SupportTicketRepository', () => {
	const repository = new SupportTicketRepository()

	beforeAll(async () => {
		await connectMemoryMongo()
	})

	beforeEach(async () => {
		await clearMemoryMongo()
	})

	afterAll(async () => {
		await disconnectMemoryMongo()
	})

	it('crea ticket de revision y lo lista en la coleccion', async () => {
		const ticket = await repository.createPaymentReviewTicket('order-1', 1800, { reason: 'declined' })
		const list = await repository.findAll()

		expect(ticket.orderId).toBe('order-1')
		expect(ticket.reason).toBe('paymentFailed-over-threshold')
		expect(list).toHaveLength(1)
		expect(list[0].amount).toBe(1800)
	})
})

