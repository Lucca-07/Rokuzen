let dataAtual = new Date();
let eventos = [];
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
const modalAlterElementosPopUp = document.querySelector(".modal-conteudo");

function getInicioSemana(data) {
  const dia = data.getDay();
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

async function carregarEventosDaSemana() {
  const inicioSemana = getInicioSemana(dataAtual);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(fimSemana.getDate() + 7);

  const inicioISO = inicioSemana.toISOString();
  const fimISO = fimSemana.toISOString();

  try {
    const response = await fetch(
      `/api/atendimentos?inicio=${inicioISO}&fim=${fimISO}`
    );
    if (!response.ok) {
      throw new Error("Falha ao buscar agendamentos.");
    }
    const eventosDoServidor = await response.json();

    eventos = eventosDoServidor.map((evento) => {
      const nomeColaborador = evento.colaborador_id
        ? evento.colaborador_id.nome_colaborador
        : "N/D";
      const idColaborador = evento.colaborador_id
        ? evento.colaborador_id._id
        : null;
      const nomeServico = evento.servico_id
        ? evento.servico_id.nome_servico
        : "N/D";
      const idServico = evento.servico_id ? evento.servico_id._id : null;

      return {
        id: evento._id,
        dataHora: evento.inicio_atendimento.slice(0, 16),
        funcionario: nomeColaborador,
        funcionarioId: idColaborador,
        tipoTrabalho: nomeServico,
        tipoTrabalhoId: idServico,
        unidadeId: evento.unidade_id,
        postoId: evento.posto_id,
      };
    });

    exibirEventos();
  } catch (error) {
    console.error("Erro ao carregar eventos:", error);
    alert("Não foi possível carregar os agendamentos.");
  }
}

async function renderizarCalendario() {
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
        const dataKey = `${ano}-${mes}-${dia}T${hora}:${minuto}`;
        let classeHoje =
          data.toDateString() === hoje.toDateString() ? "hoje" : "";
        linha += `<td class="horario-celula ${classeHoje}" data-time="${dataKey}"></td>`;
      });

      linha += "</tr>";
      tbodyHTML += linha;
    }

  await carregarEventosDaSemana();
  adicionarListenersCelulas();
}

async function carregarEquipamentos(unidadeId, equipamentoAtualId = null) {
  const selectEquipamento = document.getElementById("equipamento");
  selectEquipamento.innerHTML =
    '<option value="selecao">Carregando...</option>';
  selectEquipamento.disabled = true;


  try {
    // Constrói a URL da API dinamicamente
    let apiUrl = `/api/postos?unidade_id=${unidadeId}&status=Disponível`;
    if (equipamentoAtualId) {
      apiUrl += `&incluir_posto_id=${equipamentoAtualId}`;
    }

    const response = await fetch(apiUrl);
    const equipamentos = await response.json();

    selectEquipamento.innerHTML =
      '<option value="selecao" selected disabled>Selecione o equipamento</option>';

    if (equipamentos.length === 0) {
      selectEquipamento.innerHTML =
        '<option value="selecao">Nenhum equipamento disponível</option>';
      return;
    }

    equipamentos.forEach((eq) => {
      const option = document.createElement("option");
      option.value = eq._id;
      option.textContent = eq.nome_posto;
      selectEquipamento.appendChild(option);
    });

    selectEquipamento.disabled = false;
  } catch (error) {
    console.error("Erro ao carregar equipamentos:", error);
    selectEquipamento.innerHTML =
      '<option value="selecao">Erro ao carregar</option>';
  }
}

