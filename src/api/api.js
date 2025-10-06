import express from "express";

const app = express();

import get_all_users from "./User.js";
import {
    get_all_users_admin,
    get_all_users_gerente,
    get_all_users_recepcao,
    get_all_users_terapeuta,
} from "./User.js";
import get_all_clients, { set_name_client } from "./Client.js";

import connectDB from "../modules/connect.js";

connectDB();

app.use(express.json());

const users = await get_all_users();
const masterUsers = await get_all_users_admin();
const gerenteUsers = await get_all_users_gerente();
const recepcaoUsers = await get_all_users_recepcao();
const terapeutaUsers = await get_all_users_terapeuta();
const clients = await get_all_clients();

app.get("/", (req, res) => {
    res.send(users.data);
});
app.get("/names", (req, res) => {
    res.send(users.getNames());
});
app.get("/roles", (req, res) => {
    res.send(users.getRoles());
});
app.get("/emails", (req, res) => {
    res.send(users.getEmails());
});
app.get("/master", (req, res) => {
    res.send(masterUsers.data);
});
app.get("/gerente", (req, res) => {
    res.send(gerenteUsers.data);
});
app.get("/recepcao", (req, res) => {
    res.send(recepcaoUsers.data);
});
app.get("/terapeuta", (req, res) => {
    res.send(terapeutaUsers.data);
});

app.get("/clients", (req, res) => {
    const date = new Date();
    const diaNascto = clients.getDiaNascto()[0];
    const mesNascto = clients.getMesNascto()[0];
    res.send(clients.data);
    console.log(date);
    console.log(`Dia Nascimento: ${clients.getDiaNascto()[0]}`);
    console.log(`Mês Nascimento: ${clients.getMesNascto()[0] + 1}`);
    if (diaNascto == date.getDate() && mesNascto == date.getUTCMonth()) {
        console.log("Dia do Aniversário");
    } else {
        console.log("Não é seu aniversário");
    }
});

app.put("/clients/:id", async (req, res) => {
    try {
        const updClient = await set_client_name(req.params.id, req.body);
        res.json(updClient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(1234, () => {
    console.log("Servidor Rodando na porta 1234");
});
