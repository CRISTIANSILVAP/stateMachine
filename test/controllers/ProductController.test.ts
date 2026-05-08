import { describe, expect, it, vi } from 'vitest'
import ProductController from '../../src/controllers/ProductController'

function mockReply() {
	const reply = {
		send: vi.fn(),
		code: vi.fn(),
	}
	reply.code.mockReturnValue(reply)
	return reply
}

describe('ProductController', () => {
	it('getProducts responde la lista', async () => {
		const service = {
			getAll: vi.fn().mockResolvedValue([{ id: 'p1' }]),
			getById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		}
		const controller = new ProductController(service as never)
		const reply = mockReply()

		await controller.getProducts({} as never, reply as never)
		expect(service.getAll).toHaveBeenCalled()
		expect(reply.send).toHaveBeenCalledWith([{ id: 'p1' }])
	})

	it('getProductById responde con el producto', async () => {
		const service = {
			getAll: vi.fn(),
			getById: vi.fn().mockResolvedValue({ id: 'p1', name: 'A', price: 1, stock: 1 }),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		}
		const controller = new ProductController(service as never)
		const reply = mockReply()

		await controller.getProductById({ params: { id: 'p1' } } as never, reply as never)
		expect(service.getById).toHaveBeenCalledWith('p1')
		expect(reply.send).toHaveBeenCalledWith({ id: 'p1', name: 'A', price: 1, stock: 1 })
	})

	it('createProduct responde 201', async () => {
		const service = {
			getAll: vi.fn(),
			getById: vi.fn(),
			create: vi.fn().mockResolvedValue({ id: 'p1', name: 'N', price: 2, stock: 3 }),
			update: vi.fn(),
			delete: vi.fn(),
		}
		const controller = new ProductController(service as never)
		const reply = mockReply()

		await controller.createProduct({ body: { name: 'N', price: 2, stock: 3 } } as never, reply as never)
		expect(reply.code).toHaveBeenCalledWith(201)
	})

	it('updateProduct responde objeto actualizado', async () => {
		const service = {
			getAll: vi.fn(),
			getById: vi.fn(),
			create: vi.fn(),
			update: vi.fn().mockResolvedValue({ id: 'p1', stock: 99 }),
			delete: vi.fn(),
		}
		const controller = new ProductController(service as never)
		const reply = mockReply()

		await controller.updateProduct({ params: { id: 'p1' }, body: { stock: 99 } } as never, reply as never)
		expect(service.update).toHaveBeenCalledWith('p1', { stock: 99 })
		expect(reply.send).toHaveBeenCalledWith({ id: 'p1', stock: 99 })
	})

	it('deleteProduct responde 204', async () => {
		const service = {
			getAll: vi.fn(),
			getById: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn().mockResolvedValue(undefined),
		}
		const controller = new ProductController(service as never)
		const reply = mockReply()

		await controller.deleteProduct({ params: { id: 'p1' } } as never, reply as never)

		expect(service.delete).toHaveBeenCalledWith('p1')
		expect(reply.code).toHaveBeenCalledWith(204)
	})
})

