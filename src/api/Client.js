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

export async function set_client_name(id, reqbody) {
    const updClient = await UsuarioExterno.findOneAndUpdate({ _id: id }, reqbody, {
        new: true,
    });
    return updClient;
}
