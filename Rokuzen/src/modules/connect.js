import mongoose from "mongoose";

export default async function connectDB() {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        const dbName = conn && conn.connection && conn.connection.db && conn.connection.db.databaseName;
        console.log("Conectado ao mongodb", dbName ? `(db: ${dbName})` : "");
    } catch (error) {
        console.log("Erro ao conectar ao mongodb: ", error);
    }
}
