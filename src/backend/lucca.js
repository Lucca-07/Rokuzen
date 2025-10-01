import express from "express";
const app = express();
const port = 8080;

import mongoose from "mongoose";
import LoginUsuario from "./LoginUsuario.js";

import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "node:url";
const dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

dotenv.config();

// Conecta ao banco de dados
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conectado ao mongodb");
    } catch (error) {
        console.log("Erro ao conectar ao mongodb: ", error);
    }
};

connectDB();

// Verifique a rota '/vendor' primeiro
app.use("/vendor", express.static(path.join(dirname, "../node_modules")));
// Depois, sirva os outros arquivos estáticos
app.use(express.static(path.join(dirname)));

app.use(express.json());


// Rota da Página de Login
app.get("/", (req, res) => {
    res.sendFile(dirname + "/frontend/index.html");
});

// Verifica o Login
app.post("/login", async (req, res) => {
    const { user, pass } = req.body;
    try {
        const loginUsuario = await LoginUsuario.findOne({
            user: user,
            pass: pass,
        });
        if (loginUsuario) {
            res.json({ validado: true, mensagem: "Login efetuado!" });
            console.log(loginUsuario.role);
        } else {
            res.status(401).json({
                validado: false,
                mensagem: "Usuário ou senha inválidos",
            });
        }
    } catch (error) {
        res.status(500).json({ validado: false, mensagem: "Erro no servidor" });
    }
});

app.listen(8080, () => {
    console.log(`Servidor rodando na porta: ${port}`);
});
