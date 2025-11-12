const salvarSenha = document.getElementById("confirmar");
salvarSenha.addEventListener("click", updateSenha);

const alertaErro = document.getElementById("alertaSenhaErro");
const alertaSucesso = document.getElementById("alertaSenhaSucesso");

// =====================
// 🔐 Atualiza a senha
// =====================
async function updateSenha() {
    const email = document.getElementById("emailRecuperacao").value.trim();
    const senha1 = document.getElementById("novasenha1").value.trim();
    const senha2 = document.getElementById("novasenha2").value.trim();

    // limpa alertas
    alertaErro.innerHTML = "";
    alertaSucesso.innerHTML = "";

    if (!email || !senha1 || !senha2) {
        mostrarErro("Preencha todos os campos!");
        return;
    }

    if (!email.includes("@")) {
        mostrarErro("Insira um email válido!");
        return;
    }

    if (senha1 !== senha2) {
        mostrarErro("As senhas não coincidem!");
        return;
    }

    if (senha1.length < 8) {
        mostrarErro("A senha precisa ter pelo menos 8 caracteres!");
        return;
    }

    try {
        const response = await fetch("/atualizarSenha", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, newpass: senha1 }),
        });

        const data = await response.json();

        if (response.ok) {
            mostrarSucesso("Senha atualizada com sucesso!");
        } else {
            mostrarErro(data.msg || "Email não encontrado!");
        }
    } catch (error) {
        console.error("Erro ao atualizar a senha:", error);
        mostrarErro("Ocorreu um erro. Tente novamente.");
    }
}

// =====================
// 👁️ Alterna exibição da senha
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
// ⌨️ Atalhos de teclado
// =====================
function handleRecuperarKey(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        salvarSenha.click();
    }
}

document.addEventListener("keydown", handleRecuperarKey);

// =====================
// 🔔 Funções de alerta
// =====================
function mostrarErro(msg) {
    alertaErro.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show py-2" role="alert">
            <i class="mdi mdi-close-circle-outline me-1"></i>
            ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        </div>`;
}

function mostrarSucesso(msg) {
    alertaSucesso.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show py-2" role="alert">
            <i class="mdi mdi-check-circle-outline me-1"></i>
            ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        </div>`;
}
