import { AppError } from '../handlers/AppError'
import type { CreateProductInput, Product, UpdateProductInput } from '../models/Product'
import ProductRepository from '../repositories/ProductRepository'
import { isValidObjectId } from '../utils/objectId'

/**
 * Servicio de productos.
 * Centraliza validaciones de negocio y delega el acceso a datos al repositorio.
 */
export default class ProductService {
	constructor(private readonly repository = new ProductRepository()) {}

	/** Devuelve todos los productos. */
	async getAll(): Promise<Product[]> {
		return this.repository.findAll()
	}

	/** Obtiene un producto por id. */
	async getById(id: string): Promise<Product> {
		this.ensureValidId(id)

		const product = await this.repository.findById(id)
		if (!product) {
			throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado')
		}

		return product
	}

	/** Crea un producto nuevo validando su contenido. */
	async create(data: CreateProductInput): Promise<Product> {
		this.ensureValidProductData(data)
		return this.repository.create(data)
	}

	/** Actualiza un producto existente usando un payload parcial. */
	async update(id: string, data: UpdateProductInput): Promise<Product> {
		this.ensureValidId(id)

		if (Object.keys(data).length === 0) {
			throw new AppError(400, 'INVALID_PRODUCT_DATA', 'Debes enviar al menos un campo para actualizar')
		}

		this.ensureValidProductData(data, true)

		const product = await this.repository.update(id, data)
		if (!product) {
			throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado')
		}

		return product
	}

	/** Elimina un producto por id. */
	async delete(id: string): Promise<void> {
		this.ensureValidId(id)

		const deleted = await this.repository.delete(id)
		if (!deleted) {
			throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Producto no encontrado')
		}
	}

	/** Valida que el id tenga formato de ObjectId. */
	private ensureValidId(id: string): void {
		if (!isValidObjectId(id)) {
			throw new AppError(400, 'INVALID_PRODUCT_ID', 'El id del producto no es válido')
		}
	}

	/** Valida el payload de creación o actualización de producto. */
	private ensureValidProductData(data: Partial<CreateProductInput>, isPartial = false):
		asserts data is CreateProductInput | UpdateProductInput {
		if (!isPartial) {
			if (typeof data.name !== 'string' || data.name.trim().length === 0) {
				throw new AppError(400, 'INVALID_PRODUCT_NAME', 'El nombre del producto es obligatorio')
			}

			if (!this.isValidNumber(data.price)) {
				throw new AppError(400, 'INVALID_PRODUCT_PRICE', 'El precio del producto debe ser un número válido mayor o igual a 0')
			}

			if (!this.isValidNumber(data.stock)) {
				throw new AppError(400, 'INVALID_PRODUCT_STOCK', 'El stock del producto debe ser un número válido mayor o igual a 0')
			}

			return
		}

		if (data.name !== undefined && data.name.trim().length === 0) {
			throw new AppError(400, 'INVALID_PRODUCT_NAME', 'El nombre del producto no puede estar vacío')
		}

		if (data.price !== undefined && !this.isValidNumber(data.price)) {
			throw new AppError(400, 'INVALID_PRODUCT_PRICE', 'El precio del producto debe ser un número válido mayor o igual a 0')
		}

		if (data.stock !== undefined && !this.isValidNumber(data.stock)) {
			throw new AppError(400, 'INVALID_PRODUCT_STOCK', 'El stock del producto debe ser un número válido mayor o igual a 0')
		}
	}

	/** Asegura que un número sea finito y no negativo. */
	private isValidNumber(value: unknown): value is number {
		return typeof value === 'number' && Number.isFinite(value) && value >= 0
	}
}

