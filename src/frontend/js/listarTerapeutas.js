async function buscarColaboradores() {
    const container = document.getElementById("container");
    if (!container) {
        console.error("Container não encontrado");
        return;
    }

    try {
        container.innerHTML = "";

        // Cria uma row para os cards
        const row = document.createElement("div");
        row.className = "row g-3";
        container.appendChild(row);

        // Obtém a unidade do localStorage
        const unidadeNome = localStorage.getItem("unidade");

        console.log("Unidade do localStorage:", unidadeNome); // DEBUG

        if (!unidadeNome) {
            const mensagem = document.createElement("div");
            mensagem.className = "alert alert-warning text-center";
            mensagem.textContent =
                "Unidade não identificada. Por favor, faça login novamente.";
            container.appendChild(mensagem);
            return;
        }

        const response = await fetch("/api/listarterapeutas", {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log("Dados recebidos da API:", data); // DEBUG

        if (!data.terapeutas || data.terapeutas.length === 0) {
            const mensagem = document.createElement("div");
            mensagem.className = "alert alert-info text-center";
            mensagem.textContent = "Nenhum terapeuta encontrado.";
            container.appendChild(mensagem);
            return;
        }

        console.log("Terapeutas antes do filtro:", data.terapeutas); // DEBUG

        // Filtra terapeutas pela unidade - verifica se o nome está no array unidades_trabalha
        const terapeutasDaUnidade = data.terapeutas.filter((terapeuta) => {
            console.log(
                `Terapeuta ${terapeuta.nome}: unidades_trabalha=`,
                terapeuta.unidades_trabalha
            ); // DEBUG

            // Verifica se a unidade do localStorage está no array de unidades do terapeuta
            return (
                terapeuta.unidades_trabalha &&
                terapeuta.unidades_trabalha.includes(unidadeNome)
            );
        });

        console.log("Terapeutas filtrados:", terapeutasDaUnidade); // DEBUG

        if (terapeutasDaUnidade.length === 0) {
            const mensagem = document.createElement("div");
            mensagem.className = "alert alert-info text-center";
            mensagem.innerHTML = `
                <p>Nenhum terapeuta encontrado nesta unidade.</p>
                <small class="text-muted">Unidade procurada: ${unidadeNome}</small>
            `;
            container.appendChild(mensagem);
            return;
        }

        terapeutasDaUnidade.forEach((terapeuta) => {
            console.log(
                `Status do terapeuta ${terapeuta.nome}:`,
                terapeuta.status,
                "Em andamento:",
                terapeuta.em_andamento
            ); // DEBUG

            // Converte para UTC para comparação correta
            const agora = new Date();
            const agoraUTC = new Date(
                agora.getTime() + agora.getTimezoneOffset() * 60000
            );

            const inicioAtendimento = terapeuta.inicio_atendimento
                ? new Date(terapeuta.inicio_atendimento)
                : null;
            const fimAtendimento = terapeuta.fim_atendimento
                ? new Date(terapeuta.fim_atendimento)
                : null;

            let back;
            let statusDisplay;
            let textoHorario;

            // Verifica primeiro o status retornado pela API
            if (
                terapeuta.status === "Em sessão" ||
                terapeuta.em_andamento === true
            ) {
                // EM ATENDIMENTO - card vermelho
                back = "bg-danger-subtle";
                statusDisplay = "Em atendimento";
                textoHorario = "Disponível às:";
            } else if (inicioAtendimento && fimAtendimento) {
                const sessaoComecou = agoraUTC >= inicioAtendimento;
                const sessaoTerminou = agoraUTC >= fimAtendimento;

                if (sessaoComecou && !sessaoTerminou) {
                    // Se estiver no horário da sessão - EM ATENDIMENTO
                    back = "bg-danger-subtle";
                    statusDisplay = "Em atendimento";
                    textoHorario = "Disponível às:";
                } else if (!sessaoComecou) {
                    // Se a sessão ainda vai começar - DISPONÍVEL
                    back = "bg-success-subtle";
                    statusDisplay = "Disponível";
                    textoHorario = "Próxima Sessão:";
                } else {
                    // Se a sessão já terminou - DISPONÍVEL
                    back = "bg-success-subtle";
                    statusDisplay = "Disponível";
                    textoHorario = "Próxima Sessão:";
                }
            } else {
                // Se não tiver nenhuma sessão agendada - DISPONÍVEL
                back = "bg-success-subtle";
                statusDisplay = "Disponível";
                textoHorario = "Próxima Sessão:";
            }

            const formatarDataHora = (dataParam) => {
                if (!dataParam) return { hora: "-", data: "-" };

                const data = new Date(dataParam);

                const hora =
                    data.getUTCHours().toString().padStart(2, "0") +
                    ":" +
                    data.getUTCMinutes().toString().padStart(2, "0");

                const dia = data.getUTCDate().toString().padStart(2, "0");
                const mes = (data.getUTCMonth() + 1)
                    .toString()
                    .padStart(2, "0");
                const ano = data.getUTCFullYear();
                const dataFormatada = `${dia}/${mes}/${ano}`;

                return { hora, data: dataFormatada };
            };

            let horarioExibir;

            // Se está em atendimento, mostra quando termina
            if (
                terapeuta.status === "Em sessão" ||
                terapeuta.em_andamento === true
            ) {
                horarioExibir = formatarDataHora(terapeuta.fim_atendimento);
            } else if (inicioAtendimento && fimAtendimento) {
                const sessaoComecou = agora >= inicioAtendimento;
                const sessaoTerminou = agora >= fimAtendimento;

                if (sessaoComecou && !sessaoTerminou) {
                    horarioExibir = formatarDataHora(terapeuta.fim_atendimento);
                } else {
                    horarioExibir = formatarDataHora(
                        terapeuta.inicio_atendimento
                    );
                }
            } else {
                horarioExibir = { hora: "-", data: "-" };
            }

            const statusBadgeClass =
                statusDisplay === "Em atendimento" ? "bg-danger" : "bg-success";

            const card = `
                <div class="col-12 col-md-6 col-lg-4 col-xl-3">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-body ${back} d-flex flex-column rounded rounded-3">
                            <div class="d-flex flex-column align-items-center mb-3">
                                <div class="rounded-4 border shadow-sm overflow-hidden mb-2" style="width:120px;height:120px;">
                                    <img src="${
                                        terapeuta.imagem ||
                                        "/frontend/img/default-avatar.png"
                                    }" 
                                        alt="Foto de ${terapeuta.nome}"
                                        class="w-100 h-100 object-fit-cover">
                                </div>
                            </div>
                            <h6 class="fw-semibold text-center text-truncate mb-2" title="${
                                terapeuta.nome
                            }">${terapeuta.nome}</h6>
                            <div class="d-flex justify-content-center mb-3">
                                <span class="badge ${statusBadgeClass} fw-medium">${statusDisplay}</span>
                            </div>
                            <div class="mt-auto text-center">
                                <small class="text-muted d-block mb-2">${textoHorario}</small>
                                <p class="fw-semibold mb-0">
                                    ${
                                        horarioExibir.hora !== "-"
                                            ? `${horarioExibir.hora}<br><small class="fw-normal">${horarioExibir.data}</small>`
                                            : "Sem horário marcado"
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            row.insertAdjacentHTML("beforeend", card);
        });
    } catch (error) {
        console.error("Erro ao carregar os terapeutas:", error);
        container.innerHTML = `
            <div class="alert alert-danger text-center">
                Erro ao carregar os terapeutas. Por favor, recarregue a página.
            </div>
        `;
    }
}

// Função para atualizar os dados periodicamente
async function atualizarDados() {
    try {
        await buscarColaboradores();
    } catch (error) {
        console.error("Erro na atualização automática:", error);
    }
}

// Executa quando a página carregar e configura atualização automática
document.addEventListener("DOMContentLoaded", () => {
    const tipoUser = localStorage.getItem("tipoUser");

    if (tipoUser !== "admin") {
        const linkCadastro = document.querySelector('a[href*="/cadastrar"]');
        const linkUsuarios = document.querySelector('a[href*="/user/listar"]');
        const dropdownAtendimento =
            document.querySelector(".nav-item.dropdown");

        if (linkCadastro) linkCadastro.parentElement.style.display = "none";
        if (linkUsuarios) linkUsuarios.parentElement.style.display = "none";

        if (dropdownAtendimento) {
            const navbar = dropdownAtendimento.parentElement;

            const escalaLi = document.createElement("li");
            escalaLi.className = "nav-item";
            escalaLi.setAttribute("role", "listitem");
            escalaLi.innerHTML =
                '<a class="nav-link text-secondary fs-6" href="/escala/:id" aria-current="false">Visualizar Escala</a>';

            const sessaoLi = document.createElement("li");
            sessaoLi.className = "nav-item";
            sessaoLi.setAttribute("role", "listitem");
            sessaoLi.innerHTML =
                '<a class="nav-link text-secondary fs-6" href="/sessao/:id" aria-current="false">Gerenciar Sessão</a>';

            const terapeutasLi = document.createElement("li");
            terapeutasLi.className = "nav-item";
            terapeutasLi.setAttribute("role", "listitem");
            terapeutasLi.innerHTML =
                '<a class="nav-link text-secondary fs-6" href="/listarterapeutas/:id" aria-current="false">Listar Terapeutas</a>';

            navbar.insertBefore(terapeutasLi, dropdownAtendimento);
            navbar.insertBefore(sessaoLi, dropdownAtendimento);
            navbar.insertBefore(escalaLi, dropdownAtendimento);

            dropdownAtendimento.remove();
        }
    }

    buscarColaboradores();

    // Atualiza a cada 2 minutos (120000ms)
    setInterval(atualizarDados, 120000);

    const id = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/";
        return;
    }

    const links = {
        escala: document.querySelector('a[href^="/escala"]'),
        postos: document.querySelector('a[href^="/postosatendimento"]'),
        sessao: document.querySelector('a[href^="/sessao"]'),
        terapeutas: document.querySelector('a[href^="/listarterapeutas"]'),
        cadastro: document.querySelector('a[href^="/cadastrar"]'),
        listar: document.querySelector('a[href^="/user/listar"]'),
        inicio: document.querySelector('a[href^="/inicio"]'),
    };

    if (links.escala) links.escala.href = `/escala/${id}`;
    if (links.postos) links.postos.href = `/postosatendimento/${id}`;
    if (links.sessao) links.sessao.href = `/sessao/${id}`;
    if (links.terapeutas) links.terapeutas.href = `/listarterapeutas/${id}`;
    if (links.inicio) links.inicio.href = `/inicio/${id}`;
    if (links.cadastro) links.cadastro.href = `/cadastrar/${id}`;
    if (links.listar) links.listar.href = `/user/listar/${id}`;
});

document.getElementById("sairbutton").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
});
