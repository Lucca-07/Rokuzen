const menubtn = document.getElementById("menubtn");
function abrirMenu() {
    const dropcnt = document.getElementById("dropcnt");
    dropcnt.classList.toggle("d-none");
}

const statusMap = {
    verde: "Disponível",
    vermelho: "Ocupado",
    amarelo: "Manutenção",
    laranja: "Intervalo",
};

const colorMap = {
    Disponível: "#90ee90", // Verde claro
    Ocupado: "#ff4d4d", // Vermelho
    Manutenção: "#ffd700", // Amarelo
    Intervalo: "#ffa500", // Laranja
};
// Abro os pop up
function abrirPopup(tipo) {
    fecharTodosPopups();
    const popup = document.getElementById(`popup-${tipo}`);
    if (popup) popup.style.display = "flex";
}

// Fecho todos os pop ups
function fecharTodosPopups() {
    document.querySelectorAll(".popup-bg").forEach((popup) => {
        popup.style.display = "none";
    });
}

// Fechar o pop o pup com o icone do x no superior da tela
function fecharPopup(botao) {
    const popup = botao.closest(".popup-bg");
    if (popup) popup.style.display = "none";
}

// Pego os postos do back
async function buscarPostos() {
    try {
        const response = await fetch("/postoatendimento", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                unidade: localStorage.getItem("unidade"),
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json();
        console.log("📬 Dados recebidos do backend:", data);
        renderizarPostos(data);
    } catch (error) {
        console.error("Erro ao buscar postos:", error);
    }
}

// Renderiza os postos
function renderizarPostos(data) {
    const { quick, poltrona, maca } = data;

    // Cadeiras quick
    const frameCadeira = document.getElementById("frame-cadeira");
    frameCadeira.innerHTML = "";
    quick.forEach((posto, i) => {
        const statusInicial =
            posto.status && posto.status.trim() !== ""
                ? posto.status
                : "Disponível";
        const linha = criarLinha(posto._id, `Cadeira ${i + 1}`, statusInicial);
        frameCadeira.appendChild(linha);
    });

    // Poltronas
    const framePoltrona = document.getElementById("frame-poltrona");
    framePoltrona.innerHTML = "";
    poltrona.forEach((posto, i) => {
        const statusInicial =
            posto.status && posto.status.trim() !== ""
                ? posto.status
                : "Disponível";
        const linha = criarLinha(posto._id, `Poltrona ${i + 1}`, statusInicial);
        framePoltrona.appendChild(linha);
    });

    // Macas
    const frameMaca = document.getElementById("frame-maca");
    frameMaca.innerHTML = "";
    maca.forEach((posto, i) => {
        const statusInicial =
            posto.status && posto.status.trim() !== ""
                ? posto.status
                : "Disponível";
        const linha = criarLinha(posto._id, `Maca ${i + 1}`, statusInicial);
        frameMaca.appendChild(linha);
    });
}

// Crio linha
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
        const novaCor = colorMap[statusSelect.value];
        item.style.backgroundColor = novaCor;
    });

    linha.append(item, statusLabel, statusSelect);
    return linha;
}

// Confirmar alteracoes
document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll(".popup").forEach((popup) => {
        const btnConfirmar = popup.querySelector(".confirmar");

        btnConfirmar.addEventListener("click", async () => {
            const frame = popup.querySelector(".frame");
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

                    const result = await response.json();
                    console.log(" Resultado atualização:", result);
                }

                // Alerta quando salvar
                alert("Status alterado com sucesso");
                popup.parentElement.style.display = "none";
            } catch (error) {
                console.error(" Erro ao atualizar status:", error);
                alert("Erro ao salvar as alterações!");
            }
        });
    });

    await buscarPostos();
});
