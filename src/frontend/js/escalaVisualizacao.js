// ===============================
// VISUALIZAR ESCALA DO TERAPEUTA
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
    const pathParts = window.location.pathname.split("/");
    const userId = pathParts[pathParts.length - 1];

    if (!userId) {
        console.error("Usuário não encontrado na URL");
        return;
    }

    const perfis = localStorage.getItem("perfis") || "";

    try {
        const query = `userId=${userId}&perfis_usuario=${encodeURIComponent(perfis)}`;
        const resposta = await fetch(`/api/agendamentos?${query}`);
        const agendamentos = await resposta.json();

        const tabela = document.getElementById("tabela-escala");

        if (!Array.isArray(agendamentos) || agendamentos.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted py-4">
                        Nenhuma sessão encontrada hoje.
                    </td>
                </tr>`;
            return;
        }

        // Ordena os agendamentos
        agendamentos.sort((a, b) =>
            new Date(a.inicio_atendimento) - new Date(b.inicio_atendimento)
        );

        tabela.innerHTML = agendamentos
            .map((a) => {
                const inicio = a.inicio_atendimento.slice(11, 16);
                const fim = a.fim_atendimento.slice(11, 16);

                const duracaoMin = Math.round(
                    (new Date(a.fim_atendimento) - new Date(a.inicio_atendimento)) / 60000
                );

                return `
                <tr>
                    <td>${a.colaborador}</td>
                    <td>${inicio} - ${fim}</td>
                    <td>${duracaoMin} min</td>
                </tr>`;
            })
            .join("");
    } catch (err) {
        console.error("Erro ao carregar escala:", err);
    }
});
