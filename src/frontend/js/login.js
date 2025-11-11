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
    if (selectedOption != "Selecionar") {
        localStorage.setItem("unidade", selectedOption);
        window.location.href = localStorage.getItem("redirect");
    } else {
        unidadeErro.innerHTML = "Selecione uma unidade válida!";
    }
});

document.addEventListener("keydown", handleLoginKey);

//Valida o login
async function validarUsuario() {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("pass").value;
    const paragrafoErro = document.getElementById("erroLogin");
    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                pass: pass,
            }),
        });

        const data = await response.json();

        if (data.validado) {
            localStorage.setItem("token", data.token); // salva o token
            localStorage.setItem("userId", data.id); // Salva o id
            localStorage.setItem("tipoUser", data.tipoUser);
            localStorage.setItem("perfis_usuario", data.perfis_usuario[0]);
            document.getElementById("cardLogin").classList.toggle("d-none");
            document.getElementById("cardUnidades").classList.toggle("d-none");
            const select = document.getElementById("unidades");
            let listaUnidades;
            if (data.unidades.includes(",")) {
                listaUnidades = data.unidades.split(",");
            } else {
                listaUnidades = data.unidades;
            }
            listaUnidades.forEach((unidade) => {
                select.add(new Option(unidade, unidade));
            });
            localStorage.setItem("redirect", data.redirect);
            document.removeEventListener("keydown", handleLoginKey);
            document.addEventListener("keydown", handleUnidadeKey);
        } else {
            console.error("Falha no login:", data.msg);
            paragrafoErro.innerHTML = "Usuário/Senha inválidos";
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao tentar fazer login.");
    }
}

async function recuperarSenha() {
    const recuperarErro = document.getElementById("erroRecuperacao");
    const recuperarSucesso = document.getElementById("sucessoRecuperacao");

    const email = emailRecuperacaoInput.value;

    try {
        const response = await fetch("/recuperar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ emailRecuperacao: email }),
        });

        const data = await response.json();

        if (response.ok) {
            recuperarSucesso.innerHTML = "Email enviado!";
            recuperarErro.innerHTML = "";
        } else {
            recuperarErro.innerHTML = "Email inválido!";
            recuperarSucesso.innerHTML = "";
        }
    } catch (error) {
        console.error("Erro ao tentar recuperar senha:", error);
        alert("Ocorreu um erro. Tente novamente.");
    }
}

function esqueciSenha() {
    const email = document.getElementById("email");
    const pass = document.getElementById("pass");
    const paragrafoErro = document.getElementById("erroLogin");
    const emailRecuperacao = document.getElementById("emailRecuperacao");
    const recuperarErro = document.getElementById("erroRecuperacao");
    const unidadeErro = document.getElementById("erroUnidade");
    email.value = "";
    pass.value = "";
    paragrafoErro.innerHTML = "";
    emailRecuperacao.value = "";
    recuperarErro.innerHTML = "";
    unidadeErro;
    cardLogin.classList.toggle("d-none");
    cardSenha.classList.toggle("d-none");
}

const passwordInput = document.getElementById("pass");
const toggleButton = document.getElementById("toggle-senha");
const toggleIcon = toggleButton.querySelector("i"); // Seleciona o ícone dentro do botão

function togglePassword(inputId, iconId) {
    const senhaInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);
    const toggleButton = toggleIcon.parentElement; // O pai do ícone é o botão

    if (senhaInput.type === "password") {
        senhaInput.type = "text";
        toggleIcon.classList.remove("mdi-eye-off");
        toggleIcon.classList.add("mdi-eye");
        toggleButton.setAttribute("aria-label", "Ocultar senha");
    } else {
        senhaInput.type = "password";
        toggleIcon.classList.remove("mdi-eye");
        toggleIcon.classList.add("mdi-eye-off");
        toggleButton.setAttribute("aria-label", "Mostrar senha");
    }
}

function handleLoginKey(event) {
    if (event.key === "Enter") {
        if (cardLogin.classList.contains("d-none")) {
            handleForgotKey();
            return;
        }
        console.log(cardLogin.classList);
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
