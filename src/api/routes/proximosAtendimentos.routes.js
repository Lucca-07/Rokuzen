import express from "express";
import RegistroAtendimento from "../../models/registroAtendimento.model.js";
import Colaborador from "../../models/colaborador.js";

const router = express.Router();

// Buscar próximos atendimentos do dia — limite 10
router.post("/", async (req, res) => {
    try {
        const { unidade } = req.body;

        if (!unidade) {
            return res.status(400).json({ msg: "Unidade não enviada." });
        }

        const agora = new Date();
        const hojeInicio = new Date();
        const hojeFim = new Date();

        hojeInicio.setHours(0, 0, 0, 0);
        hojeFim.setHours(23, 59, 59, 999);

        // Buscar apenas sessões de hoje e futuras
        const registros = await RegistroAtendimento.find({
            unidade_id: unidade,
            inicio_atendimento: {
                $gte: agora,         // ainda não aconteceu
                $lte: hojeFim        // apenas do dia atual
            }
        })
            .sort({ inicio_atendimento: 1 }) // ordem crescente
            .limit(10);

        // Popular manualmente o nome do colaborador
        const resultadosCompletos = await Promise.all(
            registros.map(async (reg) => {
                const terapeuta = await Colaborador.findById(reg.colaborador_id);

                return {
                    id: reg._id,
                    inicio_atendimento: reg.inicio_atendimento,
                    createdAt: reg.createdAt,
                    nome_terapeuta: terapeuta?.nome || "Não encontrado",
                };
            })
        );

        return res.json(resultadosCompletos);
    } catch (error) {
        console.error("Erro ao buscar próximos atendimentos:", error);
        return res.status(500).json({ msg: "Erro interno no servidor" });
    }
});

export default router;
