/*Establece la conexión con la basse de datos MongoDB*/
import mongoose from 'mongoose'

async function connectDB() {
    const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/miralo'
    await mongoose.connect(uri)
    console.log('Conectado a MongoDB')
}

export default connectDB