async function listarColaboradores() {
    const main = document.getElementById("main");
    main.innerHTML = "";
    try {
        const response = await fetch("/api/user/listar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const { users } = await response.json();

        let contador = 1;
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
                <div id="card-${contador}" class="row container-lg bg-light d-flex p-4 border mt-4 card-editar h-25 "
                    style="border-radius: 30px; animation: aparecer 0.3s ease-in forwards;">
                    <div class="col-12 col-md-6 col-lg-3 d-flex align-self-center align-items-center justify-content-center h-50">
                        <img src="/frontend/img/account-outline.svg" alt=""
                            style="border-radius: 25px; border: 1px solid black; height: 100px; width: 100px;">
                    </div>
                    <div class="col-12 col-md-6 col-lg-9 d-flex">
                        <div class="nome d-flex align-self-center align-items-center justify-content-center h-100" style="flex:40%">
                            <p class="fs-4">${nome}</p>
                        </div>
                        <div class="perfil d-flex align-self-center align-items-center justify-content-center h-100" style="flex:40%">
                            <p class="fs-4">${perfis}</p>
                        </div>
                        <div class="perfil d-flex align-items-start justify-content-end h-100 gap-2" style="flex:20%">
                            <i class="mdi mdi-pencil px-2 py-1 fs-5 bg-success-subtle" style="cursor:pointer; border-radius: 10px;"></i>
                            <i class="mdi mdi-delete px-2 py-1 fs-5 bg-danger-subtle" style="cursor:pointer; border-radius: 10px;" onclick="popupDelete('${user._id}')"></i>
                        </div>

                    </div>
                </div>
            `;

            main.insertAdjacentHTML("beforeend", card);
            contador++;
        });
    } catch (error) {
        console.error("Erro: " + error);
    }
}

function popupDelete(id) {
    const main = document.getElementById("main");
    const deletepopup = `<div id="popupdelete"
        class="position-fixed top-50 start-50 translate-middle bg-light border border-2 border-black p-4 z-3" style="border-radius: 20px;">
        <p class="fs-4">Tem certeza que deseja excluir este usuário?</p>
        <div class="d-flex justify-content-center align-content-center gap-2">
            <button id="confirmbtn" class="w-25 bg-success-subtle" style="border-radius: 10px;" onclick="deleteColaborador('${id}')">Sim</button>
            <button id="cancelbtn" class="w-25 bg-danger-subtle" style="border-radius: 10px;"
        onclick="document.getElementById('popupdelete').remove(), document.getElementById('overlay').remove()">Não</button>
        </div>
    </div>`;
    const overylay = `<div id="overlay" class="overlay position-fixed top-0 start-0 z-2" style="background: rgba(0,0,0,0.3); width: 100vw; height: 100vh;">

    </div>`;
    main.insertAdjacentHTML("beforeend", overylay)
    main.insertAdjacentHTML("beforeend", deletepopup);
}

async function deleteColaborador(id) {
    const main = document.getElementById("main");
    try {
        const response = await fetch("/api/user/deletar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.msg);
            listarColaboradores(); // atualiza a lista na tela
        } else {
            alert(result.msg || "Erro ao deletar usuário");
        }
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro no servidor");
    }
}
