// ==========================================================
// 1. Variáveis de Estado e Configurações
// ==========================================================
let dataAtual = new Date(); // Começamos com a data de hoje.
let eventos = []; // Array para armazenar todos os agendamentos.
let celulaSelecionada = null; // Armazena a célula (horário) para agendamento/edição.
let eventoEmEdicao = null; // Armazena o objeto evento se estiver em modo de edição.

// Configurações de Horário (Fácil de ajustar aqui!)
const HORA_INICIO = 9;
const HORA_FIM = 18;
const INTERVALO_MINUTOS = 30;

// Elementos do DOM
const tabelaCalendario = document.getElementById('tabela-calendario');
const semanaAtualElement = document.getElementById('semana-atual');
const modal = document.getElementById('modal-agendamento');
const fecharBtn = document.querySelector('.fechar-btn');
const formAgendamento = document.getElementById('form-agendamento');
const horarioSelecionadoDisplay = document.getElementById('horario-selecionado');
// Novos Elementos
const btnSalvar = document.getElementById('btn-salvar');
const btnExcluir = document.getElementById('btn-excluir');


// ==========================================================
// 2. Funções de Utilidade de Data
// ==========================================================

/**
 * Retorna a data de início da semana (domingo) baseada na data fornecida.
 * @param {Date} data - A data de referência.
 * @returns {Date} - O primeiro dia da semana (Domingo, 00:00:00).
 */
function getInicioSemana(data) {
    const dia = data.getDay(); // 0 (Domingo) a 6 (Sábado)
    const inicio = new Date(data);
    inicio.setDate(data.getDate() - dia);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
}

/**
 * Formata um objeto Date para uma string 'DD/MM'.
 * @param {Date} data - A data a ser formatada.
 * @returns {string} - A data formatada.
 */
function formatarData(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
}

// ==========================================================
// 3. Renderização do Calendário
// ==========================================================

/**
 * Gera a tabela do calendário para a semana atual.
 */
function renderizarCalendario() {
    const inicioSemana = getInicioSemana(dataAtual);
    const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let datas = [];
    
    // 3.1. Calcular Datas da Semana
    for (let i = 0; i < 7; i++) {
        const data = new Date(inicioSemana);
        data.setDate(inicioSemana.getDate() + i);
        datas.push(data);
    }

    // 3.2. Atualizar o Título da Semana
    const dataInicialFormatada = formatarData(datas[0]);
    const dataFinalFormatada = formatarData(datas[6]);
    semanaAtualElement.textContent = `${dataInicialFormatada} - ${dataFinalFormatada}`;

    // 3.3. Gerar o Cabeçalho (Thead)
    let theadHTML = '<tr><th>Horário</th>';
    datas.forEach((data, index) => {
        const diaNome = diasDaSemana[index];
        const dataFormatada = formatarData(data);
        theadHTML += `<th>${diaNome}<br>(${dataFormatada})</th>`;
    });
    theadHTML += '</tr>';
    tabelaCalendario.querySelector('thead').innerHTML = theadHTML;

    // 3.4. Gerar o Corpo (Tbody) com os Horários
    let tbodyHTML = '';
    const hoje = new Date();
    
    for (let h = HORA_INICIO; h < HORA_FIM; h++) {
        for (let m = 0; m < 60; m += INTERVALO_MINUTOS) {
            const horario = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            
            let linha = `<tr><td>${horario}</td>`;
            
            datas.forEach(data => {
                const chaveData = new Date(data.getFullYear(), data.getMonth(), data.getDate(), h, m);
                const dataKey = chaveData.toISOString().slice(0, 16); // Ex: "2025-10-03T09:00"
                
                let classeHoje = data.toDateString() === hoje.toDateString() ? 'hoje' : '';
                
                linha += `<td class="horario-celula ${classeHoje}" data-time="${dataKey}"></td>`;
            });
            
            linha += '</tr>';
            tbodyHTML += linha;
        }
    }
    tabelaCalendario.querySelector('tbody').innerHTML = tbodyHTML;

    // 3.5. Adicionar Eventos Existentes e Listeners de Clique
    adicionarListenersCelulas();
    exibirEventos();
}

// ==========================================================
// 4. Gerenciamento de Eventos (CRUD)
// ==========================================================

/**
 * Exibe todos os eventos no calendário.
 */
function exibirEventos() {
    document.querySelectorAll('.evento').forEach(el => el.remove());

    eventos.forEach((evento, index) => {
        const celula = document.querySelector(`[data-time="${evento.dataHora}"]`);
        
        if (celula && !celula.querySelector('.evento')) { 
            const divEvento = document.createElement('div');
            divEvento.classList.add('evento');
            // Adiciona o ID/Index do evento para facilitar a edição/exclusão
            divEvento.dataset.eventoIndex = index; 
            divEvento.title = `${evento.funcionario} - ${evento.tipoTrabalho}\nEquipamentos: ${evento.equipamentos || 'Nenhum'}`;
            
            divEvento.textContent = `${evento.funcionario.split(' ')[0]} / ${evento.tipoTrabalho.split(' ')[0]}`;
            
            celula.appendChild(divEvento);
        }
    });
}

/**
 * Exclui um evento do array.
 * @param {string} dataHora - A chave de data/hora do evento a ser excluído.
 */
