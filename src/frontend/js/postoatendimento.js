const menubtn = document.getElementById("menubtn");
function abrirMenu() {
  const dropcnt = document.getElementById("dropcnt");
  dropcnt.classList.toggle("d-none");
}

function abrirPopup(tipo) {
  fecharTodosPopups();
  const popup = document.getElementById(`popup-${tipo}`);
  if (popup) popup.style.display = "flex";
}

function fecharPopup(tipo) {
  const popup = document.getElementById(`popup-${tipo}`);
  if (popup) popup.style.display = "none";
}

function fecharTodosPopups() {
  document.querySelectorAll(".popup-bg").forEach((popup) => {
    popup.style.display = "none";
  });
}

/* === Funções de Interação === */
document.addEventListener("DOMContentLoaded", () => {
  // Adiciona eventos a todos os botões de cada popup
  document.querySelectorAll(".popupposto").forEach((popup) => {
    const tipo = popup.parentElement.id.replace("popup-", "");
    const frame = popup.querySelector(".frameposto");
    const btns = popup.querySelectorAll(".btncustom");

    const btnRemover = btns[0];
    const btnAdicionar = btns[1];
    const btnConfirmar = btns[2];

    // Ao clicar em "Adicionar"
    btnAdicionar.addEventListener("click", () => {
      const itens = frame.querySelectorAll(".itemposto");
      const novoNumero = itens.length + 1;

      const novoItem = document.createElement("div");
      novoItem.classList.add("itemposto", "verde");
      novoItem.textContent =
        tipo.charAt(0).toUpperCase() + tipo.slice(1) + " " + novoNumero;

      // Adiciona o evento de alternar cor
      novoItem.addEventListener("click", alternarCor);

      frame.insertBefore(novoItem, btnRemover);
    });

    // Ao clicar em "Remover"
    btnRemover.addEventListener("click", () => {
      const itens = frame.querySelectorAll(".itemposto");
      if (itens.length > 0) {
        const ultimo = itens[itens.length - 1];
        ultimo.remove();
      }
    });

    // Ao clicar em "Confirmar"
    btnConfirmar.addEventListener("click", () => {
      fecharPopup(tipo);
    });

    // Adiciona alternância de cor nos itens existentes
    frame.querySelectorAll(".itemposto").forEach((item) => {
      item.addEventListener("click", alternarCor);
    });
  });
});

/* === Alternância de Cores === */
function alternarCor(event) {
  const cores = ["verde", "amarelo", "vermelho", "laranja"];
  const item = event.target;

  // Descobre a cor atual
  const corAtual = cores.find((c) => item.classList.contains(c));
  let proximaCor;

  if (corAtual) {
    const index = cores.indexOf(corAtual);
    proximaCor = cores[(index + 1) % cores.length];
    item.classList.remove(corAtual);
  } else {
    proximaCor = "verde"; // caso inicial
  }

  item.classList.add(proximaCor);
}

