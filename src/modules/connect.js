import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export default async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conectado ao mongodb");
    } catch (error) {
        console.log("Erro ao conectar ao mongodb: ", error);
    }
}
