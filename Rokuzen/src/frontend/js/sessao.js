// navbar
const menubtn = document.getElementById("menubtn");
function abrirMenu() {
    const dropcnt = document.getElementById("dropcnt");
    dropcnt.classList.toggle("d-none");
}

// Timer
// manter múltiplos timers por terapeuta
let intervalo = null; // ainda usado para a UI central quando nenhuma seleção
let pausado = false;
let selectedTid = null; // id ou nome do terapeuta selecionado para controlar pelo timer central

const timerDisplay = document.getElementById("timer");
const btnIniciar = document.getElementById("btnIniciar");
const btnPausar = document.getElementById("btnPausar");
const btnReiniciar = document.getElementById("btnReiniciar");

function formatarTempo(segundos) {
    let min = Math.floor(segundos / 60);
    let sec = segundos % 60;
    return `${min.toString().padStart(2, "0")}:${sec
        .toString()
        .padStart(2, "0")}`;
}

function atualizarDisplay() {
    // mostra tempo do terapeuta selecionado, ou como segunp 10:00
    let sec = 10 * 60;
    if (selectedTid && window.__timers__ && window.__timers__[selectedTid]) {
        sec = window.__timers__[selectedTid].tempo;
    }
    timerDisplay.textContent = formatarTempo(sec);
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
}, 10000);

