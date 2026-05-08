import { describe, expect, it } from 'vitest'
import { OrderModel } from '../../src/models/Order'
import { OrderState } from '../../src/models/OrderState'

describe('OrderModel', () => {
	it('asigna estado Pending por defecto', () => {
		const doc = new OrderModel({ productIds: ['p-1'], amount: 20 })
		expect(doc.state).toBe(OrderState.Pending)
	})

	it('falla validacion con productIds vacio', () => {
		const doc = new OrderModel({ productIds: [], amount: 20 })
		const error = doc.validateSync()
		expect(error).toBeDefined()
	})

	it('convierte _id a id al serializar', () => {
		const doc = new OrderModel({ productIds: ['p-1'], amount: 20 })
		const json = doc.toJSON() as { id?: string; _id?: string }
		expect(json.id).toBeDefined()
		expect(json._id).toBeUndefined()
	})
})

