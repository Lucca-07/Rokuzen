import express from "express";
import PostosAtendimento from "../../models/PostosAtendimento.js";
import Unidade from "../../models/Unidades.js";

const router = express.Router();

// Rota para DEBUG - listar todas as unidades
router.get("/debug/unidades", async (req, res) => {
    try {
        const unidades = await Unidade.find({});
        console.log("Unidades no banco:", unidades);
        return res.json(unidades);
    } catch (error) {
        console.error("Erro ao buscar unidades:", error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.post("/disponiveis", async (req, res) => {
    try {
        const { unidade } = req.body || {};

        if (!unidade) {
            return res.status(400).json({
                erro: 'Campo "unidade" é obrigatório',
            });
        }

        // Tente buscar com regex case-insensitive
        const unidadeEncontrada = await Unidade.findOne({
            $or: [
                { nome_unidade: { $regex: unidade, $options: "i" } },
                { nome: { $regex: unidade, $options: "i" } },
            ],
        });

        if (!unidadeEncontrada) {
            return res.status(404).json({
                error: `Unidade "${unidade}" não encontrada.`,
                dica: "Verifique o nome da unidade ou acesse /api/equipamentos/debug/unidades para ver todas",
            });
        }

        const equipamentosDisponiveis = await PostosAtendimento.find({
            status: { $regex: /^dispon[ií]vel$/i },
            unidade_id: unidadeEncontrada._id,
        });

        return res.json(equipamentosDisponiveis);
    } catch (error) {
        console.error("Erro ao buscar equipamentos disponíveis:", error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

export default router;
