import mongoose from "mongoose";

const LoginUsuarioSchema = new mongoose.Schema({
    user: String,
    pass: String,
    role: String,
});

export default mongoose.model("LoginUsuario", LoginUsuarioSchema);
