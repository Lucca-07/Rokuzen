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
            perfis = Array.isArray(perfis)
                ? perfis.filter((p) => p && p.trim())
                : [];

            // se não houver perfis válidos, mostra mensagem padrão
            if (perfis.length === 0) {
                perfis = "Sem perfil";
            }
            // se houver apenas um perfil, usa ele
            else if (perfis.length === 1) {
                perfis = perfis[0];
            }
            // se houver mais de um perfil junta com vírgula
            else {
                perfis = perfis.join(", ");
            }
            console.log("Perfis depois:", perfis);
            // console.log(perfisOrganizados)

            const card = `<div id="card-${contador}" class="row container-lg bg-light d-flex p-4 border border-1 rounded-3 mt-4 card-editar h-25">
                <div class="col-12 col-md-6 col-lg-3 d-flex align-items-center justify-content-center">
                    <img src="${
                        user.imagem || "/frontend/img/account-outline.svg"
                    }" alt="Imagem de perfil do colaborador" class="rounded border border-1 border-dark" style="height:100px; width:100px; object-fit:cover;">
                </div>

                <div class="col-12 col-md-6 col-lg-9 d-flex">
                    <div class="nome d-flex align-items-center justify-content-center h-100 flex-grow-1" style="flex:40%">
                        <p class="fs-4 text-center mb-0">${nome}</p>
                    </div>

                    <div class="perfil d-flex align-items-center justify-content-center h-100 flex-grow-1" style="flex:40%">
                        <p class="fs-4 text-center mb-0">${perfis}</p>
                    </div>

                    <div class="perfil d-flex align-items-start justify-content-end h-100 gap-2" style="flex:20%">
                        <i class="mdi mdi-pencil px-2 py-1 fs-5 bg-success-subtle" role="button" style="cursor:pointer; border-radius:10px;"
                onclick="popupEdit('${user._id}')"></i>
                        <i class="mdi mdi-delete px-2 py-1 fs-5 bg-danger-subtle" role="button" style="cursor:pointer; border-radius:10px;"
                onclick="popupDelete('${user._id}')"></i>
                    </div>
                </div>
            </div>`;
            main.insertAdjacentHTML("beforeend", card);
            contador++;
        });
    } catch (error) {
        console.error("Erro: " + error);
    }
}

function popupDelete(id) {
    const main = document.getElementById("main");
    const modalId = `deleteModal-${id}`;
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const deleteModal = `<div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-3">
                <div class="modal-header">
                    <h5 class="modal-title">Confirmar exclusão</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <p class="fs-5">Tem certeza que deseja excluir este usuário?</p>
                </div>
                <div class="modal-footer">
                    <button id="${modalId}-confirm" type="button" class="btn btn-success">Sim</button>
                    <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Não</button>
                </div>
            </div>
        </div>
    </div>`;

    main.insertAdjacentHTML("beforeend", deleteModal);
    const modalEl = document.getElementById(modalId);
    const bsModal = new bootstrap.Modal(modalEl, { backdrop: true });
    modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());

    document
        .getElementById(`${modalId}-confirm`)
        .addEventListener("click", async () => {
            await deleteColaborador(id);
            bsModal.hide();
        });

    bsModal.show();
}

