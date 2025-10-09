let dataAtual = new Date(); // data de hoje.
let eventos = []; // Array armazena todos os agendamentos.
let celulaSelecionada = null;
let eventoEmEdicao = null;

// Configurações de Horário
const HORA_INICIO = 9;
const HORA_FIM = 23;
const INTERVALO_MINUTOS = 60;

// Elementos do DOM
const tabelaCalendario = document.getElementById("tabela-calendario");
const modal = document.getElementById("modal-agendamento");
const fecharBtn = document.querySelector(".fechar-btn");
const formAgendamento = document.getElementById("form-agendamento");
const horarioSelecionadoDisplay = document.getElementById(
    "horario-selecionado"
);
const btnSalvar = document.getElementById("btn-salvar");
const btnExcluir = document.getElementById("btn-excluir");

// ==========================================================
// 2. Funções de Utilidade de Data
// ==========================================================

/**
 * Retorna a data de início da semana (domingo) baseada na data fornecida.
 * @param {Date} data - A data de referência.
 * @returns {Date} - O primeiro dia da semana (Domingo, 00:00:00).
 */
function getInicioSemana(data) {
    const dia = data.getDay(); // 0 (Domingo) a 6 (Sábado)
    const inicio = new Date(data);
    inicio.setDate(data.getDate() - dia);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
}

/**
 * Formata um objeto Date para uma string 'DD/MM'.
 */
function formatarData(data) {
    const dia = String(data.getDate()).padStart(2, "0"); // padStart Garante 2 digitos no mes e dia
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    return `${dia}/${mes}`;
}

/**
 * Gera a tabela do calendário para a semana atual.
 */
function renderizarCalendario() {
    const inicioSemana = getInicioSemana(dataAtual);
    const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    let datas = [];

    // Calcular Datas da Semana
    for (let i = 0; i < 7; i++) {
        const data = new Date(inicioSemana);
        data.setDate(inicioSemana.getDate() + i);
        datas.push(data);
    }

    //  Gera o Cabeçalho (Thead)
    let theadHTML = "<tr><th>Horário</th>";
    datas.forEach((data, index) => {
        const diaNome = diasDaSemana[index];
        const dataFormatada = formatarData(data);
        theadHTML += `<th>${diaNome}<br>(${dataFormatada})</th>`;
    });
    theadHTML += "</tr>";
    tabelaCalendario.querySelector("thead").innerHTML = theadHTML;

    // Gerar o Corpo (Tbody) com os Horários
    let tbodyHTML = "";
    const hoje = new Date();

    for (let h = HORA_INICIO; h < HORA_FIM; h++) {
        for (let m = 0; m < 60; m += INTERVALO_MINUTOS) {
            const horario = `${String(h).padStart(2, "0")}:${String(m).padStart(
                2,
                "0"
            )}`;

            let linha = `<tr><td>${horario}</td>`;

            datas.forEach((data) => {
                // Cria a data e hora local exata
                const dataHoraLocal = new Date(
                    data.getFullYear(),
                    data.getMonth(),
                    data.getDate(),
                    h,
                    m
                ); // CORREÇÃO: Geramos uma string de chave que IGNORA o fuso horário. // O formato será 'AAAA-MM-DDTHH:MM', mas sem o 'Z' de UTC, // e sem deixar o navegador ajustar o horário.
                const ano = dataHoraLocal.getFullYear();
                const mes = String(dataHoraLocal.getMonth() + 1).padStart(
                    2,
                    "0"
                );
                const dia = String(dataHoraLocal.getDate()).padStart(2, "0");
                const hora = String(dataHoraLocal.getHours()).padStart(2, "0");
                const minuto = String(dataHoraLocal.getMinutes()).padStart(
                    2,
                    "0"
                );
                const dataKey = `${ano}-${mes}-${dia}T${hora}:${minuto}`; // Novo formato
                let classeHoje =
                    data.toDateString() === hoje.toDateString() ? "hoje" : "";
                linha += `<td class="horario-celula ${classeHoje}" data-time="${dataKey}"></td>`;
            });

            linha += "</tr>";
            tbodyHTML += linha;
        }
    }
    tabelaCalendario.querySelector("tbody").innerHTML = tbodyHTML;

    adicionarListenersCelulas();
    exibirEventos();
}

// ==========================================================
function exibirEventos() {
    document.querySelectorAll(".evento").forEach((el) => el.remove());

    eventos.forEach((evento, index) => {
        const celula = document.querySelector(
            `[data-time="${evento.dataHora}"]`
        );

        if (celula && !celula.querySelector(".evento")) {
            const divEvento = document.createElement("div");
            divEvento.classList.add("evento");
            // Adiciona o ID/Index do evento para facilitar a edição/exclusão
            divEvento.dataset.eventoIndex = index;
            divEvento.title = `${evento.funcionario} - ${
                evento.tipoTrabalho
            }\nEquipamentos: ${evento.equipamentoss || "Nenhum"}`;

            divEvento.textContent = `${evento.funcionario.split(" ")[0]} / ${
                evento.tipoTrabalho.split(" ")[0]
            }`;

            celula.appendChild(divEvento);
        }
    });
}

