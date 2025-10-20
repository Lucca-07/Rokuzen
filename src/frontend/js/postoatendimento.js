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
function abrirPopup(tipo) {
    fecharTodosPopups();
    const popup = document.getElementById(`popup-${tipo}`);
    if (popup) popup.style.display = "flex";
}

function fecharTodosPopups() {
    document.querySelectorAll(".popup-bg").forEach((popup) => {
        popup.style.display = "none";
    });
}

// Torne a função buscarPostos global
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
        console.log(data)
        console.log("Dados carregados:", data);

        // Renderize os dados nos popups
        renderizarPostos(data);
    } catch (error) {
        console.error("Erro ao buscar postos:", error);
    }
}

// Função para renderizar os postos nos popups
function renderizarPostos(data) {
    const { quick, poltrona, maca } = data;
    console.log(typeof quick, typeof poltrona, typeof maca)
    // Renderizar Cadeira Quick
    const frameCadeira = document.getElementById("frame-cadeira");
    frameCadeira.innerHTML = ""; // Limpa o conteúdo anterior
    for (let i = 0; i < quick.length; i++) {
        const linha = criarLinha(`Cadeira ${i + 1}`, "Disponível");
        frameCadeira.appendChild(linha);
    }

    // Renderizar Poltrona
    const framePoltrona = document.getElementById("frame-poltrona");
    framePoltrona.innerHTML = ""; // Limpa o conteúdo anterior
    for (let i = 0; i < poltrona.length; i++) {
        const linha = criarLinha(`Poltrona ${i + 1}`, "Disponível");
        framePoltrona.appendChild(linha);
    }

    // Renderizar Maca
    const frameMaca = document.getElementById("frame-maca");
    frameMaca.innerHTML = ""; // Limpa o conteúdo anterior
    for (let i = 0; i < maca.length; i++) {
        const linha = criarLinha(`Maca ${i + 1}`, "Disponível");
        frameMaca.appendChild(linha);
    }
}

// Função para criar uma linha com o layout desejado
function criarLinha(nome, statusInicial) {
    const linha = document.createElement("div");
    linha.classList.add("linha");
    linha.style.display = "flex"; // Define o layout flexível
    linha.style.alignItems = "center"; // Centraliza os itens verticalmente
    linha.style.marginBottom = "10px"; // Espaçamento entre linhas

    const item = document.createElement("div");
    item.classList.add("item", "verde");
    item.textContent = nome;
    item.style.padding = "10px 20px"; // Adiciona espaçamento interno
    item.style.borderRadius = "10px"; // Bordas arredondadas
    item.style.backgroundColor = "#90ee90"; // Cor verde clara
    item.style.flex = "1"; // Faz o item ocupar o espaço disponível

    const statusLabel = document.createElement("span");
    statusLabel.textContent = "Status:";
    statusLabel.style.margin = "0 10px"; // Espaçamento entre o texto e o seletor

    const statusSelect = document.createElement("select");
    statusSelect.classList.add("status-select");
    statusSelect.style.marginRight = "10px"; // Espaçamento entre o seletor e a lixeira

    ["Disponível", "Ocupado", "Manutenção", "Intervalo"].forEach((opcao) => {
        const option = document.createElement("option");
        option.value = opcao;
        option.textContent = opcao;
        statusSelect.appendChild(option);
    });

    statusSelect.value = statusInicial;

    // Evento para alterar a cor do item com base no status selecionado
    statusSelect.addEventListener("change", () => {
        const novaCor = colorMap[statusSelect.value];
        item.style.backgroundColor = novaCor; // Altera a cor de fundo diretamente
        console.log(`Status alterado para: ${statusSelect.value}`);
    });

    const trash = document.createElement("div");
    trash.classList.add("trash");
    trash.innerHTML = "🗑️"; // Ícone de lixeira
    trash.style.cursor = "pointer"; // Define o cursor como ponteiro
    trash.style.fontSize = "20px"; // Tamanho do ícone
    trash.addEventListener("click", () => {
        console.log("Linha removida");
        linha.remove();
    });

    // Adiciona os elementos à linha
    linha.append(item);
    linha.append(statusLabel);
    linha.append(statusSelect);
    linha.append(trash);

    return linha;
}

document.addEventListener("DOMContentLoaded", async () => {
    document.querySelectorAll(".popup").forEach((popup) => {
        const tipo = popup
            .querySelector("h2")
            .textContent.split(" ")[0]
            .toLowerCase();
        const frame = popup.querySelector(".frame");
        const btnAdicionar = popup.querySelector(".adicionar");
        const btnConfirmar = popup.querySelector(".confirmar");

        btnAdicionar.addEventListener("click", () => {
            const itens = frame.querySelectorAll(".linha");
            const numero = itens.length + 1;

            const linha = document.createElement("div");
            linha.classList.add("linha");
            linha.style.display = "flex"; // Define o layout flexível
            linha.style.alignItems = "center"; // Centraliza os itens verticalmente
            linha.style.marginBottom = "10px"; // Espaçamento entre linhas

            const item = document.createElement("div");
            item.classList.add("item", "verde");
            item.textContent = `${
                tipo.charAt(0).toUpperCase() + tipo.slice(1)
            } ${numero}`;
            item.style.padding = "10px 20px"; // Adiciona espaçamento interno
            item.style.borderRadius = "10px"; // Bordas arredondadas
            item.style.backgroundColor = "#90ee90"; // Cor verde clara
            item.style.flex = "1"; // Faz o item ocupar o espaço disponível

            const statusLabel = document.createElement("span");
            statusLabel.textContent = "Status:";
            statusLabel.style.margin = "0 10px"; // Espaçamento entre o texto e o seletor

            const statusSelect = document.createElement("select");
            statusSelect.classList.add("status-select");
            statusSelect.style.marginRight = "10px"; // Espaçamento entre o seletor e a lixeira

            ["Disponível", "Ocupado", "Manutenção", "Intervalo"].forEach(
                (opcao) => {
                    const option = document.createElement("option");
                    option.value = opcao;
                    option.textContent = opcao;
                    statusSelect.appendChild(option);
                }
            );

            statusSelect.value = "Disponível";

            // Evento para alterar a cor do item com base no status selecionado
            statusSelect.addEventListener("change", () => {
                const novaCor = colorMap[statusSelect.value];
                item.style.backgroundColor = novaCor; // Altera a cor de fundo diretamente
                console.log(`Status alterado para: ${statusSelect.value}`);
            });

            const trash = document.createElement("div");
            trash.classList.add("trash");
            trash.innerHTML = "🗑️"; // Ícone de lixeira
            trash.style.cursor = "pointer"; // Define o cursor como ponteiro
            trash.style.fontSize = "20px"; // Tamanho do ícone
            trash.addEventListener("click", () => {
                console.log("Linha removida");
                linha.remove();
            });

            // Adiciona os elementos à linha
            linha.append(item);
            linha.append(statusLabel);
            linha.append(statusSelect);
            linha.append(trash);

            // Adiciona a linha ao frame
            frame.append(linha);

            console.log("Linha adicionada:", linha);
        });

        btnConfirmar.addEventListener("click", () => {
            popup.parentElement.style.display = "none";
        });
    });

    // Chama a função para buscar os dados ao carregar a página
    await buscarPostos();
});
