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
                    `Erro ${response.status}: ${
                        errorData.erro || errorData.error
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
// LISTAR PONTUAÇÃO DOS TERAPEUTAS
// ==================================
document.addEventListener("DOMContentLoaded", async () => {
    const tabelaPontuacao = document.querySelector(
        '.card:has(#titulo-terapeutas) table'
    );

    try {
        const response = await fetch("/api/colaboradores/pontuacao");
        if (!response.ok) throw new Error("Erro ao buscar pontuação");

        const terapeutas = await response.json();

        const linhas = terapeutas
            .map(
                (t) => `
            <tr>
                <td>${t.nome_colaborador || "Sem nome"}</td>
                <td>${t.pontos ?? 0}</td>
            </tr>`
            )
            .join("");

        tabelaPontuacao.innerHTML += `<tbody>${linhas}</tbody>`;
    } catch (error) {
        console.error("Erro ao carregar pontuação:", error);
        tabelaPontuacao.innerHTML += `
            <tbody>
                <tr>
                    <td colspan="2" class="text-danger py-3">Erro ao carregar pontuação</td>
                </tr>
            </tbody>
        `;
    }
});
