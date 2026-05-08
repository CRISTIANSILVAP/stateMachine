import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import ProductRepository from '../../src/repositories/ProductRepository'
import { clearMemoryMongo, connectMemoryMongo, disconnectMemoryMongo } from '../helpers/mongoMemory'

describe('ProductRepository', () => {
	const repository = new ProductRepository()

	beforeAll(async () => {
		await connectMemoryMongo()
	})

	beforeEach(async () => {
		await clearMemoryMongo()
	})

	afterAll(async () => {
		await disconnectMemoryMongo()
	})

	it('crea y actualiza un producto', async () => {
		const created = await repository.create({ name: 'Teclado', price: 50, stock: 10 })
		const updated = await repository.update(created.id, { stock: 5 })

		expect(updated).not.toBeNull()
		expect(updated?.stock).toBe(5)
	})

	it('elimina un producto existente', async () => {
		const created = await repository.create({ name: 'Mouse', price: 30, stock: 8 })
		const deleted = await repository.delete(created.id)
		expect(deleted).toBe(true)
	})

	it('lista productos creados', async () => {
		await repository.create({ name: 'A', price: 1, stock: 1 })
		await repository.create({ name: 'B', price: 2, stock: 2 })
		const products = await repository.findAll()
		expect(products.length).toBeGreaterThanOrEqual(2)
	})

	it('retorna null en findById con id invalido', async () => {
		const product = await repository.findById('bad-id')
		expect(product).toBeNull()
	})

	it('retorna null/false en operaciones con id invalido', async () => {
		const updated = await repository.update('bad-id', { stock: 2 })
		const deleted = await repository.delete('bad-id')
		expect(updated).toBeNull()
		expect(deleted).toBe(false)
	})
})

