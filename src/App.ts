import  Fastify from 'fastify'
import 'dotenv/config'
import connectDB from './plugins/mongodb'
import productRoutes from './routes/ProductRoutes'
import orderRoutes from './routes/OrderRoutes'
import { AppError } from './handlers/AppError'

// Instancia principal de Fastify para toda la API.
const app = Fastify({ logger: true });

// Convierte errores de negocio en respuestas HTTP consistentes.
app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            code: error.code,
            message: error.message,
        })
    }

    app.log.error(error)
    return reply.status(500).send({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Ocurrió un error inesperado',
    })
})

// Bootstrap de infraestructura y rutas.
const start = async () => {
    await connectDB()   // ← primero conectas
    // CORS simple implementado por hook para evitar incompatibilidades de versión.
    // Se permite únicamente el origen configurado en FRONTEND_URL.
    app.addHook('onRequest', async (request, reply) => {
        const origin = request.headers.origin as string | undefined
        const allowed = process.env.FRONTEND_URL ?? 'http://localhost:5173'
        if (origin && origin === allowed) {
            reply.header('Access-Control-Allow-Origin', allowed)
            reply.header('Access-Control-Allow-Credentials', 'true')
            reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
        }

        if (request.method === 'OPTIONS') {
            // Responder preflight inmediatamente.
            reply.code(204).send()
        }
    })

    // Registro de módulos HTTP de la aplicación.
    await app.register(productRoutes)
    await app.register(orderRoutes)
    await app.listen({ port: 5000 })
    console.log('Servidor corriendo en http://localhost:5000')
}

start();