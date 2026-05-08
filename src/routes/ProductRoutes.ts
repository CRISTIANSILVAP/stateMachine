import type { FastifyInstance } from 'fastify'
import ProductController from '../controllers/ProductController'
import ProductService from '../services/ProductService'

// Rutas HTTP de productos: CRUD completo sobre el catálogo.
export default async function productRoutes(fastify: FastifyInstance) {
    const productService = new ProductService()
    const productController = new ProductController(productService)

    fastify.get('/products', productController.getProducts)

    fastify.get('/products/:id', productController.getProductById)

    fastify.post('/products/create', productController.createProduct)

    fastify.put('/products/:id', productController.updateProduct)

    fastify.delete('/products/:id', productController.deleteProduct)
}