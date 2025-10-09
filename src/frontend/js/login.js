const acessar = document.getElementById("acessar");
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

//Valida o login
async function validarUsuario() {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("pass").value;
    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: email, pass: pass }),
        });

        const data = await response.json();

        if (data.validado && data.redirect) {
            localStorage.setItem("token", data.token); // salva o token
            localStorage.setItem("userId", data.id); // Salva o id
            window.location.href = data.redirect; 
        } else {
            console.error("Falha no login:", data.msg);
            alert(data.msg || "Email ou senha inválidos");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao tentar fazer login.");
    }
}

async function recuperarSenha() {
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
            alert(data.mensagem); // Ex: "Email enviado"
        } else {
            alert(data.mensagem); // Ex: "Email não existente"
        }
    } catch (error) {
        console.error("Erro ao tentar recuperar senha:", error);
        alert("Ocorreu um erro. Tente novamente.");
    }
}

function esqueciSenha() {
    const email = document.getElementById("email");
    const pass = document.getElementById("pass");
    const emailRecuperacao = document.getElementById("emailRecuperacao");
    email.value = "";
    pass.value = "";
    emailRecuperacao.value = "";
    cardLogin.classList.toggle("d-none");
    cardSenha.classList.toggle("d-none");
}
