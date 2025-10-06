import express from "express";
const app = express();
const port = 8080;

import mongoose from "mongoose";

// import mysql2 from "mysql2";

import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { fileURLToPath } from "node:url";
const dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

import recuperarSenha from "./recuperarSenha.js";
import UsuarioInterno from "./UsuarioInterno.js";
import UsuarioExterno from "./UsuarioExterno.js";
// import { error } from "node:console";

app.use(express.json());

// async function connectMySQL(){

//     const connection = mysql2.createConnection({
//         host: process.env.HOST_DB,
//         port: process.env.PORT_DB,
//         password: process.env.PASS_DB,
//         database: process.env.NAME_DB,
//     });
//     return connection;
// }

// Conecta ao banco de dados

const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conectado ao mongodb");
    } catch (error) {
        console.log("Erro ao conectar ao mongodb: ", error);
    }
};
connectMongoDB()


// Verifique a rota '/vendor' primeiro
app.use("/vendor", express.static(path.join(dirname, "../node_modules")));
// Depois, sirva os outros arquivos estáticos
app.use(express.static(path.join(dirname)));

// Rota da Página de Login
app.get("/", (req, res) => {
    res.sendFile(dirname + "/frontend/index.html");
});
// Rota da Página de Recuperação de senha
app.get("/recuperar", (req, res) => {
    res.sendFile(dirname + "/frontend/recuperarSenha.html");
});

app.get("/cadastrar", (req,res) => {
    res.sendFile(dirname + "/frontend/cadastro.html")
})

// Verifica o Login
app.post("/login", async (req, res) => {
    const { email, pass } = req.body;
    try {
        const loginUsuario = await UsuarioInterno.findOne({
            email: email,
            pass: pass,
        });
        if (loginUsuario) {
            res.json({ validado: true, mensagem: "Login efetuado!" });
            // console.log(loginUsuario.role);
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
// Verifica se o email a ser recuperado está no banco de dados
app.post("/recuperar", async (req, res) => {
    const { emailRecuperacao } = req.body;
    try {
        const emailUsuario = await UsuarioInterno.findOne({
            email: emailRecuperacao,
        });
        if (emailUsuario) {
            recuperarSenha(emailRecuperacao);
            res.json({ mensagem: "Email enviado" });
            console.log(emailRecuperacao);
        } else {
            res.status(401).json({
                mensagem: "Email não existente",
            });
            console.log(
                "Tentativa de recuperação com email não existente:",
                emailRecuperacao
            );
        }
    } catch (error) {
        res.status(500).json({ mensagem: "Erro no servidor" });
    }
});
// Pega os dados e atualiza a senha
app.post("/atualizarSenha", async (req, res) => {
    const { email, newpass } = req.body;
    try {
        // Sintaxe correta: findOneAndUpdate(filtro, atualização, opções)
        const emailUsuario = await UsuarioInterno.findOneAndUpdate(
            { email: email }, // Filtro: encontrar o usuário por email
            { $set: { pass: newpass } },
            { new: true }
        );

        if (emailUsuario) {
            // Envia a resposta de sucesso APENAS UMA VEZ
            res.json({ mensagem: "Senha atualizada com sucesso!" });
        } else {
            // Envia a resposta de erro APENAS UMA VEZ
            res.status(404).json({ mensagem: "Usuário não encontrado." });
        }
    } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        res.status(500).json({ mensagem: "Erro no servidor" });
    }
});

app.listen(8080, () => {
    console.log(`Servidor rodando na porta: ${port}`);
});
