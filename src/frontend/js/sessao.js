// navbar
const menubtn = document.getElementById("menubtn");
function abrirMenu() {
    const dropcnt = document.getElementById("dropcnt");
    dropcnt.classList.toggle("d-none");
}

// Timer
let tempo = 10 * 60; // 10 minutos em segundos
let intervalo = null;
let pausado = false;

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
    timerDisplay.textContent = formatarTempo(tempo);
}

// Inicializa o display
atualizarDisplay();

// Função Iniciar
function iniciarTimer() {
    if (intervalo !== null) return;

    // muda a cor do círculo para #A2C838 quando iniciar
    document.querySelector(".timer-circle").style.backgroundColor = "#A2C838";

    // muda a cor dos botões de adicionar tempo para #B9DE6B com 50% de transparência
    document
        .querySelectorAll("#Adicionar1min, #Adicionar5min, #Adicionar10min")
        .forEach((btn) => {
            btn.style.backgroundColor = "rgba(185, 222, 107, 0.5)";
            btn.style.borderColor = "rgba(0, 0, 0, 0.5)";
            btn.style.color = "black";
        });

    intervalo = setInterval(() => {
        if (tempo > 0) {
            tempo--;
            atualizarDisplay();
        } else {
            clearInterval(intervalo);
            intervalo = null;
            alert("⏰ O tempo acabou!");
        }
    }, 1000);

    // troca os botões
    btnIniciar.classList.add("d-none");
    btnPausar.classList.remove("d-none");
    btnReiniciar.classList.remove("d-none");
    btnPausar.textContent = "Pausar";
    pausado = false;
}

// Função Pausar/Continuar
function pausarOuContinuar() {
    if (!pausado) {
        // Pausar
        clearInterval(intervalo);
        intervalo = null;
        pausado = true;
        btnPausar.textContent = "Continuar";
        btnPausar.classList.remove("btn-warning");
        btnPausar.classList.add("btn-primary");
    } else {
        // Continuar
        iniciarTimer();
        btnPausar.textContent = "Pausar";
        btnPausar.classList.remove("btn-primary");
        btnPausar.classList.add("btn-warning");
    }
}

// Função Reiniciar
function reiniciarTimer() {
    clearInterval(intervalo);
    intervalo = null;
    tempo = 10 * 60;
    atualizarDisplay();

    // volta para a cor original do círculo
    document.querySelector(".timer-circle").style.backgroundColor =
        "rgb(225, 239, 197)";

    // volta os botões de adicionar tempo para o estilo padrão
    document
        .querySelectorAll("#Adicionar1min, #Adicionar5min, #Adicionar10min")
        .forEach((btn) => {
            btn.style.backgroundColor = "";
            btn.style.borderColor = "";
            btn.style.color = "";
        });

    // esconde os botões Pausar e Reiniciar
    document.getElementById("btnPausar").classList.add("d-none");
    document.getElementById("btnReiniciar").classList.add("d-none");

    // mostra o botão Iniciar
    document.getElementById("btnIniciar").classList.remove("d-none");
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
    tempo += 60; // +1 minuto
    atualizarDisplay();
});

btnAdicionar5.addEventListener("click", () => {
    tempo += 5 * 60; // +5 minutos
    atualizarDisplay();
});

btnAdicionar10.addEventListener("click", () => {
    tempo += 10 * 60; // +10 minutos
    atualizarDisplay();
});

function popterapeuta() {
    document.getElementById("poptera").classList.toggle("d-none");
}

// função para buscar e renderizar no modal os timers ativos
async function carregarTerapeutas() {
    const container = document.getElementById("listaTerapeutas");
    container.innerHTML = "Carregando...";
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
            card.innerHTML = `
                    <img src="/frontend/img/account-outline.svg" alt="Foto Terapeuta" class="avatar">
                    <div>
                        <span class="fw-medium small">${terapeuta.nome_colaborador}</span>
                        <p class="small mb-0">Tipo: ${terapeuta.tipo_colaborador}</p>
                    </div>
                    <div class="ms-auto text-end small">
                        <div>Timer:</div>
                        <div class="fw-semibold">${terapeuta.tempoRestante != null ? formatSeconds(terapeuta.tempoRestante) : 'Sem timer'}</div>
                    </div>
`;
            container.appendChild(card);
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


