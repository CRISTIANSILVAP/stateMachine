import { describe, expect, it, vi } from 'vitest'
import type { Product } from '../../src/models/Product'
import ProductService from '../../src/services/ProductService'

function buildProduct(overrides?: Partial<Product>): Product {
	return {
		id: '507f191e810c19729de860ea',
		name: 'Test',
		price: 100,
		stock: 10,
		...overrides,
	}
}

describe('ProductService', () => {
	it('retorna producto por id cuando existe', async () => {
		const repository = {
			findAll: vi.fn(),
			findById: vi.fn().mockResolvedValue(buildProduct({ id: '507f191e810c19729de860ea' })),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		}
		const service = new ProductService(repository as never)

		const result = await service.getById('507f191e810c19729de860ea')
		expect(result.id).toBe('507f191e810c19729de860ea')
	})

	it('lanza PRODUCT_NOT_FOUND en getById', async () => {
		const repository = {
			findAll: vi.fn(),
			findById: vi.fn().mockResolvedValue(null),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		}
		const service = new ProductService(repository as never)

		await expect(service.getById('507f191e810c19729de860ea')).rejects.toMatchObject({
			code: 'PRODUCT_NOT_FOUND',
		})
	})

	it('retorna lista de productos', async () => {
		const repository = {
			findAll: vi.fn().mockResolvedValue([buildProduct()]),
			findById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		}
		const service = new ProductService(repository as never)

		const result = await service.getAll()
		expect(result).toHaveLength(1)
	})

	it('crea producto valido', async () => {
		const repository = {
			findAll: vi.fn(),
			findById: vi.fn(),
			create: vi.fn().mockResolvedValue(buildProduct()),
			update: vi.fn(),
			delete: vi.fn(),
		}
		const service = new ProductService(repository as never)

		await service.create({ name: 'Camisa', price: 20, stock: 2 })
		expect(repository.create).toHaveBeenCalled()
	})

	it('valida datos invalidos al crear', async () => {
		const service = new ProductService({} as never)
		await expect(service.create({ name: '', price: 20, stock: 2 })).rejects.toMatchObject({
			code: 'INVALID_PRODUCT_NAME',
		})
		await expect(service.create({ name: 'X', price: -1, stock: 2 })).rejects.toMatchObject({
			code: 'INVALID_PRODUCT_PRICE',
		})
		await expect(service.create({ name: 'X', price: 1, stock: -2 })).rejects.toMatchObject({
			code: 'INVALID_PRODUCT_STOCK',
		})
	})

	it('lanza error si update llega vacio', async () => {
		const service = new ProductService({} as never)
		await expect(service.update('507f191e810c19729de860ea', {})).rejects.toMatchObject({
			code: 'INVALID_PRODUCT_DATA',
		})
	})

	it('actualiza producto y maneja not found', async () => {
		const repository = {
			findAll: vi.fn(),
			findById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		}
		const service = new ProductService(repository as never)

		repository.update.mockResolvedValue(buildProduct({ stock: 15 }))
		const updated = await service.update('507f191e810c19729de860ea', { stock: 15 })
		expect(updated.stock).toBe(15)

		repository.update.mockResolvedValue(null)
		await expect(service.update('507f191e810c19729de860ea', { stock: 1 })).rejects.toMatchObject({
			code: 'PRODUCT_NOT_FOUND',
		})
	})

	it('valida campos invalidos en update parcial', async () => {
		const service = new ProductService({} as never)
		await expect(service.update('507f191e810c19729de860ea', { name: '' })).rejects.toMatchObject({
			code: 'INVALID_PRODUCT_NAME',
		})
		await expect(service.update('507f191e810c19729de860ea', { price: -3 })).rejects.toMatchObject({
			code: 'INVALID_PRODUCT_PRICE',
		})
		await expect(service.update('507f191e810c19729de860ea', { stock: -3 })).rejects.toMatchObject({
			code: 'INVALID_PRODUCT_STOCK',
		})
	})

	it('lanza error si elimina id invalido', async () => {
		const service = new ProductService({} as never)
		await expect(service.delete('bad-id')).rejects.toMatchObject({ code: 'INVALID_PRODUCT_ID' })
	})

	it('lanza PRODUCT_NOT_FOUND cuando delete devuelve false', async () => {
		const repository = {
			findAll: vi.fn(),
			findById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn().mockResolvedValue(false),
		}
		const service = new ProductService(repository as never)
		await expect(service.delete('507f191e810c19729de860ea')).rejects.toMatchObject({
			code: 'PRODUCT_NOT_FOUND',
		})
	})
})

