import { AppError } from '../handlers/AppError'
import type { OrderEventType } from '../models/Order'
import { OrderState } from '../models/OrderState'

// Tabla declarativa de transiciones válidas de la máquina de estados.
// Cada evento define el siguiente estado posible para un estado actual.
const transitions: Partial<Record<OrderState, Partial<Record<OrderEventType, OrderState>>>> = {
	[OrderState.Pending]: {
		pendingBiometricalVerification: OrderState.OnHold,
		noVerificationNeeded: OrderState.PendingPayment,
		paymentFailed: OrderState.Cancelled,
		orderCancelled: OrderState.Cancelled,
	},
	[OrderState.OnHold]: {
		biometricalVerificationSuccessful: OrderState.PendingPayment,
		verificationFailed: OrderState.Cancelled,
	},
	[OrderState.PendingPayment]: {
		paymentSuccessful: OrderState.Confirmed,
	},
	[OrderState.Confirmed]: {
		preparingShipment: OrderState.Processing,
	},
	[OrderState.Processing]: {
		itemDispatched: OrderState.Shipped,
	},
	[OrderState.Shipped]: {
		itemReceivedByCustomer: OrderState.Delivered,
		deliveryIssue: OrderState.OnHold,
	},
	[OrderState.Delivered]: {
		returnInitiatedByCustomer: OrderState.Returning,
	},
	[OrderState.Returning]: {
		itemReceivedBack: OrderState.Returned,
	},
	[OrderState.Returned]: {
		refundProcessed: OrderState.Refunded,
	},
}

const cancellableByUserStates = new Set<OrderState>([
	OrderState.Pending,
	OrderState.OnHold,
	OrderState.PendingPayment,
	OrderState.Confirmed,
	OrderState.Processing,
	OrderState.Shipped,
	OrderState.Returning,
])

/**
 * Resuelve transiciones válidas de la orden sin tocar persistencia.
 * Esta clase concentra la regla de negocio del flujo de estados.
 */
export default class OrderStateService {
	/** Devuelve el siguiente estado o `null` si el evento no aplica. */
	getNextState(currentState: OrderState, eventType: OrderEventType): OrderState | null {
		if (eventType === 'orderCancelledByUser') {
			return cancellableByUserStates.has(currentState) ? OrderState.Cancelled : null
		}

		return transitions[currentState]?.[eventType] ?? null
	}

	/** Lanza un error de negocio cuando no existe transición para el evento recibido. */
	assertTransition(currentState: OrderState, eventType: OrderEventType): OrderState {
		const nextState = this.getNextState(currentState, eventType)
		if (!nextState) {
			throw new AppError(
				409,
				'INVALID_ORDER_TRANSITION',
				`No existe transición para el estado ${currentState} con el evento ${eventType}`
			)
		}

		return nextState
	}
}

