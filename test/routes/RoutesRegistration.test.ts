import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import orderRoutes from '../../src/routes/OrderRoutes'
import productRoutes from '../../src/routes/ProductRoutes'

describe('Routes registration', () => {
	it('registra las rutas de product', async () => {
		const app = Fastify()
		await app.register(productRoutes)

		const tree = app.printRoutes()
		expect(tree).toContain('products (GET, HEAD)')
		expect(tree).toContain('create (POST)')
		await app.close()
	})

	it('registra las rutas de order', async () => {
		const app = Fastify()
		await app.register(orderRoutes)

		const tree = app.printRoutes()
		expect(tree).toContain('orders (GET, HEAD)')
		expect(tree).toContain('create (POST)')
		expect(tree).toContain('/events (POST)')
		await app.close()
	})
})

