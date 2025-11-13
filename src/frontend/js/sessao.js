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

(function limpaModals() {
    const popupModalEl = document.getElementById("popupTerapeuta");
    if (!popupModalEl) return;
    try {
        // oculta e remove instâncias/handlers do bootstrap
        const inst = (window.bootstrap && bootstrap.Modal.getInstance(popupModalEl));
        if (inst) {
            inst.hide();
            inst.dispose();
        }
    } catch (e) {
        // ignore
    }
    // força remover classes/estilos/backdrops que possam ter sobrado
    popupModalEl.classList.remove("show");
    popupModalEl.style.display = "none";
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    document.body.classList.remove("modal-open");
})();


const timerDisplay = document.getElementById("timer");
const btnIniciar = document.getElementById("btnIniciar");
const btnPausar = document.getElementById("btnPausar");
const btnReiniciar = document.getElementById("btnReiniciar");

// Carrega timers do banco
async function loadTimersFromDB() {
    try {
        // busca todos os atendimentos do dia (API espera inicio e fim)
        const hoje = new Date();
        const inicio = new Date(hoje);
        inicio.setHours(0, 0, 0, 0);
        const fim = new Date(inicio);
        fim.setDate(inicio.getDate() + 1);

        const API_URL =
            window.location.origin +
            `/api/atendimentos?inicio=${encodeURIComponent(
                inicio.toISOString()
            )}&fim=${encodeURIComponent(fim.toISOString())}`;

        const token = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(API_URL, { headers });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.warn(`loadTimersFromDB: status=${res.status} body=${text}`);
            window.__timers__ = window.__timers__ || {};
            return [];
        }

        const atendimentos = await res.json();
        console.log(" Timers sincronizados com o banco:", atendimentos);
        console.log(` Total de atendimentos retornados: ${atendimentos.length}`);

        if (!window.__timers__) window.__timers__ = {};

        atendimentos.forEach((a) => {
            console.log(`  Analisando atendimento: colaborador_id=${a.colaborador_id}, encerrado=${a.encerrado}, tempoRestante=${a.tempoRestante}`);
            if (!a.colaborador_id) {
                console.warn("tendimento sem colaborador_id:", a);
                return;
            }

            // Ignora APENAS atendimentos já encerrados
            if (a.encerrado) return;

            // IMPORTANTE: usar serverId (ID do atendimento) como chave, não colaborador_id
            // Isto permite múltiplos agendamentos para a mesma pessoa
            const tid = String(a._id).trim();
            console.log(` loadTimersFromDB - processando tid='${tid}' (atendimento), tempoRestante=${a.tempoRestante}, em_andamento=${a.em_andamento}`);

            if (window.__timers__[tid]) {
                const state = window.__timers__[tid];
                state.serverId = a._id;
                state.nome_colaborador =
                    a.nome_colaborador || state.nome_colaborador || "Desconhecido";
                // IMPORTANTE: NÃO sobrescreve state.tempo se já está rodando em memória
                // Apenas usa tempoRestante se o tempo em memória está em um estado inválido (0, null, undefined)
                if (!state.tempo || state.tempo <= 0) {
                    state.tempo = a.tempoRestante ?? 600;
                    console.log(`   Timer já existe - tempo restaurado=${state.tempo}`);
                } else {
                    console.log(`   Timer já existe - tempo mantido=${state.tempo}s (ignorando banco=${a.tempoRestante})`);
                }
                state.pausado = !a.em_andamento;
                // se estiver em andamento e não estiver com interval, inicia
                if (a.em_andamento && state.pausado === false && !state.interval) {
                    iniciarTimer(tid);
                }
            } else {
                // Extrai colaborador_id corretamente
                let colaboradorId = a.colaborador_id;
                if (typeof colaboradorId === 'object' && colaboradorId._id) {
                    colaboradorId = colaboradorId._id;
                }
                window.__timers__[tid] = {
                    tempo: a.tempoRestante ?? 600,
                    pausado: !a.em_andamento,
                    interval: null,
                    serverId: a._id,
                    nome_colaborador: a.nome_colaborador || "Desconhecido",
                    colaborador_id: String(colaboradorId),
                    encerrado: !!a.encerrado,
                    inicio_atendimento: a.inicio_atendimento,
                    fim_atendimento: a.fim_atendimento,
                };
                console.log(`   Timer criado - tempo=${a.tempoRestante ?? 600}, tid=${tid}, window.__timers__ agora tem:`, Object.keys(window.__timers__));
                if (a.em_andamento) iniciarTimer(tid);
            }
        });

        return atendimentos;
    } catch (err) {
        console.error(" Erro ao carregar timers do DB:", err);
        window.__timers__ = window.__timers__ || {};
        return [];
    }
}

