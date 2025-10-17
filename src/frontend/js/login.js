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
    const select = document.getElementById("unidades");
    const selectedOption = select.options[select.selectedIndex].text;
    localStorage.setItem("unidade", selectedOption);
    window.location.href = localStorage.getItem("redirect");
});

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
            body: JSON.stringify({
                email: email,
                pass: pass,
            }),
        });

        const data = await response.json();

        if (data.validado) {
            localStorage.setItem("token", data.token); // salva o token
            localStorage.setItem("userId", data.id); // Salva o id
            document.getElementById("cardLogin").classList.toggle("d-none");
            document.getElementById("cardUnidades").classList.toggle("d-none");
            const select = document.getElementById("unidades");
            let listaUnidades;
            console.log(typeof localStorage.getItem("unidadesTotais"));
            if (data.unidades.includes(",")) {
                listaUnidades = data.unidades.split(",");
            } else {
                listaUnidades = data.unidades;
            }
            console.log(listaUnidades);
            listaUnidades.forEach((unidade) => {
                select.add(new Option(unidade, unidade));
            });
            localStorage.setItem("redirect", data.redirect);
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
            alert(data.msg); // Ex: "Email enviado"
        } else {
            alert(data.msg); // Ex: "Email não existente"
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
