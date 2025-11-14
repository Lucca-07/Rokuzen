
document.getElementById("sairbutton").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
});

// ==================================
// CONFIGURAÇÃO DE LINKS E TOKEN
// ==================================
document.addEventListener("DOMContentLoaded", async () => {
    const pathParts = window.location.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    const token = localStorage.getItem("token");
    if (!token) {
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
    } catch (error) {
        console.error("Erro de rede:", error);
        alert("Erro de rede. Tente novamente.");
    }
});

// ==================================
// LISTAR E FILTRAR EQUIPAMENTOS POR UNIDADE
// ==================================
document.addEventListener("DOMContentLoaded", async () => {
    const tabela = document.getElementById("tabela-equipamentos");
    const unidade = localStorage.getItem("unidade");

    if (!unidade) {
        console.error("Nenhuma unidade encontrada no localStorage");
        tabela.innerHTML =
            "<tr><td colspan='2'>Unidade não definida.</td></tr>";
        return;
    }

    async function buscarEquipamentosDisponiveis() {
        try {

            const unidade = localStorage.getItem("unidade")

            console.log("Buscando equipamentos da unidade:", unidade);

            const response = await fetch("/api/equipamentos/disponiveis", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ unidade: unidade }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Erro ${response.status}: ${errorData.erro || errorData.error
                    }`
                );
            }

            const equipamentos = await response.json();
            console.log("Equipamentos recebidos:", equipamentos);
            preencherTabelaEquipamentos(equipamentos);
        } catch (error) {
            console.error("Erro ao buscar equipamentos:", error);
            document.getElementById("tabela-equipamentos").innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-danger py-4">
                        ⚠️ ${error.message}
                    </td>
                </tr>
            `;
        }
    }


    function preencherTabelaEquipamentos(equipamentos) {
        const tbody = document.getElementById("tabela-equipamentos");

        if (!equipamentos || equipamentos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-muted py-4">
                        Nenhum equipamento disponível
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = equipamentos
            .map(
                (equip) => `
            <tr>
                <td>${equip.nome_posto || "N/A"}</td>
                <td>
                    <span class="badge bg-success">Disponível</span>
                </td>
            </tr>
        `
            )
            .join("");
    }

    buscarEquipamentosDisponiveis();
});

// ==================================
// LISTAR PONTUAÇÃO DOS TERAPEUTAS POR UNIDADE
// ==================================
document.addEventListener("DOMContentLoaded", async () => {
    const unidade = localStorage.getItem("unidade");
    const tabelaPontuacao = document.querySelector(".table.table-striped.table-hover.text-center.align-middle.mb-0");

    if (!unidade) {
        console.error("Nenhuma unidade encontrada no localStorage para pontuação");
        return;
    }

    try {
        const response = await fetch("/api/colaboradores/pontuacao", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ unidade }),
        });

        if (!response.ok) {
            const erro = await response.json();
            console.error("Erro ao buscar pontuação:", erro);
            return;
        }

        const terapeutas = await response.json();
        preencherTabelaPontuacao(terapeutas);
    } catch (error) {
        console.error("Erro de rede ao buscar pontuação:", error);
    }

    function preencherTabelaPontuacao(terapeutas) {
        // Seleciona o <table> certo com base no cabeçalho "Pontuação dos Terapeutas"
        const tabela = document.querySelector("#titulo-terapeutas")
            ?.closest(".card")
            ?.querySelector("table");

        if (!tabela) {
            console.error("Tabela de pontuação não encontrada no DOM");
            return;
        }

        // Cria o corpo da tabela dinamicamente
        let tbody = tabela.querySelector("tbody");
        if (!tbody) {
            tbody = document.createElement("tbody");
            tabela.appendChild(tbody);
        }

        if (!terapeutas || terapeutas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-center text-muted py-4">
                        Nenhum terapeuta encontrado para esta unidade.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = terapeutas
            .map(
                (t) => `
                <tr>
                    <td>${t.nome_colaborador}</td>
                    <td>${t.pontos ?? 0}</td>
                </tr>
            `
            )
            .join("");
    }
});

// ==================================
// LISTAR AGENDAMENTOS
// ==================================
// ==================================
// LISTAR AGENDAMENTOS
// ==================================
document.addEventListener("DOMContentLoaded", async () => {
    const tabela = document.getElementById("tabela-agendamentos");
    if (!tabela) return;

    const id = localStorage.getItem("userId") || "";
    const perfis = localStorage.getItem("perfis_usuario") || localStorage.getItem("perfis") || "";

    tabela.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">
        <span class="spinner-border spinner-border-sm me-2"></span>Carregando...
    </td></tr>`;

    try {
        const query = `idUser=${encodeURIComponent(id)}&userId=${encodeURIComponent(id)}&perfis_usuario=${encodeURIComponent(perfis)}`;
        const res = await fetch(`/api/agendamentos?${query}`);
        if (!res.ok) throw new Error("Falha ao carregar agendamentos");

        let agendamentos = await res.json();

        // Nada vindo do servidor
        if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
            tabela.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Não há agendamentos futuros.</td></tr>`;
            return;
        }

        // ================================
        // 1) Converter datas para horário BR
        // ================================
        const toLocalBR = (dateString) => {
            if (!dateString) return null;
            const d = new Date(dateString);
            d.setHours(d.getHours() + 3);
            return d;
        };

        // ================================
        // 2) Remover atendimentos já finalizados
        // ================================
        const agora = new Date();

        agendamentos = agendamentos.filter(a => {
            const fim = toLocalBR(a.fim_atendimento);
            return fim && fim >= agora; // mantém só quem ainda não acabou
        });

        if (agendamentos.length === 0) {
            tabela.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">Não há agendamentos futuros.</td></tr>`;
            return;
        }

        // ================================
        // 3) Ordenar por horário de início
        // ================================
        agendamentos.sort((a, b) =>
            new Date(a.inicio_atendimento) - new Date(b.inicio_atendimento)
        );

        // ================================
        // 4) Montar tabela
        // ================================
        const rows = agendamentos.map(a => {
            const inicioDate = toLocalBR(a.inicio_atendimento);
            const fimDate = toLocalBR(a.fim_atendimento);

            const inicio = inicioDate
                ? inicioDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "-";

            const fim = fimDate
                ? fimDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "-";

            const data = inicioDate
                ? inicioDate.toLocaleDateString("pt-BR")
                : "-";

            const colaborador = a.colaborador || a.nome_colaborador || "Desconhecido";

            return `
            <tr>
                <td class="text-start ps-4">${colaborador}</td>
                <td>${inicio} - ${fim}</td>
                <td>${data}</td>
            </tr>`;
        }).join("");


        tabela.innerHTML = rows;
    } catch (err) {
        console.error("Erro ao carregar agendamentos:", err);
        tabela.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-4">Erro ao carregar agendamentos.</td></tr>`;
    }
});

