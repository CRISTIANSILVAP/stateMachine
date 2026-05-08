import { describe, expect, it } from 'vitest'
import { AppError } from '../../src/handlers/AppError'
import { OrderState } from '../../src/models/OrderState'
import OrderStateService from '../../src/services/OrderStateService'

describe('OrderStateService', () => {
	const service = new OrderStateService()

	it('retorna el siguiente estado para una transicion valida', () => {
		const nextState = service.getNextState(OrderState.Pending, 'noVerificationNeeded')
		expect(nextState).toBe(OrderState.PendingPayment)
	})

	it('permite cancelar por usuario cuando el estado es cancelable', () => {
		const nextState = service.getNextState(OrderState.Processing, 'orderCancelledByUser')
		expect(nextState).toBe(OrderState.Cancelled)
	})

	it('no permite cancelar por usuario cuando el estado no es cancelable', () => {
		const nextState = service.getNextState(OrderState.Delivered, 'orderCancelledByUser')
		expect(nextState).toBeNull()
	})

	it('lanza AppError para transiciones invalidas', () => {
		expect(() => service.assertTransition(OrderState.Pending, 'itemDispatched')).toThrow(AppError)
		expect(() => service.assertTransition(OrderState.Pending, 'itemDispatched')).toThrow(
			'No existe transición para el estado Pending con el evento itemDispatched'
		)
	})
})

