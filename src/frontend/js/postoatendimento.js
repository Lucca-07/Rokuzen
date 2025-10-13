const menubtn = document.getElementById("menubtn");
function abrirMenu() {
  const dropcnt = document.getElementById("dropcnt");
  dropcnt.classList.toggle("d-none");
}

const statusMap = {
  verde: "Disponível",
  vermelho: "Ocupado",
  amarelo: "Manutenção",
  laranja: "Intervalo",
};

const colorMap = {
  Disponível: "verde",
  Ocupado: "vermelho",
  Manutenção: "amarelo",
  Intervalo: "laranja",
};

function abrirPopup(tipo) {
  fecharTodosPopups();
  const popup = document.getElementById(`popup-${tipo}`);
  if (popup) popup.style.display = "flex";
}

function fecharTodosPopups() {
  document.querySelectorAll(".popup-bg").forEach((popup) => {
    popup.style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".popup").forEach((popup) => {
    const tipo = popup.querySelector("h2").textContent.split(" ")[0].toLowerCase();
    const frame = popup.querySelector(".frame");
    const btnAdicionar = popup.querySelector(".adicionar");
    const btnConfirmar = popup.querySelector(".confirmar");

    btnAdicionar.addEventListener("click", () => {
      const itens = frame.querySelectorAll(".linha");
      const numero = itens.length + 1;

      const linha = document.createElement("div");
      linha.classList.add("linha");

      const item = document.createElement("div");
      item.classList.add("item", "verde");
      item.textContent = `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ${numero}`;

      const statusSelect = document.createElement("select");
      statusSelect.classList.add("status-select");

      ["Disponível", "Ocupado", "Manutenção", "Intervalo"].forEach((opcao) => {
        const option = document.createElement("option");
        option.value = opcao;
        option.textContent = opcao;
        statusSelect.appendChild(option);
      });

      statusSelect.value = "Disponível";

      statusSelect.addEventListener("change", () => {
        const novaCor = colorMap[statusSelect.value];
        item.classList.remove("verde", "vermelho", "amarelo", "laranja");
        item.classList.add(novaCor);
      });

      const trash = document.createElement("div");
      trash.classList.add("trash");
      trash.innerHTML = "🗑️";
      trash.addEventListener("click", () => linha.remove());

      linha.append(item);
      linha.insertAdjacentHTML("beforeend", `<span>Status:</span>`);
      linha.append(statusSelect, trash);
      frame.append(linha);
    });

    btnConfirmar.addEventListener("click", () => {
      popup.parentElement.style.display = "none";
    });
  });
});