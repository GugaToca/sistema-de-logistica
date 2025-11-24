// Estado em memória
let transportadoras = JSON.parse(localStorage.getItem("transportadoras_v1") || "[]");
let cargas = JSON.parse(localStorage.getItem("cargas_v1") || "[]");

let transportadoraSelecionada = null;
let cargaEditandoId = null;

/* Utilitários de storage */
function salvarEstado() {
  localStorage.setItem("transportadoras_v1", JSON.stringify(transportadoras));
  localStorage.setItem("cargas_v1", JSON.stringify(cargas));
}

/* Troca de página */
function mostrarPagina(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("visible"));
  document.getElementById("page-" + pageId).classList.add("visible");

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });

  // Atualiza dashboard ao abrir
  if (pageId === "dashboard") {
    atualizarDashboard();
  }
}

/* Sidebar mobile */
function configurarMenu() {
  const body = document.body;
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");

  function abrir() {
    body.classList.add("sidebar-open");
  }

  function fechar() {
    body.classList.remove("sidebar-open");
  }

  menuToggle.addEventListener("click", () => {
    if (body.classList.contains("sidebar-open")) fechar();
    else abrir();
  });

  backdrop.addEventListener("click", fechar);

  // Fechar ao clicar em item de menu no mobile
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      mostrarPagina(btn.dataset.page);
      fechar();
    });
  });
}

/* Transportadoras */
function atualizarListaTransportadoras() {
  const tbody = document.getElementById("lista-transportadoras");
  tbody.innerHTML = "";

  transportadoras.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.nome}</td>
      <td>${t.codigo}</td>
    `;
    tbody.appendChild(tr);
  });

  atualizarDashboard(); // refez métrica
}

function adicionarTransportadora() {
  const nome = document.getElementById("transp-nome").value.trim();
  const codigo = document.getElementById("transp-codigo").value.trim();

  if (!nome || !codigo) {
    alert("Preencha nome e código.");
    return;
  }

  if (transportadoras.some(t => t.codigo === codigo)) {
    alert("Já existe uma transportadora com esse código.");
    return;
  }

  transportadoras.push({ id: Date.now(), nome, codigo });
  salvarEstado();
  atualizarListaTransportadoras();

  document.getElementById("transp-nome").value = "";
  document.getElementById("transp-codigo").value = "";
}

/* Buscar transportadora para carga */
function buscarTransportadora() {
  const codigo = document.getElementById("codigo-busca").value.trim();
  const formCarga = document.getElementById("form-carga");
  const nomeTranspSpan = document.getElementById("nome-transp");

  if (!codigo) {
    alert("Informe o código da transportadora.");
    return;
  }

  const encontrada = transportadoras.find(t => t.codigo === codigo);

  if (!encontrada) {
    alert("Transportadora não encontrada. Cadastre primeiro.");
    formCarga.classList.add("hidden");
    transportadoraSelecionada = null;
    nomeTranspSpan.textContent = "";
    return;
  }

  transportadoraSelecionada = encontrada;
  nomeTranspSpan.textContent = encontrada.nome + " (" + encontrada.codigo + ")";
  formCarga.classList.remove("hidden");
}

/* Salvar/atualizar carga */
function salvarCarga() {
  if (!transportadoraSelecionada) {
    alert("Busque primeiro a transportadora pelo código.");
    return;
  }

  const numero = document.getElementById("num-carga").value.trim();
  const pedidos = document.getElementById("total-pedidos").value.trim();
  const volumes = document.getElementById("total-volumes").value.trim();
  const destino = document.getElementById("destino").value.trim();
  const status = document.getElementById("status").value;
  const observacao = document.getElementById("observacao").value.trim();
  const problemas = document.getElementById("problemas").value.trim();

  if (!numero) {
    alert("Informe o número da carga.");
    return;
  }

  const agora = new Date();

  if (cargaEditandoId) {
    // Atualiza existente
    const idx = cargas.findIndex(c => c.id === cargaEditandoId);
    if (idx !== -1) {
      cargas[idx] = {
        ...cargas[idx],
        numero,
        pedidos,
        volumes,
        destino,
        status,
        observacao,
        problemas,
        transportadora: transportadoraSelecionada.nome,
        codigo: transportadoraSelecionada.codigo
      };
    }
  } else {
    // Nova carga
    const nova = {
      id: Date.now(),
      transportadora: transportadoraSelecionada.nome,
      codigo: transportadoraSelecionada.codigo,
      numero,
      pedidos,
      volumes,
      destino,
      observacao,
      problemas,
      status,
      dataCriacao: agora.toLocaleString()
    };
    cargas.push(nova);
  }

  salvarEstado();
  atualizarListaCargas();
  atualizarDashboard();

  alert("Carga salva com sucesso.");

  // Limpa formulário
  cargaEditandoId = null;
  document.getElementById("num-carga").value = "";
  document.getElementById("total-pedidos").value = "";
  document.getElementById("total-volumes").value = "";
  document.getElementById("destino").value = "";
  document.getElementById("status").value = "aberto";
  document.getElementById("observacao").value = "";
  document.getElementById("problemas").value = "";
}

/* Listar cargas */
function atualizarListaCargas() {
  const tbody = document.getElementById("lista-cargas");
  tbody.innerHTML = "";

  cargas
    .slice() // copia
    .sort((a, b) => b.id - a.id)
    .forEach(c => {
      const tr = document.createElement("tr");

      const statusClass = c.status === "aberto" ? "status-aberto" : "status-fechado";
      const statusLabel = c.status === "aberto" ? "ABERTO" : "FECHADO";

      tr.innerHTML = `
        <td>${c.transportadora} (${c.codigo})</td>
        <td>${c.numero}</td>
        <td>${c.volumes || "-"}</td>
        <td>${c.pedidos || "-"}</td>
        <td>${c.destino || "-"}</td>
        <td><span class="status-chip ${statusClass}">${statusLabel}</span></td>
        <td>${c.dataCriacao || "-"}</td>
        <td>
          <button class="btn-secondary btn-small" data-acao="editar" data-id="${c.id}">
            Editar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

