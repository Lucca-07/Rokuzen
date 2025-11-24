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

// instância do modal bootstrap
let bsModal = null;
// guarda o id da unidade atual
let unidadeIdAtual = null;

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
    hoje.setHours(0, 0, 0, 0); // resetar horas pra comparar só a data

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
                const mes = String(dataHoraLocal.getMonth() + 1).padStart(
                    2,
                    "0"
                );
                const dia = String(dataHoraLocal.getDate()).padStart(2, "0");
                const hora = String(dataHoraLocal.getHours()).padStart(2, "0");
                const minuto = String(dataHoraLocal.getMinutes()).padStart(
                    2,
                    "0"
                );
                const dataKey = `${ano}-${mes}-${dia}T${hora}:${minuto}`;

                // verifica se é hoje
                let classeHoje =
                    data.toDateString() === new Date().toDateString()
                        ? "hoje"
                        : "";

                // verifica se já passou
                const agora = new Date();
                const dataHoraCompleta = new Date(dataKey);
                const jaPassou = dataHoraCompleta < agora;

                // adiciona classe se passou
                let classePassado = jaPassou ? "passado" : "";

                linha += `<td class="horario-celula ${classeHoje} ${classePassado}" data-time="${dataKey}" ${
                    jaPassou ? 'data-passado="true"' : ""
                }></td>`;
            });

            linha += "</tr>";
            tbodyHTML += linha;
        }
        tabelaCalendario.querySelector("tbody").innerHTML = tbodyHTML;

        await carregarEventosDaSemana();
        adicionarListenersCelulas();
    }
}

async function carregarEquipamentos(
    unidadeId,
    equipamentoAtualId = null,
    dataHora = null
) {
    const selectEquipamento = document.getElementById("equipamento");
    selectEquipamento.innerHTML =
        '<option value="selecao">Carregando...</option>';
    selectEquipamento.disabled = true;

    // valida se tem unidade
    if (!unidadeId || unidadeId === "selecao" || unidadeId === "") {
        selectEquipamento.innerHTML =
            '<option value="selecao">Selecione uma unidade primeiro</option>';
        return;
    }

    try {
        // monta a url da api
        let apiUrl = `/api/postos?unidade_id=${unidadeId}&status=Disponivel`;
        if (equipamentoAtualId) {
            apiUrl += `&incluir_posto_id=${equipamentoAtualId}`;
        }
        // passa o horário pra verificar conflitos
        if (dataHora) {
            apiUrl += `&dataHora=${encodeURIComponent(dataHora)}`;
        }

        const response = await fetch(apiUrl);

        // verifica se deu certo
        if (!response.ok) {
            const erro = await response.json();
            console.error("❌ Erro na API de equipamentos:", erro);
            selectEquipamento.innerHTML =
                '<option value="selecao">Erro ao carregar equipamentos</option>';
            return;
        }

        const equipamentos = await response.json();


        // verifica se é array
        if (!Array.isArray(equipamentos)) {
            console.error("❌ Resposta da API não é um array:", equipamentos);
            selectEquipamento.innerHTML =
                '<option value="selecao">Erro: resposta inválida do servidor</option>';
            return;
        }

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

        // define o valor do equipamento depois de carregar tudo
        if (equipamentoAtualId) {
            // verifica se existe na lista
            const equipamentoExiste = Array.from(
                selectEquipamento.options
            ).some((option) => option.value === equipamentoAtualId);

            if (equipamentoExiste) {
                selectEquipamento.value = equipamentoAtualId;
            } else {
                console.warn(
                    "Equipamento atual não encontrado na lista:",
                    equipamentoAtualId
                );
            }
        }
    } catch (error) {
        console.error("Erro ao carregar equipamentos:", error);
        selectEquipamento.innerHTML =
            '<option value="selecao">Erro ao carregar</option>';
    }
}

