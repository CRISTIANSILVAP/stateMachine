import { FastifyReply, FastifyRequest } from 'fastify'
import type { CreateProductInput, UpdateProductInput } from '../models/Product'
import ProductService from '../services/ProductService'

type ProductParams = {
	id: string
}

/**
 * Controller HTTP de productos.
 * Deja la lógica de negocio en el servicio y solo maneja la capa web.
 */
export default class ProductController {
	constructor(private readonly service: ProductService) {}

	/** Devuelve el listado completo de productos. */
	getProducts = async (_request: FastifyRequest, reply: FastifyReply) => {
		const products = await this.service.getAll()
		return reply.send(products)
	}

	/** Busca un producto por id. */
	getProductById = async (
		request: FastifyRequest<{ Params: ProductParams }>,
		reply: FastifyReply
	) => {
		const product = await this.service.getById(request.params.id)
		return reply.send(product)
	}

	/** Crea un producto nuevo. */
	createProduct = async (
		request: FastifyRequest<{ Body: CreateProductInput }>,
		reply: FastifyReply
	) => {
		const product = await this.service.create(request.body)
		return reply.code(201).send(product)
	}

	/** Actualiza un producto existente. */
	updateProduct = async (
		request: FastifyRequest<{ Params: ProductParams; Body: UpdateProductInput }>,
		reply: FastifyReply
	) => {
		const product = await this.service.update(request.params.id, request.body)
		return reply.send(product)
	}

	/** Elimina un producto por id. */
	deleteProduct = async (
		request: FastifyRequest<{ Params: ProductParams }>,
		reply: FastifyReply
	) => {
		await this.service.delete(request.params.id)
		return reply.code(204).send()
	}
}
