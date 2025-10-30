const menubtn = document.getElementById("menubtn");
function abrirMenu() {
    const dropcnt = document.getElementById("dropcnt");
    dropcnt.classList.toggle("d-none");
}

function abrirPopup(tipo) {
    fecharTodosPopups();
    const popup = document.getElementById(`popup-${tipo}`);
    if (popup) popup.style.display = "flex";
}

function fecharPopup(tipo) {
    const popup = document.getElementById(`popup-${tipo}`);
    if (popup) popup.style.display = "none";
}

function fecharTodosPopups() {
    document.querySelectorAll(".popup-bg").forEach((popup) => {
        popup.style.display = "none";
    });
}

/* === Funções de Interação === */
document.addEventListener("DOMContentLoaded", () => {
    // Adiciona eventos a todos os botões de cada popup
    document.querySelectorAll(".popupposto").forEach((popup) => {
        const tipo = popup.parentElement.id.replace("popup-", "");
        const frame = popup.querySelector(".frameposto");
        const btns = popup.querySelectorAll(".btncustom");

        const btnRemover = btns[0];
        const btnAdicionar = btns[1];
        const btnConfirmar = btns[2];

        // Ao clicar em "Adicionar"
        btnAdicionar.addEventListener("click", () => {
            const itens = frame.querySelectorAll(".itemposto");
            const novoNumero = itens.length + 1;

            const novoItem = document.createElement("div");
            novoItem.classList.add("itemposto", "verde");
            novoItem.textContent =
                tipo.charAt(0).toUpperCase() + tipo.slice(1) + " " + novoNumero;

            // Adiciona o evento de alternar cor
            novoItem.addEventListener("click", alternarCor);

            frame.insertBefore(novoItem, btnRemover);
        });

        // Ao clicar em "Remover"
        btnRemover.addEventListener("click", () => {
            const itens = frame.querySelectorAll(".itemposto");
            if (itens.length > 0) {
                const ultimo = itens[itens.length - 1];
                ultimo.remove();
            }
        });

        // Ao clicar em "Confirmar"
        btnConfirmar.addEventListener("click", () => {
            fecharPopup(tipo);
        });

        // Adiciona alternância de cor nos itens existentes
        frame.querySelectorAll(".itemposto").forEach((item) => {
            item.addEventListener("click", alternarCor);
        });
    });
});

/* === Alternância de Cores === */
function alternarCor(event) {
    const cores = ["verde", "amarelo", "vermelho", "laranja"];
    const item = event.target;

    // Descobre a cor atual
    const corAtual = cores.find((c) => item.classList.contains(c));
    let proximaCor;

    if (corAtual) {
        const index = cores.indexOf(corAtual);
        proximaCor = cores[(index + 1) % cores.length];
        item.classList.remove(corAtual);
    } else {
        proximaCor = "verde"; // caso inicial
    }

    item.classList.add(proximaCor);
}

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
