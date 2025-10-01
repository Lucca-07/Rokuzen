const acessar = document.getElementById("acessar");
acessar.addEventListener("click", validarUsuario);

//Valida o login
async function validarUsuario() {
    const user = document.getElementById("user").value;
    const pass = document.getElementById("pass").value;
    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user: user, pass: pass})
        })
        
        const result = await response.json();

        if (response.ok) {
            console.log(result.message);
            console.log("Login bem sucedido!")
        } else{
            console.error(result.message);
            console.log("Usuário ou senha inválidos");
        }
    } catch (error) {
        console.log({ error: error });
        alert("Erro ao tentar fazer login.");
    }
}
