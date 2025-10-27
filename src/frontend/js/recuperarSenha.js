const salvarSenha = document.getElementById("confirmar");
salvarSenha.addEventListener("click", updateSenha);
async function updateSenha() {
    const email = document.getElementById("email").value;
    const senha1 = document.getElementById("novasenha1").value;
    const senha2 = document.getElementById("novasenha2").value;

    if (senha1 !== senha2) {
        document.getElementById("pSenha").classList.remove("d-none");
        document.getElementById("pSenha").classList.remove("text-success");
        document.getElementById("pSenha").classList.add("text-danger");
        document.getElementById("pSenha").innerHTML =
            "As senhas não coincidem!";
    } else {
        if (senha1.length > 7) {
            try {
                const response = await fetch("/atualizarSenha", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: email, newpass: senha1 }),
                });
                const data = await response.json();

                if (response.ok) {
                    document
                        .getElementById("pSenha")
                        .classList.remove("d-none");
                    document
                        .getElementById("pSenha")
                        .classList.remove("text-danger");
                    document
                        .getElementById("pSenha")
                        .classList.add("text-success");
                    document.getElementById("pSenha").innerHTML =
                        "Senha atualizada!";
                } else {
                    document
                        .getElementById("pSenha")
                        .classList.remove("d-none");
                    document
                        .getElementById("pSenha")
                        .classList.remove("text-success");
                    document
                        .getElementById("pSenha")
                        .classList.add("text-danger");
                    document.getElementById("pSenha").innerHTML =
                        "Preencha todos os campos!";
                }
            } catch (error) {
                console.log("Erro ao tentar atualizar a senha:", error);
            }
        } else {
            document.getElementById("pSenha").classList.remove("d-none");
            document.getElementById("pSenha").classList.remove("text-success");
            document.getElementById("pSenha").classList.add("text-danger");
            document.getElementById("pSenha").innerHTML =
                "A senha precisa ter 8 caracteres!";
        }
    }
}
