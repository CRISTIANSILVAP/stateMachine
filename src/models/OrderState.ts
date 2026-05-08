export enum OrderState {
    Pending         = 'Pending',
    OnHold          = 'OnHold',
    PendingPayment  = 'PendingPayment',
    Confirmed       = 'Confirmed',
    Processing      = 'Processing',
    Shipped         = 'Shipped',
    Delivered       = 'Delivered',
    Returning       = 'Returning',
    Returned        = 'Returned',
    Refunded        = 'Refunded',
    Cancelled       = 'Cancelled',
}

export const ORDER_STATES = [
	OrderState.Pending,
	OrderState.OnHold,
	OrderState.PendingPayment,
	OrderState.Confirmed,
	OrderState.Processing,
	OrderState.Shipped,
	OrderState.Delivered,
	OrderState.Returning,
	OrderState.Returned,
	OrderState.Refunded,
	OrderState.Cancelled,
] as const
