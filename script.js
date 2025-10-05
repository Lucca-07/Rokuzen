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
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
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
  document.querySelectorAll("#Adicionar1min, #Adicionar5min, #Adicionar10min").forEach(btn => {
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
  document.querySelector(".timer-circle").style.backgroundColor = "rgb(225, 239, 197)";

  // volta os botões de adicionar tempo para o estilo padrão
  document.querySelectorAll("#Adicionar1min, #Adicionar5min, #Adicionar10min").forEach(btn => {
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
