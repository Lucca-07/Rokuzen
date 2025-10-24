import mongoose from "mongoose";

const ColaboradoresSchema = new mongoose.Schema({
    nome_colaborador: String,
    ativo: Boolean,
    tipo_colaborador: String,
    unidades_trabalha: Array,
    perfis_usuario: Array,
    login: Object,
    imagem: String
});

export default mongoose.model("Colaboradores", ColaboradoresSchema);