// Função Iniciar
async function iniciarTimer() {
    if (!selectedTid) return alert('Selecione primeiro um terapeuta no modal');
    const state = window.__timers__[selectedTid];
    if (!state) return;
    if (state.interval) return; // já rodando

    // muda a cor do círculo para #A2C838 quando iniciar
    const circle = document.querySelector('.timer-circle');
    if (circle) circle.style.backgroundColor = '#A2C838';

    // muda a cor dos botões de adicionar tempo
    document.querySelectorAll('#Adicionar1min, #Adicionar5min, #Adicionar10min').forEach((btn) => {
        btn.style.backgroundColor = 'rgba(185, 222, 107, 0.5)';
        btn.style.borderColor = 'rgba(0, 0, 0, 0.5)';
        btn.style.color = 'black';
    });

    state.pausado = false;
    state.interval = setInterval(async () => {
        if (state.tempo > 0) {
            state.tempo -= 1;
            atualizarDisplay();
        } else {
            clearInterval(state.interval);
            state.interval = null;
            // notificar fim
            try {
                if (state.serverId) await fetch(`/api/timers/${state.serverId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tempoRestante: 0, emAndamento: false }) });
            } catch (e) { }
            alert('⏰ O tempo acabou!');
        }
    }, 1000);

    // trocar botões centrais
    btnIniciar.classList.add('d-none');
    btnPausar.classList.remove('d-none');
    btnReiniciar.classList.remove('d-none');
    btnPausar.textContent = 'Pausar';

    // sincroniza com servidor (criar ou atualizar)
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
pausado = false;

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
    // garantir que timers do servidor foram carregados antes de renderizar o modal
    try {
        await loadTimersFromDB();
    } catch (e) {
        // falhar silenciosamente aqui; a função abaixo lidará com ausência de timers
    }
    try {
        const res = await fetch("/api/terapeutas");
        // Se a resposta não for OK, tenta extrair mensagem e mostra no UI
        if (!res.ok) {
            let errPayload = {};
            try {
                errPayload = await res.json();
            } catch (e) {
            }
            const details = errPayload.details || errPayload.error || errPayload.message || res.statusText;
            container.innerHTML = `Erro ao carregar terapeutas: ${details}`;
            return;
        }
        //  espera resposta JSON
        const terapeutas = await res.json();
        container.innerHTML = "";
        if (!Array.isArray(terapeutas)) {
            container.innerHTML = 'Resposta inesperada ao carregar terapeutas';
            return;
        }
        // carrega os terapeutas no container 
        terapeutas.forEach(terapeuta => {
            const card = document.createElement("div");
            card.classList.add("card-terapeuta", "d-flex", "align-items-center", "gap-2", "border", "border-2", "rounded-3", "bg-light-subtle", "p-2", "mb-3");

            // id único para elementos do terapeuta (sempre string)
            const tid = terapeuta._id ? String(terapeuta._id) : terapeuta.nome_colaborador;

            card.innerHTML = `
                    <img src="/frontend/img/account-outline.svg" alt="Foto Terapeuta" class="avatar">
                    <div>
                        <span class="fw-medium small">${terapeuta.nome_colaborador}</span>
                        <p class="small mb-0">Tipo: ${terapeuta.tipo_colaborador}</p>
                    </div>
                    <div class="ms-auto text-end small">
                        <div>Timer:</div>
                        <div class="fw-semibold" id="timer-display-${tid}">${terapeuta.tempoRestante != null ? formatSeconds(terapeuta.tempoRestante) : '10:00'}</div>
                        <div class="btn-group mt-2" role="group">
                            <button class="btn btn-sm btn-success" id="select-${tid}">Selecionar</button>
                        </div>
                    </div>
`;
            container.appendChild(card);

            // cria estado local para cada terapeuta (sem controles no modal)
            if (!window.__timers__) window.__timers__ = {};
            const initialSec = typeof terapeuta.tempoRestante === 'number' && !isNaN(terapeuta.tempoRestante) ? terapeuta.tempoRestante : 10 * 60;
            window.__timers__[tid] = window.__timers__[tid] || {
                interval: null,
                tempo: initialSec,
                pausado: false,
                serverId: null,
                colaborador_id: terapeuta._id || null,
                nome_colaborador: terapeuta.nome_colaborador
            };

            const display = document.getElementById(`timer-display-${tid}`);
            const btnSelect = document.getElementById(`select-${tid}`);

            // atualiza display inicial (prefere estado carregado do DB quando disponível)
            const initVal = (window.__timers__ && window.__timers__[tid]) ? window.__timers__[tid].tempo : (typeof terapeuta.tempoRestante === 'number' ? terapeuta.tempoRestante : 10*60);
            if (!window.__timers__ || !window.__timers__[tid]) {
                if (!window.__timers__) window.__timers__ = {};
                window.__timers__[tid] = window.__timers__[tid] || {
                    interval: null,
                    tempo: initVal,
                    pausado: true,
                    serverId: null,
                    colaborador_id: terapeuta._id ? String(terapeuta._id) : null,
                    nome_colaborador: terapeuta.nome_colaborador
                };
            }
            display.textContent = formatSeconds(window.__timers__[tid].tempo);

            // selecionar terapeuta para controle central
            btnSelect.addEventListener('click', () => {
                selectedTid = tid;
                // atualiza display central imediatamente
                atualizarDisplay();
                // ajustar visibilidade dos botões centrais conforme estado
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
                // fecha o modal (se estiver usando bootstrap)
                try { const modalEl = document.getElementById('popupTerapeuta'); if (modalEl) { const bs = bootstrap.Modal.getInstance(modalEl); if (bs) bs.hide(); } } catch (e) { }
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
        const state = window.__timers__ && window.__timers__[tid];
        if (!state) return;
        const payload = { colaborador_id: state.colaborador_id || null, nome_colaborador: state.nome_colaborador || tid, tempoRestante: state.tempo, emAndamento: !!state.interval };
        if (state.serverId) {
            await fetch(`/api/timers/${state.serverId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tempoRestante: state.tempo, emAndamento: !!state.interval }) });
        } else {
            const r = await fetch('/api/timers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (r.ok) {
                const data = await r.json();
                state.serverId = data._id || data.id || state.serverId;
            }
        }
    } catch (e) {
        console.warn('Erro ao sincronizar timer com servidor', e);
    }
}

// Carrega timers do servidor e inicializa estados locais; inicia contadores em andamento
async function loadTimersFromDB() {
    try {
        const res = await fetch('/api/timers');
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
                    state.interval = setInterval(() => {
                        if (state.tempo > 0) {
                            state.tempo -= 1;
                            // atualiza display central se selecionado
                            if (selectedTid === tid) atualizarDisplay();
                        } else {
                            clearInterval(state.interval);
                            state.interval = null;
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


