import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoServer: MongoMemoryServer | null = null

export async function connectMemoryMongo(): Promise<void> {
	mongoServer = await MongoMemoryServer.create()
	const uri = mongoServer.getUri()
	await mongoose.connect(uri)
}

export async function clearMemoryMongo(): Promise<void> {
	const collections = mongoose.connection.collections

	for (const collection of Object.values(collections)) {
		await collection.deleteMany({})
	}
}

export async function disconnectMemoryMongo(): Promise<void> {
	await mongoose.disconnect()

	if (mongoServer) {
		await mongoServer.stop()
		mongoServer = null
	}
}

