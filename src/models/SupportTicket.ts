import mongoose, { Schema, type Model } from 'mongoose'

// Tickets de soporte generados cuando un pago falla y el monto supera el umbral.
export type SupportTicketReason = 'paymentFailed-over-threshold'

export type SupportTicketAttributes = {
	orderId: string
	amount: number
	reason: SupportTicketReason
	metadata?: Record<string, unknown>
}

export interface SupportTicket extends SupportTicketAttributes {
	id: string
	createdAt: Date
	updatedAt: Date
}

const supportTicketSchema = new Schema<SupportTicketAttributes>(
	{
		orderId: { type: String, required: true, index: true },
		amount: { type: Number, required: true, min: 0 },
		reason: { type: String, required: true },
		metadata: { type: Schema.Types.Mixed },
	},
	{
		collection: 'supportTickets',
		versionKey: false,
		timestamps: true,
		toJSON: {
			transform: (_doc, ret) => {
				const output = ret as SupportTicketAttributes & {
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
		toObject: {
			transform: (_doc, ret) => {
				const output = ret as SupportTicketAttributes & {
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

export const SupportTicketModel: Model<SupportTicketAttributes> =
	(mongoose.models.SupportTicket as Model<SupportTicketAttributes> | undefined) ??
	mongoose.model<SupportTicketAttributes>('SupportTicket', supportTicketSchema)