async function popupEdit(id) {
    const main = document.getElementById("main");
    try {
        const response = await fetch("/api/user/edit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: id }),
        });
        const data = await response.json();
        let { nome, email, perfis, unidades, imagem } = data;

        if (!data) {
            console.log("Erro ao enviar o usuário ao front");
            return;
        }

        const modalId = `editModal-${id}`;
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const editModal = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content rounded-3">
                    <div class="modal-header">
                        <h5 class="modal-title">Editar colaborador</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-body">
                        <div class="container-fluid">
                            <div class="row g-3 align-items-center">
                                <div class="col-12 col-lg-3 text-center">
                                    <!-- container com tamanho máximo para evitar overflow -->
                                    <div class="preview-container mx-auto mb-2">
                                        <img id="previewImagem-${id}" src="${
            imagem || "/frontend/img/account-outline.svg"
        }" alt="Preview imagem" class="rounded border preview-img">
                                    </div>

                                    <input type="file" name="imagemUsuario" class="d-none" id="imagemUsuarioEdit-${id}" accept="image/*">
                                    <label for="imagemUsuarioEdit-${id}" class="btn btn-outline-success mt-2">Selecionar Imagem</label>
                                </div>
                                <!-- restante do modal permanece igual -->
                                <div class="col-12 col-lg-9">
                                    <div class="row">
                                        <div class="col-12 col-md-6 mb-2">
                                            <label for="nome-${id}" class="fs-6">Nome:</label>
                                            <input id="nome-${id}" type="text" class="form-control" value="${nome}">
                                        </div>
                                        <div class="col-12 col-md-6 mb-2">
                                            <label for="email-${id}" class="fs-6">Email:</label>
                                            <input id="email-${id}" type="text" class="form-control" value="${email}">
                                        </div>
                                        <div class="col-12 text-center mt-2">
                                            <label for="cargos-${id}" class="fs-6">Cargos:</label>
                                            <select class="form-select d-inline-block w-auto" id="cargos-${id}">
                                                <option value="selecionar" disabled>Selecionar:</option>
                                                <option value="Master">Master</option>
                                                <option value="Gerente">Gerente</option>
                                                <option value="Recepção">Recepção</option>
                                                <option value="Terapeuta">Terapeuta</option>
                                            </select>
                                            <div id="setorcargo-${id}" class="d-none mt-2">
                                                <label for="setorgerente-${id}" class="me-2">Setor:</label>
                                                <select id="setorgerente-${id}" class="form-select d-inline-block w-auto">
                                                    <option value="Recepção" selected>Recepção</option>
                                                    <option value="Terapeuta">Terapeuta</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12 mt-3">
                                    <p class="mb-1 fs-5">Unidades:</p>
                                    <div id="unidadesdiv-${id}" class="row gy-2 justify-content-center">
                                        <div class="col-6 col-md-3 text-center">
                                            <label class="d-block" for='GoldenSquare-${id}'>Golden Square</label>
                                            <input type="checkbox" name="unidades" id="GoldenSquare-${id}" value="Golden Square">
                                        </div>
                                        <div class="col-6 col-md-3 text-center">
                                            <label class="d-block" for='MoocaPlaza-${id}'>Mooca Plaza</label>
                                            <input type="checkbox" name="unidades" id="MoocaPlaza-${id}" value="Mooca Plaza">
                                        </div>
                                        <div class="col-6 col-md-3 text-center">
                                            <label class="d-block" for='GrandPlaza-${id}'>Grand Plaza</label>
                                            <input type="checkbox" name="unidades" id="GrandPlaza-${id}" value="Grand Plaza">
                                        </div>
                                        <div class="col-6 col-md-3 text-center">
                                            <label class="d-block" for='WestPlaza-${id}'>West Plaza</label>
                                            <input type="checkbox" name="unidades" id="WestPlaza-${id}" value="West Plaza">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                        <button id="salvarEdicaoColaborador-${id}" type="button" class="btn btn-primary">Salvar</button>
                    </div>
                </div>
            </div>
        </div>`;

        main.insertAdjacentHTML("beforeend", editModal);
        const modalEl = document.getElementById(modalId);
        const bsModal = new bootstrap.Modal(modalEl, { backdrop: true });
        modalEl.addEventListener("hidden.bs.modal", () => modalEl.remove());

        // preencher valores e listeners após inserção
        const setorcargo = document.getElementById(`setorcargo-${id}`);
        const cargoselect = document.getElementById(`cargos-${id}`);
        const setorgerente = document.getElementById(`setorgerente-${id}`);

        // adapta perfis para o formato esperado
        perfis = Array.isArray(perfis) ? perfis : [];

        cargoselect.addEventListener("change", () => {
            const text = cargoselect.options[cargoselect.selectedIndex].text;
            if (text === "Gerente" || text === "Master") {
                setorcargo.classList.remove("d-none");
            } else {
                setorcargo.classList.add("d-none");
                setorgerente.value = "";
                perfis[1] = null;
            }
        });

        // setar cargo atual
        for (let i = 0; i < cargoselect.options.length; i++) {
            if (cargoselect.options[i].text == perfis[0]) {
                cargoselect.selectedIndex = i;
                if (
                    cargoselect.options[i].text == "Gerente" ||
                    cargoselect.options[i].text == "Master"
                ) {
                    setorgerente.value = perfis[1] || "";
                    setorcargo.classList.remove("d-none");
                }
            }
        }

        // marcar unidades
        const unidadesdiv = document.getElementById(`unidadesdiv-${id}`);
        (unidades || []).forEach((unidade) => {
            const checkbox = unidadesdiv.querySelector(
                `#${unidade.replace(/ /g, "")}-${id}`
            );
            if (checkbox) checkbox.checked = true;
        });

        // imagem
        const imagemInput = document.getElementById(`imagemUsuarioEdit-${id}`);
        const previewImg = document.getElementById(`previewImagem-${id}`);
        if (imagem) imagemInput.dataset.preview = imagem;

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

        // salvar
        document
            .getElementById(`salvarEdicaoColaborador-${id}`)
            .addEventListener("click", async () => {
                try {
                    const nomeinput = document.getElementById(
                        `nome-${id}`
                    ).value;
                    const emailinput = document.getElementById(
                        `email-${id}`
                    ).value;
                    const cargoinput = document.getElementById(
                        `cargos-${id}`
                    ).value;
                    const setorinput = document.getElementById(
                        `setorgerente-${id}`
                    ).value;
                    const novosPerfis = [cargoinput, setorinput];

                    const novasUnidades = Array.from(
                        modalEl.querySelectorAll(
                            "input[name='unidades']:checked"
                        )
                    ).map((input) => input.value);

                    const imagemInputEl = document.getElementById(
                        `imagemUsuarioEdit-${id}`
                    );
                    const imagemBase64 =
                        imagemInputEl && imagemInputEl.dataset.preview
                            ? imagemInputEl.dataset.preview
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
                    if (!response.ok)
                        throw new Error(
                            result.msg || "Erro ao atualizar usuário"
                        );

                    bsModal.hide();
                    listarColaboradores();
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

        bsModal.show();
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

document.addEventListener("DOMContentLoaded", () => {
    const id = localStorage.getItem("userId");

    const token = localStorage.getItem("token");
    if (!token) {
        // sem token: volta pra login
        window.location.href = "/";
        return;
    }
    const links = {
        escala: document.querySelector('a[href^="/escala"]'),
        postos: document.querySelector('a[href^="/postosatendimento"]'),
        sessao: document.querySelector('a[href^="/sessao"]'),
        cadastro: document.querySelector('a[href^="/cadastrar"]'),
        listar: document.querySelector('a[href^="/user/listar"]'),
        inicio: document.querySelector('a[href^="/inicio"]'),
    };

    if (links.escala) links.escala.href = `/escala/${id}`;
    if (links.postos) links.postos.href = `/postosatendimento/${id}`;
    if (links.sessao) links.sessao.href = `/sessao/${id}`;
    if (links.inicio) links.inicio.href = `/inicio/${id}`;
    if (links.cadastro) links.cadastro.href = `/cadastrar/${id}`;
    if (links.listar) links.listar.href = `/user/listar/${id}`;
});

document.getElementById("sairbutton").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
});
