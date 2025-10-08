import Clientes from "../models/Clientes.js";

export default async function get_all_clients() {
    try {
        const clientArray = await Clientes.find({});

        return {
            data: clientArray,
            getNames: function () {
                return this.data.map((user) => user.nome_cliente);
            },
            getTel: function () {
                return this.data.map((user) => user.telefone_cliente);
            },
            getEmails: function () {
                return this.data.map((user) => user.email_cliente);
            },
            getNascto: function () {
                return this.data.map((user) => user.data_nascimento);
            },
            getObservacoes: function () {
                return this.data.map((user) => user.observacoes);
            },
            getPrimeiroAtendimento: function () {
                return this.data.map((user) => user.primeiro_atendimento);
            },
            getRespostasSaude: function () {
                return this.data.map((user) => user.respostas_saude);
            },
            // As funções getDiaNascto e getMesNascto foram removidas, pois a função principal
            // agora usa o aggregation para otimização.
        };
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return {
            data: [],
            getNames: () => [],
            getTel: () => [],
            getEmails: () => [],
            getNascto: () => [],
            getObservacoes: () => [],
            getPrimeiroAtendimento: () => [],
            getRespostasSaude: () => [],
        };
    }
}

export async function get_todays_birthdays() {
    try {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1; // Mês é base 0, então +1

        const birthdayClients = await Clientes.aggregate([
            {
                $match: {
                    // $expr permite que a lógica de comparação seja aplicada no banco de dados
                    $expr: {
                        $and: [
                            // Compara o dia do campo data_nascimento com o dia de hoje
                            { $eq: [{ $dayOfMonth: "$data_nascimento" }, day] },
                            // Compara o mês do campo dt_nascto com o mês de hoje
                            { $eq: [{ $month: "$data_nascimento" }, month] },
                        ],
                    },
                },
            },
        ]);

        return birthdayClients;
    } catch (error) {
        console.error("Erro ao buscar aniversariantes (Agregação):", error);
        return [];
    }
}

export async function set_client_name(id, reqbody) {
    const updClient = await Clientes.findOneAndUpdate({ _id: id }, reqbody, {
        new: true,
    });
    return updClient;
}
