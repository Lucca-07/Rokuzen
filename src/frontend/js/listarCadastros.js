// Função para compressão de imagem
function compressImage(file, maxSize = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL("image/jpeg", quality);
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

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
            const nome = user.nome_colaborador;
            let perfis = user.perfis_usuario;
            console.log("Perfis antes:", perfis);
            
            // Garante que perfis é um array e remove valores vazios/null/undefined
            perfis = Array.isArray(perfis) ? perfis.filter(p => p && p.trim()) : [];
            
            // Se não houver perfis válidos, mostra mensagem padrão
            if (perfis.length === 0) {
                perfis = "Sem perfil";
            } 
            // Se houver apenas um perfil, usa ele
            else if (perfis.length === 1) {
                perfis = perfis[0];
            } 
            // Se houver mais de um perfil, junta com vírgula
            else {
                perfis = perfis.join(", ");
            }
            console.log("Perfis depois:", perfis);
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
        let { nome, email, perfis, unidades, imagem } = data;

        if (!data) {
            console.log("Erro ao enviar o usuário ao front");
        }

        const editpopup = `<div id="editar"
        class="editarcard container-md position-fixed top-50 start-50 d-flex  translate-middle bg-light border border-2 border-black z-3 w-100 "
        style="border-radius: 20px;">
        <div class="cardtera row w-100 p-3 h-100 d-flex justify-content-center align-items-center"
            style="border-radius: 30px;">
            <div>
                    <button type="button" class="btn-close" aria-label="close" data-bs-dismiss="button" onclick="document.getElementById('editar').remove(); document.getElementById('overlay').remove();"></button>
                </div>
            <div class="col-12 col-lg-3 d-flex align-self-center align-items-center justify-content-center h-50 flex-column">
                <img id="previewImagem" src="${
                    imagem || "/frontend/img/account-outline.svg"
                }" alt=""
                    style="border-radius: 25px; border: 1px solid black; height: 100px; width: 100px; object-fit: cover;">
                    <input type="file" name="imagemUsuario" class="d-none" id="imagemUsuarioEdit" accept="image/*">
                    <label for="imagemUsuarioEdit" class="btn btn-outline-success mt-2">Selecionar Imagem</label>
            </div>
            <div class="col-12 col-lg-9 d-flex align-items-center justify-content-center h-50 text-center gap-4">
                <div class="w-50 d-flex flex-column align-items-center justify-content-center mb-3 mb-md-0 text-center">
                    <label for="nome" class="fs-4">Nome:</label>
                    <input id="nome" type="text" class="fs-5 w-75 mb-2" value="${nome}">
                </div>
                <div class="w-50 d-flex flex-column align-items-center justify-content-center mb-3 mb-md-0 text-center">
                    <label for="email" class="fs-4">Email:</label>
                    <input id="email" type="text" class="fs-5 w-75 mb-2" value="${email}">
                    <div>
                        <label for="cargos" class="fs-4">Cargos:</label>
                        <select class="mx-2 align-self-center w-auto" id="cargos"
                            style="border-radius: 5px; cursor: pointer; height: 30px;">
                            <option value="selecionar" disabled selected>Selecionar:</option>
                            <option value="Master">Master</option>
                            <option value="Gerente">Gerente</option>
                            <option value="Recepção">Recepção</option>
                            <option value="Terapeuta">Terapeuta</option>
                        </select>
                        <div id="setorcargo" class="d-none">
                                <label for="setorgerente" class="campos h-100 align-content-center">Setor: </label>
                                <select class="mx-2 align-self-center w-auto" id="setorgerente" style="border-radius: 5px; cursor: pointer; height: 30px;">
                                    <option value="Recepção" selected>Recepção</option>
                                    <option value="Terapeuta">Terapeuta</option>
                                </select>
                            </div>
                    </div>
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

        // Adiciona o event listener depois que os elementos existem no DOM
        let setorcargo = document.getElementById("setorcargo");
        let cargoselect = document.getElementById("cargos");
        cargoselect.addEventListener("change", () => {
            if (
                cargoselect.options[cargoselect.selectedIndex].text ===
                    "Gerente" ||
                cargoselect.options[cargoselect.selectedIndex].text === "Master"
            ) {
                setorcargo.classList.remove("d-none"); // Mostra o setor
            } else {
                setorcargo.classList.add("d-none"); // Esconde o setor
                setorgerente.value = null;
                perfis[1] = null;
            }
        });

        console.log(perfis);
        for (let i = 0; i < cargoselect.options.length; i++) {
            console.log(cargoselect.options.length);
            console.log(cargoselect.options[i].text);
            if (cargoselect.options[i].text == perfis[0]) {
                cargoselect.selectedIndex = i;
                if (
                    cargoselect.options[i].text == "Gerente" ||
                    cargoselect.options[i].text == "Master"
                ) {
                    const setorgerente =
                        document.getElementById("setorgerente");
                    setorgerente.value = perfis[1];
                    setorcargo.classList.remove("d-none");
                }
            }
        }

        const unidadesdiv = document.querySelector(`#unidadesdiv`);
        unidades.forEach((unidade) => {
            const checkbox = unidadesdiv.querySelector(`#${unidade}`);
            checkbox.checked = true;
        });

        // Configurar preview de imagem
        const imagemInput = document.getElementById("imagemUsuarioEdit");
        const previewImg = document.getElementById("previewImagem");

        // Inicializar o dataset com a imagem existente se houver
        if (imagem) {
            imagemInput.dataset.preview = imagem;
        }

        imagemInput.addEventListener("change", async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
                const compressed = await compressImage(file, 800, 0.7);
                previewImg.src = compressed;
                imagemInput.dataset.preview = compressed;
            } catch (err) {
                console.error("Erro ao processar imagem:", err);
            }
        });

        document
            .getElementById("salvarEdicaoColaborador")
            .addEventListener("click", async () => {
                try {
                    const nomeinput = document.getElementById("nome").value;
                    const emailinput = document.getElementById("email").value;
                    const cargoinput = document.getElementById("cargos").value;
                    const setorinput =
                        document.getElementById("setorgerente").value;
                    const novosPerfis = Array(cargoinput, setorinput);
                    const novasUnidades = Array.from(
                        document.querySelectorAll(
                            "input[name='unidades']:checked"
                        )
                    ).map((input) => input.value);
                    // Pega a imagem comprimida do dataset se existir
                    const imagemInput =
                        document.getElementById("imagemUsuarioEdit");
                    const imagemBase64 =
                        imagemInput && imagemInput.dataset.preview
                            ? imagemInput.dataset.preview
                            : null;

                    const body = {
                        id: id,
                        nome: nomeinput,
                        email: emailinput,
                        perfis: novosPerfis,
                        unidades: novasUnidades,
                        imagem: imagemBase64,
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
                    document.getElementById("editar").remove(); // fecha popup
                    listarColaboradores(); // atualizar lista
                    setTimeout(() => {
                        document
                            .getElementById("alertEdit")
                            .classList.add("show");
                        document
                            .getElementById("alertEdit")
                            .classList.remove("d-none");
                        setTimeout(() => {
                            document
                                .getElementById("alertEdit")
                                .classList.remove("show");
                            document
                                .getElementById("alertEdit")
                                .classList.add("d-none");
                        }, 2500);
                    }, 500);
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
            listarColaboradores(); // atualiza a lista na tela
            setTimeout(() => {
                document.getElementById("alertDel").classList.add("show");
                document.getElementById("alertDel").classList.remove("d-none");
                setTimeout(() => {
                    document
                        .getElementById("alertDel")
                        .classList.remove("show");
                    document.getElementById("alertDel").classList.add("d-none");
                }, 2500);
            }, 500);
        } else {
            alert(result.msg || "Erro ao deletar usuário");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro no servidor");
    }
}
