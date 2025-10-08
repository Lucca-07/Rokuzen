import Colaboradores from "../models/Colaboradores.js";

// Função para obter TODOS os usuários (sem filtro de role)
export default async function get_all_users() {
    try {
        const usersArray = await Colaboradores.find({});

        return {
            data: usersArray,
            getNames: function () {
                return this.data.map((user) => user.nome_colaborador);
            },
            getType: function () {
                return this.data.map((user) => user.tipo_colaborador);
            },
            getState: function () {
                return this.data.map((user) => user.ativo);
            },
            getPermissions: function () {
                return this.data.map((user) => user.perfis_usuario);
            },
            getLogin: function () {
                return this.data.map((user) => user.login);
            },
            getUnidades: function () {
                return this.data.map((user) => user.unidades_trabalha);
            },
        };
    } catch (error) {
        console.error("Erro ao buscar todos os usuários:", error);
        return {
            data: [],
            getNames: () => [],
            getLogin: () => [],
            getType: () => [],
            getState: () => [],
            getPermissions: () => [],
            getUnidades: () => [],
        };
    }
}

export async function get_users_by_role(type) {
    const filter = type ? { tipo_colaborador: type } : {};

    try {
        const usersArray = await Colaboradores.find(filter);

        return {
            data: usersArray,
            getNames: function () {
                return this.data.map((user) => user.nome_colaborador);
            },
            getState: function () {
                return this.data.map((user) => user.ativo);
            },
            getPermissions: function () {
                return this.data.map((user) => user.perfis_usuario);
            },
            getLogin: function () {
                return this.data.map((user) => user.login);
            },
            getUnidades: function () {
                return this.data.map((user) => user.unidades_trabalha);
            },
        };
    } catch (error) {
        console.error(`Erro ao buscar usuários com a role "${role}":`, error);
        return {
            data: [],
            getNames: () => [],
            getLogin: () => [],
            getState: () => [],
            getPermissions: () => [],
            getUnidades: () => [],
        };
    }
}
