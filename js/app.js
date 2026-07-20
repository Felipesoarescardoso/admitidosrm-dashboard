/**
 * App - Dashboard Estático (GitHub Pages)
 * Lê dados de dashboard.json exportado do PostgreSQL
 */

const App = {
  data: null,

  async init() {
    await this.loadData();
  },

  async loadData() {
    try {
      const response = await fetch('dashboard.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.data = await response.json();

      this.updateCards();
      this.updateLastUpdate();
      this.renderExecucoes();
      this.renderCadastrados();
      this.setupFilters();
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      document.getElementById('status-indicator').className = 'status-badge status-offline';
      document.getElementById('status-indicator').textContent = '● OFFLINE';
    }
  },

  updateCards() {
    const el = (id) => document.getElementById(id);
    const m = this.data.metricas;
    const r = this.data.resumo;

    if (el('total-execucoes')) el('total-execucoes').textContent = m.totalExecucoes || 0;
    if (el('total-cadastrados')) el('total-cadastrados').textContent = r.cadastrados || 0;
    if (el('total-ja-existiam')) el('total-ja-existiam').textContent = r.jaExistiam || 0;
    if (el('total-erros')) el('total-erros').textContent = r.erros || 0;

    if (el('media-duracao') && m.mediaDuracaoSegundos) {
      const min = Math.floor(m.mediaDuracaoSegundos / 60);
      const sec = m.mediaDuracaoSegundos % 60;
      el('media-duracao').textContent = `${min}m ${sec}s`;
    }
  },

  updateLastUpdate() {
    const el = document.getElementById('last-update');
    if (el && this.data.atualizado_em) {
      const d = new Date(this.data.atualizado_em);
      el.textContent = `Última atualização: ${d.toLocaleString('pt-BR')}`;
    }
  },

  renderExecucoes() {
    const tbody = document.getElementById('tbody-execucoes');
    if (!tbody || !this.data.execucoes) return;

    tbody.innerHTML = this.data.execucoes.map(exec => {
      const inicio = new Date(exec.iniciado_em).toLocaleString('pt-BR');
      const fim = exec.finalizado_em
        ? new Date(exec.finalizado_em).toLocaleString('pt-BR')
        : '-';
      const duracao = exec.iniciado_em && exec.finalizado_em
        ? Math.round((new Date(exec.finalizado_em) - new Date(exec.iniciado_em)) / 1000)
        : null;
      const duracaoStr = duracao ? `${Math.floor(duracao / 60)}m ${duracao % 60}s` : '-';

      let statusBadge = '';
      switch (exec.status) {
        case 'CONCLUIDO': statusBadge = '<span class="badge badge-success">CONCLUÍDO</span>'; break;
        case 'EM_ANDAMENTO': statusBadge = '<span class="badge badge-info">EM ANDAMENTO</span>'; break;
        case 'FALHA': statusBadge = '<span class="badge badge-danger">FALHA</span>'; break;
        default: statusBadge = `<span class="badge badge-secondary">${exec.status}</span>`;
      }

      return `
        <tr>
          <td title="${exec.id}">${exec.id.substring(0, 8)}</td>
          <td><span class="badge badge-secondary">${exec.tipo}</span></td>
          <td>${inicio}</td>
          <td>${fim}</td>
          <td>${duracaoStr}</td>
          <td>${statusBadge}</td>
          <td>${exec.cadastrados || 0}</td>
          <td>${exec.erros || 0}</td>
        </tr>
      `;
    }).join('');
  },

  renderCadastrados(filtro = {}) {
    const tbody = document.getElementById('tbody-cadastrados');
    if (!tbody || !this.data.cadastrados) return;

    let itens = [...this.data.cadastrados];

    if (filtro.busca) {
      const b = filtro.busca.toLowerCase();
      itens = itens.filter(i =>
        (i.nome && i.nome.toLowerCase().includes(b)) ||
        (i.cpf && i.cpf.includes(b))
      );
    }

    if (filtro.status) {
      itens = itens.filter(i => i.status === filtro.status);
    }

    tbody.innerHTML = itens.map(item => {
      const statusBadge = item.status === 'CADASTRADO'
        ? '<span class="badge badge-success">CADASTRADO</span>'
        : '<span class="badge badge-info">JÁ EXISTIA</span>';

      const empresa = item.empresa_cnpj || '-';
      const primeiroRegistro = item.primeiro_registro
        ? new Date(item.primeiro_registro).toLocaleString('pt-BR')
        : '-';

      return `
        <tr>
          <td>${item.nome || '-'}</td>
          <td>${item.cpf || '-'}</td>
          <td>${item.chapa || '-'}</td>
          <td>${empresa}</td>
          <td>${statusBadge}</td>
          <td>${primeiroRegistro}</td>
        </tr>
      `;
    }).join('');
  },

  setupFilters() {
    const filterBusca = document.getElementById('filter-cadastrados-busca');
    const filterStatus = document.getElementById('filter-cadastrados-status');

    const aplicarFiltros = () => {
      this.renderCadastrados({
        busca: filterBusca ? filterBusca.value : '',
        status: filterStatus ? filterStatus.value : ''
      });
    };

    if (filterBusca) filterBusca.addEventListener('input', aplicarFiltros);
    if (filterStatus) filterStatus.addEventListener('change', aplicarFiltros);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
