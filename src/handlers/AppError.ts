/**
 * Error de negocio/validación pensado para devolverse con un código HTTP estable.
 */
export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly code: string,
        message: string
    ) {
        super(message)
        this.name = 'AppError'
    }
}