import express from "express";
import get_all_clients, {
    get_todays_birthdays,
    set_client_name,
} from "../Client.js";

const router = express.Router();

// --- Carregamento Inicial de Dados (Executado uma vez na inicialização) ---
let clients = {
    data: [],
    getNames: () => [],
    getTel: () => [],
    getEmails: () => [],
    getNascto: () => [],
    getObservacoes: () => [],
    getPrimeiroAtendimento: () => [],
    getRespostasSaude: () => [],
};

(async function loadInitialClientData() {
    clients = await get_all_clients();
})();

// Rota: GET /
// Retorna um array com todos os clientes cadastrados.
router.get("/", async (req, res) => {
    try {
        // Busca os dados atualizados do banco de dados a cada requisição.
        const clients = await get_all_clients();
        res.send(clients.data);
    } catch (error) {
        console.error("Erro ao buscar todos os clientes:", error);
        res.status(500).send({ error: "Erro ao buscar todos os clientes." });
    }
});

// Rota: GET /birth/today
// Retorna um array com todos os clientes que fazem aniversário na data atual.
// O caminho da rota no api.js será '/clients/birth/today'
router.get("/birth/today", async (req, res) => {
    try {
        const birthdayClients = await get_todays_birthdays();
        res.json(birthdayClients);
    } catch (error) {
        // Logar o erro completo para debug, mas enviar uma mensagem genérica para o cliente
        console.error("Erro ao buscar aniversariantes:", error);
        res.status(500).json({
            error: "Erro interno do servidor ao buscar aniversariantes.",
        });
    }
});

// Rota: PUT /:id
// Atualiza as informações de um cliente específico com base no seu ID.
// O caminho da rota no api.js será '/clients/:id'
router.put("/:id", async (req, res) => {
    const id = req.params.id.trim();
    const body = req.body;

    try {
        const updatedClient = await set_client_name(id, body);
        if (updatedClient) {
            res.json(updatedClient);
        } else {
            res.status(404).send("Cliente não encontrado.");
        }
    } catch (error) {
        // Captura erros de validação do MongoDB (se aplicável) ou outros erros
        console.error("Erro ao atualizar cliente:", error);
        res.status(500).send("Erro ao atualizar cliente.");
    }
});

export default router;
