import mongoose from "mongoose";

const ClientesSchema = new mongoose.Schema({
    nome_cliente: { type: String, required: true },
    email_cliente: { type: String, required: true },
    telefone_cliente: { type: String, required: true },
    data_nascimento: { type: Date, required: true },
    respostas_saude: { type: Object, required: true },
    primeiro_atendimento: { type: Date, required: true },
    observacoes: { type: String, default: "" },
})

export default mongoose.model("Cliente", ClientesSchema);