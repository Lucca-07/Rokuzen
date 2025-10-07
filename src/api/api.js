import express from "express";

const app = express();

import get_all_users from "./User.js";
import {
    get_all_users_admin,
    get_all_users_gerente,
    get_all_users_recepcao,
    get_all_users_terapeuta,
} from "./User.js";
import get_all_clients, {
    get_todays_birthdays,
    set_client_name,
} from "./Client.js";

import connectDB from "../modules/connect.js";

// Inicia a conexão com o banco de dados
connectDB();

// Middleware para permitir que o Express processe corpos de requisição em formato JSON
app.use(express.json());

// --- Carregamento Inicial de Dados (Executado uma vez na inicialização do servidor) ---
const users = await get_all_users();
const masterUsers = await get_all_users_admin();
const gerenteUsers = await get_all_users_gerente();
const recepcaoUsers = await get_all_users_recepcao();
const terapeutaUsers = await get_all_users_terapeuta();
const clients = await get_all_clients();

// --- Rotas de Usuários Internos ---

// Rota: GET /
// Retorna um array com todos os usuários internos (funcionários).
app.get("/", (req, res) => {
    res.send(users.data);
});

// Rota: GET /names
// Retorna um array contendo apenas os nomes de todos os usuários internos.
app.get("/names", (req, res) => {
    res.send(users.getNames());
});

// Rota: GET /roles
// Retorna um array contendo apenas as funções (roles) de todos os usuários internos.
app.get("/roles", (req, res) => {
    res.send(users.getRoles());
});

// Rota: GET /emails
// Retorna um array contendo apenas os emails de todos os usuários internos.
app.get("/emails", (req, res) => {
    res.send(users.getEmails());
});

// Rota: GET /master
// Retorna um array com todos os usuários que possuem a função 'Owner'.
app.get("/master", (req, res) => {
    res.send(masterUsers.data);
});

// Rota: GET /gerente
// Retorna um array com todos os usuários que possuem a função 'Gerente'.
app.get("/gerente", (req, res) => {
    res.send(gerenteUsers.data);
});

// Rota: GET /recepcao
// Retorna um array com todos os usuários que possuem a função 'Recepcao'.
app.get("/recepcao", (req, res) => {
    res.send(recepcaoUsers.data);
});

// Rota: GET /terapeuta
// Retorna um array com todos os usuários que possuem a função 'Terapeuta'.
app.get("/terapeuta", (req, res) => {
    res.send(terapeutaUsers.data);
});

// --- Rotas de Clientes ---

// Rota: GET /clients
// Retorna um array com todos os clientes cadastrados.
app.get("/clients", (req, res) => {
    res.send(clients.data);
});

// Rota: GET /clients/birth/today
// Retorna um array com todos os clientes que fazem aniversário na data atual.
app.get("/clients/birth/today", async (req, res) => {
    try {
        // Esta função retorna um ARRAY de clientes
        const birthdayClients = await get_todays_birthdays();
        res.json(birthdayClients); // Envia o array de clientes como resposta
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar aniversariantes." });
    }
});

// Rota: PUT /clients/:id
// Atualiza as informações de um cliente específico com base no seu ID.
// Parâmetros:
// - id: O ID do cliente a ser atualizado (na URL).
// - req.body: O corpo da requisição contendo os campos a serem atualizados.
app.put("/clients/:id", async (req, res) => {
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
        res.status(500).send("Erro ao atualizar cliente.");
    }
});

// --- Inicialização do Servidor ---

// Inicia o servidor Express e o faz escutar na porta especificada.
app.listen(1234, () => {
    console.log("Servidor Rodando na porta 1234");
});
