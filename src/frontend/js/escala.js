let dataAtual = new Date(); // data de hoje.
let eventos = []; // Array armazena todos os agendamentos.
let celulaSelecionada = null;
let eventoEmEdicao = null;


const HORA_INICIO = 9;
const HORA_FIM = 23;
const INTERVALO_MINUTOS = 60;


const tabelaCalendario = document.getElementById("tabela-calendario");
const modal = document.getElementById("modal-agendamento");
const fecharBtn = document.querySelector(".fechar-btn");
const formAgendamento = document.getElementById("form-agendamento");
const horarioSelecionadoDisplay = document.getElementById(
  "horario-selecionado"
);
const btnSalvar = document.getElementById("btn-salvar");
const btnExcluir = document.getElementById("btn-excluir");
const modalAlterElementosPopUp = document.querySelector(".modal-conteudo")


function getInicioSemana(data) {
  const dia = data.getDay(); // 0 (Domingo) a 6 (Sábado)
  const inicio = new Date(data);
  inicio.setDate(data.getDate() - dia);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}


function formatarData(data) {
  const dia = String(data.getDate()).padStart(2, "0"); 
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}


function renderizarCalendario() {
  const inicioSemana = getInicioSemana(dataAtual);
  const diasDaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  let datas = [];

  
  for (let i = 0; i < 7; i++) {
    const data = new Date(inicioSemana);
    data.setDate(inicioSemana.getDate() + i);
    datas.push(data);
  }

  
  let theadHTML = "<tr><th>Horário</th>";
  datas.forEach((data, index) => {
    const diaNome = diasDaSemana[index];
    const dataFormatada = formatarData(data);
    theadHTML += `<th>${diaNome}<br>(${dataFormatada})</th>`;
  });
  theadHTML += "</tr>";
  tabelaCalendario.querySelector("thead").innerHTML = theadHTML;

  
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
       
        const dataHoraLocal = new Date(
          data.getFullYear(),
          data.getMonth(),
          data.getDate(),
          h,
          m
        ); 
        const ano = dataHoraLocal.getFullYear();
        const mes = String(dataHoraLocal.getMonth() + 1).padStart(2, "0");
        const dia = String(dataHoraLocal.getDate()).padStart(2, "0");
        const hora = String(dataHoraLocal.getHours()).padStart(2, "0");
        const minuto = String(dataHoraLocal.getMinutes()).padStart(2, "0");
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


function exibirEventos() {
    // 1. Limpa todos os eventos existentes na interface
    document.querySelectorAll(".evento").forEach((el) => el.remove());

    // 2. Agrupa eventos por dataHora, garantindo que o 'index' esteja em cada objeto
    const eventosPorCelula = eventos.reduce((acc, evento, index) => {
        const key = evento.dataHora;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push({ ...evento, index }); 
        return acc;
    }, {});

    // 3. Itera sobre as células e adiciona TODOS os eventos
    Object.keys(eventosPorCelula).forEach(dataHoraKey => {
        const eventosDaCelula = eventosPorCelula[dataHoraKey];
        const celula = document.querySelector(`[data-time="${dataHoraKey}"]`);
        
        if (celula) {
            
            celula.innerHTML = ''; // Limpa antes de adicionar todos
            
            // Adiciona classe de limite se for o caso
            if (eventosDaCelula.length >= 5) {
                celula.classList.add('limite-atingido');
            } else {
                celula.classList.remove('limite-atingido');
            }
            
            // Renderiza TODOS OS EVENTOS DA CÉLULA (o loop que faltava)
            eventosDaCelula.forEach((eventoDetalhe) => {
                
                const divEvento = document.createElement("div");
                divEvento.classList.add("evento");
                
                // Adiciona o INDEX do evento original - CRUCIAL PARA EDIÇÃO
                divEvento.dataset.eventoIndex = eventoDetalhe.index; 
                divEvento.dataset.dataHora = dataHoraKey; 
                
                divEvento.title = `${eventoDetalhe.funcionario} - ${
                    eventoDetalhe.tipoTrabalho
                }\nEquipamentos: ${eventoDetalhe.equipamentoss || "Nenhum"}`;
                
                // Exibe o nome do funcionário
                divEvento.textContent = `${eventoDetalhe.funcionario.split(" ")[0]}`;

                celula.appendChild(divEvento);
            });
        }
    });
}

function excluirEvento(indexParaExcluir) {
    // Verifica se o índice é válido antes de remover
    if (indexParaExcluir !== undefined && indexParaExcluir > -1) {
        // Usa o índice diretamente para remover 1 elemento a partir daquele ponto
        eventos.splice(indexParaExcluir, 1);
        exibirEventos(); 
    }
}

function adicionarListenersCelulas() {
    // Clona e substitui para remover listeners antigos e evitar duplicação
    document.querySelectorAll(".horario-celula").forEach((celula) => {
        const newCelula = celula.cloneNode(true);
        celula.replaceWith(newCelula);
    });

    // Readquire as células para adicionar os novos listeners
    document.querySelectorAll(".horario-celula").forEach((celula) => {
        celula.addEventListener("click", (e) => {
            const dataHoraKey = celula.dataset.time;
            
            // Verifica se o clique foi diretamente em um DIV.EVENTO
            const eventoDiv = e.target.closest(".evento"); 
            
            // Conta quantos eventos já existem para este horário
            const eventosAtuais = eventos.filter(e => e.dataHora === dataHoraKey).length;
            
            if (eventoDiv) {
                // MODO EDIÇÃO: Clicou em um evento específico
                const index = parseInt(eventoDiv.dataset.eventoIndex);
                
                // Passamos o objeto evento COMPLETO, incluindo o índice
                const eventoCompleto = { ...eventos[index], index: index };
                abrirModalEdicao(eventoCompleto);
                
            } else if (e.target.classList.contains('horario-celula') || e.target.classList.contains('limite-atingido')) {
                // MODO CRIAÇÃO: Clicou no fundo da célula
                
                if (eventosAtuais >= 5) {
                    alert("Limite de 5 agendamentos atingido para este horário. Não é possível adicionar mais.");
                    return; // Impede a abertura do modal
                }

                celulaSelecionada = celula;
                abrirModalCriacao(dataHoraKey);
            }
        });
    });
}

function abrirModalCriacao(dataHoraKey) {
  eventoEmEdicao = null;
  formAgendamento.reset();

  
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
  btnExcluir.style.display = "none"; 
  modal.style.display = "flex";
  modal.style.alignItems = "center";   
  modal.style.justifyContent = "center"; 
  modalAlterElementosPopUp.style.backgroundColor = "#fff"; 
  modalAlterElementosPopUp.style.padding = "35px";
  modalAlterElementosPopUp.style.border = "2px solid #ccc";
  modalAlterElementosPopUp.style.borderRadius = "10px";
}


function abrirModalEdicao(evento) {
  eventoEmEdicao = evento;
  celulaSelecionada = document.querySelector(
    `[data-time="${evento.dataHora}"]`
  );

  
  document.getElementById("funcionario").value = evento.funcionario;
  document.getElementById("tipo-trabalho").value = evento.tipoTrabalho;
 
  document.getElementById("equipamentoss").value = evento.equipamentoss;

  
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
  btnExcluir.style.display = "block"; 
  modal.style.display = "flex";
  modal.style.alignItems = "center";  
  modal.style.justifyContent = "center"; 
  modalAlterElementosPopUp.style.backgroundColor = "#fff"; 
  modalAlterElementosPopUp.style.padding = "35px";
  modalAlterElementosPopUp.style.border = "2px solid #ccc";
}


formAgendamento.addEventListener("submit", function (e) {
  e.preventDefault();

  const dados = {
    dataHora: celulaSelecionada.dataset.time,
    funcionario: document.getElementById("funcionario").value,
    tipoTrabalho: document.getElementById("tipo-trabalho").value,
    equipamentoss: document.getElementById("equipamentoss").value || null,
  };

  if (eventoEmEdicao) {
    const indexParaAtualizar = eventoEmEdicao.index;
    if (indexParaAtualizar !== undefined && indexParaAtualizar > -1) {
      eventos[indexParaAtualizar] = { ...eventos[indexParaAtualizar], ...dados };
    }
  } else {
    eventos.push(dados);
  }

  
  modal.style.display = "none";
  formAgendamento.reset();
  celulaSelecionada = null;
  eventoEmEdicao = null;
  exibirEventos(); 
});


btnExcluir.addEventListener("click", () => {
    // eventoEmEdicao agora contém o 'index' correto graças às correções anteriores.
    if (
        eventoEmEdicao &&
        confirm("Tem certeza que deseja excluir esta reserva?")
    ) {
        // *** CORREÇÃO APLICADA AQUI ***
        // Chamamos excluirEvento passando o índice (index) do evento a ser excluído
        excluirEvento(eventoEmEdicao.index); 
        
        modal.style.display = "none";
        celulaSelecionada = null;
        eventoEmEdicao = null;
        // Não precisamos chamar exibirEventos() novamente, pois ele é chamado dentro de excluirEvento
    }
});


document.getElementById("btn-hoje").addEventListener("click", () => {
  dataAtual = new Date(); 
  renderizarCalendario();
});


fecharBtn.onclick = function () {
  modal.style.display = "none";
  celulaSelecionada = null;
  eventoEmEdicao = null;
  formAgendamento.reset();
};


window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
    celulaSelecionada = null;
    eventoEmEdicao = null;
    formAgendamento.reset();
  }
};


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
