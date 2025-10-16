import mongoose from "mongoose";

const ColaboradoresSchema = new mongoose.Schema({
    nome_colaborador: { type: String, required: true },
    ativo: { type: Boolean, default: true },
    tipo_colaborador: { type: String, enum: ["admin", "user"], default: "user" },
    unidades_trabalha: { type: [String], default: [] },
    perfis_usuario: { type: [String], default: [] },
    login: { type: Object },
});

export default mongoose.model("Colaboradores", ColaboradoresSchema);
