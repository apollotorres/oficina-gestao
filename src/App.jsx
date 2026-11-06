import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import PatioView from './components/PatioView';
import HistoricoView from './components/HistoricoView';
import ModalNovaEntrada from './components/ModalNovaEntrada';
import ModalOrdemServico from './components/ModalOrdemServico';
import ModalSaidaVeiculo from './components/ModalSaidaVeiculo';
import ModalImprimirOS from './components/ModalImprimirOS';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('patio'); // 'patio' | 'historico' | 'config'
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Estados de dados
  const [stats, setStats] = useState(null);
  const [veiculosPatio, setVeiculosPatio] = useState([]);
  const [veiculosHistorico, setVeiculosHistorico] = useState([]);
  const [config, setConfig] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // Estados de Modais
  const [modalNovaEntrada, setModalNovaEntrada] = useState(false);
  const [osSelecionadaId, setOsSelecionadaId] = useState(null);
  const [veiculoSaida, setVeiculoSaida] = useState(null);
  const [veiculoImpressao, setVeiculoImpressao] = useState(null);

  // Carregar dados da API
  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);

      const [resStats, resConfig] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/config')
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resConfig.ok) setConfig(await resConfig.json());

      const paramsPatio = new URLSearchParams({ modo: 'patio' });
      if (busca) paramsPatio.append('search', busca);
      const resPatio = await fetch(`/api/veiculos?${paramsPatio.toString()}`);
      if (resPatio.ok) setVeiculosPatio(await resPatio.json());

      const paramsHist = new URLSearchParams({ modo: 'historico' });
      if (busca) paramsHist.append('search', busca);
      const resHist = await fetch(`/api/veiculos?${paramsHist.toString()}`);
      if (resHist.ok) setVeiculosHistorico(await resHist.json());

    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setCarregando(false);
    }
  }, [busca]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Ações de Veículos
  async function handleSalvarNovaEntrada(dados) {
    const res = await fetch('/api/veiculos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao registrar entrada');
    }
    const created = await res.json();
    await carregarDados();
    if (created.id) {
      setOsSelecionadaId(created.id);
    }
  }

  async function handleConfirmarSaida(id, dadosSaida) {
    const res = await fetch(`/api/veiculos/${id}/saida`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosSaida)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao registrar saída');
    }
    await carregarDados();
  }

  async function handleReabrirVeiculo(id) {
    if (!confirm('Deseja reabrir este veículo e trazê-lo de volta para o pátio?')) return;
    try {
      const res = await fetch(`/api/veiculos/${id}/reabrir`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao reabrir');
      await carregarDados();
      setAbaAtiva('patio');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleExcluirVeiculo(id) {
    if (!confirm('Tem certeza que deseja excluir permanentemente este veículo e todo o seu histórico?')) return;
    try {
      const res = await fetch(`/api/veiculos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      await carregarDados();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSalvarConfig(novasConfigs) {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novasConfigs)
    });
    if (!res.ok) throw new Error('Erro ao salvar');
    setConfig(novasConfigs);
  }

  async function handleMudarStatusRapido(id, novoStatus) {
    try {
      // Atualização otimista imediata na UI
      setVeiculosPatio(prev => prev.map(v => v.id === id ? { ...v, status: novoStatus } : v));
      const res = await fetch(`/api/veiculos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) throw new Error('Falha ao atualizar status');
      await carregarDados();
    } catch (err) {
      alert(err.message);
      await carregarDados();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      
      {/* Header Fixo / Barra Superior */}
      <Header
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        busca={busca}
        setBusca={setBusca}
        onAbrirNovaEntrada={() => setModalNovaEntrada(true)}
        onAtualizar={carregarDados}
        carregando={carregando}
        oficinaNome={config?.nome_oficina}
        totalPatio={veiculosPatio.length}
      />

      {/* Conteúdo Principal com padding inferior para a BottomNav no mobile */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 pb-24 md:pb-8">
        
        {/* Abas */}
        {abaAtiva === 'patio' && (
          <PatioView
            veiculos={veiculosPatio}
            carregando={carregando}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
            busca={busca}
            setBusca={setBusca}
            onMudarStatusRapido={handleMudarStatusRapido}
            onAbrirOS={(id) => setOsSelecionadaId(id)}
            onAbrirSaida={(v) => setVeiculoSaida(v)}
            onExcluirVeiculo={handleExcluirVeiculo}
            onAbrirNovaEntrada={() => setModalNovaEntrada(true)}
          />
        )}

        {abaAtiva === 'historico' && (
          <HistoricoView
            veiculos={veiculosHistorico}
            carregando={carregando}
            onAbrirOS={(id) => setOsSelecionadaId(id)}
            onAbrirImpressao={(v) => setVeiculoImpressao(v)}
            onReabrirVeiculo={handleReabrirVeiculo}
            onExcluirVeiculo={handleExcluirVeiculo}
          />
        )}

      </main>

      {/* Barra de Navegação Inferior para Celular / Tablet (Native App Experience) */}
      <BottomNav
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        onAbrirNovaEntrada={() => setModalNovaEntrada(true)}
        totalPatio={veiculosPatio.length}
        totalHistorico={veiculosHistorico.length}
      />

      {/* Rodapé no Desktop */}
      <footer className="hidden md:block bg-white border-t border-slate-200/80 text-slate-400 py-4 text-center text-xs no-print">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="font-medium text-slate-500">{config?.nome_oficina || 'AutoGestão'} • Sistema de Oficina Mecânica</span>
          <span>Design responsivo para Smartphone, Tablet e Computador</span>
        </div>
      </footer>

      {/* Modais em estilo Bottom Sheet para Mobile */}
      <ModalNovaEntrada
        isOpen={modalNovaEntrada}
        onClose={() => setModalNovaEntrada(false)}
        onSalvar={handleSalvarNovaEntrada}
      />

      <ModalOrdemServico
        veiculoId={osSelecionadaId}
        isOpen={!!osSelecionadaId}
        onClose={() => setOsSelecionadaId(null)}
        onAtualizarVeiculo={carregarDados}
        onAbrirSaida={(v) => setVeiculoSaida(v)}
        onAbrirImpressao={(v) => setVeiculoImpressao(v)}
        oficinaConfig={config}
      />

      <ModalSaidaVeiculo
        veiculo={veiculoSaida}
        isOpen={!!veiculoSaida}
        onClose={() => setVeiculoSaida(null)}
        onConfirmarSaida={handleConfirmarSaida}
      />

      <ModalImprimirOS
        veiculoId={veiculoImpressao?.id}
        isOpen={!!veiculoImpressao}
        onClose={() => setVeiculoImpressao(null)}
        oficinaConfig={config}
      />

    </div>
  );
}
