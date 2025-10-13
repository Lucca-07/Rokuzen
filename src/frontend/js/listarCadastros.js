async function listarColaboradores() {
    const main = document.getElementById("main");
    try {
        const response = await fetch("/api/user/listar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const { users } = await response.json();

        users.forEach((user) => {
            const nome = user.nome_colaborador; // nome correto do campo
            let perfis = user.perfis_usuario; // nome correto do campo
            if (perfis[1] == null) {
                perfis = perfis[0];
            } else {
                perfis = perfis.join(", ");
            }
            console.log(perfis);
            // console.log(perfisOrganizados)

            const card = `
                <div class="row container-lg bg-light d-flex p-4 border mt-4 card-editar h-25 "
                    style="border-radius: 30px; animation: aparecer 0.3s ease-in forwards;">
                    <div class="col-12 col-md-6 col-lg-3 d-flex align-self-center align-items-center justify-content-center h-50">
                        <img src="/frontend/img/account-outline.svg" alt=""
                            style="border-radius: 25px; border: 1px solid black; height: 100px; width: 100px;">
                    </div>
                    <div class="col-12 col-md-6 col-lg-9 d-flex">
                        <div class="nome d-flex align-self-center align-items-center justify-content-center h-100" style="flex:50%">
                            <p class="fs-4">${nome}</p>
                        </div>
                        <div class="perfil d-flex align-self-center align-items-center justify-content-center h-100" style="flex:50%">
                            <p class="fs-4">${perfis}</p>
                        </div>
                    </div>
                </div>
            `;

            main.insertAdjacentHTML("beforeend", card);
        });
    } catch (error) {
        console.error("Erro: " + error);
    }
}
