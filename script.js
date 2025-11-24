// ================================
// ESTADO DO SISTEMA
// ================================
let transportadoras = JSON.parse(localStorage.getItem("transportadoras_v1") || "[]");
let cargas = JSON.parse(localStorage.getItem("cargas_v1") || "[]");

let transportadoraSelecionada = null;
let cargaEditandoId = null;

// ================================
// SALVAR NO LOCALSTORAGE
// ================================
function salvarEstado() {
  localStorage.setItem("transportadoras_v1", JSON.stringify(transportadoras));
  localStorage.setItem("cargas_v1", JSON.stringify(cargas));
}

// ================================
// MENU LATERAL (ABRIR/FECHAR)
// ================================
function configurarMenu() {
  const body = document.body;
  const toggle = document.getElementById("menu-toggle");
  const backdrop = document.getElementById("backdrop");
  const sidebar = document.getElementById("sidebar");

  function abrir() {
    body.classList.add("sidebar-open");
  }

  function fechar() {
    body.classList.remove("sidebar-open");
  }

  toggle.addEventListener("click", () => {
    if (body.classList.contains("sidebar-open")) fechar();
    else abrir();
  });

  backdrop.addEventListener("click", fechar);

  // Fechar ao selecionar item no mobile
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      mostrarPagina(btn.dataset.page);
      fechar();
    });
  });
}

// ================================
// TROCAR DE PÁGINA
// ================================
function mostrarPagina(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("visible"));
  document.getElementById("page-" + pageId).classList.add("visible");

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });

  if (pageId === "dashboard") atualizarDashboard();
}

// ================================
// LISTAR TRANSPORTADORAS
// ================================
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
}

// ================================
// ADICIONAR TRANSPORTADORA
// ================================
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
  atualizarDashboard();
}

// ================================
// BUSCAR TRANSPORTADORA POR CÓDIGO
// ================================
function buscarTransportadora() {
  const codigo = document.getElementById("codigo-busca").value.trim();
  const formCarga = document.getElementById("form-carga");
  const nomeTransp = document.getElementById("nome-transp");

  if (!codigo) {
    alert("Informe o código.");
    return;
  }

  const encontrada = transportadoras.find(t => t.codigo === codigo);

  if (!encontrada) {
    alert("Transportadora não encontrada.");
    formCarga.classList.add("hidden");
    transportadoraSelecionada = null;
    nomeTransp.textContent = "";
    return;
  }

  transportadoraSelecionada = encontrada;
  nomeTransp.textContent = `${encontrada.nome} (${encontrada.codigo})`;
  formCarga.classList.remove("hidden");
}

