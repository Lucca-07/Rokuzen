import mongoose from "mongoose";

const UsuarioExternoSchema = new mongoose.Schema({
    name: String,
    email: String,
    pass: String,
    tel: String,
    dt_nascto: Date,
})

export default mongoose.model("UsuarioExterno", UsuarioExternoSchema);