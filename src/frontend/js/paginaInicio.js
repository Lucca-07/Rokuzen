document.getElementById("sairbutton").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/";
});

// ==================================
// CONFIGURAÇÃO DE LINKS E TOKEN
// ==================================
document.addEventListener("DOMContentLoaded", async () => {
  const pathParts = window.location.pathname.split("/");
  const id = pathParts[pathParts.length - 1];

  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/";
    return;
  }

  try {
    const res = await fetch(`/api/colaboradores/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/";
      return;
    }

    if (!res.ok) {
      const err = await res.json();
      console.error("Erro ao carregar dados:", err);
      alert(err.msg || "Erro ao carregar dados.");
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
  } catch (error) {
    console.error("Erro de rede:", error);
    alert("Erro de rede. Tente novamente.");
  }
});

// ==================================
// LISTAR E FILTRAR EQUIPAMENTOS POR UNIDADE
// ==================================
document.addEventListener("DOMContentLoaded", async () => {
  const tabela = document.getElementById("tabela-equipamentos");
  const unidade = localStorage.getItem("unidade");

  if (!unidade) {
    console.error("Nenhuma unidade encontrada no localStorage");
    tabela.innerHTML = "<tr><td colspan='2'>Unidade não definida.</td></tr>";
    return;
  }

  try {
    console.log("🔍 Carregando equipamentos da unidade:", unidade);

    const response = await fetch(`/api/equipamentos/disponiveis?unidade=${encodeURIComponent(unidade)}`);

    if (!response.ok) {
      throw new Error(`Erro na resposta da API (${response.status})`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Resposta não está em formato JSON");
    }

    const data = await response.json();
    console.log("Equipamentos disponíveis:", data);

    if (!data || data.length === 0) {
      tabela.innerHTML = "<tr><td colspan='2'>Nenhum equipamento disponível.</td></tr>";
      return;
    }

    const equipamentosFiltrados = data.filter(eq =>
      eq.status && eq.status.toLowerCase().includes("dispon")
    );

    tabela.innerHTML = equipamentosFiltrados
      .map(
        eq => `
        <tr>
          <td>${eq.nome_posto || "Sem nome"}</td>
          <td>${eq.status || "Sem status"}</td>
        </tr>
      `
      )
      .join("");
  } catch (error) {
    console.error("Erro ao carregar equipamentos:", error);
    tabela.innerHTML = "<tr><td colspan='2'>Erro ao carregar equipamentos.</td></tr>";
  }
});
