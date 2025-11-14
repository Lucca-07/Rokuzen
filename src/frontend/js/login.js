const acessar = document.getElementById("proximo");
acessar.addEventListener("click", validarUsuario);

const esqueci = document.getElementById("esqueci");
esqueci.addEventListener("click", esqueciSenha);
const voltarLogin = document.getElementById("voltarLogin");
voltarLogin.addEventListener("click", esqueciSenha);

const cardLogin = document.getElementById("cardLogin");
const cardSenha = document.getElementById("cardSenha");

const recuperarButton = document.getElementById("recuperarButton");
recuperarButton.addEventListener("click", recuperarSenha);
const emailRecuperacaoInput = document.getElementById("emailRecuperacao");

document.getElementById("acessar").addEventListener("click", () => {
    const unidadeErro = document.getElementById("erroUnidade");
    const select = document.getElementById("unidades");
    const selectedOption = select.options[select.selectedIndex].text;

    unidadeErro.innerHTML = ""; // limpa mensagens anteriores

    if (selectedOption != "Selecionar") {
        localStorage.setItem("unidade", selectedOption);
        window.location.href = localStorage.getItem("redirect");
    } else {
        unidadeErro.innerHTML = `
            <div class="alert alert-warning alert-dismissible fade show py-2" role="alert">
                <i class="mdi mdi-alert-circle-outline me-1"></i>
                Selecione uma unidade válida!
                <button type="button" class="btn-close align-self-center p-3" data-bs-dismiss="alert" aria-label="Fechar"></button>
            </div>`;
    }
});

document.addEventListener("keydown", handleLoginKey);

// =====================
// 🔐 Valida o login
// =====================
async function validarUsuario() {
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("pass").value.trim();
    const paragrafoErro = document.getElementById("erroLogin");

    // limpa mensagens anteriores
    paragrafoErro.innerHTML = "";

    if (!email || !pass) {
        paragrafoErro.innerHTML = `
            <div class="alert alert-warning alert-dismissible fade show py-2" role="alert">
                <i class="mdi mdi-alert-circle-outline me-1"></i>
                Preencha todos os campos.
                <button type="button" class="btn-close align-self-center p-3" data-bs-dismiss="alert"></button>
            </div>`;
        return;
    }

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, pass }),
        });

        const data = await response.json();

        if (data.validado) {
            // 🔓 Login bem-sucedido
            localStorage.setItem("token", data.token);
            localStorage.setItem("userId", data.id);
            localStorage.setItem("tipoUser", data.tipoUser);
            localStorage.setItem("perfis_usuario", data.perfis_usuario[0]);
            localStorage.setItem("redirect", data.redirect);

            // troca de card
            document.getElementById("cardLogin").classList.add("d-none");
            document.getElementById("cardUnidades").classList.remove("d-none");

            // preenche lista de unidades
            const select = document.getElementById("unidades");
            select.innerHTML = "<option selected disabled>Selecionar</option>";

            let listaUnidades = [];
            if (
                typeof data.unidades === "string" &&
                data.unidades.includes(",")
            ) {
                listaUnidades = data.unidades.split(",");
            } else if (Array.isArray(data.unidades)) {
                listaUnidades = data.unidades;
            } else {
                listaUnidades = [data.unidades];
            }

            listaUnidades.forEach((unidade) => {
                if (unidade.trim())
                    select.add(new Option(unidade.trim(), unidade.trim()));
            });

            document.removeEventListener("keydown", handleLoginKey);
            document.addEventListener("keydown", handleUnidadeKey);
        } else {
            // ❌ Falha no login
            paragrafoErro.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show py-2" role="alert">
                    <i class="mdi mdi-close-circle-outline me-1"></i>
                    Usuário ou senha inválidos.
                    <button type="button" class="btn-close align-self-center p-3" data-bs-dismiss="alert" aria-label="Fechar"></button>
                </div>`;
        }
    } catch (error) {
        console.error("Erro:", error);
        paragrafoErro.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show py-2" role="alert">
                <i class="mdi mdi-alert me-1"></i>
                Erro ao tentar fazer login. Tente novamente.
                <button type="button" class="btn-close align-self-center p-3" data-bs-dismiss="alert" aria-label="Fechar"></button>
            </div>`;
    }
}

// =====================
// 🔁 Recuperar senha
// =====================
async function recuperarSenha() {
    const recuperarErro = document.getElementById("erroRecuperacao");
    const recuperarSucesso = document.getElementById("sucessoRecuperacao");
    const email = emailRecuperacaoInput.value.trim();

    recuperarErro.innerHTML = "";
    recuperarSucesso.innerHTML = "";

    try {
        const response = await fetch("/recuperar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailRecuperacao: email }),
        });

        const data = await response.json();

        if (response.ok) {
            recuperarSucesso.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
                    <i class="mdi mdi-check-circle-outline me-1"></i>
                    Email de recuperação enviado!
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>`;
        } else {
            recuperarErro.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show py-2" role="alert">
                    <i class="mdi mdi-close-circle-outline me-1"></i>
                    ${data.msg || "Email inválido!"}
                    <button type="button" class="btn-close align-self-center p-3" data-bs-dismiss="alert"></button>
                </div>`;
        }
    } catch (error) {
        console.error("Erro ao tentar recuperar senha:", error);
        recuperarErro.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show py-2" role="alert">
                <i class="mdi mdi-alert me-1"></i>
                Ocorreu um erro. Tente novamente.
                <button type="button" class="btn-close align-self-center p-3" data-bs-dismiss="alert"></button>
            </div>`;
    }
}

// =====================
// 🔁 Alternar tela de senha esquecida
// =====================
function esqueciSenha() {
    const email = document.getElementById("email");
    const pass = document.getElementById("pass");
    const paragrafoErro = document.getElementById("erroLogin");
    const emailRecuperacao = document.getElementById("emailRecuperacao");
    const recuperarErro = document.getElementById("erroRecuperacao");

    email.value = "";
    pass.value = "";
    paragrafoErro.innerHTML = "";
    emailRecuperacao.value = "";
    recuperarErro.innerHTML = "";

    cardLogin.classList.toggle("d-none");
    cardSenha.classList.toggle("d-none");
}

// =====================
// 👁️ Mostrar/Ocultar senha
// =====================
function togglePassword(inputId, iconId) {
    const senhaInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);
    const toggleButton = toggleIcon.parentElement;

    if (senhaInput.type === "password") {
        senhaInput.type = "text";
        toggleIcon.classList.replace("mdi-eye-off", "mdi-eye");
        toggleButton.setAttribute("aria-label", "Ocultar senha");
    } else {
        senhaInput.type = "password";
        toggleIcon.classList.replace("mdi-eye", "mdi-eye-off");
        toggleButton.setAttribute("aria-label", "Mostrar senha");
    }
}

// =====================
// ⌨️ Eventos de tecla
// =====================
function handleLoginKey(event) {
    if (event.key === "Enter") {
        if (cardLogin.classList.contains("d-none")) {
            handleForgotKey();
            return;
        }
        event.preventDefault();
        validarUsuario();
    }
}

function handleForgotKey() {
    recuperarButton.click();
}

function handleUnidadeKey(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("acessar").click();
    }
}
