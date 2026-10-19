import mongoose from "mongoose"
import { DB_NAME } from "../constant.js"

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  const uri = `${process.env.MONGODB_URI}/${DB_NAME}`

  try {
    const connectionInstance = await mongoose.connect(uri)
    console.log(
      `\n Mongoose connected !! DB HOST:${connectionInstance.connection.host}DB NAME:${connectionInstance.connection.name}\n`,
    )
    return connectionInstance
  } catch (error) {
    console.error("Error connecting to MongoDB", error)
    throw error
  }
}

export default connectDB

