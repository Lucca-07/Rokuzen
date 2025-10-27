const userInterno = document.getElementById("containerColaborador");
const userExterno = document.getElementById("containerCliente");

const selectUser = document.getElementById("usuarioselect");

const setorcargo = document.getElementById("setorcargo");
const cargoselect = document.getElementById("cargoselect");

// --- Funções para imagem: compressão e preview ---
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

document.addEventListener("DOMContentLoaded", () => {
    const imagemInput = document.getElementById("imagemUsuario");
    const previewImg = document.querySelector("#foto img");
    if (imagemInput && previewImg) {
        imagemInput.addEventListener("change", async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
                // mostra preview comprimido
                const compressed = await compressImage(file, 800, 0.7);
                previewImg.src = compressed;
                // armazenar temporariamente no input dataset para enviar no salvar
                imagemInput.dataset.preview = compressed;
            } catch (err) {
                console.error("Erro ao processar imagem:", err);
            }
        });
    }
});

selectUser.addEventListener("change", () => {
    userExterno.classList.toggle("d-none");
    userInterno.classList.toggle("d-none");
});

cargoselect.addEventListener("change", () => {
    if (cargoselect.options[cargoselect.selectedIndex].text === "Gerente") {
        setorcargo.classList.toggle("d-none");
    } else {
        setorcargo.classList.add("d-none");
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    // pega o id da URL: /inicio/:id
    const pathParts = window.location.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    const token = localStorage.getItem("token");
    if (!token) {
        // sem token: volta pra login
        window.location.href = "/";
        return;
    }

    try {
        const res = await fetch(`/api/colaboradores/${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
        });

        if (res.status === 401 || res.status === 403) {
            // token inválido / sem permissão -> limpa token e volta ao login
            localStorage.removeItem("token");
            window.location.href = "/";
            return;
        }

        if (!res.ok) {
            const err = await res.json();
            console.error("Erro ao carregar dados:", err);
            alert(err.msg || "Erro ao carregar dados.");
            return;
        }
        const links = {
            escala: document.querySelector('a[href="#escala"]'),
            postos: document.querySelector('a[href="#postos"]'),
            sessao: document.querySelector('a[href="#sessao"]'),
            inicio: document.querySelector('a[href="#inicio"'),
        };
        if (links.escala) links.escala.href = `/escala/${id}`;
        if (links.postos) links.postos.href = `/postosatendimento/${id}`;
        if (links.sessao) links.sessao.href = `/sessao/${id}`;
        if (links.inicio) links.inicio.href = `/inicio/${id}`;
    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Erro de rede. Tente novamente.");
    }
});

document.getElementById("sairbutton").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
});

async function salvarColaborador(event) {
    event.preventDefault();

    const nome = document.getElementById("nomeinput").value;
    let email = document.getElementById("emailinput").value;
    let senha = document.getElementById("senhainput").value;
    const cargo = document.getElementById("cargoselect");
    let tipo_colaborador = "user";
    let setor = null;
    let cargoSelecionado = cargo.options[cargo.selectedIndex].text;
    if (cargoSelecionado === "Selecionar:") {
        cargoSelecionado = null;
    }
    if (cargoSelecionado === "Gerente") {
        tipo_colaborador = "admin";
        const setorSelect = document.getElementById("setorgerente");
        setor = setorSelect.options[setorSelect.selectedIndex].text;
    }
    const checkboxes = document.querySelectorAll(
        "input[name='unidades']:checked"
    );
    let unidadesTrabalha = Array.from(checkboxes).map((cb) => cb.value);
    if (!unidadesTrabalha[0]) {
        unidadesTrabalha = null;
    }
    // pega imagem (preview) se existir
    const imagemInputEl = document.getElementById("imagemUsuario");
    const imagemPreviewBase64 =
        imagemInputEl && imagemInputEl.dataset && imagemInputEl.dataset.preview
            ? imagemInputEl.dataset.preview
            : null;

    try {
        const response = await fetch("/auth/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome_colaborador: nome,
                ativo: true,
                tipo_colaborador,
                unidades_trabalha: unidadesTrabalha,
                perfis_usuario: [cargoSelecionado, setor ?? null],
                login: { email, pass: senha },
                imagem: imagemPreviewBase64,
            }),
        });

        const data = await response.json();
        if (data.msg !== "Usuário criado com sucesso!") {
            setTimeout(() => {
                document.getElementById("alertErro").classList.add("show");
                document.getElementById("alertErro").classList.remove("d-none");
                document.getElementById("pAlertErro").innerHTML = data.msg;
                setTimeout(() => {
                    document
                        .getElementById("alertErro")
                        .classList.remove("show");
                    document
                        .getElementById("alertErro")
                        .classList.add("d-none");
                }, 2500);
            }, 500);
        } else {
            setTimeout(() => {
                document.getElementById("alertSucesso").classList.add("show");
                document
                    .getElementById("alertSucesso")
                    .classList.remove("d-none");
                document.getElementById("pAlertSucesso").innerHTML = data.msg;
                setTimeout(() => {
                    document
                        .getElementById("alertSucesso")
                        .classList.remove("show");
                    document
                        .getElementById("alertSucesso")
                        .classList.add("d-none");
                }, 2500);
            }, 500);
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao tentar salvar colaborador.");
    }
}
async function salvarCliente(event) {
    event.preventDefault();

    const nome = document.getElementById("nomeinput2").value;
    let email = document.getElementById("emailinput2").value;
    let tel = document.getElementById("telinput2").value;
    let nascto = document.getElementById("nasctoinput").value;
    const respostasSaude = [
        document.getElementById("pressao").checked,
        document.getElementById("gravida").checked,
        document.getElementById("dores").value,
    ];
    const observacoes = document.getElementById("textobservacoes").value;
    console.log(respostasSaude);
    try {
        const response = await fetch("/auth/client/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome_cliente: nome,
                email_cliente: email,
                telefone_cliente: tel,
                data_nascimento: nascto,
                respostas_saude: respostasSaude,
                observacoes: observacoes,
            }),
        });

        const data = await response.json();
        if (data.msg !== "Cliente criado com sucesso!") {
            setTimeout(() => {
                document.getElementById("alertErro").classList.add("show");
                document.getElementById("alertErro").classList.remove("d-none");
                document.getElementById("pAlertErro").innerHTML = data.msg;
                setTimeout(() => {
                    document
                        .getElementById("alertErro")
                        .classList.remove("show");
                    document
                        .getElementById("alertErro")
                        .classList.add("d-none");
                }, 2500);
            }, 500);
        } else {
            setTimeout(() => {
                document.getElementById("alertSucesso").classList.add("show");
                document
                    .getElementById("alertSucesso")
                    .classList.remove("d-none");
                document.getElementById("pAlertSucesso").innerHTML = data.msg;
                setTimeout(() => {
                    document
                        .getElementById("alertSucesso")
                        .classList.remove("show");
                    document
                        .getElementById("alertSucesso")
                        .classList.add("d-none");
                }, 2500);
            }, 500);
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao tentar salvar cliente.");
    }
}
