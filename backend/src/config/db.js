import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

let isConnected = false

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/'
  try {
    mongoose.set('strictQuery', false)
    await mongoose.connect(uri, {
      dbName: 'developer_assistant',
      serverSelectionTimeoutMS: 2500, // Quick timeout if MongoDB is not running locally
    })
    isConnected = true
    console.log('📦 MongoDB Connected:', uri, `(Database: ${mongoose.connection.name})`)
  } catch (err) {
    isConnected = false
    console.warn(`📦 MongoDB Connection Notice: Could not connect to MongoDB (${err.message}). Using unified persistence with graceful fallback.`)
  }
}

export function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1
}

export default connectDB
