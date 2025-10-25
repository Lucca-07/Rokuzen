// navbar
const menubtn = document.getElementById("menubtn");
function abrirMenu() {
    const dropcnt = document.getElementById("dropcnt");
    dropcnt.classList.toggle("d-none");
}
function formatSeconds(sec) {
    if (typeof sec !== 'number' || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// --- Sincroniza o timer com o servidor ---
async function syncTimerToServer(tid) {
    const state = window.__timers__?.[tid];
    if (!state || !state.serverId) return;

    try {
        await fetch(`/api/atendimentos/${state.serverId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tempoRestante: state.tempo,
                emAndamento: !state.pausado
            })
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

async function loadTimersFromDB() {
    try {
        const res = await fetch("/api/atendimentos/ativos");
        if (!res.ok) throw new Error("Erro ao carregar timers do banco");

        const atendimentos = await res.json();
        console.log("Timers sincronizados com o banco:", atendimentos);

        // Garante que o objeto global existe
        if (!window.__timers__) window.__timers__ = {};

        const tidsDoBanco = new Set();

        atendimentos.forEach(a => {
            if (!a.colaborador_id) return;

            const tid = String(a.colaborador_id);
            tidsDoBanco.add(tid);

            // Se o timer já existe, atualiza; se não, cria novo
            if (window.__timers__[tid]) {
                // Atualiza dados com base no servidor
                window.__timers__[tid].tempo = a.tempoRestante ?? window.__timers__[tid].tempo ?? 600;
                window.__timers__[tid].pausado = !a.emAndamento;
                window.__timers__[tid].serverId = a._id;
                window.__timers__[tid].nome_colaborador = a.nome_colaborador || window.__timers__[tid].nome_colaborador || "Desconhecido";
            } else {
                // Cria novo timer
                window.__timers__[tid] = {
                    tempo: a.tempoRestante ?? 600,
                    pausado: !a.emAndamento,
                    interval: null,
                    serverId: a._id,
                    nome_colaborador: a.nome_colaborador || "Desconhecido",
                    colaborador_id: a.colaborador_id
                };
            }
        });

    } catch (err) {
        console.error("Erro ao carregar timers do DB:", err);
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

    state.pausado = false;

    btnIniciar.classList.add("d-none");
    btnPausar.classList.remove("d-none");
    btnReiniciar.classList.remove("d-none");
    btnPausar.textContent = 'Pausar';
    btnPausar.classList.replace('btn-primary', 'btn-warning');

    await syncTimerToServer(selectedTid);
    atualizarTimersModal();
}



// Função Pausar/Continuar
async function pausarOuContinuar() {
    if (!selectedTid) return alert('Selecione um terapeuta');
    const state = window.__timers__[selectedTid];
    if (!state) return alert("Terapeuta não tem atendimento ativo");

    state.pausado = !state.pausado;

    if (state.pausado) {
        btnPausar.textContent = 'Continuar';
        btnPausar.classList.replace('btn-warning', 'btn-primary');
    } else {
        btnPausar.textContent = 'Pausar';
        btnPausar.classList.replace('btn-primary', 'btn-warning');
    }

    await syncTimerToServer(selectedTid);
    atualizarTimersModal();
}

// Função REINICIAR 
async function reiniciarTimer() {
    if (!selectedTid) return alert('Selecione um terapeuta');
    const state = window.__timers__[selectedTid];
    if (!state) return alert("Terapeuta não tem atendimento ativo");

    state.tempo = 10 * 60;
    state.pausado = true;

    atualizarDisplays(selectedTid);
    atualizarTimersModal();

    btnIniciar.classList.remove('d-none');
    btnPausar.classList.add('d-none');
    btnReiniciar.classList.add('d-none');

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
});

// Funções para adicionar tempo
async function adicionarTempo(segundos) {
    if (!selectedTid) {
        alert('Selecione um terapeuta primeiro');
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
    await loadTimersFromDB();

    try {
        const res = await fetch("/api/terapeutas");
        if (!res.ok) throw new Error("Falha ao carregar terapeutas");
        const terapeutas = await res.json();

        // Buscar atendimentos ativos para verificar quais terapeutas têm sessões
        const resAtendimentos = await fetch("/api/atendimentos/ativos");
        const atendimentosAtivos = resAtendimentos.ok ? await resAtendimentos.json() : [];

        container.innerHTML = "";

        terapeutas.forEach(t => {
            const tid = String(t._id);
        
            // Definir a URL da imagem para este terapeuta
            const imagemUrl = t.imagem
                ? `/api/colaboradores/${t._id}/imagem`
                : "/frontend/img/account-outline.svg";
        
            // Verificar se este terapeuta tem atendimento ativo
            const atendimentoAtivo = atendimentosAtivos.find(a => String(a.colaborador_id) === tid);
        
            let state = window.__timers__[tid];
        
            if (!state && atendimentoAtivo) {
                state = {
                    tempo: atendimentoAtivo.tempoRestante ?? 600,
                    pausado: !atendimentoAtivo.emAndamento,
                    interval: null,
                    serverId: atendimentoAtivo._id,
                    nome_colaborador: t.nome_colaborador,
                    colaborador_id: t._id
                };
                window.__timers__[tid] = state;
            }

            // Se ainda não tem state (nem atendimento ativo), mostrar como sem atendimento
            if (!state) {
                const card = document.createElement("div");
                card.className = "card-terapeuta d-flex align-items-center gap-2 border border-2 rounded-3 bg-light-subtle p-2 mb-3";
                card.innerHTML = `
                    <div class="d-flex align-items-center flex-grow-1 gap-2">
                       <img src="${imagemUrl}" class="avatar border">
                        <div class="d-flex flex-column">
                            <span class="fw-semibold text-dark">${t.nome_colaborador}</span>
                            <small class="text-muted mb-0">Unidade: ${t.unidade_id || 'Não informada'}</small>
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

            // Terapeuta COM atendimento ativo
            const card = document.createElement("div");
            card.className = "card-terapeuta d-flex align-items-center gap-2 border border-2 rounded-3 bg-light-subtle p-2 mb-3";
            card.innerHTML = `
                <div class="d-flex align-items-center flex-grow-1 gap-2">
                    <img src="/frontend/img/account-outline.svg" class="avatar border">
                    <div class="d-flex flex-column">
                        <span class="fw-semibold text-dark">${t.nome_colaborador}</span>
                        <small class="text-muted mb-0">Unidade: ${t.unidade_id || 'Não informada'}</small>
                        <small class="text-muted">Tipo: ${t.tipo_colaborador}</small>
                    </div>
                </div>
                <div class="text-end flex-shrink-0">
                    <div class="fw-semibold text-secondary small">Timer:</div>
                    <div class="fw-bold fs-5 ${state.pausado ? 'text-secondary' : 'text-success'}" id="timer-display-${tid}">
                        ${formatSeconds(state.tempo)}
                    </div>
                    <button class="btn btn-success btn-sm mt-2 px-3" id="select-${tid}">Selecionar</button>
                </div>
            `;

            container.appendChild(card);

            document.getElementById(`select-${tid}`).addEventListener("click", () => {
                selectedTid = tid;
                const state = window.__timers__[tid];

                atualizarDisplays(tid);

                if (state.pausado) {
                    btnIniciar.classList.remove("d-none");
                    btnPausar.classList.add("d-none");
                    btnPausar.textContent = 'Pausar';
                    btnPausar.classList.replace('btn-warning', 'btn-primary');
                } else {
                    btnIniciar.classList.add("d-none");
                    btnPausar.classList.remove("d-none");
                    btnPausar.textContent = 'Pausar';
                    btnPausar.classList.replace('btn-primary', 'btn-warning');
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


// ATUALIZAR DISPLAYS corrigida
function atualizarDisplays(tid) {
    const state = window.__timers__[tid];
    if (!state) return;

    // Atualiza o display principal (mantém estilo original)
    if (selectedTid === tid) {
        const timerDisplay = document.getElementById("timer");
        if (timerDisplay) {
            timerDisplay.textContent = formatSeconds(state.tempo);
        }
    }

    // Atualiza o display no modal (mantém estilo original)
    const displayModal = document.getElementById(`timer-display-${tid}`);
    if (displayModal) {
        displayModal.textContent = formatSeconds(state.tempo);
        displayModal.className = `fw-bold fs-5 ${state.pausado ? 'text-secondary' : 'text-success'}`;
    }
}

// Atualiza todos os timers que aparecem dentro do modal de terapeutas
function atualizarTimersModal() {
    if (!window.__timers__) return;

    Object.keys(window.__timers__).forEach(tid => {
        const state = window.__timers__[tid];
        if (!state) return;

        // Atualiza o display de cada terapeuta no modal
        const display = document.getElementById(`timer-display-${tid}`);
        if (display) {
            display.textContent = formatSeconds(state.tempo);
            display.className = `fw-bold fs-5 ${state.pausado ? 'text-secondary' : 'text-success'}`;
        }
    });
}

// Atualização automática global + sincronização periódica
let lastSync = Date.now();
setInterval(() => {
    if (!window.__timers__) return;

    const modalAbertoTerapeuta = document.getElementById("popupTerapeuta")?.classList.contains("show");
    const agora = Date.now();

    Object.keys(window.__timers__).forEach(tid => {
        const state = window.__timers__[tid];
        if (!state) return;

        // Decrementa tempo se não estiver pausado
        if (!state.pausado) {
            state.tempo = Math.max(0, state.tempo - 1);
            atualizarDisplays(tid);

            // Abre modal de encerramento automaticamente
            if (state.tempo === 0 && !state.encerrado) {
                state.encerrado = true; // evita abrir várias vezes
                window.sessaoEncerrarId = state.serverId;

                const encerrarModalEl = document.getElementById("encerrarSessaoModal");
                if (encerrarModalEl) {
                    const encerrarModal = new bootstrap.Modal(encerrarModalEl);
                    encerrarModal.show();
                }

                // Opcional: desativa botões de controle
                if (selectedTid === tid) {
                    btnIniciar.classList.add('d-none');
                    btnPausar.classList.add('d-none');
                    btnReiniciar.classList.add('d-none');
                }
            }
        }

        // Sincroniza com servidor a cada segundo
        if (state.serverId && !state.pausado) {
            syncTimerToServer(tid);
        }
    });

    // Atualiza modal de terapeutas se aberto
    if (modalAbertoTerapeuta) {
        atualizarTimersModal();
    }
}, 1000);



// chama quando abrir o modal - SEM recarregar timers do DB para não interferir
document.getElementById("popupTerapeuta")?.addEventListener("show.bs.modal", () => {
    // Apenas atualiza o display com os dados atuais, sem recarregar do banco
    setTimeout(() => {
        carregarTerapeutas();
    }, 100);
});

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

    // carrega timers do banco uma vez na inicialização
    loadTimersFromDB().then(() => {
        carregarTerapeutas();
    });
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

    // Normaliza tid: preferir colaboradorId (se for ObjectId/str)
    let tid = null;
    if (colaboradorId) {
        tid = String(colaboradorId);
    }

    // fallback: se ainda não tiver tid, cria uma id temporária segura
    if (!tid) {
        tid = `temp-${Date.now()}`;
    }

    if (!window.__timers__) window.__timers__ = {};

    // SEMPRE atualiza ou cria o timer para este terapeuta
    window.__timers__[tid] = {
        tempo: tempoSegundos,
        pausado: true,
        interval: null,
        serverId: id,
        nome_colaborador: colaboradorNome || "Desconhecido",
        colaborador_id: colaboradorId || null
    };

    // Define o terapeuta selecionado globalmente como o tid canônico
    selectedTid = tid;

    // Atualiza o display central (círculo principal)
    const state = window.__timers__[tid];
    const timerDisplay = document.getElementById("timer");
    if (timerDisplay) timerDisplay.textContent = formatSeconds(state.tempo);

    // Atualiza visibilidade dos botões centrais (se estiver rodando mostra pausar)
    if (!state.pausado) {
        btnIniciar.classList.add('d-none');
        btnPausar.classList.remove('d-none');
        btnReiniciar.classList.remove('d-none');
    } else {
        btnIniciar.classList.remove('d-none');
        btnPausar.classList.add('d-none');
        btnReiniciar.classList.add('d-none');
    }

    // Garante que o modal e os displays reflitam o estado atual
    atualizarDisplays(selectedTid);
    atualizarTimersModal();

    // Sincroniza com o servidor (caso queira criar/atualizar o atendimento)
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
const state = Object.values(window.__timers__ || {}).find(
    t => t.serverId === window.sessaoEncerrarId
);

console.log("Timers completos:", window.__timers__);
console.log("Sessão a encerrar:", window.sessaoEncerrarId);

if (state) {
    const colaboradorId = state.colaborador_id || state.colaboradorId; 
    console.log("ID do colaborador:", colaboradorId);

    const fbNomeEl = document.getElementById("fb-nomeTerapeuta");
    const fbHorarioEl = document.getElementById("fb-horarioSessao");

    // Preenche horário sempre
    const agora = new Date();
    fbHorarioEl.textContent = `⏰ ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    if (colaboradorId) {
        fetch(`/api/colaboradores/${colaboradorId}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(colaborador => {
                console.log("Dados do colaborador:", colaborador);

                // Use o campo correto
                fbNomeEl.textContent = `👤 ${colaborador.nome_colaborador || 'Desconhecido'}`;
            })
            .catch(err => {
                console.error("Erro ao buscar colaborador:", err);
                fbNomeEl.textContent = '👤 Desconhecido';
            });
    } else {
        fbNomeEl.textContent = '👤 Desconhecido';
    }
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