async function carregarOpcoesDoFormulario(unidadePredefinida = null) {
    const selectFuncionario = document.getElementById("funcionario");
    const selectServico = document.getElementById("tipo-trabalho");
    const selectUnidade = document.getElementById("unidade");

    // limpa tudo
    selectFuncionario.innerHTML =
        '<option value="selecao" selected disabled>Selecione o colaborador: </option>';
    selectServico.innerHTML =
        '<option value="selecao" selected disabled>Selecione o serviço: </option>';
    selectUnidade.innerHTML =
        '<option value="selecao" selected disabled>Selecione a unidade: </option>';

    try {
        const unidade = localStorage.getItem("unidade");
        // busca em paralelo
        const [resColaboradores, resServicos] = await Promise.all([
            fetch(`/api/colaboradores/`),
            fetch("/api/servicos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    unidade: localStorage.getItem("unidade"),
                }),
            }),
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

        // lógica da unidade
        if (unidadePredefinida) {
            // se tem unidade predefinida, só adiciona ela
            const option = document.createElement("option");
            option.value = unidadePredefinida._id;
            option.textContent = unidadePredefinida.nome_unidade;
            selectUnidade.appendChild(option);
        } else {
            // senão busca todas
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

    // caso 1: não tem unidade no localStorage
    if (!nomeUnidadeSalva) {
        await carregarOpcoesDoFormulario();
        // adiciona listener pra escolher
        document
            .getElementById("unidade")
            .addEventListener("change", (evento) => {
                unidadeIdAtual = evento.target.value;
                carregarEquipamentos(evento.target.value);
            });
        return;
    }

    // caso 2: tem unidade no localStorage
    try {

        // busca a unidade pelo nome
        const response = await fetch(
            `/api/unidade-por-nome?nome=${encodeURIComponent(nomeUnidadeSalva)}`
        );
        if (!response.ok) {
            throw new Error(
                "Unidade do localStorage não foi encontrada na base de dados."
            );
        }
        const unidade = await response.json();

        // carrega formulários com a unidade
        await carregarOpcoesDoFormulario(unidade);

        // define o valor e desativa
        const selectUnidade = document.getElementById("unidade");
        selectUnidade.value = unidade._id;
        selectUnidade.disabled = true;

        // atualiza variável global
        unidadeIdAtual = unidade._id;

        // carrega equipamentos
        await carregarEquipamentos(unidade._id);
    } catch (error) {
        console.error("Erro ao configurar unidade do localStorage:", error);
        alert(
            "A unidade guardada é inválida ou não foi encontrada. Por favor, verifique o nome no localStorage ou faça login novamente."
        );
        localStorage.removeItem("unidade");
        // em caso de erro, carrega normal
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
                divEvento.textContent = `${
                    eventoDetalhe.funcionario.split(" ")[0]
                }`;

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

            // se clicou no evento, sempre permite editar (mesmo se passado)
            if (eventoDiv) {
                const eventoId = eventoDiv.dataset.eventoId;

                const eventoCompleto = eventos.find(
                    (evt) => evt.id === eventoId
                );

                if (eventoCompleto) {
                    abrirModalEdicao(eventoCompleto);
                }
                return; // já tratou o clique
            }

            // se clicou na célula vazia, verifica se passou
            const jaPassou = celula.dataset.passado === "true";

            if (jaPassou) {
                // não permite criar em horários passados
                alert(
                    "Não é possível criar agendamentos em horários que já passaram."
                );
                return;
            }

            // célula não passada e vazia - permite criar
            const eventosAtuais = eventos.filter(
                (ev) => ev.dataHora === dataHoraKey
            ).length;

            if (eventosAtuais >= 5) {
                alert("Limite de 5 agendamentos atingido para este horário.");
                return;
            }

            celulaSelecionada = celula;
            abrirModalCriacao(dataHoraKey);
        });
    });
}
async function abrirModalCriacao(dataHoraKey) {
    eventoEmEdicao = null;
    document.getElementById("titulo-agendamento").innerHTML =
        "Novo Agendamento";

    // usa a variável global ou pega do campo
    let unidadeId = unidadeIdAtual || document.getElementById("unidade").value;

    // se não tem, tenta pegar do localStorage
    if (!unidadeId || unidadeId === "selecao" || unidadeId === "") {
        const nomeUnidadeSalva = localStorage.getItem("unidade");
        if (nomeUnidadeSalva) {
            // busca a unidade pelo nome
            try {
                const response = await fetch(
                    `/api/unidade-por-nome?nome=${encodeURIComponent(
                        nomeUnidadeSalva
                    )}`
                );
                if (response.ok) {
                    const unidade = await response.json();
                    unidadeId = unidade._id;
                    unidadeIdAtual = unidadeId;
                }
            } catch (error) {
                console.error("Erro ao buscar unidade:", error);
            }
        }
    } else {
        // atualiza variável global
        unidadeIdAtual = unidadeId;
    }

    formAgendamento.reset();

    document.getElementById("unidade").value = unidadeId;

    // passa o horário pra verificar conflitos
    await carregarEquipamentos(unidadeId, null, dataHoraKey);

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

    // usa instância existente ou cria nova
    if (!bsModal) {
        bsModal = new bootstrap.Modal(modal, {
            backdrop: true,
            keyboard: true,
        });
    }
    bsModal.show();
}

