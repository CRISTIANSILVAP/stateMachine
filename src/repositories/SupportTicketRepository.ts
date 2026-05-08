import type {
	SupportTicket,
	SupportTicketReason,
} from '../models/SupportTicket'
import { SupportTicketModel } from '../models/SupportTicket'

export default class SupportTicketRepository {
	/**
	 * Crea un ticket de soporte para revisión de pagos.
	 *
	 * Este método se utiliza cuando ocurre
	 * un fallo de pago que requiere revisión manual.
	 *
	 * @param {string} orderId
	 * ID de la orden relacionada con el problema.
	 *
	 * @param {number} amount
	 * Monto asociado al pago fallido.
	 *
	 * @param {Record<string, unknown>} [metadata]
	 * Información adicional opcional
	 * relacionada con el incidente.
	 *
	 * @returns {Promise<SupportTicket>}
	 * Retorna el ticket de soporte creado.
	 */
	async createPaymentReviewTicket(
		orderId: string,
		amount: number,
		metadata?: Record<string, unknown>
	): Promise<SupportTicket> {
		const ticketData: {
			orderId: string
			amount: number
			reason: SupportTicketReason
			metadata?: Record<string, unknown>
		} = {
			orderId,

			amount,

			/**
			 * Razón fija para tickets
			 * relacionados con pagos fallidos.
			 */
			reason: 'paymentFailed-over-threshold',
		}

		/**
		 * Agrega metadata únicamente
		 * si fue proporcionada.
		 */
		if (metadata !== undefined) {
			ticketData.metadata = metadata
		}

		/**
		 * Crea el ticket en MongoDB.
		 */
		const doc = await SupportTicketModel.create(ticketData)

		/**
		 * Retorna el ticket serializado.
		 */
		return doc.toJSON() as unknown as SupportTicket
	}

	/**
	 * Obtiene todos los tickets de soporte.
	 *
	 * Los tickets se ordenan desde
	 * el más reciente hasta el más antiguo.
	 *
	 * @returns {Promise<SupportTicket[]>}
	 * Lista de tickets registrados.
	 */
	async findAll(): Promise<SupportTicket[]> {
		const docs = await SupportTicketModel.find()
			.sort({ createdAt: -1 })
			.exec()

		return docs.map(
			(doc) => doc.toJSON() as unknown as SupportTicket
		)
	}
}