/* Dashboard */
function atualizarDashboard() {
  const spanTransp = document.getElementById("metric-transportadoras");
  const spanAbertas = document.getElementById("metric-abertas");
  const spanFechadas = document.getElementById("metric-fechadas");
  const tbodyDashboard = document.getElementById("dashboard-cargas");

  if (!spanTransp) return; // ainda não montou DOM

  spanTransp.textContent = transportadoras.length;

  const abertas = cargas.filter(c => c.status === "aberto").length;
  const fechadas = cargas.filter(c => c.status === "fechado").length;

  spanAbertas.textContent = abertas;
  spanFechadas.textContent = fechadas;

  tbodyDashboard.innerHTML = "";

  cargas
    .slice()
    .sort((a, b) => b.id - a.id)
    .slice(0, 5)
    .forEach(c => {
      const statusClass = c.status === "aberto" ? "status-aberto" : "status-fechado";
      const statusLabel = c.status === "aberto" ? "ABERTO" : "FECHADO";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.transportadora} (${c.codigo})</td>
        <td>${c.numero}</td>
        <td>${c.volumes || "-"}</td>
        <td>${c.pedidos || "-"}</td>
        <td><span class="status-chip ${statusClass}">${statusLabel}</span></td>
        <td>${c.dataCriacao || "-"}</td>
      `;
      tbodyDashboard.appendChild(tr);
    });
}

/* Editar carga */
function prepararEdicaoCarga(id) {
  const c = cargas.find(x => x.id === id);
  if (!c) return;

  if (c.status === "fechado") {
    alert("Essa carga está FECHADA e não pode ser editada.");
    return;
  }

  // Vai para página de nova carga
  mostrarPagina("nova-carga");

  // Preenche dados
  document.getElementById("codigo-busca").value = c.codigo;
  buscarTransportadora();

  document.getElementById("num-carga").value = c.numero;
  document.getElementById("total-pedidos").value = c.pedidos;
  document.getElementById("total-volumes").value = c.volumes;
  document.getElementById("destino").value = c.destino;
  document.getElementById("status").value = c.status;
  document.getElementById("observacao").value = c.observacao;
  document.getElementById("problemas").value = c.problemas;

  cargaEditandoId = c.id;
}

/* Inicialização */
document.addEventListener("DOMContentLoaded", () => {
  configurarMenu();

  // Botões
  document.getElementById("btn-add-transp").addEventListener("click", adicionarTransportadora);
  document.getElementById("btn-buscar-transp").addEventListener("click", buscarTransportadora);
  document.getElementById("btn-salvar-carga").addEventListener("click", salvarCarga);

  // Ações na tabela de cargas (delegação)
  document.getElementById("lista-cargas").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-acao='editar']");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    prepararEdicaoCarga(id);
  });

  // Navegação do menu (desktop)
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      mostrarPagina(btn.dataset.page);
    });
  });

  // Estado inicial
  atualizarListaTransportadoras();
  atualizarListaCargas();
  atualizarDashboard();
  mostrarPagina("dashboard");
});