async function abrirModalEdicao(evento) {
    eventoEmEdicao = evento;

    unidadeIdAtual = evento.unidadeId;
    celulaSelecionada = document.querySelector(
        `[data-time="${evento.dataHora}"]`
    );

    // verifica se já passou
    const dataHoraEvento = new Date(evento.dataHora);
    const agora = new Date();
    const eventoPassado = dataHoraEvento < agora;

    // carrega equipamentos com o horário pra verificar conflitos
    await carregarEquipamentos(
        evento.unidadeId,
        evento.postoId,
        evento.dataHora
    );

    document.getElementById("titulo-agendamento").innerHTML = eventoPassado
        ? "Visualizar Agendamento (Passado)"
        : "Editar Agendamento";
    document.getElementById("funcionario").value = evento.funcionarioId;
    document.getElementById("tipo-trabalho").value = evento.tipoTrabalhoId;
    document.getElementById("unidade").value = evento.unidadeId;

    // adiciona ou remove mensagem
    let mensagemInfo = document.getElementById("mensagem-passado");
    if (eventoPassado) {
        if (!mensagemInfo) {
            mensagemInfo = document.createElement("div");
            mensagemInfo.id = "mensagem-passado";
            mensagemInfo.className = "alert alert-info";
            mensagemInfo.textContent =
                "Este agendamento já passou e não pode ser editado.";
            const modalBody = document.querySelector(".modal-body");
            modalBody.insertBefore(mensagemInfo, modalBody.firstChild);
        }
        mensagemInfo.style.display = "block";
    } else {
        if (mensagemInfo) {
            mensagemInfo.style.display = "none";
        }
    }

    // desabilita campos se passou
    const funcionarioSelect = document.getElementById("funcionario");
    const servicoSelect = document.getElementById("tipo-trabalho");
    const equipamentoSelect = document.getElementById("equipamento");

    if (eventoPassado) {
        funcionarioSelect.disabled = true;
        servicoSelect.disabled = true;
        equipamentoSelect.disabled = true;
        btnSalvar.style.display = "none"; // esconde botão salvar
    } else {
        funcionarioSelect.disabled = false;
        servicoSelect.disabled = false;
        equipamentoSelect.disabled = false;
        btnSalvar.style.display = "block"; // mostra botão salvar
    }

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

    // usa instância existente ou cria nova
    if (!bsModal) {
        bsModal = new bootstrap.Modal(modal, {
            backdrop: true,
            keyboard: true,
        });
    }
    bsModal.show();
}

