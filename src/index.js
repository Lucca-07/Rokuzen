// IMPORTS
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { fileURLToPath } from "node:url";
import connectDB from "./modules/connect.js";
connectDB();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import recuperarSenha from "./modules/recuperarSenha.js";
import Clientes from "../src/models/Clientes.js";
import Atendimentos from "./models/Atendimentos.js";
import Colaboradores from "../src/models/Colaboradores.js";

// CONSTANTS IMPORTANTES
const dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const app = express();
const port = 8080;

// Middleware para o express entender JSON
app.use(express.json());

// Servir os arquivos estáticos do projeto (CSS, IMG ...)
app.use("/vendor", express.static(path.join(dirname, "../node_modules")));
app.use(express.static(path.join(dirname, "src")));

// GETS
// Rota da Página de Login
app.get("/", (req, res) => {
    res.sendFile(path.join(dirname, "src", "frontend", "index.html"));
});
// Rota da Página de Recuperação de senha
app.get("/recuperar", (req, res) => {
    res.sendFile(path.join(dirname, "src", "frontend", "recuperarSenha.html"));
});
// Rota para a Página de Cadastro
app.get("/cadastrar/:id", async (req, res) => {
    const id = req.params.id;
    if (!id) return res.redirect("/");
    res.sendFile(path.join(dirname, "src", "frontend", "cadastro.html"));
});
// Rota da página de inicio
app.get("/inicio/:id", async (req, res) => {
    const id = req.params.id;
    if (!id) return res.redirect("/");
    res.sendFile(path.join(dirname, "src", "frontend", "paginaInicio.html"));
});
//Rota da página de postoatendimento
app.get("/postosatendimento/:id", async (req, res) => {
    const id = req.params.id;
    if (!id) return res.redirect("/");
    res.sendFile(
        path.join(dirname, "src", "frontend", "postoatendimento.html")
    );
});
//Rota da página de escala
app.get("/escala/:id", async (req, res) => {
    const id = req.params.id;
    if (!id) return res.redirect("/");
    res.sendFile(path.join(dirname, "src", "frontend", "escala.html"));
});
//Rota da página de sessoes
app.get("/sessao/:id", async (req, res) => {
    const id = req.params.id;
    if (!id) return res.redirect("/");
    res.sendFile(path.join(dirname, "src", "frontend", "sessao.html"));
});
app.get("/listarterapeutas", async (req, res) => {
    res.sendFile(
        path.join(dirname, "src", "frontend", "listarTerapeutas.html")
    );
});

//Rota da api de listar Terapeutas
app.get("/api/listarterapeutas", async (req, res) => {
    try {
        const terapeutas = await Colaboradores.find({
            perfis_usuario: "terapeuta",
        });

        const result = [];

        for (const t of terapeutas) {
            const atendimentos = await Atendimentos.find({
                colaborador_id: t._id,
                fim_atendimento: { $gte: new Date() },
            }).sort({ inicio_atendimento: 1 }); // ordena do mais próximo

            // Se não tiver atendimentos futuros
            if (atendimentos.length === 0) {
                result.push({
                    nome: t.nome_colaborador || "Nome não definido",
                    inicio_atendimento: null,
                    inicio_atendimento_data: null,
                    inicio_atendimento_horas: null,
                    fim_atendimento: null,
                    fim_atendimento_horas: null,
                    fim_atendimento_data: null,
                    status_sessao: "Disponível",
                    colaborador_id: t._id,
                    intervalo: t.intervalo || false,
                });
            } else {
                const a = atendimentos[0];
                const inicio = new Date(a.inicio_atendimento);
                const fim = new Date(a.fim_atendimento);

                let status = "Disponível";
                if (inicio <= new Date() && fim >= new Date())
                    status = "Em sessão";
                else if (inicio > new Date()) status = "Disponível";
                else status = "Intervalo";

                result.push({
                    nome: t.nome_colaborador || "Nome não definido",
                    inicio_atendimento: inicio.toISOString(),
                    inicio_atendimento_data: inicio.toLocaleDateString([], {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                    }),
                    inicio_atendimento_horas: inicio.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    fim_atendimento: fim.toISOString(),
                    fim_atendimento_horas: fim.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    fim_atendimento_data: fim.toLocaleDateString([], {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                    }),
                    status_sessao: status,
                    colaborador_id: t._id,
                    intervalo: t.intervalo || false,
                });
            }
        }

        res.json({ terapeutas: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Erro ao listar terapeutas e atendimentos",
        });
    }
});

