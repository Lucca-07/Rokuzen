import UsuarioExterno from "../modules/UsuarioExterno.js";
import mongoose from "mongoose";

export default async function get_all_clients() {
    try {
        const clientArray = await UsuarioExterno.find({});

        return {
            data: clientArray,
            getNames: function () {
                return this.data.map((user) => user.name);
            },
            getTel: function () {
                return this.data.map((user) => user.tel);
            },
            getEmails: function () {
                return this.data.map((user) => user.email);
            },
            getNascto: function () {
                return this.data.map((user) => user.dt_nascto);
            },
            getDiaNascto: function () {
                return this.data.map((user) => user.dt_nascto.getUTCDate());
            },
            getMesNascto: function () {
                return this.data.map((user) => user.dt_nascto.getUTCMonth());
            },
        };
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return {
            data: [],
            getNames: () => [],
            getTel: () => [],
            getEmails: () => [],
            getNascto: () => [],
        };
    }
}

export async function get_client_birth(id) {
    try {
        // Use findOne para retornar um único objeto, não um array
        const client = await UsuarioExterno.findOne({ _id: id });

        if (!client) {
            console.log("Nenhum cliente encontrado com o id:", id);
            return null;
        }

        // Agora 'client' é o objeto do documento, então a propriedade existe
        const diaNascto = client.dt_nascto.getUTCDate();
        const mesNascto = client.dt_nascto.getUTCMonth() + 1;

        return {
            data: client,
            diaNascto: diaNascto,
            mesNascto: mesNascto,
        };
    } catch (error) {
        console.error("Erro ao buscar cliente por ID:", error);
        throw new Error("Erro ao processar a data de nascimento do cliente.");
    }
}

export async function get_todays_birthdays() {
    try {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1; // Mês é base 0, então +1

        // Busca todos os clientes
        const allClients = await UsuarioExterno.find({});

        // Filtra para encontrar apenas os aniversariantes de hoje
        const birthdayClients = allClients.filter((client) => {
            if (!client.dt_nascto) return false; // Ignora clientes sem data de nascimento
            const clientDay = client.dt_nascto.getUTCDate();
            const clientMonth = client.dt_nascto.getUTCMonth() + 1;
            return clientDay === day && clientMonth === month;
        });

        return birthdayClients;
    } catch (error) {
        console.error("Erro ao buscar aniversariantes:", error);
        return []; // Retorna um array vazio em caso de erro
    }
}

export async function set_client_name(id, reqbody) {
    const updClient = await UsuarioExterno.findOneAndUpdate(
        { _id: id },
        reqbody,
        {
            new: true,
        }
    );
    return updClient;
}
