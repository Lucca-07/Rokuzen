import mongoose from "mongoose";

const ColaboradoresSchema = new mongoose.Schema({
    nome_colaborador: { type: String, required: true },
    ativo: Boolean,
    tipo_colaborador: String,
    unidades_trabalha: Array,
    perfis_usuario: Array,
    login: Object,
});

export default mongoose.model("Colaboradores", ColaboradoresSchema);
