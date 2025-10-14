import express from "express";
// Mantenha os imports das funções de User.js
import get_all_users, { get_users_by_role } from "../User.js";

const router = express.Router();

// O bloco de inicialização de variáveis e o IIFE foram removidos.
// Não é necessário inicializar `let users = { ... }`

// Rota: GET /users
// Torne a rota ASYNC e chame a função de busca dentro dela.
router.get("/users", async (req, res) => {
    try {
        const users = await get_all_users(); // Busca os dados a cada requisição
        res.send(users.data);
    } catch (error) {
        // Lidar com erro
        console.error("Erro na rota /users:", error);
        res.status(500).send({ error: "Erro ao buscar todos os usuários." });
    }
});

// Rota: GET /names
router.get("/names", async (req, res) => {
    try {
        const users = await get_all_users();
        res.send(users.getNames());
    } catch (error) {
        res.status(500).send({ error: "Erro ao buscar nomes de usuários." });
    }
});

// Rota: GET /type
router.get("/type", async (req, res) => {
    try {
        const users = await get_all_users();
        res.send(users.getType());
    } catch (error) {
        res.status(500).send({ error: "Erro ao buscar tipos de usuário." });
    }
});

// Rota: GET /login
router.get("/login", async (req, res) => {
    try {
        const users = await get_all_users();
        res.send(users.getLogin());
    } catch (error) {
        res.status(500).send({ error: "Erro ao buscar logins de usuário." });
    }
});

// Rota: GET /permissions
router.get("/permissions", async (req, res) => {
    try {
        const users = await get_all_users();
        res.send(users.getPermissions());
    } catch (error) {
        res.status(500).send({ error: "Erro ao buscar permissões de usuário." });
    }
});

// Rota: GET /state
router.get("/state", async (req, res) => {
    try {
        const users = await get_all_users();
        res.send(users.getState());
    } catch (error) {
        res.status(500).send({ error: "Erro ao buscar estado de usuário." });
    }
});

// Rota: GET /unidades
router.get("/unidades", async (req, res) => {
    try {
        const users = await get_all_users();
        res.send(users.getUnidades());
    } catch (error) {
        res.status(500).send({ error: "Erro ao buscar unidades de usuário." });
    }
});

// Exemplo de como usar get_users_by_role
router.get("/type/:userType", async (req, res) => {
    try {
        const users = await get_users_by_role(req.params.userType);
        res.send(users.data);
    } catch (error) {
        res.status(500).send({ error: "Erro ao buscar usuários por tipo." });
    }
});


export default router;