// SUBSTITUA PELA VERSÃO QUE ACEITA UM PARÂMETRO
async function carregarOpcoesDoFormulario(unidadePredefinida = null) {
  const selectFuncionario = document.getElementById("funcionario");
  const selectServico = document.getElementById("tipo-trabalho");
  const selectUnidade = document.getElementById("unidade");

  // Limpa tudo
  selectFuncionario.innerHTML = '<option value="selecao">Selecione o colaborador</option>';
  selectServico.innerHTML = '<option value="selecao">Selecione o serviço</option>';
  selectUnidade.innerHTML = '<option value="selecao">Selecione a unidade</option>';

  try {
    // Busca colaboradores e serviços em paralelo
    const [resColaboradores, resServicos] = await Promise.all([
      fetch("/api/colaboradores"),
      fetch("/api/servicos")
    ]);

    const colaboradores = await resColaboradores.json();
    colaboradores.forEach((colab) => {
      const option = document.createElement("option");
      option.value = colab._id;
      option.textContent = colab.nome_colaborador;
      selectFuncionario.appendChild(option);
    });

    const servicos = await resServicos.json();
    servicos.forEach((servico) => {
      const option = document.createElement("option");
      option.value = servico._id;
      option.textContent = servico.nome_servico;
      selectServico.appendChild(option);
    });

    // LÓGICA DA UNIDADE ATUALIZADA
    if (unidadePredefinida) {
      // Se recebemos uma unidade, só adicionamos essa opção
      const option = document.createElement("option");
      option.value = unidadePredefinida._id;
      option.textContent = unidadePredefinida.nome_unidade;
      selectUnidade.appendChild(option);
    } else {
      // Se não, busca todas (comportamento antigo)
      const resUnidades = await fetch("/api/unidades");
      const unidades = await resUnidades.json();
      unidades.forEach((unidade) => {
        const option = document.createElement("option");
        option.value = unidade._id;
        option.textContent = unidade.nome_unidade;
        selectUnidade.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Erro ao carregar opções do formulário:", error);
    alert("Não foi possível carregar os dados para agendamento.");
  }
}

async function inicializarFormularioEUnidade() {
  const nomeUnidadeSalva = localStorage.getItem("unidade");

  // CASO 1: Não há unidade no localStorage (o utilizador precisa de escolher)
  if (!nomeUnidadeSalva) {
    console.log("Nenhuma unidade no localStorage. Carregando formulário para seleção manual.");
    // Carrega todos os formulários normalmente
    await carregarOpcoesDoFormulario(); 
    // E adiciona o listener para o utilizador poder escolher
    document.getElementById("unidade").addEventListener("change", (evento) => {
      carregarEquipamentos(evento.target.value);
    });
    return; // Termina a função aqui
  }

  // CASO 2: Encontrámos uma unidade no localStorage!
  try {
    console.log(`Unidade encontrada no localStorage: ${nomeUnidadeSalva}. A configurar automaticamente...`);
    
    // 1. PRIMEIRO: Busca os dados da unidade pelo nome
    const response = await fetch(`/api/unidade-por-nome?nome=${encodeURIComponent(nomeUnidadeSalva)}`);
    if (!response.ok) {
      throw new Error("Unidade do localStorage não foi encontrada na base de dados.");
    }
    const unidade = await response.json();

    // 2. SEGUNDO: Manda carregar os formulários, JÁ PASSANDO a unidade que encontrámos
    await carregarOpcoesDoFormulario(unidade);

    // 3. TERCEIRO: Define o valor do dropdown (que agora já tem a opção certa) e desativa-o
    const selectUnidade = document.getElementById("unidade");
    selectUnidade.value = unidade._id;
    selectUnidade.disabled = true;

    // 4. QUARTO E ÚLTIMO: Manda carregar os equipamentos para esta unidade
    await carregarEquipamentos(unidade._id);
    console.log("Configuração automática da unidade concluída com sucesso!");

  } catch (error) {
    console.error("Erro ao configurar unidade do localStorage:", error);
    alert("A unidade guardada é inválida ou não foi encontrada. Por favor, verifique o nome no localStorage ou faça login novamente.");
    localStorage.removeItem("unidade");
    // Em caso de erro, carrega o formulário normal para seleção manual
    await carregarOpcoesDoFormulario();
  }
}

function exibirEventos() {
  document.querySelectorAll(".evento").forEach((el) => el.remove());

  const eventosPorCelula = eventos.reduce((acc, evento) => {
    const key = evento.dataHora;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(evento);
    return acc;
  }, {});

  Object.keys(eventosPorCelula).forEach((dataHoraKey) => {
    const eventosDaCelula = eventosPorCelula[dataHoraKey];
    const celula = document.querySelector(`[data-time="${dataHoraKey}"]`);

    if (celula) {
      celula.innerHTML = "";

      if (eventosDaCelula.length >= 5) {
        celula.classList.add("limite-atingido");
      } else {
        celula.classList.remove("limite-atingido");
      }

      eventosDaCelula.forEach((eventoDetalhe) => {
        const divEvento = document.createElement("div");
        divEvento.classList.add("evento");

        divEvento.dataset.eventoId = eventoDetalhe.id;

        divEvento.title = `${eventoDetalhe.funcionario} - ${eventoDetalhe.tipoTrabalho}`;
        divEvento.textContent = `${eventoDetalhe.funcionario.split(" ")[0]}`;

        celula.appendChild(divEvento);
      });
    }
  });
}

function adicionarListenersCelulas() {
  document.querySelectorAll(".horario-celula").forEach((celula) => {
    const newCelula = celula.cloneNode(true);
    celula.parentNode.replaceChild(newCelula, celula);
  });

  document.querySelectorAll(".horario-celula").forEach((celula) => {
    celula.addEventListener("click", (e) => {
      const dataHoraKey = celula.dataset.time;
      const eventoDiv = e.target.closest(".evento");

      if (eventoDiv) {
        const eventoId = eventoDiv.dataset.eventoId;

        const eventoCompleto = eventos.find((evt) => evt.id === eventoId);

        if (eventoCompleto) {
          abrirModalEdicao(eventoCompleto);
        }
      } else {
        const eventosAtuais = eventos.filter(
          (ev) => ev.dataHora === dataHoraKey
        ).length;

        if (eventosAtuais >= 5) {
          alert("Limite de 5 agendamentos atingido para este horário.");
          return;
        }

        celulaSelecionada = celula;
        abrirModalCriacao(dataHoraKey);
      }
    });
}
async function abrirModalCriacao(dataHoraKey) {
  eventoEmEdicao = null;

  const unidadeId = document.getElementById("unidade").value;
  formAgendamento.reset();

  await carregarEquipamentos(unidadeId);

  // const selectEquipamento = document.getElementById("equipamento");
  // selectEquipamento.innerHTML =
  //   '<option value="selecao">Selecione uma unidade primeiro</option>';
  // selectEquipamento.disabled = true;

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

async function abrirModalEdicao(evento) {
  eventoEmEdicao = evento;
  celulaSelecionada = document.querySelector(
    `[data-time="${evento.dataHora}"]`
  );

  await carregarEquipamentos(evento.unidadeId, evento.postoId);

  if (evento.postoId) {
    document.getElementById("equipamento").value = evento.postoId;
  }

  document.getElementById("funcionario").value = evento.funcionarioId;
  document.getElementById("tipo-trabalho").value = evento.tipoTrabalhoId;
  document.getElementById("unidade").value = evento.unidadeId;

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
}

formAgendamento.addEventListener("submit", async function (e) {
  e.preventDefault();

  const dadosParaEnviar = {
    colaborador_id: document.getElementById("funcionario").value,
    servico_id: document.getElementById("tipo-trabalho").value,
    // unidade_id: document.getElementById("unidade").value,
    posto_id: document.getElementById("equipamento").value,
  };

  if (
    (dadosParaEnviar.colaborador_id === "selecao" ||
      dadosParaEnviar.servico_id === "selecao" ||
      dadosParaEnviar.unidade_id === "selecao" ||
    dadosParaEnviar.posto_id === "selecao")
  ) {
    alert("Por favor, selecione todos os tópicos");
    return;
  }

  let urlAPI = "/escala/atendimento";
  let metodoHTTP = "POST";

  if (eventoEmEdicao) {
    urlAPI = `/api/atendimentos/${eventoEmEdicao.id}`;
    metodoHTTP = "PUT";
  } else {
    dadosParaEnviar.dataHora = celulaSelecionada.dataset.time;
  }

  try {
    const response = await fetch(urlAPI, {
      method: metodoHTTP,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosParaEnviar),
    });

    const resultado = await response.json();

    if (response.ok) {
      alert(resultado.mensagem);
      await carregarEventosDaSemana();
    } else {
      alert(`Erro: ${resultado.mensagem}`);
    }
  } catch (error) {
    alert("Houve um erro de conexão com o servidor.");
    console.error("Erro no fetch:", error);
  }

  modal.style.display = "none";
  formAgendamento.reset();
  celulaSelecionada = null;
  eventoEmEdicao = null;
});

btnExcluir.addEventListener("click", async () => {
  if (
    eventoEmEdicao &&
    confirm("Tem certeza que deseja excluir esta reserva?")
  ) {
    try {
      const urlAPI = `/api/atendimentos/${eventoEmEdicao.id}`;
      const response = await fetch(urlAPI, {
        method: "DELETE",
      });

      const resultado = await response.json();

      if (response.ok) {
        alert(resultado.mensagem);
        await carregarEventosDaSemana();
      } else {
        alert(`Erro ao excluir: ${resultado.mensagem}`);
      }
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      alert("Houve um erro de conexão ao tentar excluir o agendamento.");
    }

    modal.style.display = "none";
    formAgendamento.reset();
    celulaSelecionada = null;
    eventoEmEdicao = null;
    exibirEventos(); // Redesenha a tela
});

// Listener para o botão Excluir
btnExcluir.addEventListener("click", () => {
    if (
        eventoEmEdicao &&
        confirm("Tem certeza que deseja excluir esta reserva?")
    ) {
        excluirEvento(eventoEmEdicao.dataHora);
        modal.style.display = "none";
        celulaSelecionada = null;
        eventoEmEdicao = null;
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
};

// Fechar o modal ao clicar fora dele
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

document.addEventListener("DOMContentLoaded", () => {
  renderizarCalendario();
  // Esta função agora orquestra todo o carregamento do formulário
  inicializarFormularioEUnidade(); 
});

// document.getElementById("unidade").addEventListener("change", (evento) => {
//   const unidadeId = evento.target.value;
//   carregarEquipamentos(unidadeId);
// });

async function teste() {
  try {
    const response = await fetch("/escala/atendimento", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        nome_colaborador: variavel_do_nome,
        servico: variavel_servico,
      },
    });
  } catch (error) {}
}
