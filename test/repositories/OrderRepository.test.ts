import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { OrderState } from '../../src/models/OrderState'
import OrderRepository from '../../src/repositories/OrderRepository'
import { clearMemoryMongo, connectMemoryMongo, disconnectMemoryMongo } from '../helpers/mongoMemory'

describe('OrderRepository', () => {
	const repository = new OrderRepository()

	beforeAll(async () => {
		await connectMemoryMongo()
	})

	beforeEach(async () => {
		await clearMemoryMongo()
	})

	afterAll(async () => {
		await disconnectMemoryMongo()
	})

	it('crea y consulta una orden por id', async () => {
		const created = await repository.create({ productIds: ['p-1'], amount: 90 })
		const found = await repository.findById(created.id)

		expect(found).not.toBeNull()
		expect(found?.state).toBe(OrderState.Pending)
		expect(found?.productIds).toEqual(['p-1'])
	})

	it('lista ordenes guardadas', async () => {
		await repository.create({ productIds: ['a'], amount: 20 })
		await repository.create({ productIds: ['b'], amount: 30 })

		const list = await repository.findAll()
		expect(list.length).toBeGreaterThanOrEqual(2)
	})

	it('aplica transicion atomica cuando el estado esperado coincide', async () => {
		const created = await repository.create({ productIds: ['p-1'], amount: 200 })

		const updated = await repository.applyTransition({
			orderId: created.id,
			expectedState: OrderState.Pending,
			nextState: OrderState.PendingPayment,
			eventType: 'noVerificationNeeded',
			metadata: { source: 'test' },
		})

		expect(updated).not.toBeNull()
		expect(updated?.state).toBe(OrderState.PendingPayment)
		expect(updated?.eventLog).toHaveLength(1)
		expect(updated?.eventLog[0].eventType).toBe('noVerificationNeeded')
	})

	it('retorna null si el estado esperado no coincide', async () => {
		const created = await repository.create({ productIds: ['p-1'], amount: 200 })

		const updated = await repository.applyTransition({
			orderId: created.id,
			expectedState: OrderState.Confirmed,
			nextState: OrderState.Processing,
			eventType: 'preparingShipment',
		})

		expect(updated).toBeNull()
	})

	it('retorna null para objectId invalido', async () => {
		const found = await repository.findById('bad-id')
		expect(found).toBeNull()
	})

	it('retorna null en transicion con objectId invalido', async () => {
		const updated = await repository.applyTransition({
			orderId: 'bad-id',
			expectedState: OrderState.Pending,
			nextState: OrderState.PendingPayment,
			eventType: 'noVerificationNeeded',
		})

		expect(updated).toBeNull()
	})
})