// Rota de API
app.get("/api/colaboradores/:id", checkToken, async (req, res) => {
    const id = req.params.id;
    try {
        // Opcional: garantir que o id do token bate com o id pedido (ou tratar roles/admin)
        if (req.userId !== id) {
            return res.status(403).json({ msg: "Acesso proibido." });
        }

        const user = await Colaboradores.findById(id, "-login.pass");
        if (!user)
            return res.status(404).json({ msg: "Usuário não encontrado." });

        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Erro no servidor." });
    }
});
function checkToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res
            .status(401)
            .json({ msg: "Acesso negado. Token não fornecido." });
    }

    try {
        const secret = process.env.SECRET;
        const decoded = jwt.verify(token, secret);
        req.userId = decoded.id; // anexa id do token
        next();
    } catch (error) {
        console.log("JWT error:", error);
        return res.status(401).json({ msg: "Token inválido." });
    }
}

// POSTS
// Registrar Usuário
app.post("/auth/register", async (req, res) => {
    const {
        nome_colaborador,
        ativo,
        tipo_colaborador,
        unidades_trabalha,
        perfis_usuario,
    } = req.body;
    const { email, pass, confirmpass } = req.body.login;
    if (!nome_colaborador) {
        return res.status(422).json({ msg: "O nome é obrigatório" });
    }
    if (!email) {
        return res.status(422).json({ msg: "O email é obrigatório" });
    }
    if (!pass) {
        return res.status(422).json({ msg: "A senha é obrigatório" });
    }
    if (pass !== confirmpass) {
        return res.status(422).json({ msg: "As senhas não conferem" });
    }
    if (!perfis_usuario) {
        return res
            .status(422)
            .json({ msg: "O usuário deve ter pelo menos 1 perfil" });
    }
    // Checa se ja existe um user com o email
    const userExist = await Colaboradores.findOne({ "login.email": email });
    if (userExist) {
        return res.status(422).json({ msg: "Por favor utilize outro email" });
    }
    // Cria a senha hash
    const salt = await bcrypt.genSalt(12);
    const passHash = await bcrypt.hash(pass, salt);
    const user = new Colaboradores({
        nome_colaborador,
        ativo,
        tipo_colaborador,
        unidades_trabalha,
        perfis_usuario,
        login: { email, pass: passHash },
    });
    try {
        const novoUser = await Colaboradores.create(user);
        res.status(201).json({ msg: "Usuário criado com sucesso!" });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Aconteceu um erro na aplicação!",
        });
    }
});
// Verifica o Login
app.post("/auth/login", async (req, res) => {
    const { email, pass } = req.body;
    if (!email) {
        console.log(email);
        return res.status(422).json({ msg: "O email é obrigatório" });
    }
    if (!pass) {
        return res.status(422).json({ msg: "A senha é obrigatório" });
    }
    // Chegar se o colaborador existe
    const user = await Colaboradores.findOne({ "login.email": email });
    if (!user) {
        return res.status(404).json({ msg: "Email não encontrado" });
    }
    // Chega a senha do user
    const checkPass = await bcrypt.compare(pass, user.login.pass);
    if (!checkPass) {
        return res.status(422).json({ msg: "Senha inválida" });
    }

    try {
        const secret = process.env.SECRET;

        const token = jwt.sign(
            {
                id: user._id,
            },
            secret
        );

        res.status(200).json({
            msg: "Autenticação realizada com sucesso",
            token: token,
            validado: true,
            redirect: `/inicio/${user._id}`,
            id: user._id,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json("Aconteceu um erro na aplicação!");
    }
});

// Verifica se o email a ser recuperado está no banco de dados
app.post("/recuperar", async (req, res) => {
    const { emailRecuperacao } = req.body;
    try {
        const emailUsuario = await Colaboradores.findOne({
            "login.email": emailRecuperacao,
        });
        // console.log(emailRecuperacao);
        if (emailUsuario) {
            console.log(emailRecuperacao);
            recuperarSenha(emailRecuperacao);
            res.json({ msg: "Email enviado" });
        } else {
            res.status(401).json({
                msg: "Email não existente",
            });
            console.log(
                "Tentativa de recuperação com email não existente:",
                emailRecuperacao
            );
        }
    } catch (error) {
        res.status(500).json({ msg: "Erro no servidor" });
    }
});
// Pega os dados e atualiza a senha
app.post("/atualizarSenha", async (req, res) => {
    const { email, newpass } = req.body;

    const salt = await bcrypt.genSalt(12);
    const passHash = await bcrypt.hash(newpass, salt);
    try {
        // Sintaxe correta: findOneAndUpdate(filtro, atualização, opções)
        const emailUsuario = await Colaboradores.findOneAndUpdate(
            { "login.email": email }, // Filtro: encontrar o usuário por email
            {
                $set: {
                    "login.pass": passHash,
                },
            },
            { new: true }
        );

        if (emailUsuario) {
            res.json({ msg: "Senha atualizada com sucesso!" });
        } else {
            res.status(404).json({ msg: "Usuário não encontrado." });
        }
    } catch (error) {
        console.error("Erro ao atualizar senha:", error);
        res.status(500).json({ msg: "Erro no servidor" });
    }
});

// SERVER
// Faz o servidor rodar
app.listen(port, () => {
    console.log(`Servidor rodando na porta: ${port}`);
});
