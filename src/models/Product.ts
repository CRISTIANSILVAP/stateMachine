import mongoose, { Schema, type Model } from 'mongoose'

/**
 * Atributos base de un producto tal como se almacenan en la base de datos.
 */
type ProductAttributes = {
    name: string // Nombre del producto
    price: number // Precio (debe ser >= 0)
    stock: number // Cantidad disponible en inventario (>= 0)
}

/**
 * Representación de un producto expuesto hacia afuera (ej: API).
 * Se agrega `id` como string en lugar de `_id`.
 */
export interface Product extends ProductAttributes {
    id: string
}

/**
 * Tipo para crear un producto.
 * Requiere todos los atributos.
 */
export type CreateProductInput = ProductAttributes

/**
 * Tipo para actualizar un producto.
 * Permite enviar solo algunos campos (update parcial).
 */
export type UpdateProductInput = Partial<ProductAttributes>

/**
 * Definición del esquema de Mongoose para Product.
 */
const productSchema = new Schema<ProductAttributes>(
    {
        name: {
            type: String,
            required: true,
            trim: true, // Elimina espacios en blanco al inicio y final
        },
        price: {
            type: Number,
            required: true,
            min: 0, // No permite precios negativos
        },
        stock: {
            type: Number,
            required: true,
            min: 0, // No permite stock negativo
        },
    },
    {
        collection: 'products', // Nombre de la colección en MongoDB
        versionKey: false, // Desactiva el campo __v (versionado interno)

        /**
         * Transformación al convertir a JSON (ej: res.json())
         */
        toJSON: {
            transform: (_doc, ret) => {
                // Tipado auxiliar para poder manipular _id
                const output = ret as ProductAttributes & {
                    _id?: mongoose.Types.ObjectId
                    id?: string
                }

                // Si existe _id, lo convertimos a string y lo movemos a `id`
                if (output._id) {
                    output.id = output._id.toString()
                    delete output._id
                }

                return output
            },
        },

        /**
         * Transformación al convertir a objeto plano (ej: .toObject())
         */
        toObject: {
            transform: (_doc, ret) => {
                const output = ret as ProductAttributes & {
                    _id?: mongoose.Types.ObjectId
                    id?: string
                }

                if (output._id) {
                    output.id = output._id.toString()
                    delete output._id
                }

                return output
            },
        },
    }
)

/**
 * Modelo de Mongoose para Product.
 *
 * - Reutiliza el modelo existente si ya fue creado (mongoose.models.Product)
 * - Evita errores en entornos con hot reload o serverless
 */
export const ProductModel: Model<ProductAttributes> =
    (mongoose.models.Product as Model<ProductAttributes> | undefined) ??
    mongoose.model<ProductAttributes>('Product', productSchema)

