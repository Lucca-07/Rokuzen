import nodemailer from "nodemailer";

import path from "path";
import { fileURLToPath } from "node:url";
const dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export default function recuperarSenha(email) {
    // Informações sobre o remetente e o servidor do email
    const mailtransport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true para porta 465, false para o resto
        auth: {
            user: process.env.EMAIL_REMETENTE,
            pass: process.env.EMAIL_SENHA,
        },
    });
    //Enviar o Email
    mailtransport
        .sendMail({
            from: `Equipe ROKUZEN <${process.env.EMAIL_REMETENTE}>`,
            to: `${email}`,
            subject: "Recuperação de Senha",
            html: "<body style='margin: 0; padding: 0;'> <div style='margin: 0; text-align:center; width: 100%; border-top: 5px solid #9DB668; border-bottom: 5px solid #E9EAEE;'> <h1>Recuperação de Senha</h1> <a href='http://localhost:8080/recuperar'>Clique aqui para recuperar a sua senha</a> <br> <img style='margin-top: 25px;' src='cid:minhaImagemID' alt='Logo ROKUZEN'> </div> </body>",
            attachments: [
                {
                    path: dirname + "/frontend/img/logo.png", // Caminho para o arquivo da imagem no seu sistema
                    cid: "minhaImagemID", // O "cid" que você usará na tag <img>
                },
            ],
        })
        .then((response) => console.log("Email enviado com sucesso!"))
        .catch((error) => console.log("Erro ao enviar email: ", error));
}
