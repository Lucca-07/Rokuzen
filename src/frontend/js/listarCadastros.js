async function listarColaboradores() {
    const main = document.getElementById("main");
    main.innerHTML = "";
    try {
        const response = await fetch("/api/user/listar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const { users } = await response.json();

        let contador = 1;
        users.forEach((user) => {
            const nome = user.nome_colaborador; // nome correto do campo
            let perfis = user.perfis_usuario; // nome correto do campo
            if (perfis[1] == null) {
                perfis = perfis[0];
            } else {
                perfis = perfis.join(", ");
            }
            console.log(perfis);
            // console.log(perfisOrganizados)

            const card = `
                <div id="card-${contador}" class="row container-lg bg-light d-flex p-4 border mt-4 card-editar h-25 "
                    style="border-radius: 30px; animation: aparecer 0.3s ease-in forwards;">
                    <div class="col-12 col-md-6 col-lg-3 d-flex align-self-center align-items-center justify-content-center h-50">
                        <img src="${
                            user.imagem || "/frontend/img/account-outline.svg"
                        }" alt=""
                            style="border-radius: 25px; border: 1px solid black; height: 100px; width: 100px; object-fit: cover;">
                    </div>
                    <div class="col-12 col-md-6 col-lg-9 d-flex">
                        <div class="nome d-flex align-self-center align-items-center justify-content-center h-100" style="flex:40%">
                            <p class="fs-4 text-center">${nome}</p>
                        </div>
                        <div class="perfil d-flex align-self-center align-items-center justify-content-center h-100" style="flex:40%">
                            <p class="fs-4 text-center">${perfis}</p>
                        </div>
                        <div class="perfil d-flex align-items-start justify-content-end h-100 gap-2" style="flex:20%">
                            <i class="mdi mdi-pencil px-2 py-1 fs-5 bg-success-subtle" style="cursor:pointer; border-radius: 10px;" onclick="popupEdit('${
                                user._id
                            }')"></i>
                            <i class="mdi mdi-delete px-2 py-1 fs-5 bg-danger-subtle" style="cursor:pointer; border-radius: 10px;" onclick="popupDelete('${
                                user._id
                            }')"></i>
                        </div>

                    </div>
                </div>
            `;

            main.insertAdjacentHTML("beforeend", card);
            contador++;
        });
    } catch (error) {
        console.error("Erro: " + error);
    }
}

function popupDelete(id) {
    const main = document.getElementById("main");
    const deletepopup = `<div id="popupdelete"
        class="position-fixed top-50 start-50 translate-middle bg-light border border-2 border-black p-4 z-3" style="border-radius: 20px;">
        <p class="fs-4">Tem certeza que deseja excluir este usuário?</p>
        <div class="d-flex justify-content-center align-content-center gap-2">
            <button id="confirmbtn" class="w-25 bg-success-subtle" style="border-radius: 10px;" onclick="deleteColaborador('${id}')">Sim</button>
            <button id="cancelbtn" class="w-25 bg-danger-subtle" style="border-radius: 10px;"
        onclick="document.getElementById('popupdelete').remove(), document.getElementById('overlay').remove()">Não</button>
        </div>
    </div>`;
    const overylay = `<div id="overlay" class="overlay position-fixed top-0 start-0 z-2" style="background: rgba(0,0,0,0.3); width: 100vw; height: 100vh;">

    </div>`;
    main.insertAdjacentHTML("beforeend", overylay);
    main.insertAdjacentHTML("beforeend", deletepopup);
}

async function popupEdit(id) {
    const main = document.getElementById("main");
    try {
        const response = await fetch("/api/user/edit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: id,
            }),
        });

        const data = await response.json();
        let { nome, email, perfis, unidades } = data;
        if (perfis[1] == null) {
            perfis = perfis[0];
        } else {
            perfis = perfis.join(", ");
        }

        console.log(data);
        if (!data) {
            console.log("Erro ao enviar o usuário ao front");
        }

        const editpopup = `<div id="editar"
        class="editarcard container-md position-fixed top-50 start-50 d-flex  translate-middle bg-light border border-2 border-black z-3 w-100 "
        style="border-radius: 20px;">
        <div class="cardtera row w-100 p-3 h-100 d-flex justify-content-center align-items-center"
            style="border-radius: 30px;">
            <div class="col-12 col-lg-3 d-flex align-self-center align-items-center justify-content-center h-50">
                <img src="/frontend/img/account-outline.svg" alt=""
                    style="border-radius: 25px; border: 1px solid black; height: 100px; width: 100px;">
            </div>
            <div class="col-12 col-lg-9 d-flex align-items-center justify-content-center h-50 text-center gap-4">
                <div class="w-50 d-flex flex-column align-items-center justify-content-center mb-3 mb-md-0 text-center">
                    <label for="nome" class="fs-4">Nome:</label>
                    <input id="nome" type="text" class="fs-5 w-75 mb-2" value="${nome}">
                </div>
                <div class="w-50 d-flex flex-column align-items-center justify-content-center mb-3 mb-md-0 text-center">
                    <label for="email" class="fs-4">Email:</label>
                    <input id="email" type="text" class="fs-5 w-75 mb-2" value="${email}">
                    <label for="cargos" class="fs-4">Cargos:</label>
                    <input id="cargos" type="text" class="fs-5 w-75" value="${perfis}">
                </div>
            </div>
            <div id="unidades"
                class="col-sm-12 col-md-6 d-flex justify-content-center mt-md-3 mt-0 flex-column gap-2 w-75">

                <p class="campos h-100 align-content-center m-0 align-self-center mt-md-3 justify-content-center fs-2">
                    Unidades: </p>
                <div id="unidadesdiv" class="row d-flex justify-content-center align-items-center w-100 ">
                    <div class="col-sm-12 col-md-3 d-flex flex-fill justify-content-center text-center">
                        <label for="golden" class="fs-6">Golden Square</label>
                        <input class="me-5 me-lg-0" type="checkbox" name="unidades" id="GoldenSquare" value="GoldenSquare">
                    </div>
                    <div class="col-sm-12 col-md-3 d-flex flex-fill justify-content-center text-center">
                        <label for="mooca" class="fs-56">Mooca Plaza</label>
                        <input class="me-5 me-lg-0" type="checkbox" name="unidades" id="MoocaPlaza" value="MoocaPlaza">
                    </div>
                    <div class="col-sm-12 col-md-3 d-flex flex-fill justify-content-center text-center">
                        <label for="grand" class="fs-6">Grand Plaza</label>
                        <input class="me-5 me-lg-0" type="checkbox" name="unidades" id="GrandPlaza" value="GrandPlaza">
                    </div>
                    <div class="col-sm-12 col-md-3 d-flex flex-fill justify-content-center text-center">
                        <label for="west" class="fs-6">West Plaza</label>
                        <input class="me-5 me-lg-0" type="checkbox" name="unidades" id="WestPlaza" value="WestPlaza">
                    </div>
                </div>
            </div>
            <div class="col-12 text-center">
                <button id="salvarEdicaoColaborador" type="submit" class="enviar mt-4 px-3 py-1 fs-4">Salvar</button>
            </div>

        </div>
    </div>`;
        const overylay = `<div id="overlay" class="overlay position-fixed top-0 start-0 z-2" style="background: rgba(0,0,0,0.3); width: 100vw; height: 100vh;">

    </div>`;

        main.insertAdjacentHTML("beforeend", editpopup);
        main.insertAdjacentHTML("beforeend", overylay);
        const unidadesdiv = document.querySelector(`#unidadesdiv`);
        unidades.forEach((unidade) => {
            const checkbox = unidadesdiv.querySelector(`#${unidade}`);
            checkbox.checked = true;
        });

        const nomeinput = document.getElementById("nome").value;
        const emailinput = document.getElementById("email").value;
        const perfisinput = document.getElementById("cargos").value;
        const novosPerfis = perfis.split(", ");
        const novasUnidades = Array.from(
            document.querySelectorAll("input[name='unidades']:checked")
        ).map((input) => input.value);

        document
            .getElementById("salvarEdicaoColaborador")
            .addEventListener("click", async () => {
                try {
                    const nomeinput = document.getElementById("nome").value;
                    const emailinput = document.getElementById("email").value;
                    const perfisinput = document.getElementById("cargos").value;
                    const novosPerfis = perfisinput
                        .split(",")
                        .map((p) => p.trim());
                    const novasUnidades = Array.from(
                        document.querySelectorAll(
                            "input[name='unidades']:checked"
                        )
                    ).map((input) => input.value);

                    const body = {
                        id: id,
                        nome: nomeinput,
                        email: emailinput,
                        perfis: novosPerfis,
                        unidades: novasUnidades,
                    };

                    const response = await fetch("/api/user/update", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    });

                    const result = await response.json();
                    if (!response.ok) {
                        throw new Error(
                            result.msg || "Erro ao atualizar usuário"
                        );
                    }

                    console.log("Usuário atualizado:", result);
                    document.getElementById("editar").remove(); // fecha popup
                    listarColaboradores(); // atualizar lista
                } catch (err) {
                    console.error("Erro ao salvar alterações:", err);
                }
            });
    } catch (error) {
        console.error("Erro: " + error);
    }
}

async function salvarEdicao(novosDados) {
    try {
        const response = await fetch("/api/user/confirmedit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                data: novosDados,
            }),
        });
    } catch (error) {
        console.error("Erro: " + error);
    }
}

async function deleteColaborador(id) {
    const main = document.getElementById("main");
    try {
        const response = await fetch("/api/user/deletar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.msg);
            listarColaboradores(); // atualiza a lista na tela
        } else {
            alert(result.msg || "Erro ao deletar usuário");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro no servidor");
    }
}
