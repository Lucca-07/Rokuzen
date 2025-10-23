// navbar
const menubtn = document.getElementById("menubtn");
function abrirMenu() {
    const dropcnt = document.getElementById("dropcnt");
    dropcnt.classList.toggle("d-none");
}

// Timer
// manter múltiplos timers por terapeuta
let selectedTid = null; // id ou nome do terapeuta selecionado para controlar pelo timer central

const timerDisplay = document.getElementById("timer");
const btnIniciar = document.getElementById("btnIniciar");
const btnPausar = document.getElementById("btnPausar");
const btnReiniciar = document.getElementById("btnReiniciar");

function atualizarDisplay() {
    // Se não houver um terapeuta selecionado ou timer, mostra 10:00 e retorna
    if (!selectedTid || !window.__timers__ || !window.__timers__[selectedTid]) {
        document.getElementById("timer").textContent = "10:00";
        return;
    }

    // Pega os segundos restantes do timer do terapeuta selecionado
    const segundos = window.__timers__[selectedTid].tempo;

    // Atualiza o <h2> com o tempo formatado
    document.getElementById("timer").textContent = formatSeconds(segundos);
}

// carrega timers do DB ao inicializar a página e só então inicializa o display
loadTimersFromDB().then(() => {
    atualizarDisplay();
});

//  atualiza timers do servidor a cada 10s
setInterval(async () => {
    await loadTimersFromDB();
    // atualizar displays no modal se estiver aberto
    if (document.getElementById('popupTerapeuta') && document.querySelector('.modal.show')) {
        // atualiza cada display a partir de window.__timers__
        if (window.__timers__) {
            Object.keys(window.__timers__).forEach(tid => {
                const el = document.getElementById(`timer-display-${tid}`);
                if (el) el.textContent = formatSeconds(window.__timers__[tid].tempo);
            });
        }
    }
    // atualizar display central
    atualizarDisplay();
}, 10000)

