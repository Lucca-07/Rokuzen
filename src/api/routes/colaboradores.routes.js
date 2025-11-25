import express from "express";
import Colaborador from "../../models/Colaborador.js";

const router = express.Router();

/**
 * 🔹 Função utilitária para normalizar strings
 * Remove acentos, espaços e diferenciação de maiúsculas/minúsculas.
 * Exemplo:
 *  "Mooca Plaza" → "moocaplaza"
 *  "MoocaPlaza"  → "moocaplaza"
 */
function normalize(str) {
  return str
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/\s+/g, "") // remove todos os espaços
    .trim()
    .toLowerCase();
}

/**
 * 🔹 POST /api/colaboradores/pontuacao
 * Corpo esperado: { unidade: "Golden Square" }
 */
router.post("/pontuacao", async (req, res) => {
  try {
    const { unidade } = req.body;

    if (!unidade) {
      return res.status(400).json({ erro: "A unidade é obrigatória." });
    }

    const unidadeNormalizada = normalize(unidade);

    // Busca somente colaboradores ativos e cujas unidades correspondam
    const colaboradores = await Colaborador.find({ ativo: true });

    // Filtra apenas os colaboradores da unidade solicitada
    const terapeutas = colaboradores
      .filter(colab =>
        colab.unidades_trabalha.some(
          u => normalize(u) === unidadeNormalizada
        )
      )
      .map(c => ({
        nome_colaborador: c.nome_colaborador,
        pontos: c.pontos,
      }))
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 10);

    res.json(terapeutas);
  } catch (error) {
    console.error("Erro ao buscar pontuação por unidade:", error);
    res.status(500).json({ erro: "Erro ao buscar pontuação dos terapeutas." });
  }
});

/**
 * 🔹 GET /api/colaboradores/pontos/:unidade
 * Exemplo: /api/colaboradores/pontos/Golden%20Square
 */
router.get("/pontos/:unidade", async (req, res) => {
  try {
    const { unidade } = req.params;
    const unidadeNormalizada = normalize(unidade);

    // Busca apenas colaboradores ativos
    const colaboradores = await Colaborador.find({ ativo: true });

    // Filtra localmente as unidades normalizadas
    const filtrados = colaboradores.filter(colab =>
      colab.unidades_trabalha.some(
        u => normalize(u) === unidadeNormalizada
      )
    );

    const resultado = filtrados
      .map(c => ({
        nome: c.nome_colaborador,
        pontos: c.pontos,
      }))
      .sort((a, b) => b.pontos - a.pontos);

    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro ao buscar colaboradores por unidade:", error);
    res.status(500).json({ message: "Erro ao buscar colaboradores por unidade" });
  }
});

export default router;
