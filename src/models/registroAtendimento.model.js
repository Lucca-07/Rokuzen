import mongoose from "mongoose";

const RegistroAtendimentoSchema = new mongoose.Schema(
    {
        unidade_id: { type: mongoose.Schema.Types.ObjectId, ref: "Unidade", required: true },
        cliente_id: { type: mongoose.Schema.Types.ObjectId, ref: "Cliente", default: null },
        servico_id: { type: mongoose.Schema.Types.ObjectId, ref: "Servico", required: true },
        colaborador_id: { type: mongoose.Schema.Types.ObjectId, ref: "Colaborador", required: true },

        inicio_atendimento: { type: Date, required: true },
        fim_atendimento: { type: Date, required: true },

        observacao_cliente: { type: String, default: "" },
        foi_marcado_online: { type: Boolean, default: false },
        encerrado: { type: Boolean, default: false },
    },
    { timestamps: true } // cria createdAt e updatedAt automaticamente
);

export default mongoose.model("RegistroAtendimento", RegistroAtendimentoSchema);
