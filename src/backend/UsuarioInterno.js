import mongoose from "mongoose";

const UsuarioInternoSchema = new mongoose.Schema({
    name: String,
    email: String,
    pass: String,
    role: String,
    tel: String,
});

export default mongoose.model("UsuarioInterno", UsuarioInternoSchema);
