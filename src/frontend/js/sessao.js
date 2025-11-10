// navbar
const menubtn = document.getElementById("menubtn");
function abrirMenu() {
    const dropcnt = document.getElementById("dropcnt");
    dropcnt.classList.toggle("d-none");
}

// formata segundos em horas, minutos e segundos
function formataSegundos(sec) {
    if (typeof sec !== "number" || isNaN(sec)) return "00:00";
    const horas = Math.floor(sec / 3600);
    const minutos = Math.floor((sec % 3600) / 60);
    const segundos = sec % 60;

    if (horas > 0) {
        // Formato H:MM:SS
        return `${horas}:${minutos.toString().padStart(2, "0")}:${segundos
            .toString()
            .padStart(2, "0")}`;
    } else {
        // Formato MM:SS
        return `${minutos.toString().padStart(2, "0")}:${segundos
            .toString()
            .padStart(2, "0")}`;
    }
}

// --- Sincroniza o timer com o servidor ---
async function syncTimerToServer(tid) {
    const state = window.__timers__?.[tid];
    if (!state || !state.serverId) return;

    try {
        await fetch(`/api/atendimentos/${state.serverId}/timer`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tempoRestante: state.tempo,
                em_andamento: !state.pausado,
            }),
        });
    } catch (err) {
        console.warn("Erro ao sincronizar timer:", err);
    }
}

// Timer
// manter múltiplos timers por terapeuta
let selectedTid = null; // id ou nome do terapeuta selecionado para controlar pelo timer central
if (!window.__timers__) window.__timers__ = {};

const timerDisplay = document.getElementById("timer");
const btnIniciar = document.getElementById("btnIniciar");
const btnPausar = document.getElementById("btnPausar");
const btnReiniciar = document.getElementById("btnReiniciar");

// Carrega timers do banco
async function loadTimersFromDB() {
    try {
        const API_URL = window.location.origin + "/api/atendimentos/hoje";

        const res = await fetch(API_URL, {
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Erro ao carregar timers do banco");

        const atendimentos = await res.json();
        console.log("🕒 Timers sincronizados com o banco:", atendimentos);

        if (!window.__timers__) window.__timers__ = {};

        atendimentos.forEach((a) => {
            if (!a.colaborador_id) return;

            // Ignora atendimentos já encerrados
            if (a.tempoRestante <= 0 || a.encerrado || a.em_andamento === false)
                return;

            const tid = String(a.colaborador_id);

            // Atualiza ou cria o timer local
            if (window.__timers__[tid]) {
                const state = window.__timers__[tid];
                state.serverId = a._id;
                state.nome_colaborador =
                    a.nome_colaborador ||
                    state.nome_colaborador ||
                    "Desconhecido";

                if (state.pausado) {
                    state.tempo = a.tempoRestante ?? state.tempo ?? 600;
                }

                if (a.em_andamento && state.pausado) {
                    console.log(
                        `▶ Retomando timer de ${state.nome_colaborador}`
                    );
                    state.pausado = false;
                    iniciarTimer(tid);
                }
            } else {
                // Novo timer
                window.__timers__[tid] = {
                    tempo: a.tempoRestante ?? 600,
                    pausado: !a.em_andamento,
                    interval: null,
                    serverId: a._id,
                    nome_colaborador: a.nome_colaborador || "Desconhecido",
                    colaborador_id: a.colaborador_id,
                    encerrado: false,
                };

                if (a.em_andamento) {
                    console.log(
                        `▶ Iniciando timer de ${
                            a.nome_colaborador || "Desconhecido"
                        }`
                    );
                    iniciarTimer(tid);
                }
            }
        });
    } catch (err) {
        console.error("❌ Erro ao carregar timers do DB:", err);
    }
}

// carrega timers do DB ao inicializar a página e só então inicializa o display
loadTimersFromDB().then(() => {
    if (selectedTid && window.__timers__[selectedTid]) {
        atualizarDisplays(selectedTid);
    }
});

// iniciar
async function iniciarTimer() {
    if (!selectedTid) return alert("Selecione primeiro um agendamento");
    const state = window.__timers__[selectedTid];
    if (!state) return alert("Terapeuta não tem atendimento ativo");
    if (!state.pausado) return;

    // Marca como ativo
    state.pausado = false;

    // Atualiza botões na UI
    btnIniciar.classList.add("d-none");
    btnPausar.classList.remove("d-none");
    btnReiniciar.classList.remove("d-none");
    btnPausar.innerHTML = '<i class="mdi mdi-pause"></i> Pausar';
    btnPausar.classList.replace("btn-primary", "btn-warning");

    // Cria o atendimento no servidor, se ainda não existir
    if (!state.serverId) {
        try {
            const res = await fetch("/api/atendimentos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    colaborador_id: state.colaborador_id,
                    nome_colaborador: state.nome_colaborador,
                    tempoRestante: state.tempo,
                    em_andamento: true,
                }),
            });
            const novo = await res.json();
            state.serverId = novo._id;
        } catch (err) {
            console.error("Erro ao criar atendimento no servidor:", err);
        }
    }

    // Use iniciarContagem em vez da chamada recursiva
    iniciarContagem(selectedTid);

    // Sincroniza em segundo plano
    await syncTimerToServer(selectedTid);
    carregarTerapeutas();
    atualizarTimersModal();
}

