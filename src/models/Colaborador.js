import mongoose from "mongoose";

const ColaboradorSchema = new mongoose.Schema(
    {
        nome_colaborador: {
            type: String,
            required: true,
        },
        ativo: {
            type: Boolean,
            default: true,
        },
        tipo_colaborador: {
            type: String,
            default: "terapeuta",
        },
        unidades_trabalha: {
            type: [String],
            default: [],
        },
        perfis_usuario: {
            type: [String],
            default: [],
        },
        login: {
            email: { type: String },
            pass: { type: String },
        },
        intervalo: {
            type: Boolean,
            default: false,
        },
        timer: {
            tempo_restante: { type: Number },
            emAndamento: { type: Boolean },
            createdAt: { type: Date },
            updatedAt: { type: Date },
        },
        imagem: {
            type: String,
            default: null,
        },
        pontos: {
            type: Number,
            default: 0,
        },
    },
    { collection: "colaboradores" }
);

export default mongoose.model("Colaborador", ColaboradorSchema);