// iniciar
async function iniciarTimer() {
    if (!selectedTid) return alert('Selecione primeiro um terapeuta no modal');
    const state = window.__timers__[selectedTid];
    if (!state) return;
    if (state.interval) return; // já rodando

    const circle = document.querySelector('.timer-circle');
    if (circle) circle.style.backgroundColor = '#A2C838';

    state.pausado = false;
    state.interval = setInterval(async () => {
        if (state.tempo > 0) {
            state.tempo -= 1;
            atualizarDisplay();
        } else {
            clearInterval(state.interval);
            state.interval = null;
            state.pausado = true;

            // atualiza servidor
            if (state.serverId) {
                await fetch(`/api/atendimentos/${state.serverId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tempoRestante: 0, emAndamento: false })
                });
            }

            // modal de encerramento
            const modal = new bootstrap.Modal(document.getElementById("encerrarSessaoModal"));
            modal.show();
            window.sessaoEncerrarId = state.serverId;
        }
    }, 1000);

    // troca botões centrais
    btnIniciar.classList.add('d-none');
    btnPausar.classList.remove('d-none');
    btnReiniciar.classList.remove('d-none');
    btnPausar.textContent = 'Pausar';

    // sincroniza com servidor
    await syncTimerToServer(selectedTid);
}


// Função Pausar/Continuar
function pausarOuContinuar() {
    if (!selectedTid) return alert('Selecione um terapeuta para pausar/continuar');
    const state = window.__timers__[selectedTid];
    if (!state) return;
    if (!state.pausado) {
        // Pausar
        clearInterval(state.interval);
        state.interval = null;
        state.pausado = true;
        btnPausar.textContent = 'Continuar';
        btnPausar.classList.remove('btn-warning');
        btnPausar.classList.add('btn-primary');
    } else {
        // Continuar
        iniciarTimer();
        btnPausar.textContent = 'Pausar';
        btnPausar.classList.remove('btn-primary');
        btnPausar.classList.add('btn-warning');
    }

    // sincroniza com servidor
    syncTimerToServer(selectedTid);
}

// Função Reiniciar
function reiniciarTimer() {
    if (!selectedTid) return alert('Selecione um terapeuta antes de reiniciar');
    const state = window.__timers__[selectedTid];
    if (!state) return;
    clearInterval(state.interval);
    state.interval = null;
    state.tempo = 10 * 60;
    state.pausado = false;
    atualizarDisplay();

    // volta para a cor original do círculo
    const circle = document.querySelector('.timer-circle');
    if (circle) circle.style.backgroundColor = 'rgb(225, 239, 197)';

    // volta os botões de adicionar tempo para o estilo padrão
    document.querySelectorAll('#Adicionar1min, #Adicionar5min, #Adicionar10min').forEach((btn) => {
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.style.color = '';
    });

    // esconde os botões Pausar e Reiniciar
    document.getElementById('btnPausar').classList.add('d-none');
    document.getElementById('btnReiniciar').classList.add('d-none');

    // mostra o botão Iniciar
    document.getElementById('btnIniciar').classList.remove('d-none');

    // sincroniza com servidor
    syncTimerToServer(selectedTid);
}
// volta pro estado inicial dos botões
btnIniciar.classList.remove("d-none");
btnPausar.classList.add("d-none");
btnReiniciar.classList.add("d-none");
btnPausar.textContent = "Pausar";
btnPausar.classList.remove("btn-primary");
btnPausar.classList.add("btn-warning");

// Botões de adicionar tempo
// Seleciona os botões
const btnAdicionar1 = document.getElementById("Adicionar1min");
const btnAdicionar5 = document.getElementById("Adicionar5min");
const btnAdicionar10 = document.getElementById("Adicionar10min");

// Funções para adicionar tempo
btnAdicionar1.addEventListener("click", () => {
    if (!selectedTid) return alert('Selecione um terapeuta primeiro');
    const state = window.__timers__[selectedTid];
    if (!state) return;
    state.tempo += 60;
    atualizarDisplay();
    syncTimerToServer(selectedTid);
});

btnAdicionar5.addEventListener("click", () => {
    if (!selectedTid) return alert('Selecione um terapeuta primeiro');
    const state = window.__timers__[selectedTid];
    if (!state) return;
    state.tempo += 5 * 60;
    atualizarDisplay();
    syncTimerToServer(selectedTid);
});

btnAdicionar10.addEventListener("click", () => {
    if (!selectedTid) return alert('Selecione um terapeuta primeiro');
    const state = window.__timers__[selectedTid];
    if (!state) return;
    state.tempo += 10 * 60;
    atualizarDisplay();
    syncTimerToServer(selectedTid);
});

function popterapeuta() {
    document.getElementById("poptera").classList.toggle("d-none");
}

// função para buscar e renderizar no modal os timers ativos
async function carregarTerapeutas() {
    const container = document.getElementById("listaTerapeutas");
    container.innerHTML = "Carregando...";

    try {
        // garantir que timers do servidor foram carregados antes de renderizar o modal
        await loadTimersFromDB();
    } catch (e) {
        // ignora erro silenciosamente
    }

    try {
        const res = await fetch("/api/terapeutas");

        if (!res.ok) {
            let errPayload = {};
            try {
                errPayload = await res.json();
            } catch (e) { }
            const details = errPayload.details || errPayload.error || errPayload.message || res.statusText;
            container.innerHTML = `Erro ao carregar terapeutas: ${details}`;
            return;
        }

        const terapeutas = await res.json();
        container.innerHTML = "";

        if (!Array.isArray(terapeutas)) {
            container.innerHTML = 'Resposta inesperada ao carregar terapeutas';
            return;
        }

        // inicializa o objeto global de timers se ainda não existir
        if (!window.__timers__) window.__timers__ = {};

        // renderiza cada terapeuta
        terapeutas.forEach(terapeuta => {
            const card = document.createElement("div");
            card.classList.add(
                "card-terapeuta", "d-flex", "align-items-center", "gap-2",
                "border", "border-2", "rounded-3", "bg-light-subtle", "p-2", "mb-3"
            );

            const tid = terapeuta._id ? String(terapeuta._id) : terapeuta.nome_colaborador;

            // valor inicial (caso ainda não tenha um timer ativo)
            const initialSec = typeof terapeuta.tempoRestante === "number" && !isNaN(terapeuta.tempoRestante)
                ? terapeuta.tempoRestante
                : 10 * 60;

            // cria o timer se ainda não existir, preservando timers já ativos
            if (!window.__timers__[tid]) {
                window.__timers__[tid] = {
                    interval: null,
                    tempo: initialSec,
                    pausado: true,
                    serverId: null,
                    colaborador_id: terapeuta._id || null,
                    nome_colaborador: terapeuta.nome_colaborador
                };
            }

            // usa o tempo atual do timer global, sem resetar
            const tempoAtual = window.__timers__[tid].tempo;

            card.innerHTML = `
                <div class="d-flex align-items-center flex-grow-1 gap-2">
                    <img src="/frontend/img/account-outline.svg" 
                        alt="Foto do Terapeuta" 
                        class="avatar border">
                    <div class="d-flex flex-column">
                        <span class="fw-semibold text-dark">${terapeuta.nome_colaborador}</span>
                        <small class="text-muted mb-0">Unidade: ${terapeuta.unidade_id || 'Não informada'}</small>
                        <small class="text-muted">Tipo: ${terapeuta.tipo_colaborador}</small>
                    </div>
                </div>

                <div class="text-end flex-shrink-0">
                    <div class="fw-semibold text-secondary small">Timer:</div>
                    <div class="fw-bold fs-5 text-success" id="timer-display-${tid}">
                        ${formatSeconds(tempoAtual)}
                    </div>
                    <button class="btn btn-success btn-sm mt-2 px-3" id="select-${tid}">
                        Selecionar
                    </button>
                </div>
            `;

            container.appendChild(card);

            const btnSelect = document.getElementById(`select-${tid}`);

            // ao selecionar terapeuta
            btnSelect.addEventListener('click', () => {
                selectedTid = tid;

                // atualiza display central
                atualizarDisplay();

                // ajusta visibilidade dos botões centrais conforme estado
                const state = window.__timers__[selectedTid];
                if (state && state.interval) {
                    btnIniciar.classList.add('d-none');
                    btnPausar.classList.remove('d-none');
                    btnReiniciar.classList.remove('d-none');
                } else {
                    btnIniciar.classList.remove('d-none');
                    btnPausar.classList.add('d-none');
                    btnReiniciar.classList.add('d-none');
                }

                // fecha o modal do Bootstrap
                try {
                    const modalEl = document.getElementById('popupTerapeuta');
                    if (modalEl) {
                        const bs = bootstrap.Modal.getInstance(modalEl);
                        if (bs) bs.hide();
                    }
                } catch (e) { }
            });
        });

    } catch (error) {
        container.innerHTML = "Erro ao carregar terapeutas";
    }
}


// formata segundos em mm:ss
function formatSeconds(sec) {
    if (typeof sec !== 'number' || isNaN(sec)) return '—';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Sincroniza um timer local para o servidor (cria ou atualiza)
async function syncTimerToServer(tid) {
    try {
        const state = window.__timers__?.[tid];
        if (!state) return;

        // só atualiza se houver serverId (atendimento existente)
        if (state.serverId) {
            await fetch(`/api/atendimentos/${state.serverId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tempoRestante: state.tempo,
                    emAndamento: !!state.interval
                })
            });
            console.log("Timer sincronizado para atendimento existente:", state.serverId);
        } else {
            console.warn("Nenhum atendimento existente selecionado para sincronizar:", tid);
        }

    } catch (e) {
        console.warn('Erro ao sincronizar timer com servidor', e);
    }
}