// carrega timers do DB ao inicializar a página e só então inicializa o display
// Removido daqui - agora é chamado dentro de DOMContentLoaded para garantir ordem correta

// iniciar
async function iniciarTimer(tidParam) {
    // se foi chamado programaticamente com tidParam, usa ele; senão usa selectedTid (ação do usuário)
    const predefinido = !!tidParam;
    const tid = String(tidParam ?? selectedTid);

    if (!tid) {
        if (!predefinido) return alert("Selecione primeiro um agendamento");
        return; // chamado por sync, nada a fazer
    }

    const state = window.__timers__?.[tid];
    if (!state) {
        if (!predefinido) return alert("Terapeuta não tem atendimento ativo");
        return;
    }

    // se já está rodando, nada a fazer
    if (!state.pausado) return;

    // Marca como ativo localmente
    state.pausado = false;
    console.log(`▶️ iniciarTimer(${tid}) - marcado como não pausado, estado agora:`, state);

    // se chamado pelo usuário, atualiza selectedTid
    if (!predefinido) selectedTid = tid;

    // Atualiza botões na UI apenas se o usuário é quem iniciou (evita alertas/errôneos durante sync)
    if (!predefinido) {
        console.log(`▶️ iniciarTimer - chamado pelo usuário, atualizando botões`);
        btnIniciar?.classList.add("d-none");
        btnPausar?.classList.remove("d-none");
        btnReiniciar?.classList.remove("d-none");
        if (btnPausar) {
            btnPausar.innerHTML = '<i class="mdi mdi-pause"></i> Pausar';
            btnPausar.classList.replace("btn-primary", "btn-warning");
        }
    }

    // Cria/Atualiza o atendimento no servidor
    try {
        if (!state.serverId) {
            const payload = {
                colaborador_id: state.colaborador_id || null,
                nome_colaborador: state.nome_colaborador,
                tempoRestante: state.tempo,
                em_andamento: true,
                inicio_atendimento: new Date().toISOString()
            };
            const res = await fetch("/api/atendimentos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const novo = await res.json();
                if (novo && novo._id) state.serverId = novo._id;
                console.log(` iniciarTimer - atendimento criado:`, novo);
            } else {
                console.warn("Falha ao criar atendimento:", await res.text().catch(()=>""));
            }
        } else {
            // marca em andamento no servidor
            console.log(` iniciarTimer - atualizando atendimento existente ${state.serverId}`);
            await fetch(`/api/atendimentos/${state.serverId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tempoRestante: state.tempo, em_andamento: true }),
            }).catch((e) => console.warn("PUT /api/atendimentos falhou", e));
        }

        // sempre re-sync local com servidor para garantir consistência do modal/UI
        console.log(` iniciarTimer - antes de loadTimersFromDB, state.pausado=${state.pausado}`);
        await loadTimersFromDB();
        console.log(` iniciarTimer - depois de loadTimersFromDB, state.pausado=${state.pausado}`);
        
        // IMPORTANTE: garante que permaneça como não-pausado após loadTimersFromDB
        // (pois loadTimersFromDB pode ter resincronizado o estado)
        const estadoAposSync = window.__timers__[tid];
        if (estadoAposSync) {
            estadoAposSync.pausado = false;
            console.log(` iniciarTimer - forcando pausado=false após sync, estado agora:`, estadoAposSync);
        }
    } catch (err) {
        console.error("Erro ao criar/atualizar atendimento no servidor:", err);
    }

    // inicia contagem local (usa tid)
    if (typeof iniciarContagem === "function") iniciarContagem(tid);

    // Sincroniza em segundo plano
    await syncTimerToServer(tid);

    // atualiza UI/modal
    if (!predefinido) {
        carregarTerapeutas();
        atualizarTimersModal();
    } else {
        // para chamadas programáticas somente atualiza modal/displays (não forçar alerts)
        atualizarDisplays(tid);
        atualizarTimersModal();
    }
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

    // Calcula o tempo total baseado em inicio_atendimento e fim_atendimento
    let tempoTotal = 10 * 60; // Fallback: 10 minutos
    
    if (state.inicio_atendimento && state.fim_atendimento) {
        try {
            const inicio = new Date(state.inicio_atendimento);
            const fim = new Date(state.fim_atendimento);
            const diferencaMs = fim - inicio;
            tempoTotal = Math.max(0, Math.round(diferencaMs / 1000)); // Converte para segundos
            console.log(`Reiniciar timer - tempo total calculado: ${tempoTotal}s (${Math.floor(tempoTotal / 60)}m)`);
        } catch (err) {
            console.warn("Erro ao calcular tempo total:", err);
        }
    } else {
        console.warn("Estado não possui inicio_atendimento ou fim_atendimento, usando fallback de 10 minutos");
    }

    state.tempo = tempoTotal;
    state.pausado = true;

    atualizarDisplays(selectedTid);
    atualizarTimersModal();

    btnIniciar.classList.remove("d-none");
    btnPausar.classList.add("d-none");
    btnReiniciar.classList.add("d-none");

    await syncTimerToServer(selectedTid);
}
// Função para restaurar timers quando a página é recarregada
function restaurarTimers() {
    if (!window.__timers__) return;
    
    // Tenta restaurar o selectedTid que foi salvo antes do reload
    const savedTid = localStorage.getItem("selectedTid");
    console.log(" restaurarTimers - savedTid:", savedTid, "window.__timers__:", window.__timers__);
    
    if (savedTid && window.__timers__[savedTid]) {
        selectedTid = savedTid;
        console.log(" Restaurado selectedTid:", savedTid, "tempo:", window.__timers__[savedTid].tempo);
    } else {
        // Fallback para a lógica anterior se não tiver savedTid
        const userId = localStorage.getItem("userId");
        if (userId && window.__timers__[String(userId)]) {
            selectedTid = String(userId);
        } else {
            const tids = Object.keys(window.__timers__);
            const running = tids.find(
                (tid) => window.__timers__[tid] && !window.__timers__[tid].pausado && !window.__timers__[tid].encerrado
            );
            const anyNotClosed = tids.find(
                (tid) => window.__timers__[tid] && !window.__timers__[tid].encerrado
            );
            selectedTid = running || anyNotClosed || null;

            if (!selectedTid && tids.length > 0) {
                selectedTid = tids[0];
            }
        }
    }

    if (selectedTid && window.__timers__[selectedTid]) {
        const state = window.__timers__[selectedTid];
        atualizarDisplays(selectedTid);
        atualizarTimersModal();

        if (state.pausado) {
            btnIniciar?.classList.remove("d-none");
            btnPausar?.classList.add("d-none");
            btnReiniciar?.classList.add("d-none");
        } else {
            btnIniciar?.classList.add("d-none");
            btnPausar?.classList.remove("d-none");
            btnReiniciar?.classList.remove("d-none");
        }
    } else {
        const timerDisplay = document.getElementById("timer");
        if (timerDisplay) timerDisplay.textContent = "00:00";
    }
}

// Função para garantir que oa seleçao do terapeuta esteja fechada 
function PopUpTerapeutafechado() {
    const popupModalEl = document.getElementById("popupTerapeuta");
    if (!popupModalEl) return;

    try {
        // Esconde e descarta qualquer instância do bootstrap Modal associada
        const inst = bootstrap.Modal.getInstance(popupModalEl);
        if (inst) {
            inst.hide();
            inst.dispose(); 
        } else {
            // Se não havia instância, cria, esconde e descarta
            const tmp = new bootstrap.Modal(popupModalEl);
            tmp.hide();
            tmp.dispose();
        }
    } catch (e) {
        // ignore
    }

    // remove classes e backdrops que possam ter sobrado e força style
    popupModalEl.classList.remove("show");
    popupModalEl.style.display = "none";
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    document.body.classList.remove("modal-open");
}

// garante não duplicar o listener (evita múltiplas execuções)
let popupTerapeutaListenerAttached = false;
const popupEl = document.getElementById("popupTerapeuta");
if (popupEl && !popupTerapeutaListenerAttached) {
    popupTerapeutaListenerAttached = true;
    popupEl.addEventListener("show.bs.modal", () => {
        // FORÇA sincronização com o banco antes de carregar
        setTimeout(() => {
            console.log(" Modal aberto - antes de loadTimersFromDB, window.__timers__:", window.__timers__);
            loadTimersFromDB().then(() => {
                console.log("Modal aberto - depois de loadTimersFromDB, window.__timers__:", window.__timers__);
                carregarTerapeutas();
            });
        }, 100);
    });
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
    if (!container) return;
    container.innerHTML = "Carregando...";

    // NÃO chama loadTimersFromDB() aqui - já temos os dados em window.__timers__
    // Apenas busca a lista de terapeutas para renderizar
    try {
        const res = await fetch("/api/terapeutas");
        if (!res.ok) throw new Error("Falha ao carregar terapeutas");
        const terapeutas = await res.json();

        container.innerHTML = "";

        console.log(" carregarTerapeutas - window.__timers__:", window.__timers__);

        terapeutas.forEach((t) => {
            const terapeuta_id = String(t._id);

            // Encontra TODOS os agendamentos ativos para este terapeuta
            // (window.__timers__ agora tem chaves de agendamento, não de terapeuta)
            const estadosTerapeutaAtivos = Object.entries(window.__timers__ || {})
                .filter(([tid, state]) => {
                    return state && 
                           String(state.colaborador_id).trim() === terapeuta_id.trim() && 
                           !state.encerrado;
                })
                .map(([tid, state]) => ({ tid, state }));

            console.log(`👤 Terapeuta ${t.nome_colaborador} (id=${terapeuta_id}): encontrados ${estadosTerapeutaAtivos.length} agendamento(s) ativo(s)`);

            // Se não tem timer rodando, mostra "Sem atendimento"
            if (estadosTerapeutaAtivos.length === 0) {
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

            // Terapeuta COM atendimento(s) - mostra cada agendamento ativo
            estadosTerapeutaAtivos.forEach(({ tid, state }, index) => {
                const card = document.createElement("div");
                card.className =
                    "card-terapeuta d-flex align-items-center gap-2 border border-2 rounded-3 bg-light-subtle p-2 mb-3";

                const unidades =
                    t.unidades_trabalha && t.unidades_trabalha.length > 0
                        ? t.unidades_trabalha.join(", ") + "."
                        : "Não informada.";

                // Se há múltiplos agendamentos, mostra indicador
                const multipleLabel = estadosTerapeutaAtivos.length > 1 ? ` (${index + 1}/${estadosTerapeutaAtivos.length})` : "";

                card.innerHTML = `
    <div class="d-flex align-items-center flex-grow-1 gap-2">
        <img src="/api/colaboradores/${t._id}/imagem" class="avatar border">
        <div class="d-flex flex-column">
            <span class="fw-semibold text-dark">${t.nome_colaborador}${multipleLabel}</span>
            <small class="text-muted mb-0">Unidade: ${unidades}</small>
            <small class="text-muted">Tipo: ${t.tipo_colaborador}</small>
        </div>
    </div>
    <div class="text-end flex-shrink-0">
        <div class="fw-semibold text-secondary small">Timer:</div>
        <div class="fw-bold fs-5 ${state.pausado ? "text-secondary" : "text-success"}" id="timer-display-${tid}">
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
                        localStorage.setItem("selectedTid", tid);
                        
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
            const prev = state.tempo;
            state.tempo = Math.max(0, state.tempo - 1);
            atualizarDisplays(tid);

            // Quando atingir 0, abrir modal de encerramento (comportamento original)
            if (state.tempo === 0 && !state.encerrado && state.serverId) {
                state.encerrado = true;
                window.sessaoEncerrarId = state.serverId;

                const encerrarModalEl = document.getElementById(
                    "encerrarSessaoModal"
                );
                if (encerrarModalEl) {
                    const encerrarModal = bootstrap.Modal.getOrCreateInstance(encerrarModalEl);
                    encerrarModal.show();
                }

                if (selectedTid === tid) {
                    btnIniciar?.classList.remove("d-none");
                    btnPausar?.classList.add("d-none");
                    btnReiniciar?.classList.add("d-none");
                }
            }
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

// --- DETECTA QUANDO A ABA VOLTA AO FOCO E SINCRONIZA COM O SERVIDOR ---
let lastFocusTime = Date.now();
window.addEventListener("focus", async () => {
    const agora = Date.now();
    const tempoDecorrido = Math.floor((agora - lastFocusTime) / 1000); // em segundos
    
    console.log(`Aba voltou ao foco! Tempo que passou: ${tempoDecorrido}s`);
    
    // Atualiza cada timer ativo com o tempo que passou enquanto estava oculto
    if (window.__timers__) {
        Object.keys(window.__timers__).forEach((tid) => {
            const state = window.__timers__[tid];
            if (!state || state.pausado || state.encerrado) return; // Só atualiza se estiver rodando
            
            // Diminui o tempo pelo que passou
            state.tempo = Math.max(0, state.tempo - tempoDecorrido);
            console.log(`   tid=${tid}: tempo agora=${state.tempo}s`);
            
            // Sincroniza com servidor
            syncTimerToServer(tid);
        });
        
        // Atualiza displays
        atualizarDisplays(selectedTid);
        atualizarTimersModal();
    }
    
    // Recarrega dados do banco para garantir consistência
    await loadTimersFromDB();
    atualizarTimersModal();
});

window.addEventListener("blur", () => {
    lastFocusTime = Date.now();
    console.log(" Aba perdeu o foco");
});

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
        PopUpTerapeutafechado();

        setTimeout(() => {
            loadTimersFromDB().then(() => {
                carregarTerapeutas();
                // abre o modal via API do Bootstrap (evita comportamento duplicado por data-* atributos)
                const modalEl = document.getElementById("popupTerapeuta");
                if (modalEl) {
                    try {
                        const modal = new bootstrap.Modal(modalEl);
                        modal.show();
                    } catch (e) {
                        modalEl.classList.add("show");
                        modalEl.style.display = "block";
                        document.body.classList.add("modal-open");
                    }
                }
            });
        }, 120);
    });
}

// id
const perfis = localStorage.getItem("perfis_usuario"); // ex: "Master" ou "Terapeuta"
const tipoUser = localStorage.getItem("tipoUser"); // ex: "admin"

// Mostra botão de abrir modal SelecionarTerapeuta só se for admin
document.addEventListener("DOMContentLoaded", () => {
    PopUpTerapeutafechado();
    const btnAbrirModal = document.getElementById("btnAbrirModal");
    if (tipoUser === "admin" && btnAbrirModal) {
        btnAbrirModal.classList.remove("d-none");
    }

    // carrega timers do banco uma vez na inicialização
    // aguarda loadTimersFromDB terminar ANTES de restaurar o timer
    loadTimersFromDB().then(async () => {
        await carregarAgendamentos();
        console.log(" DOMContentLoaded: após carregarAgendamentos, window.__timers__:", window.__timers__);
        await carregarTerapeutas();
        console.log(" DOMContentLoaded: após carregarTerapeutas");
        restaurarTimers(); // restaura DEPOIS que loadTimersFromDB populou window.__timers__
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
    // IMPORTANTE: usar id do agendamento como tid, não colaborador_id
    // Isto permite múltiplos agendamentos para a mesma pessoa
    const tid = String(id).trim();
    console.log(` selecionarAgendamento - id='${id}' (agendamento) -> tid='${tid}', colaborador='${colaboradorId}'`);
    
    if (!window.__timers__) window.__timers__ = {};

    // Se timer já existe, APENAS alterna a seleção (NÃO muda o tempo)
    if (window.__timers__[tid]) {
        const state = window.__timers__[tid];
        // NÃO altera o tempo - ele mantém o que está rodando
        // Apenas atualiza campos que podem ter mudado
        if (!state.serverId || state.serverId !== id) {
            state.serverId = id;
        }
        state.nome_colaborador =
            colaboradorNome || state.nome_colaborador || "Desconhecido";
        state.colaborador_id = colaboradorId || state.colaborador_id;

        console.log(` Timer já existe para tid=${tid}, tempo mantido=${state.tempo}s`);
    } else {
        // Cria novo timer - PRIMEIRA VEZ que este agendamento é selecionado
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
        console.log(` Timer criado para tid=${tid}, tempo inicial=${tempoSegundos}s`);
    }

    // Define o selecionado
    selectedTid = tid;
    // Salva o selectedTid no localStorage para restaurar após reload
    localStorage.setItem("selectedTid", tid);

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

        // Encontra o state pelo serverId
        const state = Object.values(window.__timers__ || {}).find(
            (t) => t.serverId === window.sessaoEncerrarId
        );

        // Tenta usar nome do state primeiro
        let nomeColaborador = state?.nome_colaborador || null;

        // Se não tiver nome, busca usando colaborador_id
        if (!nomeColaborador && state?.colaborador_id) {
            fbNomeEl.textContent = "👤 Carregando...";
            try {
                const resCol = await fetch(`/api/colaboradores/${state.colaborador_id}`);
                if (resCol.ok) {
                    const colaborador = await resCol.json();
                    nomeColaborador = colaborador.nome_colaborador || null;
                }
            } catch (err) {
                console.warn("Erro ao buscar colaborador:", err);
            }
        }

        fbNomeEl.textContent = `👤 ${nomeColaborador || "Desconhecido"}`;

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