formAgendamento.addEventListener("submit", async function (e) {
    e.preventDefault();

    // verifica se está editando evento passado
    if (eventoEmEdicao) {
        const dataHoraEvento = new Date(eventoEmEdicao.dataHora);
        const agora = new Date();
        if (dataHoraEvento < agora) {
            alert("Não é possível editar agendamentos que já passaram.");
            return;
        }
    }

    // pega o valor da unidade (mesmo se desabilitado)
    const selectUnidade = document.getElementById("unidade");
    const unidadeValue =
        unidadeIdAtual || selectUnidade.value || eventoEmEdicao?.unidadeId;

    const dadosParaEnviar = {
        colaborador_id: document.getElementById("funcionario").value,
        servico_id: document.getElementById("tipo-trabalho").value,
        unidade_id: unidadeValue,
        posto_id: document.getElementById("equipamento").value,
    };

    // atualiza variável global
    unidadeIdAtual = dadosParaEnviar.unidade_id;

    if (
        dadosParaEnviar.colaborador_id === "selecao" ||
        dadosParaEnviar.servico_id === "selecao" ||
        dadosParaEnviar.posto_id === "selecao"
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

    // fecha modal
    if (bsModal) {
        bsModal.hide();
    }
    // não faz reset aqui - deixa o fecharModalLimparFormulario fazer
    celulaSelecionada = null;
    eventoEmEdicao = null;
});

btnExcluir.addEventListener("click", async () => {
    if (
        eventoEmEdicao &&
        confirm("Tem certeza que deseja excluir essa reserva?")
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

        // fecha modal
        if (bsModal) {
            bsModal.hide();
        }
        formAgendamento.reset();
        celulaSelecionada = null;
        eventoEmEdicao = null;
        exibirEventos(); // redesenha
    }
});

document.getElementById("btn-hoje").addEventListener("click", () => {
    dataAtual = new Date();
    renderizarCalendario();
});

function fecharModalLimparFormulario() {
    // guarda o id da unidade
    const unidadeId =
        unidadeIdAtual || document.getElementById("unidade").value;

    // reseta formulário
    formAgendamento.reset();

    // reabilita campos (caso tenham sido desabilitados)
    document.getElementById("funcionario").disabled = false;
    document.getElementById("tipo-trabalho").disabled = false;
    document.getElementById("equipamento").disabled = false;
    btnSalvar.style.display = "block"; // mostra botão salvar

    // recoloca o id da unidade
    if (unidadeId && unidadeId !== "selecao" && unidadeId !== "") {
        const selectUnidade = document.getElementById("unidade");
        selectUnidade.value = unidadeId;
    }

    // mantém desativado se veio do localStorage
    if (localStorage.getItem("unidade")) {
        const selectUnidade = document.getElementById("unidade");
        selectUnidade.disabled = true;
    }

    // limpa estado
    celulaSelecionada = null;
    eventoEmEdicao = null;
}

document.getElementById("btn-anterior").addEventListener("click", () => {
    dataAtual.setDate(dataAtual.getDate() - 7);
    renderizarCalendario();
});

document.getElementById("btn-proximo").addEventListener("click", () => {
    dataAtual.setDate(dataAtual.getDate() + 7);
    renderizarCalendario();
});

document.addEventListener("DOMContentLoaded", () => {
    const tipoUser = localStorage.getItem("tipoUser");

    if (tipoUser !== "admin") {
        // Oculta links de Cadastro e Usuários no menu
        const linkCadastro = document.querySelector('a[href*="/cadastrar"]');
        const linkUsuarios = document.querySelector('a[href*="/user/listar"]');

        if (linkCadastro) linkCadastro.parentElement.style.display = "none";
        if (linkUsuarios) linkUsuarios.parentElement.style.display = "none";
    }
    // inicializa modal bootstrap uma vez só
    if (modal) {
        bsModal = new bootstrap.Modal(modal, {
            backdrop: true,
            keyboard: true,
        });

        // quando fecha o modal, limpa formulário
        modal.addEventListener("hidden.bs.modal", function () {
            fecharModalLimparFormulario();
        });
    }

    renderizarCalendario();
    // carrega formulário
    inicializarFormularioEUnidade();
    const pathParts = window.location.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

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

fecharBtn.onclick = fecharModalLimparFormulario;

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

document.getElementById("sairbutton").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
});
