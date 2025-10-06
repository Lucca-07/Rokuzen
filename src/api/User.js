import UsuarioInterno from "../modules/UsuarioInterno.js";

export default async function get_all_users() {
    try {
        const usersArray = await UsuarioInterno.find({});

        return {
            data: usersArray,
            getNames: function () {
                return this.data.map((user) => user.name);
            },
            getRoles: function () {
                return this.data.map((user) => user.role);
            },
            getEmails: function () {
                return this.data.map((user) => user.email);
            },
        };
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return { data: [], getNames: () => [], getEmails: () => [], getRoles: () => [] };
    }
}
export async function get_all_users_admin() {
    try {
        const usersArray = await UsuarioInterno.find({ role: "Owner" });

        return {
            data: usersArray,
            getNames: function () {
                return this.data.map((user) => user.name);
            },
            getEmails: function () {
                return this.data.map((user) => user.email);
            },
        };
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return { data: [], getNames: () => [], getEmails: () => [] };
    }
}
export async function get_all_users_terapeuta() {
    try {
        const usersArray = await UsuarioInterno.find({ role: "Terapeuta" });

        return {
            data: usersArray,
            getNames: function () {
                return this.data.map((user) => user.name);
            },
            getEmails: function () {
                return this.data.map((user) => user.email);
            },
        };
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return { data: [], getNames: () => [], getEmails: () => [] };
    }
}
export async function get_all_users_gerente() {
    try {
        const usersArray = await UsuarioInterno.find({ role: "Gerente" });

        return {
            data: usersArray,
            getNames: function () {
                return this.data.map((user) => user.name);
            },
            getEmails: function () {
                return this.data.map((user) => user.email);
            },
        };
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return { data: [], getNames: () => [], getEmails: () => [] };
    }
}
export async function get_all_users_recepcao() {
    try {
        const usersArray = await UsuarioInterno.find({ role: "Recepcao" });

        return {
            data: usersArray,
            getNames: function () {
                return this.data.map((user) => user.name);
            },
            getEmails: function () {
                return this.data.map((user) => user.email);
            },
        };
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        return { data: [], getNames: () => [], getEmails: () => [] };
    }
}
