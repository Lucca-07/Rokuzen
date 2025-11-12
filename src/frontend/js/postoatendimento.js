// Menu toggle
const menubtn = document.getElementById("menubtn");
menubtn?.addEventListener("click", () => {
    document.getElementById("dropcnt")?.classList.toggle("d-none");
});

// Mapas de status e cores
const statusMap = {
    verde: "Disponível",
    vermelho: "Ocupado",
    amarelo: "Manutenção",
    laranja: "Intervalo",
};
const colorMap = {
    Disponível: "#90ee90",
    Ocupado: "#ff4d4d",
    Manutenção: "#ffd700",
    Intervalo: "#ffa500",
};

// Abrir popup
function abrirPopup(tipo) {
    fecharTodosPopups();
    const popup = document.getElementById(`popup-${tipo}`);
    if (popup) popup.style.display = "flex";
}

// Fechar todos os popups
function fecharTodosPopups() {
    document
        .querySelectorAll(".popup-bg")
        .forEach((p) => (p.style.display = "none"));
}

// Fechar popup pelo X
function fecharPopup(botao) {
    const popup = botao.closest(".popup-bg");
    if (popup) popup.style.display = "none";
}

// Criar linha de posto
function criarLinha(id, nome, statusInicial) {
    const linha = document.createElement("div");
    linha.classList.add("linha");
    linha.dataset.id = id;
    linha.style.display = "flex";
    linha.style.alignItems = "center";
    linha.style.marginBottom = "10px";

    const item = document.createElement("div");
    item.classList.add("item");
    item.textContent = nome;
    item.style.padding = "10px 20px";
    item.style.borderRadius = "10px";
    item.style.backgroundColor = colorMap[statusInicial] || "#90ee90";
    item.style.flex = "1";

    const statusLabel = document.createElement("span");
    statusLabel.textContent = "Status:";
    statusLabel.style.margin = "0 10px";

    const statusSelect = document.createElement("select");
    statusSelect.classList.add("status-select");
    statusSelect.style.marginRight = "10px";

    ["Disponível", "Ocupado", "Manutenção", "Intervalo"].forEach((opcao) => {
        const option = document.createElement("option");
        option.value = opcao;
        option.textContent = opcao;
        statusSelect.appendChild(option);
    });

    statusSelect.value = statusInicial;

    statusSelect.addEventListener("change", () => {
        item.style.backgroundColor = colorMap[statusSelect.value];
    });

    linha.append(item, statusLabel, statusSelect);
    return linha;
}

// Renderizar postos
function renderizarPostos(data) {
    const { quick, poltrona, maca } = data;

    const frames = {
        cadeira: document.getElementById("frame-cadeira"),
        poltrona: document.getElementById("frame-poltrona"),
        maca: document.getElementById("frame-maca"),
    };

    quick.forEach((p, i) => {
        frames.cadeira.appendChild(
            criarLinha(p._id, `Cadeira ${i + 1}`, p.status || "Disponível")
        );
    });
    poltrona.forEach((p, i) => {
        frames.poltrona.appendChild(
            criarLinha(p._id, `Poltrona ${i + 1}`, p.status || "Disponível")
        );
    });
    maca.forEach((p, i) => {
        frames.maca.appendChild(
            criarLinha(p._id, `Maca ${i + 1}`, p.status || "Disponível")
        );
    });
}

// Buscar postos do backend
async function buscarPostos() {
    try {
        const response = await fetch("/postoatendimento", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ unidade: localStorage.getItem("unidade") }),
        });
        if (!response.ok)
            throw new Error(`Erro na requisição: ${response.status}`);
        const data = await response.json();
        console.log("📬 Dados recebidos do backend:", data);
        renderizarPostos(data);
    } catch (err) {
        console.error("Erro ao buscar postos:", err);
    }
}

// Confirmar alterações
async function confirmarAlteracoes(popup) {
    const frame = popup.querySelector(".frame");
    const linhas = frame.querySelectorAll(".linha");
    const atualizacoes = Array.from(linhas).map((linha) => ({
        id: linha.dataset.id,
        status: linha.querySelector(".status-select").value,
    }));

    try {
        for (const item of atualizacoes) {
            const res = await fetch("/atualizarStatus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(item),
            });
            const result = await res.json();
            console.log("Resultado backend:", result);
        }
        alert("Status alterado com sucesso!");
        popup.style.display = "none";
    } catch (err) {
        console.error("Erro ao atualizar status:", err);
        alert("Erro ao salvar as alterações!");
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", async () => {
    // Seleciona todos os botões de confirmar nos modais
    document.querySelectorAll(".confirmar").forEach((btnConfirmar) => {
        btnConfirmar.addEventListener("click", async () => {
            // Pega o modal pai
            const modalContent = btnConfirmar.closest(".modal-content");
            if (!modalContent) return;

            const frame = modalContent.querySelector(".frame");
            if (!frame) return;

            const linhas = frame.querySelectorAll(".linha");
            const atualizacoes = [];

            linhas.forEach((linha) => {
                const id = linha.dataset.id;
                const status = linha.querySelector(".status-select").value;
                atualizacoes.push({ id, status });
            });

            try {
                for (const item of atualizacoes) {
                    const response = await fetch("/atualizarStatus", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(item),
                    });

                    if (!response.ok) {
                        throw new Error(
                            `Erro ao atualizar: ${response.status}`
                        );
                    }

                    const result = await response.json();
                    console.log("Resultado backend:", result);
                }

                alert("Status alterado com sucesso!");

                // Fecha o modal usando Bootstrap JS
                const modalElement = btnConfirmar.closest(".modal");
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
            } catch (error) {
                console.error("Erro ao atualizar status:", error);
                alert("Erro ao salvar as alterações!");
            }
        });
    });

    await buscarPostos();

    // Configurar links dinâmicos
    const id = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!token) return (window.location.href = "/");
    const links = {
        escala: document.querySelector('a[href^="/escala"]'),
        postos: document.querySelector('a[href^="/postosatendimento"]'),
        sessao: document.querySelector('a[href^="/sessao"]'),
        cadastro: document.querySelector('a[href^="/cadastrar"]'),
        listar: document.querySelector('a[href^="/user/listar"]'),
        inicio: document.querySelector('a[href^="/inicio"]'),
    };
    if (links.escala) links.escala.href = `/escala/${id}`;
    if (links.postos) links.postos.href = `/postosatendimento/${id}`;
    if (links.sessao) links.sessao.href = `/sessao/${id}`;
    if (links.inicio) links.inicio.href = `/inicio/${id}`;
    if (links.cadastro) links.cadastro.href = `/cadastrar/${id}`;
    if (links.listar) links.listar.href = `/user/listar/${id}`;

    // Evento global de clique
    document.addEventListener("click", (e) => {
        // Confirmar alterações
        const btnConfirmar = e.target.closest(".confirmar");
        if (btnConfirmar) {
            const popup = btnConfirmar.closest(".popup-bg");
            if (popup) confirmarAlteracoes(popup);
        }
        // Fechar popup pelo X
        const btnFechar = e.target.closest(".btn-fechar-popup");
        if (btnFechar) fecharPopup(btnFechar);
    });

    // Sair
    document.getElementById("sairbutton")?.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    });
});
