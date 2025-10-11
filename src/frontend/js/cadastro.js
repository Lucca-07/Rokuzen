const userInterno = document.getElementById("containerColaborador");
const userExterno = document.getElementById("containerCliente");

const selectUser = document.getElementById("usuarioselect");

const setorcargo = document.getElementById("setorcargo");
const cargoselect = document.getElementById("cargoselect");

selectUser.addEventListener("change", () => {
    userExterno.classList.toggle("d-none");
    userInterno.classList.toggle("d-none");
});

cargoselect.addEventListener("change", () => {
    if (cargoselect.options[cargoselect.selectedIndex].text === "Gerente") {
        setorcargo.classList.toggle("d-none");
    } else {
        setorcargo.classList.add("d-none");
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    // pega o id da URL: /inicio/:id
    const pathParts = window.location.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    const token = localStorage.getItem("token");
    if (!token) {
        // sem token: volta pra login
        window.location.href = "/";
        return;
    }

    try {
        const res = await fetch(`/api/colaboradores/${id}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
        });

        if (res.status === 401 || res.status === 403) {
            // token inválido / sem permissão -> limpa token e volta ao login
            localStorage.removeItem("token");
            window.location.href = "/";
            return;
        }

        if (!res.ok) {
            const err = await res.json();
            console.error("Erro ao carregar dados:", err);
            alert(err.msg || "Erro ao carregar dados.");
            return;
        }
        const links = {
            escala: document.querySelector('a[href="#escala"]'),
            postos: document.querySelector('a[href="#postos"]'),
            sessao: document.querySelector('a[href="#sessao"]'),
            inicio: document.querySelector('a[href="#inicio"'),
        };
        if (links.escala) links.escala.href = `/escala/${id}`;
        if (links.postos) links.postos.href = `/postosatendimento/${id}`;
        if (links.sessao) links.sessao.href = `/sessao/${id}`;
        if (links.inicio) links.inicio.href = `/inicio/${id}`;
    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Erro de rede. Tente novamente.");
    }
});

document.getElementById("sairbutton").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
});

async function salvarColaborador(event) {
    event.preventDefault();

    const nome = document.getElementById("nomeinput").value;
    const email = document.getElementById("emailinput").value;
    const senha = document.getElementById("senhainput").value;
    const cargo = document.getElementById("cargoselect");

    let tipo_colaborador = "user";
    let setor = null;

    const cargoSelecionado = cargo.options[cargo.selectedIndex].text;

    if (cargoSelecionado === "Gerente") {
        tipo_colaborador = "admin";
        const setorSelect = document.getElementById("setorgerente");
        setor = setorSelect.options[setorSelect.selectedIndex].text;
    }

    const checkboxes = document.querySelectorAll(
        "input[name='unidades']:checked"
    );
    const unidadesTrabalha = Array.from(checkboxes).map((cb) => cb.value);

    try {
        const response = await fetch("/auth/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome_colaborador: nome,
                ativo: true,
                tipo_colaborador,
                unidades_trabalha: unidadesTrabalha,
                perfis_usuario: [cargoSelecionado, setor ?? null],
                login: { email, pass: senha },
            }),
        });

        const data = await response.json();
        alert(data.msg);
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao tentar salvar colaborador.");
    }
}
async function salvarCliente(event) {
    event.preventDefault();

    const nome = document.getElementById("nomeinput2").value;
    const email = document.getElementById("emailinput2").value;
    const tel = document.getElementById("telinput2").value;
    const nascto = document.getElementById("nasctoinput").value;
    const respostasSaude = [
        document.getElementById("pressao").checked,
        document.getElementById("gravida").checked,
        document.getElementById("dores").value,
    ];
    const observacoes = document.getElementById("textobservacoes").value;
    console.log(respostasSaude);
    try {
        const response = await fetch("/auth/client/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome_cliente: nome,
                email_cliente: email,
                telefone_cliente: tel,
                data_nascimento: nascto,
                respostas_saude: respostasSaude,
                observacoes: observacoes,
            }),
        });

        const data = await response.json();
        alert(data.msg);
    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao tentar salvar cliente.");
    }
}
