import mongoose  from "mongoose";

const ServicosSchemas =  new mongoose.Schema({
    unidade_id: { type: Number, ref: "Unidades", required: true },
    nome_servico :{ type: String, required: true},
    valor : { type: Number, required: true},
    ativo : {type: Boolean, required: true},
    pontos_equivalentes : {type: Number, required: true}
})
export default mongoose.model("Servicos" , ServicosSchemas)