import { describe, expect, it } from 'vitest'
import { ProductModel } from '../../src/models/Product'

describe('ProductModel', () => {
	it('falla validacion cuando price es negativo', () => {
		const doc = new ProductModel({ name: 'Mesa', price: -10, stock: 2 })
		const error = doc.validateSync()
		expect(error).toBeDefined()
	})

	it('falla validacion cuando stock es negativo', () => {
		const doc = new ProductModel({ name: 'Mesa', price: 10, stock: -2 })
		const error = doc.validateSync()
		expect(error).toBeDefined()
	})

	it('convierte _id a id en toObject', () => {
		const doc = new ProductModel({ name: 'Mesa', price: 10, stock: 2 })
		const obj = doc.toObject() as { id?: string; _id?: string }
		expect(obj.id).toBeDefined()
		expect(obj._id).toBeUndefined()
	})
})