// Função Pausar/Continuar
async function pausarOuContinuar() {
    if (!selectedTid) return alert("Selecione um terapeuta");
    const state = window.__timers__[selectedTid];
    if (!state) return alert("Terapeuta não tem atendimento ativo");

    state.pausado = !state.pausado;

    if (state.pausado) {
        btnPausar.innerHTML = '<i class="mdi mdi-play"></i> Continuar';
        btnPausar.classList.replace("btn-warning", "btn-primary");
    } else {
        btnPausar.innerHTML = '<i class="mdi mdi-pause"></i> Pausar';
        btnPausar.classList.replace("btn-primary", "btn-warning");
    }

    await syncTimerToServer(selectedTid);
    atualizarTimersModal();
}

// Função REINICIAR
async function reiniciarTimer() {
    if (!selectedTid) return alert("Selecione um terapeuta");
    const state = window.__timers__[selectedTid];
    if (!state) return alert("Terapeuta não tem atendimento ativo");

    state.tempo = 10 * 60;
    state.pausado = true;

    atualizarDisplays(selectedTid);
    atualizarTimersModal();

    btnIniciar.classList.remove("d-none");
    btnPausar.classList.add("d-none");
    btnReiniciar.classList.add("d-none");

    await syncTimerToServer(selectedTid);
}