// ================================
// SALVAR NOVA CARGA ou EDITAR
// ================================
function salvarCarga() {
  if (!transportadoraSelecionada) {
    alert("Busque a transportadora primeiro.");
    return;
  }

  const cargaNumero = document.getElementById("num-carga").value.trim();
  const pedidos = document.getElementById("total-pedidos").value.trim();
  const volumes = document.getElementById("total-volumes").value.trim();
  const destino = document.getElementById("destino").value.trim();
  const status = document.getElementById("status").value;
  const observacao = document.getElementById("observacao").value.trim();
  const problemas = document.getElementById("problemas").value.trim();

  if (!cargaNumero) {
    alert("Informe o número da carga.");
    return;
  }

  const agora = new Date().toLocaleString();

  if (cargaEditandoId) {
    // Editar carga existente
    const idx = cargas.findIndex(c => c.id === cargaEditandoId);

    if (idx !== -1) {
      cargas[idx] = {
        ...cargas[idx],
        numero: cargaNumero,
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
    cargas.push({
      id: Date.now(),
      transportadora: transportadoraSelecionada.nome,
      codigo: transportadoraSelecionada.codigo,
      numero: cargaNumero,
      pedidos,
      volumes,
      destino,
      observacao,
      problemas,
      status,
      dataCriacao: agora
    });
  }

  salvarEstado();
  atualizarListaCargas();
  atualizarDashboard();

  alert("Carga salva com sucesso.");

  cargaEditandoId = null;

  // Limpa formulário
  document.getElementById("num-carga").value = "";
  document.getElementById("total-pedidos").value = "";
  document.getElementById("total-volumes").value = "";
  document.getElementById("destino").value = "";
  document.getElementById("status").value = "aberto";
  document.getElementById("observacao").value = "";
  document.getElementById("problemas").value = "";
}

// ================================
// LISTAR CARGAS (COM FORMATO MOBILE)
// ================================
function atualizarListaCargas() {
  const tbody = document.getElementById("lista-cargas");
  tbody.innerHTML = "";

  cargas
    .slice()
    .sort((a, b) => b.id - a.id)
    .forEach(c => {
      const tr = document.createElement("tr");

      const statusClass = c.status === "aberto" ? "status-aberto" : "status-fechado";
      const statusLabel = c.status === "aberto" ? "ABERTO" : "FECHADO";

      tr.innerHTML = `
        <td data-label="Transportadora">${c.transportadora} (${c.codigo})</td>
        <td data-label="Carga">${c.numero}</td>
        <td data-label="Volumes">${c.volumes || "-"}</td>
        <td data-label="Pedidos">${c.pedidos || "-"}</td>
        <td data-label="Destino">${c.destino || "-"}</td>
        <td data-label="Status">
          <span class="status-chip ${statusClass}">${statusLabel}</span>
        </td>
        <td data-label="Data">${c.dataCriacao || "-"}</td>
        <td data-label="Ações">
          <button class="btn-secondary btn-small" data-acao="editar" data-id="${c.id}">
            Editar
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
}

// ================================
// DASHBOARD
// ================================
function atualizarDashboard() {
  document.getElementById("metric-transportadoras").textContent = transportadoras.length;

  const abertas = cargas.filter(c => c.status === "aberto").length;
  const fechadas = cargas.filter(c => c.status === "fechado").length;

  document.getElementById("metric-abertas").textContent = abertas;
  document.getElementById("metric-fechadas").textContent = fechadas;

  const tbody = document.getElementById("dashboard-cargas");
  tbody.innerHTML = "";

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
        <td>${c.dataCriacao}</td>
      `;
      tbody.appendChild(tr);
    });
}

// ================================
// EDITAR CARGA
// ================================
function prepararEdicaoCarga(id) {
  const carga = cargas.find(c => c.id === id);

  if (!carga) return;

  if (carga.status === "fechado") {
    alert("Não é possível editar uma carga fechada.");
    return;
  }

  mostrarPagina("nova-carga");

  document.getElementById("codigo-busca").value = carga.codigo;
  buscarTransportadora();

  document.getElementById("num-carga").value = carga.numero;
  document.getElementById("total-pedidos").value = carga.pedidos;
  document.getElementById("total-volumes").value = carga.volumes;
  document.getElementById("destino").value = carga.destino;
  document.getElementById("status").value = carga.status;
  document.getElementById("observacao").value = carga.observacao;
  document.getElementById("problemas").value = carga.problemas;

  cargaEditandoId = id;
}

// ================================
// EVENTOS
// ================================
document.addEventListener("DOMContentLoaded", () => {
  configurarMenu();

  document.getElementById("btn-add-transp").addEventListener("click", adicionarTransportadora);
  document.getElementById("btn-buscar-transp").addEventListener("click", buscarTransportadora);
  document.getElementById("btn-salvar-carga").addEventListener("click", salvarCarga);

  document.getElementById("lista-cargas").addEventListener("click", e => {
    const btn = e.target.closest("button[data-acao='editar']");
    if (!btn) return;
    prepararEdicaoCarga(Number(btn.dataset.id));
  });

  atualizarListaTransportadoras();
  atualizarListaCargas();
  atualizarDashboard();
});
