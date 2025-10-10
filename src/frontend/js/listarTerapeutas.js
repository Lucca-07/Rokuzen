async function buscarColaboradores() {
    const container = document.getElementById("container");
    const dataAgora = new Date();

    try {
        const response = await fetch("/api/listarterapeutas");
        const { terapeutas } = await response.json();

        terapeutas.forEach((terapeuta) => {
            // Determina o status da sessão
            let status;
            let back;
            if (
                terapeuta.inicio_atendimento &&
                new Date(terapeuta.inicio_atendimento) <= dataAgora &&
                new Date(terapeuta.fim_atendimento) >= dataAgora
            ) {
                status = "Em sessão";
                back = "#ff5c5c";
            } else if (
                terapeuta.inicio_atendimento &&
                new Date(terapeuta.inicio_atendimento) > dataAgora &&
                !terapeuta.intervalo
            ) {
                status = "Disponível";
                back = "#aaff64ff";
            } else {
                status = "Intervalo";
                back = "#f7ff86ff";
            }

            // Prepara horários mostrando "-" se null
            const horaFim = terapeuta.fim_atendimento_horas || "-";
            const dataFim = terapeuta.fim_atendimento_data || "-";
            const horaInicio = terapeuta.inicio_atendimento_horas || "-";
            const dataInicio = terapeuta.inicio_atendimento_data || "-";

            // Cria o card
            const card = `
                <div class="cardtera row w-100 p-3 mt-3 border h-25 d-flex align-content-center "
                     style="border-radius: 30px; animation: aparecer 0.3s ease-in forwards; background: ${back} " id="cardtera-${
                terapeuta.colaborador_id
            }">
                    <div class="col-12 col-md-6 col-lg-3 d-flex align-self-center align-items-center justify-content-center h-50">
                        <img src="/frontend/img/account-outline.svg" alt=""
                             style="border-radius: 25px; border: 1px solid black; height: 100px; width: 100px;">
                    </div>
                    <div class="col d-flex align-self-start align-items-center justify-content-center h-50 text-center gap-4">
                        <div class="w-50">
                            <p class="fs-2">${terapeuta.nome}</p>
                            <p class="fs-3">${status}</p>
                        </div>
                        <div class="w-50">
                            <p class="fs-2">${
                                status === "Disponível"
                                    ? "Próxima Sessão:"
                                    : "Finaliza:"
                            }</p>
                            <p class="fs-4">${horaFim} - ${dataFim}</p>
                        </div>
                    </div>
                </div>
            `;

            // Adiciona o card ao main
            container.insertAdjacentHTML("beforeend", card);
        });
    } catch (error) {
        console.error("Erro ao carregar os terapeutas:", error);
    }
}

// Executa quando a página carregar
window.addEventListener("DOMContentLoaded", buscarColaboradores);
