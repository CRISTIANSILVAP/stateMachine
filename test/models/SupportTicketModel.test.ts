import { describe, expect, it } from 'vitest'
import { SupportTicketModel } from '../../src/models/SupportTicket'

describe('SupportTicketModel', () => {
	it('requiere orderId y amount', () => {
		const doc = new SupportTicketModel({ reason: 'paymentFailed-over-threshold' })
		const error = doc.validateSync()
		expect(error).toBeDefined()
	})

	it('convierte _id a id al serializar', () => {
		const doc = new SupportTicketModel({
			orderId: 'order-1',
			amount: 1200,
			reason: 'paymentFailed-over-threshold',
		})

		const json = doc.toJSON() as unknown as { id?: string; _id?: string }
		expect(json.id).toBeDefined()
		expect(json._id).toBeUndefined()
	})
})

