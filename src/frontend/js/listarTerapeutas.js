async function buscarColaboradores() {
    const container = document.getElementById("container");
    if (!container) {
        console.error("Container não encontrado");
        return;
    }

    try {
        console.log("Iniciando busca de terapeutas...");
        container.innerHTML = ""; // Limpa o container antes de adicionar novos cards

        const response = await fetch("/api/listarterapeutas", {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Dados recebidos:", data);

        if (!data.terapeutas || data.terapeutas.length === 0) {
            console.log("Nenhum terapeuta encontrado");
            const mensagem = document.createElement("div");
            mensagem.className = "alert alert-info text-center";
            mensagem.textContent = "Nenhum terapeuta encontrado.";
            container.appendChild(mensagem);
            return;
        }

        if (!data.terapeutas || !Array.isArray(data.terapeutas)) {
            throw new Error("Dados de terapeutas inválidos");
        }

        const { terapeutas } = data;
        console.log("Número de terapeutas:", terapeutas.length);

        terapeutas.forEach((terapeuta) => {
            console.log("Dados do terapeuta:", terapeuta);

            // Obter a data atual no fuso horário local
            const agora = new Date();
            console.log("Hora atual local:", agora.toLocaleString("pt-BR"));

            // Converter as datas do atendimento para o fuso horário local
            const inicioAtendimento = terapeuta.inicio_atendimento
                ? new Date(terapeuta.inicio_atendimento)
                : null;
            const fimAtendimento = terapeuta.fim_atendimento
                ? new Date(terapeuta.fim_atendimento)
                : null;

            if (inicioAtendimento) {
                console.log(
                    "Início atendimento UTC:",
                    inicioAtendimento.toISOString()
                );
                console.log(
                    "Início atendimento local:",
                    inicioAtendimento.toLocaleString("pt-BR")
                );
            }
            if (fimAtendimento) {
                console.log(
                    "Fim atendimento UTC:",
                    fimAtendimento.toISOString()
                );
                console.log(
                    "Fim atendimento local:",
                    fimAtendimento.toLocaleString("pt-BR")
                );
            }

            // Define a cor e status do card
            let back;
            let statusDisplay;

            if (inicioAtendimento && fimAtendimento) {
                const sessaoComecou = agora >= inicioAtendimento;
                const sessaoTerminou = agora >= fimAtendimento;

                if (sessaoComecou && !sessaoTerminou) {
                    // Se estiver no horário da sessão
                    back = "#ff5c5c"; // vermelho
                    statusDisplay = "Em atendimento";
                } else if (!sessaoComecou) {
                    // Se a sessão ainda vai começar
                    back = "#f7ff86ff"; // amarelo
                    statusDisplay = "Próximo atendimento";
                } else {
                    // Se não tiver sessão no momento
                    back = "#aaff64ff"; // verde
                    statusDisplay = "Disponível";
                }
            } else {
                // Se não tiver nenhuma sessão agendada
                back = "#aaff64ff"; // verde
                statusDisplay = "Disponível";
            }

            // Formata as datas para exibição
            const formatarDataHora = (dataParam) => {
                if (!dataParam) return { hora: "-", data: "-" };

                // Cria uma nova data a partir do timestamp sem conversão de timezone
                const data = new Date(dataParam);
                console.log("Data do banco:", dataParam);

                // Formata a hora exatamente como está no banco
                const hora =
                    data.getUTCHours().toString().padStart(2, "0") +
                    ":" +
                    data.getUTCMinutes().toString().padStart(2, "0");

                // Formata a data para o formato brasileiro
                const dia = data.getUTCDate().toString().padStart(2, "0");
                const mes = (data.getUTCMonth() + 1)
                    .toString()
                    .padStart(2, "0");
                const ano = data.getUTCFullYear();
                const dataFormatada = `${dia}/${mes}/${ano}`;

                console.log("Hora formatada (como no banco):", hora);
                console.log("Data formatada:", dataFormatada);

                return { hora: hora - 1, data: dataFormatada };
            };

            // Formata as datas do atendimento
            const fim = formatarDataHora(terapeuta.fim_atendimento);
            const inicio = formatarDataHora(terapeuta.inicio_atendimento);

            // Cria o card
            const card = `
                <div class="cardtera row w-100 p-3 mt-3 border h-25 d-flex align-content-center"
                    style="border-radius: 30px; background: ${back}" 
                    id="cardtera-${terapeuta.colaborador_id}">
                    <div class="col-12 col-md-6 col-lg-3 d-flex align-self-center align-items-center justify-content-center h-50">
                        <img src="${terapeuta.imagem}" alt=""
                            style="border-radius: 25px; border: 1px solid black; height: 100px; width: 100px; object-fit: cover;">
                    </div>
                    <div class="col d-flex align-self-start align-items-center justify-content-center h-50 text-center gap-4">
                        <div class="w-50">
                            <p class="fs-2">${terapeuta.nome}</p>
                            <p class="fs-3">${statusDisplay}</p>
                        </div>
                        <div class="w-50">
                            <p class="fs-2">${
                                terapeuta.em_andamento
                                    ? "Finaliza:"
                                    : terapeuta["intervalo:"] ||
                                      terapeuta.intervalo
                                    ? "Retorna:"
                                    : "Próxima Sessão:"
                            }</p>
                            <p class="fs-4">${
                                fim.hora
                                    ? `${fim.hora} - ${fim.data}`
                                    : "Sem horário marcado!"
                            }</p>
                        </div>
                    </div>
                </div>
            `;

            // Adiciona o card ao main
            container.insertAdjacentHTML("beforeend", card);
        });
    } catch (error) {
        console.error("Erro ao carregar os terapeutas:", error);
        container.innerHTML = `
            <div class="alert alert-danger text-center">
                Erro ao carregar os terapeutas. Por favor, recarregue a página.
            </div>
        `;
    }
}

// Função para atualizar os dados periodicamente
async function atualizarDados() {
    try {
        await buscarColaboradores();
    } catch (error) {
        console.error("Erro na atualização automática:", error);
    }
}

// Executa quando a página carregar e configura atualização automática
document.addEventListener("DOMContentLoaded", () => {
    buscarColaboradores();
    // Atualiza a cada 30 segundos
    setInterval(atualizarDados, 120000);
});