function excluirEvento(dataHora) {
    // Filtra o array, mantendo apenas os eventos que NÃO correspondem à dataHora
    const indexParaExcluir = eventos.findIndex(e => e.dataHora === dataHora);
    if (indexParaExcluir > -1) {
        eventos.splice(indexParaExcluir, 1);
        exibirEventos(); // Redesenha os eventos
    }
}


// ==========================================================
// 5. Interações do Usuário (Cliques e Formulário)
// ==========================================================

/**
 * Configura os listeners de clique nas células de horário e nos eventos.
 */
function adicionarListenersCelulas() {
    document.querySelectorAll('.horario-celula').forEach(celula => {
        celula.addEventListener('click', (e) => {
            const dataHoraKey = celula.dataset.time; 
            const eventoDiv = e.target.closest('.evento');

            if (eventoDiv) {
                // Modo EDIÇÃO: Se clicou em um evento
                const index = parseInt(eventoDiv.dataset.eventoIndex);
                abrirModalEdicao(eventos[index]);
            } else {
                // Modo CRIAÇÃO: Se clicou em uma célula vazia
                celulaSelecionada = celula;
                abrirModalCriacao(dataHoraKey);
            }
        });
    });
}

/**
 * Prepara e abre o modal para a criação de um novo agendamento.
 * @param {string} dataHoraKey - A chave de data/hora da célula clicada.
 */
function abrirModalCriacao(dataHoraKey) {
    eventoEmEdicao = null;
    formAgendamento.reset(); // Limpa o formulário

    // Configura o modal para criação
    document.getElementById('horario-selecionado').textContent = new Date(dataHoraKey).toLocaleString('pt-BR', {
        weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    
    btnSalvar.textContent = 'Salvar Agendamento';
    btnExcluir.style.display = 'none'; // Esconde o botão de excluir
    modal.style.display = 'block';
}

/**
 * Prepara e abre o modal para a edição de um agendamento existente.
 * @param {object} evento - O objeto evento a ser editado.
 */
function abrirModalEdicao(evento) {
    eventoEmEdicao = evento;
    celulaSelecionada = document.querySelector(`[data-time="${evento.dataHora}"]`);

    // Preenche o formulário com os dados existentes
    document.getElementById('funcionario').value = evento.funcionario;
    document.getElementById('tipo-trabalho').value = evento.tipoTrabalho;
    document.getElementById('equipamentos').value = evento.equipamentos || '';
    document.getElementById('equipamentoss').value = evento.equipamentoss
    
    // Configura o modal para edição
    document.getElementById('horario-selecionado').textContent = new Date(evento.dataHora).toLocaleString('pt-BR', {
        weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
    
    btnSalvar.textContent = 'Salvar Alterações';
    btnExcluir.style.display = 'block'; // Mostra o botão de excluir
    modal.style.display = 'block';
}


// Listener para o formulário (Salvar/Editar)
formAgendamento.addEventListener('submit', function(e) {
    e.preventDefault(); 

    const dados = {
        dataHora: celulaSelecionada.dataset.time,
        funcionario: document.getElementById('funcionario').value,
        tipoTrabalho: document.getElementById('tipo-trabalho').value,
        equipamentos: document.getElementById('equipamentos').value || null,
        equipamentoss: document.getElementsById('equipamentoss').values
    };

    if (eventoEmEdicao) {
        // Modo Edição: Atualiza os dados no objeto original
        const index = eventos.findIndex(e => e.dataHora === eventoEmEdicao.dataHora);
        if (index > -1) {
            // Se a data/hora não foi alterada (mantendo o evento no mesmo lugar)
            eventos[index] = { ...eventos[index], ...dados }; 
        }
    } else {
        // Modo Criação: Adiciona um novo evento
        eventos.push(dados);
    }

    // Fecha e Limpa
    modal.style.display = 'none';
    formAgendamento.reset();
    celulaSelecionada = null;
    eventoEmEdicao = null;
    exibirEventos(); // Redesenha a tela
});

// Listener para o botão Excluir
btnExcluir.addEventListener('click', () => {
    if (eventoEmEdicao && confirm('Tem certeza que deseja excluir esta reserva?')) {
        excluirEvento(eventoEmEdicao.dataHora);
        modal.style.display = 'none';
        celulaSelecionada = null;
        eventoEmEdicao = null;
    }
});


// ==========================================================
// 6. Navegação Semanal e Inicialização
// ==========================================================

// Função para voltar para a semana atual
document.getElementById('btn-hoje').addEventListener('click', () => {
    dataAtual = new Date(); // Reseta para a data de hoje
    renderizarCalendario();
});

// Listener para fechar o modal
fecharBtn.onclick = function() {
    modal.style.display = 'none';
    celulaSelecionada = null;
    eventoEmEdicao = null;
    formAgendamento.reset();
}

// Fechar o modal ao clicar fora dele
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
        celulaSelecionada = null;
        eventoEmEdicao = null;
        formAgendamento.reset();
    }
}

// Navegação Semanal
document.getElementById('btn-anterior').addEventListener('click', () => {
    dataAtual.setDate(dataAtual.getDate() - 7);
    renderizarCalendario();
});

document.getElementById('btn-proximo').addEventListener('click', () => {
    dataAtual.setDate(dataAtual.getDate() + 7);
    renderizarCalendario();
});

// Inicialização
document.addEventListener('DOMContentLoaded', renderizarCalendario);