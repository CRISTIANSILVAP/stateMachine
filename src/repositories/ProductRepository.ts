import mongoose from 'mongoose'
import type {
	CreateProductInput,
	Product,
	UpdateProductInput,
} from '../models/Product'
import { ProductModel } from '../models/Product'

type ProductJSON = {
	_id?: mongoose.Types.ObjectId
	id?: string
	name: string
	price: number
	stock: number
}

export default class ProductRepository {
	/**
	 * Obtiene todos los productos almacenados.
	 *
	 * @returns {Promise<Product[]>}
	 * Lista de productos registrados.
	 */
	async findAll(): Promise<Product[]> {
		const docs = await ProductModel.find().exec()

		return docs.map((doc) =>
			this.toProduct(doc.toJSON() as ProductJSON)
		)
	}

	/**
	 * Busca un producto por su ID.
	 *
	 * @param {string} id
	 * ID del producto a buscar.
	 *
	 * @returns {Promise<Product | null>}
	 * Retorna el producto encontrado
	 * o null si no existe.
	 */
	async findById(id: string): Promise<Product | null> {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return null
		}

		const doc = await ProductModel.findById(id).exec()

		return doc
			? this.toProduct(doc.toJSON() as ProductJSON)
			: null
	}

	/**
	 * Crea un nuevo producto.
	 *
	 * @param {CreateProductInput} data
	 * Datos necesarios para crear el producto.
	 *
	 * @returns {Promise<Product>}
	 * Retorna el producto creado.
	 */
	async create(data: CreateProductInput): Promise<Product> {
		const doc = await ProductModel.create(data)

		return this.toProduct(doc.toJSON() as ProductJSON)
	}

	/**
	 * Actualiza un producto existente.
	 *
	 * @param {string} id
	 * ID del producto a actualizar.
	 *
	 * @param {UpdateProductInput} data
	 * Datos que serán modificados.
	 *
	 * @returns {Promise<Product | null>}
	 * Retorna el producto actualizado
	 * o null si no existe.
	 */
	async update(
		id: string,
		data: UpdateProductInput
	): Promise<Product | null> {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return null
		}

		const doc = await ProductModel.findByIdAndUpdate(
			id,
			data,
			{
				new: true,
				runValidators: true,
			}
		).exec()

		return doc
			? this.toProduct(doc.toJSON() as ProductJSON)
			: null
	}

	/**
	 * Elimina un producto por su ID.
	 *
	 * @param {string} id
	 * ID del producto a eliminar.
	 *
	 * @returns {Promise<boolean>}
	 * Retorna:
	 * - true  -> si el producto fue eliminado.
	 * - false -> si no existe o el ID es inválido.
	 */
	async delete(id: string): Promise<boolean> {
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return false
		}

		const result = await ProductModel.findByIdAndDelete(id).exec()

		return result !== null
	}

	/**
	 * Convierte un documento de MongoDB
	 * en una entidad Product.
	 *
	 * @param {ProductJSON} data
	 * Documento serializado de MongoDB.
	 *
	 * @returns {Product}
	 * Producto transformado.
	 */
	private toProduct(data: ProductJSON): Product {
		return {
			id: data.id ?? data._id?.toString() ?? '',
			name: data.name,
			price: data.price,
			stock: data.stock,
		}
	}
}