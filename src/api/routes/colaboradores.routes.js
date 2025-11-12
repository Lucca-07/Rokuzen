import express from "express";
import Colaborador from "../../models/Colaborador.js";

const router = express.Router();

// =====================================
// LISTAR PONTUAÇÃO DOS TERAPEUTAS
// =====================================
router.get("/pontuacao", async (req, res) => {
    try {
        const terapeutas = await Colaborador.find(
            { ativo: true },
            { nome_colaborador: 1, pontos: 1, _id: 0 }
        )
            .sort({ pontos: -1 }) // maior → menor
            .limit(10); // top 10, pode aumentar se quiser

        res.json(terapeutas);
    } catch (error) {
        console.error("Erro ao buscar pontuação:", error);
        res.status(500).json({ erro: "Erro ao buscar pontuação dos terapeutas." });
    }
});

export default router;
