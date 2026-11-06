import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Printer, CheckCircle, 
  Send, ArrowRight 
} from 'lucide-react';
import { 
  formatarPlaca, formatarMoeda, formatarTelefone, 
  formatarDataHora, tempoPermanencia, gerarLinkWhatsApp, 
  primeiroNome, nomeCurtoCarro, STATUS_MAP 
} from '../utils/formatters';

export default function ModalOrdemServico({ 
  veiculoId, 
  isOpen, 
  onClose, 
  onAtualizarVeiculo,
  onAbrirSaida,
  onAbrirImpressao
}) {
  const [veiculo, setVeiculo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [novoItem, setNovoItem] = useState({
    tipo: 'servico',
    descricao: '',
    quantidade: 1,
    valor_unitario: ''
  });

  useEffect(() => {
    if (!isOpen || !veiculoId) return;
    carregarDetalhes();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [veiculoId, isOpen]);

  if (!isOpen || !veiculoId) return null;

  async function carregarDetalhes() {
    try {
      setCarregando(true);
      const res = await fetch(`/api/veiculos/${veiculoId}`);
      if (!res.ok) throw new Error('Falha ao carregar dados da OS');
      const data = await res.json();
      setVeiculo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  async function handleMudarStatus(novoStatus) {
    try {
      setSalvando(true);
      const res = await fetch(`/api/veiculos/${veiculoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) throw new Error('Erro ao alterar status');
      setVeiculo(prev => ({ ...prev, status: novoStatus }));
      if (onAtualizarVeiculo) onAtualizarVeiculo();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAdicionarItem(e) {
    e.preventDefault();
    if (!novoItem.descricao.trim()) return;

    try {
      setSalvando(true);
      const res = await fetch(`/api/veiculos/${veiculoId}/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoItem)
      });
      if (!res.ok) throw new Error('Erro ao adicionar item');
      
      setNovoItem({ tipo: 'servico', descricao: '', quantidade: 1, valor_unitario: '' });
      await carregarDetalhes();
      if (onAtualizarVeiculo) onAtualizarVeiculo();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemoverItem(itemId) {
    if (!confirm('Deseja remover este item da Ordem de Serviço?')) return;

    try {
      setSalvando(true);
      const res = await fetch(`/api/veiculos/${veiculoId}/itens/${itemId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Erro ao remover item');
      await carregarDetalhes();
      if (onAtualizarVeiculo) onAtualizarVeiculo();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  }

  function enviarWhatsApp(tipoAviso) {
    if (!veiculo) return;

    const nome = primeiroNome(veiculo.cliente_nome);
    const saudacao = nome ? `Fala ${nome}, tudo certo?` : 'Opa, tudo certo?';
    const carro = nomeCurtoCarro(veiculo.modelo);
    const total = formatarMoeda(veiculo.valor_total);

    let texto = '';
    if (tipoAviso === 'orcamento') {
      texto = `${saudacao} Demos uma olhada no seu ${carro} aqui na oficina e o orçamento ficou em ${total}. Posso mandar ver no serviço?`;
    } else if (tipoAviso === 'pronto') {
      texto = `${saudacao} Passando pra avisar que o seu ${carro} já ficou pronto aqui na oficina. Deu ${total} no total. Quando quiser já pode vir buscar!`;
    } else {
      texto = `${saudacao} Tô falando aqui da oficina sobre o seu ${carro}.`;
    }

    const link = gerarLinkWhatsApp(veiculo.cliente_telefone, texto);
    window.open(link, '_blank');
  }

  if (carregando) {
    return (
      <div className="modal-backdrop fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="modal-sheet bg-white rounded-3xl p-6 shadow-xl text-center">
          <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
          <p className="text-slate-600 text-xs font-medium">Carregando Ordem de Serviço...</p>
        </div>
      </div>
    );
  }

  if (!veiculo) return null;

  const statusInfo = STATUS_MAP[veiculo.status] || STATUS_MAP.aguardando_orcamento;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="modal-sheet bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200/80 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Barra de Arraste Mobile */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Cabeçalho OS */}
        <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="border border-slate-800 rounded-md overflow-hidden bg-white shrink-0">
              <div className="bg-blue-700 text-[7px] font-black text-white text-center px-1.5 py-0.2 tracking-wider">
                BRASIL
              </div>
              <div className="font-mono font-black text-xs px-2 py-0.5 text-slate-900">
                {formatarPlaca(veiculo.placa)}
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                {veiculo.modelo}
              </h3>
              <p className="text-[11px] text-slate-500">
                {[veiculo.cor, veiculo.ano, veiculo.marca].filter(Boolean).join(' • ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAbrirImpressao(veiculo)}
              className="btn-press p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              title="Imprimir / PDF"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="btn-press p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Status & Ações Rápidas de WhatsApp */}
        <div className="bg-slate-50/80 border-b border-slate-100 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo.dot}`} />
            <select
              value={veiculo.status}
              onChange={(e) => handleMudarStatus(e.target.value)}
              disabled={salvando}
              className="flex-1 sm:flex-none bg-white text-xs font-semibold text-slate-800 border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs focus:ring-2 focus:ring-slate-900/10 focus:outline-none cursor-pointer"
            >
              {Object.entries(STATUS_MAP).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
          </div>

          {/* Botões Rápidos de WhatsApp */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => enviarWhatsApp('orcamento')}
              className="btn-press flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enviar Orçamento</span>
            </button>
            <button
              onClick={() => enviarWhatsApp('pronto')}
              className="btn-press flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Avisar Pronto</span>
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Card Resumo do Cliente e Pátio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            
            {/* Cliente */}
            <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cliente</span>
                {veiculo.cliente_telefone && veiculo.cliente_telefone !== '(Pátio)' && (
                  <button
                    onClick={() => enviarWhatsApp('geral')}
                    className="btn-press text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Chamar
                  </button>
                )}
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{veiculo.cliente_nome}</h4>
              <p className="text-xs text-slate-500">{formatarTelefone(veiculo.cliente_telefone)}</p>
            </div>

            {/* Pátio & Entrada */}
            <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Permanência</span>
                <span className="text-[11px] font-bold text-slate-700">
                  {tempoPermanencia(veiculo.data_entrada)}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-semibold">{formatarDataHora(veiculo.data_entrada)}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                <span>Km: <strong>{veiculo.km_entrada ? veiculo.km_entrada.toLocaleString('pt-BR') : '-'}</strong></span>
                <span>Tanque: <strong>{veiculo.combustivel || '1/2'}</strong></span>
              </div>
            </div>

          </div>

          {/* Defeito Relatado (Neutro e limpo, sem caixa amarela) */}
          <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-100 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Defeito Relatado / Serviço Solicitado
            </span>
            <p className="text-slate-800 leading-relaxed font-medium text-xs sm:text-sm">
              {veiculo.defeito_relatado || 'Revisão geral.'}
            </p>
            {veiculo.observacoes && (
              <p className="text-slate-500 mt-2 pt-2 border-t border-slate-200/60 text-[11px]">
                <strong className="text-slate-700">Observações:</strong> {veiculo.observacoes}
              </p>
            )}
          </div>

          {/* Itens da OS (Mão de Obra e Peças) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">Peças e Mão de Obra</h4>
                <span className="text-xs text-slate-400 font-semibold tabular-nums">
                  ({(veiculo.itens || []).length})
                </span>
              </div>
              
              <div className="text-sm sm:text-base font-black text-slate-900 tabular-nums">
                {formatarMoeda(veiculo.valor_total || 0)}
              </div>
            </div>

            {/* Lista de Itens (Sem badges coloridas de AI slop) */}
            <div className="space-y-2 mb-3.5">
              {(veiculo.itens && veiculo.itens.length > 0) ? (
                veiculo.itens.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5 text-[11px] text-slate-500 font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.tipo === 'peca' ? 'bg-amber-500' : 'bg-blue-600'}`} />
                        <span>{item.tipo === 'peca' ? 'Peça' : 'Mão de Obra'}</span>
                        <span>•</span>
                        <span>{item.quantidade}x {formatarMoeda(item.valor_unitario)}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.descricao}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums">
                        {formatarMoeda(item.valor_total)}
                      </span>
                      <button
                        onClick={() => handleRemoverItem(item.id)}
                        title="Remover"
                        className="btn-press p-1.5 text-slate-300 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  Nenhum serviço ou peça lançado ainda.
                </div>
              )}
            </div>

            {/* Formulário: Adicionar Item */}
            <form onSubmit={handleAdicionarItem} className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
              {/* Segmented Control Tipo */}
              <div className="flex gap-1 bg-slate-200/70 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNovoItem({ ...novoItem, tipo: 'servico' })}
                  className={`btn-press flex-1 py-1.5 text-xs font-semibold rounded-lg ${
                    novoItem.tipo === 'servico' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Mão de Obra / Serviço
                </button>
                <button
                  type="button"
                  onClick={() => setNovoItem({ ...novoItem, tipo: 'peca' })}
                  className={`btn-press flex-1 py-1.5 text-xs font-semibold rounded-lg ${
                    novoItem.tipo === 'peca' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Peça / Material
                </button>
              </div>

              {/* Descrição */}
              <input
                type="text"
                required
                value={novoItem.descricao}
                onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                placeholder={novoItem.tipo === 'servico' ? "Descrição do serviço (ex: Troca de pastilhas)..." : "Descrição da peça (ex: Jogo de pastilhas)..."}
                className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
              />

              {/* Qtd, Valor e Botão Adicionar */}
              <div className="flex gap-2">
                <div className="w-20">
                  <input
                    type="number"
                    min="1"
                    required
                    value={novoItem.quantidade}
                    onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })}
                    placeholder="Qtd"
                    className="w-full text-xs sm:text-sm px-2.5 py-2.5 rounded-xl border border-slate-200 bg-white text-center font-bold focus:outline-none"
                  />
                </div>

                <div className="flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={novoItem.valor_unitario}
                    onChange={(e) => setNovoItem({ ...novoItem, valor_unitario: e.target.value })}
                    placeholder="R$ Valor Unitário"
                    className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={salvando}
                  className="btn-press bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Adicionar</span>
                </button>
              </div>
            </form>

          </div>

        </div>

        {/* Rodapé Fixo / Sticky Mobile */}
        <div className="bg-white border-t border-slate-100 p-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="btn-press px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 rounded-xl"
          >
            Fechar
          </button>

          {veiculo.status !== 'finalizado' ? (
            <button
              onClick={() => {
                onClose();
                onAbrirSaida(veiculo);
              }}
              className="btn-press flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-3 rounded-xl shadow-xs text-xs sm:text-sm cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Dar Saída no Veículo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs font-semibold text-slate-400">
              Veículo entregue
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