// Botões de adicionar tempo
// Seleciona os botões
document.addEventListener("DOMContentLoaded", () => {
    const btnAdicionar1 = document.getElementById("Adicionar1min");
    const btnAdicionar5 = document.getElementById("Adicionar5min");
    const btnAdicionar10 = document.getElementById("Adicionar10min");

    btnAdicionar1?.addEventListener("click", () => adicionarTempo(60));
    btnAdicionar5?.addEventListener("click", () => adicionarTempo(5 * 60));
    btnAdicionar10?.addEventListener("click", () => adicionarTempo(10 * 60));
    const id = localStorage.getItem("userId")

    const token = localStorage.getItem("token");
    if (!token) {
        // sem token: volta pra login
        window.location.href = "/";
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
});

// Funções para adicionar tempo
async function adicionarTempo(segundos) {
    if (!selectedTid) {
        alert("Selecione um terapeuta primeiro");
        return;
    }

    const state = window.__timers__[selectedTid];
    if (!state) return alert("Terapeuta não tem atendimento ativo");

    state.tempo += segundos;

    atualizarDisplays(selectedTid);
    atualizarTimersModal();
    await syncTimerToServer(selectedTid);
}

// Função para abrir/fechar o pop-up de terapeutas
function popterapeuta() {
    document.getElementById("poptera").classList.toggle("d-none");
}

// função para buscar e renderizar no modal os timers ativos
async function carregarTerapeutas() {
    const container = document.getElementById("listaTerapeutas");
    container.innerHTML = "Carregando...";

    // sincronização com o servidor antes de carregar
    await loadTimersFromDB();

    try {
        const res = await fetch("/api/terapeutas");
        if (!res.ok) throw new Error("Falha ao carregar terapeutas");
        const terapeutas = await res.json();

        // MUDANÇA AQUI: Buscar TODOS os atendimentos e filtrar os não encerrados
        const resAtendimentos = await fetch("/api/atendimentos");
        const todosAtendimentos = resAtendimentos.ok
            ? await resAtendimentos.json()
            : [];

        // Filtra apenas atendimentos NÃO ENCERRADOS do dia de hoje
        const hoje = new Date().toISOString().split("T")[0];
        const atendimentosNaoEncerrados = todosAtendimentos.filter(
            (a) =>
                !a.encerrado &&
                a.inicio_atendimento &&
                a.inicio_atendimento.includes(hoje)
        );

        container.innerHTML = "";

        terapeutas.forEach((t) => {
            const tid = String(t._id);

            //  Verificar se este terapeuta tem atendimento NÃO ENCERRADO
            const atendimentoNaoEncerrado = atendimentosNaoEncerrados.find(
                (a) => String(a.colaborador_id) === tid
            );

            let state = window.__timers__[tid];

            //  Se existe atendimento não encerrado, SEMPRE sincroniza o tempo
            if (atendimentoNaoEncerrado) {
                if (!state) {
                    state = {
                        tempo: atendimentoNaoEncerrado.tempoRestante ?? 600,
                        pausado: !atendimentoNaoEncerrado.em_andamento,
                        interval: null,
                        serverId: atendimentoNaoEncerrado._id,
                        nome_colaborador: t.nome_colaborador,
                        colaborador_id: t._id,
                    };
                    window.__timers__[tid] = state;
                } else {
                    // GARANTE que o tempo está sincronizado com o servidor
                    state.tempo =
                        atendimentoNaoEncerrado.tempoRestante ?? state.tempo;
                    state.pausado = !atendimentoNaoEncerrado.em_andamento;
                    state.serverId = atendimentoNaoEncerrado._id;
                }
            }

            //Só mostra "Sem atendimento" se realmente não tiver state
            if (!state) {
                const card = document.createElement("div");
                card.className =
                    "card-terapeuta d-flex align-items-center gap-2 border border-2 rounded-3 bg-light-subtle p-2 mb-3";

                const unidades =
                    t.unidades_trabalha && t.unidades_trabalha.length > 0
                        ? t.unidades_trabalha.join(", ") + "."
                        : "Não informada.";

                card.innerHTML = `
                    <div class="d-flex align-items-center flex-grow-1 gap-2">
                        <img src="/api/colaboradores/${t._id}/imagem" class="avatar border">
                        <div class="d-flex flex-column">
                            <span class="fw-semibold text-dark">${t.nome_colaborador}</span>
                            <small class="text-muted mb-0">Unidade: ${unidades}</small>
                            <small class="text-muted">Tipo: ${t.tipo_colaborador}</small>
                        </div>
                    </div>
                    <div class="text-end flex-shrink-0">
                        <div class="fw-semibold text-secondary small">Status:</div>
                        <div class="fw-bold text-muted">Sem atendimento</div>
                        <button class="btn btn-outline-secondary btn-sm mt-2 px-3" disabled>Selecionar</button>
                    </div>
                `;

                container.appendChild(card);
                return;
            }

            // Terapeuta COM atendimento (mesmo pausado) - USA O TEMPO SINCORNIZADO DO SERVIDOR
            const card = document.createElement("div");
            card.className =
                "card-terapeuta d-flex align-items-center gap-2 border border-2 rounded-3 bg-light-subtle p-2 mb-3";

            const unidades =
                t.unidades_trabalha && t.unidades_trabalha.length > 0
                    ? t.unidades_trabalha.join(", ") + "."
                    : "Não informada.";

            card.innerHTML = `
    <div class="d-flex align-items-center flex-grow-1 gap-2">
        <img src="/api/colaboradores/${t._id}/imagem" class="avatar border">
        <div class="d-flex flex-column">
            <span class="fw-semibold text-dark">${t.nome_colaborador}</span>
            <small class="text-muted mb-0">Unidade: ${unidades}</small>
            <small class="text-muted">Tipo: ${t.tipo_colaborador}</small>
        </div>
    </div>
    <div class="text-end flex-shrink-0">
        <div class="fw-semibold text-secondary small">Timer:</div>
        <div class="fw-bold fs-5 ${
            state.pausado ? "text-secondary" : "text-success"
        }" id="timer-display-${tid}">
            ${formataSegundos(state.tempo)}
        </div>
        <div class="small ${state.pausado ? "text-warning" : "text-success"}">
            ${state.pausado ? "Pausado" : "Em andamento"}
        </div>
        <button class="btn btn-success btn-sm mt-2 px-3" id="select-${tid}">Selecionar</button>
    </div>
`;

            container.appendChild(card);

            document
                .getElementById(`select-${tid}`)
                .addEventListener("click", () => {
                    selectedTid = tid;
                    const state = window.__timers__[tid];

                    atualizarDisplays(tid);
                    atualizarTimersModal();

                    if (state.pausado) {
                        btnIniciar.classList.remove("d-none");
                        btnPausar.classList.add("d-none");
                        btnPausar.textContent = "Pausar";
                        btnPausar.classList.replace(
                            "btn-warning",
                            "btn-primary"
                        );
                    } else {
                        btnIniciar.classList.add("d-none");
                        btnPausar.classList.remove("d-none");
                        btnPausar.textContent = "Pausar";
                        btnPausar.classList.replace(
                            "btn-primary",
                            "btn-warning"
                        );
                    }
                    btnReiniciar.classList.remove("d-none");

                    const modalEl = document.getElementById("popupTerapeuta");
                    bootstrap.Modal.getInstance(modalEl)?.hide();
                });
        });

        atualizarTimersModal();
    } catch (e) {
        console.error(e);
        container.innerHTML = "Erro ao carregar terapeutas";
    }
}

// ATUALIZAR DISPLAYS
function atualizarDisplays(tid) {
    const state = window.__timers__[tid];
    if (!state) return;

    // Atualiza o display principal (mantém estilo original)
    if (selectedTid === tid) {
        const timerDisplay = document.getElementById("timer");
        if (timerDisplay) {
            timerDisplay.textContent = formataSegundos(state.tempo);
        }
    }

    // Atualiza o display no modal (mantém estilo original)
    const displayModal = document.getElementById(`timer-display-${tid}`);
    if (displayModal) {
        displayModal.textContent = formataSegundos(state.tempo);
        displayModal.className = `fw-bold fs-5 ${
            state.pausado ? "text-secondary" : "text-success"
        }`;
    }
}

// Atualiza todos os timers que aparecem dentro do modal de terapeutas
function atualizarTimersModal() {
    if (!window.__timers__) return;

    Object.keys(window.__timers__).forEach((tid) => {
        const state = window.__timers__[tid];
        if (!state) return;

        // Seleciona o display do modal
        const display = document.getElementById(`timer-display-${tid}`);
        if (!display) return; // elemento ainda não existe, ignora

        // Atualiza o tempo formatado
        display.textContent = formataSegundos(state.tempo);

        // Remove classes antigas de cor
        display.classList.remove("text-secondary", "text-success");

        // Adiciona a classe correta
        display.classList.add(
            state.pausado ? "text-secondary" : "text-success"
        );

        // Garante que as classes essenciais de estilo não sejam removidas
        if (!display.classList.contains("fw-bold"))
            display.classList.add("fw-bold");
        if (!display.classList.contains("fs-5")) display.classList.add("fs-5");
    });
}

// Atualização automática global + sincronização periódica
let lastSync = Date.now();
setInterval(async () => {
    if (!window.__timers__) return;

    const modalAbertoTerapeuta = document
        .getElementById("popupTerapeuta")
        ?.classList.contains("show");
    const agora = Date.now();

    Object.keys(window.__timers__).forEach((tid) => {
        const state = window.__timers__[tid];
        if (!state) return;

        // Decrementa tempo se não estiver pausado
        if (!state.pausado) {
            state.tempo = Math.max(0, state.tempo - 1);
            atualizarDisplays(tid);

            if (
                state.tempo === 0 &&
                !state.encerrado &&
                !state.pausado &&
                state.serverId &&
                state.tempoAnterior > 0 // garante que ele estava rodando, não recém-carregado
            ) {
                state.encerrado = true;
                window.sessaoEncerrarId = state.serverId;

                const encerrarModalEl = document.getElementById(
                    "encerrarSessaoModal"
                );
                if (encerrarModalEl) {
                    const encerrarModal = new bootstrap.Modal(encerrarModalEl);
                    encerrarModal.show();
                }

                if (selectedTid === tid) {
                    btnIniciar.classList.remove("d-none");
                    btnPausar.classList.add("d-none");
                    btnReiniciar.classList.add("d-none");
                }
            }

            // guarda o valor anterior para próxima iteração
            state.tempoAnterior = state.tempo;
        }

        // Sincroniza com servidor a cada segundo
        if (state.serverId && !state.pausado) {
            syncTimerToServer(tid);
        }
    });

    // Atualiza modal de terapeutas se aberto
    console.log("AAAA");
    if (modalAbertoTerapeuta) {
        await loadTimersFromDB();
        atualizarTimersModal();
    }
}, 1000);

// chama quando abrir o modal - AGORA FORÇA sincronização com o servidor
document
    .getElementById("popupTerapeuta")
    ?.addEventListener("show.bs.modal", () => {
        // FORÇA sincronização com o banco antes de carregar
        setTimeout(() => {
            loadTimersFromDB().then(() => {
                carregarTerapeutas();
            });
        }, 100);
    });

// se o evento do Bootstrap não funcionar, chama ao clicar no botão que abre o modal
const btnAbrirTerapeuta = document.querySelector(
    '[data-bs-target="#popupTerapeuta"]'
);
if (btnAbrirTerapeuta) {
    btnAbrirTerapeuta.addEventListener("click", () => {
        setTimeout(() => {
            loadTimersFromDB().then(() => {
                carregarTerapeutas();
            });
        }, 100);
    });
}

// id
const perfis = localStorage.getItem("perfis_usuario"); // ex: "Master" ou "Terapeuta"
const tipoUser = localStorage.getItem("tipoUser"); // ex: "admin"

// Mostra botão de abrir modal SelecionarTerapeuta só se for admin
document.addEventListener("DOMContentLoaded", () => {
    const btnAbrirModal = document.getElementById("btnAbrirModal");
    if (tipoUser === "admin" && btnAbrirModal) {
        btnAbrirModal.classList.remove("d-none");
    }

    // carrega timers do banco uma vez na inicialização
    loadTimersFromDB().then(() => {
        carregarAgendamentos();
        carregarTerapeutas();
    });
});

// Função para carregar agendamentos do dia
async function carregarAgendamentos() {
    const id = localStorage.getItem("userId");
    if (!id) return alert("ID do usuário não encontrado!");

    try {
        const query = `userId=${id}&perfis_usuario=${encodeURIComponent(
            perfis
        )}`;
        const resposta = await fetch(`/api/agendamentos?${query}`);
        const agendamentos = await resposta.json();

        const container = document.getElementById("agendamentos");
        container.innerHTML = "";

        if (!Array.isArray(agendamentos) || !agendamentos.length) {
            container.innerHTML = `<p class="text-center mt-3 text-muted">Nenhum agendamento encontrado para hoje.</p>`;
            return;
        }

        // Ordena do mais cedo para o mais tarde
        agendamentos.sort(
            (a, b) =>
                new Date(a.inicio_atendimento) - new Date(b.inicio_atendimento)
        );
        agendamentos.sort((a, b) => {
            if (a.encerrado !== b.encerrado) {
                return a.encerrado ? 1 : -1;
            }
            return (
                new Date(a.inicio_atendimento) - new Date(b.inicio_atendimento)
            );
        });

        agendamentos.forEach((a) => {
            const inicioISO = a.inicio_atendimento;
            const fimISO = a.fim_atendimento;
            const horaFormatada = inicioISO.slice(11, 16);
            const tempoSegundos = Math.round(
                (new Date(fimISO) - new Date(inicioISO)) / 1000
            );

            const bloco = document.createElement("div");
            bloco.classList.add(
                "card",
                "card-agendamento",
                "p-3",
                "mb-2",
                "shadow-sm"
            );
            bloco.dataset.serverId = a._id;
            bloco.style.backgroundColor = a.encerrado ? "#d4edda" : "#ffffff";

            // Botão Selecionar só aparece se a sessão NÃO estiver encerrada
            const btnSelecionarHTML = !a.encerrado
                ? `
                <button class="btn btn-success btn-sm" 
                    onclick="selecionarAgendamento(
                        '${a._id}', 
                        ${tempoSegundos}, 
                        '${a.colaborador}', 
                        '${a.colaborador_id || ""}'
                    )">
                    Selecionar
                </button>`
                : "";

            bloco.innerHTML = `
<div class="d-flex justify-content-between align-items-start">
    <div class="text-start">
        <span class="fw-semibold d-block">👤${a.colaborador}</span>
        <small class="text-muted d-block">⏰Início: ${horaFormatada}</small>
        <small class="text-muted d-block">Duração: ${Math.round(
            tempoSegundos / 60
        )} min</small>
    </div>
    <div class="ms-3">
        ${btnSelecionarHTML}
    </div>
</div>
<div id="timer-${a._id}" class="fs-5 fw-bold mt-2 text-success"></div>
`;

            // Se a sessão estiver encerrada, adiciona badge "Concluída"
            if (a.encerrado) {
                const status = document.createElement("span");
                status.className = "badge bg-success mt-2";
                status.textContent = "Concluída";
                bloco.appendChild(status);
            }

            container.appendChild(bloco);
        });
    } catch (err) {
        console.error("Erro ao carregar agendamentos:", err);
        const container = document.getElementById("agendamentos");
        if (container)
            container.innerHTML = `<p class="text-center text-danger small">Erro ao carregar agendamentos do dia.</p>`;
    }
}

// Função chamada ao clicar em "Selecionar"
function selecionarAgendamento(
    id,
    tempoSegundos,
    colaboradorNome = null,
    colaboradorId = null
) {
    let tid = colaboradorId ? String(colaboradorId) : `temp-${Date.now()}`;
    if (!window.__timers__) window.__timers__ = {};

    // Se timer já existe, atualiza apenas o tempo e serverId
    if (window.__timers__[tid]) {
        const state = window.__timers__[tid];
        state.tempo = tempoSegundos;
        state.pausado = true; // iniciar pausado
        state.serverId = id;
        state.nome_colaborador =
            colaboradorNome || state.nome_colaborador || "Desconhecido";

        //  reset de flag de encerramento
        state.encerrado = false;
        state.em_andamento = true;
    } else {
        // Cria novo timer
        window.__timers__[tid] = {
            tempo: tempoSegundos,
            pausado: true,
            interval: null,
            serverId: id,
            nome_colaborador: colaboradorNome || "Desconhecido",
            colaborador_id: colaboradorId || null,
            encerrado: false,
            em_andamento: true,
        };
    }

    // Define o selecionado
    selectedTid = tid;

    // Atualiza displays
    atualizarDisplays(selectedTid);
    atualizarTimersModal();

    const state = window.__timers__[tid];

    // Botões centrais
    if (state.pausado) {
        btnIniciar.classList.remove("d-none");
        btnPausar.classList.add("d-none");
        btnReiniciar.classList.add("d-none");
    } else {
        btnIniciar.classList.add("d-none");
        btnPausar.classList.remove("d-none");
        btnReiniciar.classList.remove("d-none");
    }

    // Atualiza display central
    const timerDisplay = document.getElementById("timer");
    if (timerDisplay) timerDisplay.textContent = formataSegundos(state.tempo);

    // Sincroniza com o servidor
    syncTimerToServer(tid);
}

document.addEventListener("DOMContentLoaded", carregarAgendamentos);

// Final de sessão abre modal de encerramento
document
    .getElementById("confirmarEncerramento")
    .addEventListener("click", async () => {
        const encerrarModalEl = document.getElementById("encerrarSessaoModal");
        const encerrarModal = bootstrap.Modal.getInstance(encerrarModalEl);
        encerrarModal.hide();

        const atendimentoEl = document.querySelector(
            `[data-server-id="${window.sessaoEncerrarId}"]`
        );
        if (atendimentoEl) {
            atendimentoEl.style.backgroundColor = "#d4edda";
            const btnSelecionar = atendimentoEl.querySelector("button");
            if (btnSelecionar) btnSelecionar.style.display = "none";
        }

        const fbModalEl = document.getElementById("fbModal");
        const fbModal = new bootstrap.Modal(fbModalEl);
        fbModal.show();

        const fbNomeEl = document.getElementById("fb-nomeTerapeuta");
        const fbHorarioEl = document.getElementById("fb-horarioSessao");

        const state = Object.values(window.__timers__ || {}).find(
            (t) => t.serverId === window.sessaoEncerrarId
        );

        if (state && state.nome_colaborador) {
            fbNomeEl.textContent = `👤 ${state.nome_colaborador}`;
        } else {
            fbNomeEl.textContent = "👤 Carregando...";
            try {
                const resCol = await fetch(
                    `/api/colaboradores/${state.colaborador_id}`
                );
                const colaborador = await resCol.json();
                fbNomeEl.textContent = `👤 ${
                    colaborador.nome_colaborador || "Desconhecido"
                }`;
            } catch {
                fbNomeEl.textContent = "👤 Desconhecido";
            }
        }

        // Horário real do encerramento
        const agora = new Date();
        const horas = String(agora.getHours()).padStart(2, "0");
        const minutos = String(agora.getMinutes()).padStart(2, "0");
        const segundos = String(agora.getSeconds()).padStart(2, "0");

        fbHorarioEl.textContent = `⏰ ${horas}:${minutos}:${segundos}`;
    });

// Salvar feedback e encerrar sessão
document.getElementById("fb-salvar").addEventListener("click", async () => {
    const texto = document.getElementById("fb-texto").value.trim();
    if (!texto) {
        alert("Por favor, escreva seu feedback antes de salvar.");
        return;
    }

    const sessaoId = window.sessaoEncerrarId;
    if (!sessaoId) {
        alert("Não foi possível identificar a sessão.");
        return;
    }

    try {
        // Salva o feedback
        const res = await fetch(`/api/atendimentos/${sessaoId}/feedback`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ observacao_cliente: texto }),
        });

        if (!res.ok) {
            const err = await res.json();
            alert(
                "Erro ao salvar feedback: " + (err.message || res.statusText)
            );
            return;
        }

        alert("Feedback salvo com sucesso");

        // Reset da página e marca como concluído
        const tid = selectedTid;
        const state = window.__timers__[tid];
        if (state) {
            // Reseta timer para 10 minutos
            state.tempo = 10 * 60;
            state.pausado = true;
            state.encerrado = true;
            state.em_andamento = false;

            // Atualiza no servidor: marca como encerrado
            if (state.serverId) {
                try {
                    await fetch(
                        `/api/atendimentos/${state.serverId}/encerrar`,
                        {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                em_andamento: false,
                                tempoRestante: 0,
                                encerrado: true,
                                fim_real: new Date(),
                            }),
                        }
                    );
                } catch (err) {
                    console.error(
                        "Erro ao marcar atendimento como encerrado no servidor:",
                        err
                    );
                }
            }

            await syncTimerToServer(tid);
            atualizarDisplays(tid);
            atualizarTimersModal();

            // Atualiza o card visual da sessão iniciada
            const bloco = document.querySelector(
                `[data-server-id="${state.serverId}"]`
            );
            if (bloco) {
                // Remove badge antiga, se existir
                const badgeExistente = bloco.querySelector(".badge");
                if (badgeExistente) bloco.removeChild(badgeExistente);

                // Atualiza status
                const status = document.createElement("span");
                status.className = "badge bg-success mt-2";
                status.textContent = "Concluída";
                bloco.appendChild(status);

                // Esconde botão Selecionar
                const btnSelecionar = bloco.querySelector("button");
                if (btnSelecionar) btnSelecionar.style.display = "none";
            }
        }

        // Fecha modal
        const fbModalEl = document.getElementById("fbModal");
        const fbModal = bootstrap.Modal.getInstance(fbModalEl);
        fbModal.hide();

        // Limpa textarea
        document.getElementById("fb-texto").value = "";
    } catch (e) {
        console.error("Erro ao salvar feedback:", e);
        alert("Ocorreu um erro ao salvar o feedback.");
    }
});

document.getElementById("sairbutton").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
});
