import mongoose from 'mongoose'

/**
 * Helper transversal para validar ids con el formato de MongoDB.
 */
export function isValidObjectId(id: string): boolean {
	return mongoose.Types.ObjectId.isValid(id)
}

