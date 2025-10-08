const salvarSenha = document.getElementById("confirmar");
salvarSenha.addEventListener("click", updateSenha);
async function updateSenha() {
    const email = document.getElementById("email").value;
    const senha1 = document.getElementById("novasenha1").value;
    const senha2 = document.getElementById("novasenha2").value;

    if (senha1 === senha2) {
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
                alert(data.mensagem); // Ex: "Email enviado"
            } else {
                alert(data.mensagem); // Ex: "Email não existente"
            }
        } catch (error) {
            console.log("Erro ao tentar atualizar a senha:", error);
        }
    } else {
        alert("As senhas não coincidem");
    }
}