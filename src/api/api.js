import express from "express";
import dotenv from "dotenv";
dotenv.config();
import get_all_users from "./User.js"; // Importa a função de busca

// Importa o módulo de conexão com o DB
import connectDB from "../modules/connect.js";

// Importa os roteadores
import userRoutes from "./routes/user.routes.js"; // Novo arquivo
import clientRoutes from "./routes/client.routes.js"; // Novo arquivo

const app = express();

let users = {
    data: [],
    getNames: () => [],
    getLogin: () => [],
    getType: () => [],
    getState: () => [],
    getPermissions: () => [],
    getUnidades: () => [],
};
(async function loadInitialUserData() {
    users = await get_all_users();
})();

// Inicia a conexão com o banco de dados
connectDB();

// Middleware para permitir que o Express processe corpos de requisição em formato JSON
app.use(express.json());

// --- Rotas de Usuários Internos ---
// O roteador 'userRoutes' será responsável por todas as rotas que começam com '/' (no contexto da API)
// Mantendo a rota base ('/') para usuários internos, como estava.
app.use(
    "/users",
    (req, res, next) => {
        req.app.locals.users = users;
        next();
    },
    userRoutes
);

// --- Rotas de Clientes ---
// O roteador 'clientRoutes' será responsável por todas as rotas que começam com '/clients'
app.use("/clients", clientRoutes);

// --- Inicialização do Servidor ---

// Inicia o servidor Express e o faz escutar na porta especificada.
// A parte do código original que carregava os dados (await get_all_users() etc.)
// foi movida para dentro dos respectivos arquivos de rota (user.routes.js e client.routes.js).
app.listen(1234, () => {
    console.log("Servidor Rodando na porta 1234");
});
