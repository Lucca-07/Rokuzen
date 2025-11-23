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

// LISTAGEM
async function listarColaboradores() {
    const main = document.getElementById("main");
    main.innerHTML = "";
    const row = document.createElement("div");
    row.className = "row g-3";
    main.appendChild(row);

    try {
        const response = await fetch("/api/user/listar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const { users } = await response.json();

        let contador = 1;
        users.forEach((user) => {
            const nome = user.nome_colaborador;
            let perfis = user.perfis_usuario;
            perfis = Array.isArray(perfis)
                ? perfis.filter((p) => p && p.trim())
                : [];

            const perfisRender = perfis.length
                ? perfis
                      .map(
                          (p) =>
                              `<span class="badge fw-medium rounded-pill bg-body-tertiary text-success border border-success-subtle me-1 mb-1">${p}</span>`
                      )
                      .join("")
                : `<span class="badge rounded-pill bg-secondary text-white mb-1">Sem perfil</span>`;

            const col = document.createElement("div");
            col.className = "col-12 col-sm-6 col-lg-4 col-xl-3 d-flex";
            col.innerHTML = `
                <div class="card w-100 shadow-sm border-0 h-100">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex flex-column align-items-center mb-3">
                            <div class="rounded-circle border shadow-sm overflow-hidden mb-2" style="width:100px;height:100px;">
                                <img src="${
                                    user.imagem ||
                                    "/frontend/img/account-outline.svg"
                                }" alt="Avatar" class="w-100 h-100 object-fit-cover">
                            </div>
                            <span class="badge bg-success-subtle text-black fw-normal">${contador}</span>
                        </div>
                        <h6 class="fw-semibold text-truncate text-center" title="${nome}">${nome}</h6>
                        <div class="d-flex flex-wrap mb-3 justify-content-center">
                            ${perfisRender}
                        </div>
                        <div class="mt-auto d-flex flex-wrap gap-2 justify-content-center">
                            <button type="button"
                                class="btn btn-sm btn-success d-flex align-items-center gap-1"
                                onclick="popupEdit('${user._id}')">
                                <i class="mdi mdi-pencil"></i> Editar
                            </button>
                            <button type="button"
                                class="btn btn-sm btn-danger d-flex align-items-center gap-1"
                                onclick="popupDelete('${user._id}')">
                                <i class="mdi mdi-delete"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            `;
            row.appendChild(col);
            contador++;
        });
    } catch (err) {
        console.error("Erro:", err);
    }
}

// DELETE
function popupDelete(id) {
    const main = document.getElementById("main");
    const modalId = `deleteModal-${id}`;
    document.getElementById(modalId)?.remove();

    const modal = `
    <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow rounded-3">
          <div class="modal-header">
            <h5 class="modal-title">Confirmar exclusão</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
          </div>
          <div class="modal-body">
            <p>Tem certeza que deseja excluir este usuário?</p>
          </div>
          <div class="modal-footer justify-content-between">
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button id="${modalId}-confirm" class="btn btn-danger">Excluir</button>
          </div>
        </div>
      </div>
    </div>`;
    main.insertAdjacentHTML("beforeend", modal);
    const el = document.getElementById(modalId);
    const bs = new bootstrap.Modal(el);
    el.addEventListener("hidden.bs.modal", () => el.remove());
    document
        .getElementById(`${modalId}-confirm`)
        .addEventListener("click", async () => {
            await deleteColaborador(id);
            bs.hide();
        });
    bs.show();
}

// EDIT
async function popupEdit(id) {
    const main = document.getElementById("main");
    try {
        const resp = await fetch("/api/user/edit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        const data = await resp.json();
        if (!data) return;

        let { nome, email, perfis, unidades, imagem } = data;
        perfis = Array.isArray(perfis) ? perfis : [];
        const showSetor = ["Master", "Gerente"].includes(perfis[0]);

        const modalId = `editModal-${id}`;
        document.getElementById(modalId)?.remove();

        const modal = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content border-0 shadow rounded-4">
              <div class="modal-header text-truncate">
                <h5 class="modal-title">Editar colaborador</h5>
                <button type="button" class="btn-close " data-bs-dismiss="modal" aria-label="Fechar"></button>
              </div>
              <div class="modal-body">
                <div class="row g-4">
                  <div class="col-12 col-lg-4">
                    <div class="d-flex flex-column align-items-center">
                      <div class="rounded-4 bg-light border shadow-sm mb-3 d-flex align-items-center justify-content-center overflow-hidden" style="width:160px;height:160px;">
                        <img id="previewImagem-${id}" src="${
            imagem || "/frontend/img/account-outline.svg"
        }" class="img-fluid h-100 w-100 object-fit-cover" alt="Imagem">
                      </div>
                      <input type="file" class="d-none" id="imagemUsuarioEdit-${id}" accept="image/*">
                      <label for="imagemUsuarioEdit-${id}" class="btn btn-outline-success btn-sm mb-2 w-75">Selecionar imagem</label>
                      <button id="removeImagem-${id}" type="button" class="btn btn-outline-danger btn-sm w-75">Remover imagem</button>
                    </div>
                  </div>
                  <div class="col-12 col-lg-8">
                    <div class="row g-3">
                      <div class="col-12 col-md-6">
                        <label class="form-label" for="nome-${id}">Nome</label>
                        <input id="nome-${id}" type="text" class="form-control" value="${nome}">
                      </div>
                      <div class="col-12 col-md-6">
                        <label class="form-label" for="email-${id}">Email</label>
                        <input id="email-${id}" type="email" class="form-control" value="${email}">
                      </div>
                      <div class="col-12 col-md-6">
                        <label class="form-label" for="cargos-${id}">Cargo</label>
                        <select id="cargos-${id}" class="form-select">
                          <option disabled>Selecionar:</option>
                          <option value="Master">Master</option>
                          <option value="Gerente">Gerente</option>
                          <option value="Recepção">Recepção</option>
                          <option value="Terapeuta">Terapeuta</option>
                        </select>
                      </div>
                      <div class="col-12 col-md-6 ${
                        showSetor ? "" : "d-none"
                      }" id="setorcargo-${id}">
                        <label class="form-label" for="setorgerente-${id}">Setor</label>
                        <select id="setorgerente-${id}" class="form-select">
                          <option value="Recepção">Recepção</option>
                          <option value="Terapeuta">Terapeuta</option>
                        </select>
                      </div>
                      <div class="col-12">
                        <label class="form-label">Unidades</label>
                        <div id="unidadesdiv-${id}" class="row g-2">
                          ${[
                              "Golden Square",
                              "Mooca Plaza",
                              "Grand Plaza",
                              "West Plaza",
                          ]
                              .map(
                                  (u) => `
                            <div class="col-6 col-md-3">
                              <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="${u.replace(
                                    / /g,
                                    ""
                                )}-${id}" value="${u}" name="unidades">
                                <label class="form-check-label text-truncate" for="${u.replace(
                                    / /g,
                                    ""
                                )}-${id}">${u}</label>
                              </div>
                            </div>
                          `
                              )
                              .join("")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer justify-content-between">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button id="salvarEdicaoColaborador-${id}" type="button" class="btn btn-success">Salvar</button>
              </div>
            </div>
          </div>
        </div>`;
        main.insertAdjacentHTML("beforeend", modal);

        const el = document.getElementById(modalId);
        const bs = new bootstrap.Modal(el);
        el.addEventListener("hidden.bs.modal", () => el.remove());

        const cargoSelect = document.getElementById(`cargos-${id}`);
        const setorDiv = document.getElementById(`setorcargo-${id}`);
        const setorSelect = document.getElementById(`setorgerente-${id}`);

        // set cargo inicial
        for (let i = 0; i < cargoSelect.options.length; i++) {
            if (cargoSelect.options[i].value === perfis[0]) {
                cargoSelect.selectedIndex = i;
            }
        }
        if (["Gerente", "Master"].includes(perfis[0])) {
            setorSelect.value = perfis[1] || "";
            setorDiv.classList.remove("d-none");
        }

        cargoSelect.addEventListener("change", () => {
            const val = cargoSelect.value;
            if (["Gerente", "Master"].includes(val)) {
                setorDiv.classList.remove("d-none");
            } else {
                setorDiv.classList.add("d-none");
                setorSelect.value = "";
            }
        });

        // unidades
        const unidadesdiv = document.getElementById(`unidadesdiv-${id}`);
        (unidades || []).forEach((u) => {
            const cb = unidadesdiv.querySelector(
                `#${u.replace(/ /g, "")}-${id}`
            );
            if (cb) cb.checked = true;
        });

        // imagem
        const imagemInput = document.getElementById(`imagemUsuarioEdit-${id}`);
        const previewImg = document.getElementById(`previewImagem-${id}`);
        const removeImgBtn = document.getElementById(`removeImagem-${id}`);
        if (imagemInput && imagem) imagemInput.dataset.preview = imagem;

        removeImgBtn?.addEventListener("click", () => {
            const padrao = "/frontend/img/account-outline.svg";
            previewImg.src = padrao;
            if (imagemInput) {
                imagemInput.dataset.preview = padrao;
                imagemInput.value = "";
            }
        });

        imagemInput?.addEventListener("change", async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const compressed = await compressImage(file, 800, 0.7);
                previewImg.src = compressed;
                imagemInput.dataset.preview = compressed;
            } catch (err) {
                console.error("Erro imagem:", err);
            }
        });

        document
            .getElementById(`salvarEdicaoColaborador-${id}`)
            .addEventListener("click", async () => {
                try {
                    const body = {
                        id,
                        nome: document.getElementById(`nome-${id}`).value,
                        email: document.getElementById(`email-${id}`).value,
                        perfis: [cargoSelect.value, setorSelect.value],
                        unidades: Array.from(
                            el.querySelectorAll(
                                "input[name='unidades']:checked"
                            )
                        ).map((i) => i.value),
                        imagem: imagemInput?.dataset.preview || null,
                    };
                    const r = await fetch("/api/user/update", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(body),
                    });
                    const j = await r.json();
                    if (!r.ok) throw new Error(j.msg || "Erro");
                    bs.hide();
                    listarColaboradores();
                    setTimeout(() => {
                        const alert = document.getElementById("alertEdit");
                        if (alert) {
                            alert.classList.add("show");
                            alert.classList.remove("d-none");
                            setTimeout(() => {
                                alert.classList.remove("show");
                                alert.classList.add("d-none");
                            }, 2500);
                        }
                    }, 400);
                } catch (err) {
                    console.error("Erro salvar:", err);
                }
            });

        bs.show();
    } catch (err) {
        console.error("Erro:", err);
    }
}

async function deleteColaborador(id) {
    try {
        const r = await fetch("/api/user/deletar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        const j = await r.json();
        if (!r.ok) {
            alert(j.msg || "Erro ao deletar");
            return;
        }
        listarColaboradores();
        setTimeout(() => {
            const alert = document.getElementById("alertDel");
            if (alert) {
                alert.classList.add("show");
                alert.classList.remove("d-none");
                setTimeout(() => {
                    alert.classList.remove("show");
                    alert.classList.add("d-none");
                }, 2500);
            }
        }, 400);
    } catch (err) {
        console.error("Erro:", err);
        alert("Erro no servidor");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const id = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!token) {
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

    listarColaboradores();
});

document.getElementById("sairbutton").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
});