// Carrega timers do servidor e inicializa estados locais; inicia contadores em andamento
async function loadTimersFromDB() {
    try {
        const res = await fetch('/api/atendimentos');
        if (!res.ok) return;
        const timers = await res.json();
        if (!Array.isArray(timers)) return;
        if (!window.__timers__) window.__timers__ = {};

        timers.forEach(t => {
            const tid = t.colaborador_id ? String(t.colaborador_id) : (t.nome_colaborador || String(t._id));
            const tempo = typeof t.tempoRestante === 'number' && !isNaN(t.tempoRestante) ? t.tempoRestante : 10 * 60;
            window.__timers__[tid] = window.__timers__[tid] || {
                interval: null,
                tempo: tempo,
                pausado: !t.emAndamento,
                serverId: t._id,
                colaborador_id: t.colaborador_id ? String(t.colaborador_id) : null,
                nome_colaborador: t.nome_colaborador || null
            };

            // se estava em andamento no servidor, inicia contador local (resume)
            if (t.emAndamento) {
                const state = window.__timers__[tid];
                if (!state.interval) {
                    state.interval = setInterval(async () => {
                        if (state.tempo > 0) {
                            state.tempo -= 1;
                            // atualiza display central se selecionado
                            if (selectedTid === tid) atualizarDisplay();
                        } else {
                            clearInterval(state.interval);
                            state.interval = null;
                            state.pausado = true;

                            //  Aqui o tempo zerou 
                            console.log("⏰ Tempo encerrado automaticamente para", tid);

                            // Atualiza no servidor
                            if (state.serverId) {
                                console.log("Tentando atualizar atendimento:", state);
                                await fetch(`/api/atendimentos/${state.serverId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ tempoRestante: 0, emAndamento: false })
                                });
                            }

                            // Abre o modal de encerramento
                            const encerrarModalEl = document.getElementById("encerrarSessaoModal");
                            if (encerrarModalEl) {
                                const modal = new bootstrap.Modal(encerrarModalEl);
                                modal.show();
                                window.sessaoEncerrarId = state.serverId;
                            }
                        }
                    }, 1000);
                }
            }
        });
    } catch (e) {
        console.warn('Erro ao carregar timers do servidor', e);
    }
}

// chama quando abrir o modal
const popupTerapeuta = document.getElementById("popupTerapeuta");
popupTerapeuta.addEventListener("show.bs.modal", carregarTerapeutas);

// se o evento do Bootstrap não funcionar, chama ao clicar no botão que abre o modal
const btnAbrirTerapeuta = document.querySelector('[data-bs-target="#popupTerapeuta"]');
if (btnAbrirTerapeuta) {
    btnAbrirTerapeuta.addEventListener('click', () => {
        setTimeout(() => carregarTerapeutas(), 100);
    });
}

// id 
const id = localStorage.getItem("idUser");

document.addEventListener("DOMContentLoaded", () => {
    // mostra o botão de abrir modal SelecionarTerapeuta só se for admin
    const tipoUser = localStorage.getItem("tipoUser");
    const btnAbrirModal = document.getElementById("btnAbrirModal");
    if (tipoUser === "admin" && btnAbrirModal) {
        btnAbrirModal.classList.remove("d-none");
    }

    // carrega terapeutas no modal
    carregarTerapeutas();
});

// Carrega os agendamentos do dia
async function carregarAgendamentos() {
    if (!id) return alert("ID do terapeuta não encontrado!");

    try {
        const resposta = await fetch(`/api/agendamentos?id=${id}`);
        const agendamentos = await resposta.json();

        const container = document.getElementById("agendamentos");
        container.innerHTML = "";

        if (!Array.isArray(agendamentos) || !agendamentos.length) {
            container.innerHTML = `<p class="text-center mt-3 text-muted">Nenhum agendamento encontrado para hoje.</p>`;
            return;
        }

        // Remove duplicatas por _id (ou por chave composta se _id ausente)
        const vistos = new Set();
        const unicos = [];
        agendamentos.forEach(a => {
            const chave = a._id || `${a.colaborador?.nome_colaborador || a.colaborador}_${a.inicio_atendimento}`;
            if (!vistos.has(chave)) {
                vistos.add(chave);
                unicos.push(a);
            }
        });

        // Renderiza exatamente como antes, usando a lista filtrada
        unicos.forEach((a) => {
            console.log("🔹 Agendamento _id:", a._id);
            console.log("🔹 Colaborador:", a.colaborador);
            const inicio = new Date(a.inicio_atendimento);
            const fim = new Date(a.fim_atendimento);

            // Calcula tempo em segundos
            const tempoSegundos = Math.round((fim - inicio) / 1000);
            a.tempoRestante = tempoSegundos;

            // Cria horaFormatada para exibir exatamente o horário do banco (UTC)
            const horas = String(inicio.getUTCHours()).padStart(2, '0');
            const minutos = String(inicio.getUTCMinutes()).padStart(2, '0');
            const horaFormatada = `${horas}:${minutos}`;

            const bloco = document.createElement("div");
            bloco.classList.add("card", "card-agendamento", "p-3", "mb-2", "shadow-sm");
            bloco.dataset.serverId = a._id;

            // protege o nome contra apóstrofos que quebram o onclick
            const nomeCol = (a.colaborador && a.colaborador.nome_colaborador) ? a.colaborador.nome_colaborador : (a.colaborador || '');
            const nomeEscaped = String(nomeCol).replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\r/g, '');

            bloco.innerHTML = `
<div class="d-flex justify-content-between align-items-start">
    <div class="text-start">
        <span class="fw-semibold d-block">👤${nomeCol}</span>
        <small class="text-muted d-block">⏰Início: ${horaFormatada}</small>
        <small class="text-muted d-block">Duração: ${Math.round(tempoSegundos / 60)} min</small>
    </div>
    <div class="ms-3">
        <button class="btn btn-success btn-sm" 
    onclick="selecionarAgendamento(
        '${a._id}', 
        ${tempoSegundos}, 
        '${a.colaborador.nome_colaborador || a.colaborador}', 
        '${a.colaborador._id || a.colaborador}'
    )">
    Selecionar
</button>

    </div>
</div>
<div id="timer-${a._id}" class="fs-5 fw-bold mt-2 text-success">
    <!-- vazio: o tempo vai para o círculo central -->
</div>
`;
            container.appendChild(bloco);
        });

    } catch (err) {
        console.error("Erro ao carregar agendamentos:", err);
        const container = document.getElementById("agendamentos");
        if (container) container.innerHTML = `<p class="text-center text-danger small">Erro ao carregar agendamentos do dia.</p>`;
    }
}


// Função chamada ao clicar em "Selecionar"
function selecionarAgendamento(id, tempoSegundos, colaboradorNome = null, colaboradorId = null) {
    const bloco = document.querySelector(`[data-server-id="${id}"]`);
    if (!bloco) return;

    // Marca visualmente o agendamento selecionado
    document.querySelectorAll('.card-agendamento').forEach(el => el.classList.remove('border-success'));
    bloco.classList.add('border', 'border-success');

    // Garante o nome e o ID do terapeuta
    const nome = colaboradorNome || "Desconhecido";
    const tid = String(colaboradorId || nome);

    if (!window.__timers__) window.__timers__ = {};

    // Se o terapeuta já tem um timer, apenas atualiza o tempo dele
    if (window.__timers__[tid]) {
        window.__timers__[tid].tempo = tempoSegundos;
        window.__timers__[tid].pausado = true;
        window.__timers__[tid].serverId = id; // garante vínculo com atendimento
        // Atualiza display do terapeuta
        const display = document.getElementById(`timer-display-${tid}`);
        if (display) display.textContent = formatSeconds(tempoSegundos);
    } else {
        // Caso o terapeuta ainda não tenha timer
        window.__timers__[tid] = {
            tempo: tempoSegundos,
            pausado: true,
            interval: null,
            serverId: id,
            nome_colaborador: nome,
            colaborador_id: colaboradorId
        };
    }

    // Define o terapeuta selecionado globalmente
    selectedTid = tid;

    // Atualiza o display central (círculo principal)
    const state = window.__timers__[tid];
    const timerDisplay = document.getElementById("timer");
    if (timerDisplay) timerDisplay.textContent = formatSeconds(state.tempo);

    // Atualiza visibilidade dos botões centrais
    if (state.interval) {
        btnIniciar.classList.add('d-none');
        btnPausar.classList.remove('d-none');
        btnReiniciar.classList.remove('d-none');
    } else {
        btnIniciar.classList.remove('d-none');
        btnPausar.classList.add('d-none');
        btnReiniciar.classList.add('d-none');
    }

    //  Sincroniza imediatamente o timer com o servidor
    syncTimerToServer(tid);
}

document.addEventListener("DOMContentLoaded", carregarAgendamentos);

// Final de sessão  abre modal de feedback
document.getElementById("confirmarEncerramento").addEventListener("click", async () => {
    const encerrarModalEl = document.getElementById("encerrarSessaoModal");
    const encerrarModal = bootstrap.Modal.getInstance(encerrarModalEl);
    encerrarModal.hide();

    // Remove o atendimento da tela (sem excluir do banco)
    const atendimentoEl = document.querySelector(`[data-server-id="${window.sessaoEncerrarId}"]`);
    if (atendimentoEl) atendimentoEl.remove();

    // Exibe o modal de feedback
    const fbModalEl = document.getElementById("fbModal");
    const fbModal = new bootstrap.Modal(fbModalEl);
    fbModal.show();

    // Preenche nome e horário no feedback automaticamente
    const state = Object.values(window.__timers__ || {}).find(t => t.serverId === window.sessaoEncerrarId);
    if (state) {
        document.getElementById("fb-nomeTerapeuta").textContent = `👤 ${state.nome_colaborador || 'Desconhecido'}`;
        const agora = new Date();
        document.getElementById("fb-horarioSessao").textContent = `⏰ ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
});

// Quando clicar em "Salvar" no modal de feedback
document.getElementById("fb-salvar").addEventListener("click", async () => {
    const texto = document.getElementById("fb-texto").value.trim();
    if (!texto) {
        alert("Por favor, escreva seu feedback antes de salvar.");
        return;
    }

    const sessaoId = window.sessaoEncerrarId;
    console.log(sessaoId)// ID do atendimento encerrado
    if (!sessaoId) {
        alert("Não foi possível identificar a sessão.");
        return;
    }

    try {
        const res = await fetch(`/api/atendimentos/${sessaoId}/feedback`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ observacao_cliente: texto })
        });

        if (!res.ok) {
            const err = await res.json();
            alert("Erro ao salvar feedback: " + (err.message || res.statusText));
            return;
        }

        alert("Feedback salvo com sucesso ✅");

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