function excluirEvento(dataHora) {
    const indexParaExcluir = eventos.findIndex((e) => e.dataHora === dataHora);
    if (indexParaExcluir > -1) {
        eventos.splice(indexParaExcluir, 1);
        exibirEventos(); // Redesenha os eventos
    }
}
// ==========================================================
function adicionarListenersCelulas() {
    document.querySelectorAll(".horario-celula").forEach((celula) => {
        celula.addEventListener("click", (e) => {
            const dataHoraKey = celula.dataset.time;
            const eventoDiv = e.target.closest(".evento");

            if (eventoDiv) {
                // Modo EDIÇÃO: Se clicou em um evento
                const index = parseInt(eventoDiv.dataset.eventoIndex);
                abrirModalEdicao(eventos[index]);
            } else {
                // Modo CRIAÇÃO: Se clicou em uma célula vazia
                celulaSelecionada = celula;
                abrirModalCriacao(dataHoraKey);
            }
        });
    });
}

function abrirModalCriacao(dataHoraKey) {
    eventoEmEdicao = null;
    formAgendamento.reset();

    // Configura o modal para criação
    document.getElementById("horario-selecionado").textContent = new Date(
        dataHoraKey
    ).toLocaleString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

    btnSalvar.textContent = "Salvar Agendamento";
    btnExcluir.style.display = "none"; // Esconde o botão de excluir
    modal.style.display = "block";
}

/**
 * Prepara e abre o modal para a edição de um agendamento existente.
 * @param {object} evento - O objeto evento a ser editado.
 */
function abrirModalEdicao(evento) {
    eventoEmEdicao = evento;
    celulaSelecionada = document.querySelector(
        `[data-time="${evento.dataHora}"]`
    );

    // Preenche o formulário com os dados existentes
    document.getElementById("funcionario").value = evento.funcionario;
    document.getElementById("tipo-trabalho").value = evento.tipoTrabalho;
    // document.getElementById('equipamentos').value = evento.equipamentos || '';
    document.getElementById("equipamentoss").value = evento.equipamentoss;

    // Configura o modal para edição
    document.getElementById("horario-selecionado").textContent = new Date(
        evento.dataHora
    ).toLocaleString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });

    btnSalvar.textContent = "Salvar Alterações";
    btnExcluir.style.display = "block"; // Mostra o botão de excluir
    modal.style.display = "block";
}

// Listener para o formulário (Salvar/Editar)
formAgendamento.addEventListener("submit", function (e) {
    e.preventDefault();

    const dados = {
        dataHora: celulaSelecionada.dataset.time,
        funcionario: document.getElementById("funcionario").value,
        tipoTrabalho: document.getElementById("tipo-trabalho").value,
        equipamentoss: document.getElementById("equipamentoss").value || null,
    };

    if (eventoEmEdicao) {
        // Modo Edição: Atualiza os dados no objeto original
        const index = eventos.findIndex(
            (e) => e.dataHora === eventoEmEdicao.dataHora
        );
        if (index > -1) {
            // Se a data/hora não foi alterada (mantendo o evento no mesmo lugar)
            eventos[index] = { ...eventos[index], ...dados };
        }
    } else {
        eventos.push(dados);
    }

    // Fecha e Limpa
    modal.style.display = "none";
    formAgendamento.reset();
    celulaSelecionada = null;
    eventoEmEdicao = null;
    exibirEventos(); // Redesenha a tela
});

// Listener para o botão Excluir
btnExcluir.addEventListener("click", () => {
    if (
        eventoEmEdicao &&
        confirm("Tem certeza que deseja excluir esta reserva?")
    ) {
        excluirEvento(eventoEmEdicao.dataHora);
        modal.style.display = "none";
        celulaSelecionada = null;
        eventoEmEdicao = null;
    }
});

// Função para voltar para a semana atual
document.getElementById("btn-hoje").addEventListener("click", () => {
    dataAtual = new Date(); // Reseta para a data de hoje
    renderizarCalendario();
});

// Listener para fechar o modal
fecharBtn.onclick = function () {
    modal.style.display = "none";
    celulaSelecionada = null;
    eventoEmEdicao = null;
    formAgendamento.reset();
};

// Fechar o modal ao clicar fora dele
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
        celulaSelecionada = null;
        eventoEmEdicao = null;
        formAgendamento.reset();
    }
};

// Navegação Semanal
document.getElementById("btn-anterior").addEventListener("click", () => {
    dataAtual.setDate(dataAtual.getDate() - 7);
    renderizarCalendario();
});

document.getElementById("btn-proximo").addEventListener("click", () => {
    dataAtual.setDate(dataAtual.getDate() + 7);
    renderizarCalendario();
});

// Inicialização
document.addEventListener("DOMContentLoaded", renderizarCalendario);

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
