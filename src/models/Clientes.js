import mongoose from "mongoose";

const ClientesSchema = new mongoose.Schema({
    nome_cliente: String,
    email_cliente: String,
    telefone_cliente: String,
    data_nascimento: Date,
    respostas_saude: Object,
    primeiro_atendimento: Date,
    observacoes: String,
})

export default mongoose.model("Cliente", ClientesSchema);