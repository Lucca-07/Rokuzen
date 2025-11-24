async function buscarColaboradores() {
    const container = document.getElementById("container");
    if (!container) {
        console.error("Container não encontrado");
        return;
    }

    try {
        container.innerHTML = "";

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

            const agora = new Date();

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
                back = "#ff5c5c";
                statusDisplay = "Em atendimento";
                textoHorario = "Disponível às:";
            } else if (inicioAtendimento && fimAtendimento) {
                const sessaoComecou = agora >= inicioAtendimento;
                const sessaoTerminou = agora >= fimAtendimento;

                if (sessaoComecou && !sessaoTerminou) {
                    // Se estiver no horário da sessão - EM ATENDIMENTO
                    back = "#ff5c5c";
                    statusDisplay = "Em atendimento";
                    textoHorario = "Disponível às:";
                } else if (!sessaoComecou) {
                    // Se a sessão ainda vai começar - DISPONÍVEL
                    back = "#aaff64ff";
                    statusDisplay = "Disponível";
                    textoHorario = "Próxima Sessão:";
                } else {
                    // Se a sessão já terminou - DISPONÍVEL
                    back = "#aaff64ff";
                    statusDisplay = "Disponível";
                    textoHorario = "Próxima Sessão:";
                }
            } else {
                // Se não tiver nenhuma sessão agendada - DISPONÍVEL
                back = "#aaff64ff";
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

            const card = `
                <div class="cardtera row w-100 p-3 mt-3 border h-25 d-flex align-content-center"
                    style="border-radius: 30px; background: ${back};" 
                    id="cardtera-${terapeuta.colaborador_id}">
                    <div class="col-12 col-md-6 col-lg-3 d-flex align-self-center align-items-center justify-content-center mb-3 mb-lg-0">
                        <img src="${
                            terapeuta.imagem ||
                            "/frontend/img/default-avatar.png"
                        }" 
                            alt="Foto de ${terapeuta.nome}"
                            class="img-fluid"
                            style="border-radius: 25px; border: 1px solid black; height: 100px; width: 100px; object-fit: cover;">
                    </div>
                    <div class="col-12 col-md-6 col-lg-9 d-flex flex-column flex-lg-row align-items-center justify-content-center text-center gap-3 gap-lg-4">
                        <div class="w-100 w-lg-50">
                            <p class="fs-3 fs-md-2 fw-bold mb-2">${
                                terapeuta.nome
                            }</p>
                            <p class="fs-5 fs-md-3 mb-0">${statusDisplay}</p>
                        </div>
                        <div class="w-100 w-lg-50">
                            <p class="fs-4 fs-md-2 fw-semibold mb-2">${textoHorario}</p>
                            <p class="fs-6 fs-md-4 mb-0">${
                                horarioExibir.hora !== "-"
                                    ? `${horarioExibir.hora} - ${horarioExibir.data}`
                                    : "Sem horário marcado"
                            }</p>
                        </div>
                    </div>
                </div>
            `;

            container.insertAdjacentHTML("beforeend", card);
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
