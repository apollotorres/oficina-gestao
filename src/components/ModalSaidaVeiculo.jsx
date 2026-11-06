import React, { useState, useEffect } from 'react';
import { X, CheckCircle, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { formatarPlaca, formatarMoeda, formatarTelefone } from '../utils/formatters';

export default function ModalSaidaVeiculo({ veiculo, isOpen, onClose, onConfirmarSaida }) {
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [statusPagamento, setStatusPagamento] = useState('pago');
  const [observacoesSaida, setObservacoesSaida] = useState('Garantia de 90 dias para peças e serviços conforme CDC.');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !veiculo) return null;

  const formas = [
    { id: 'PIX', label: 'PIX' },
    { id: 'Cartão de Débito', label: 'Débito' },
    { id: 'Cartão de Crédito', label: 'Crédito' },
    { id: 'Dinheiro', label: 'Dinheiro' },
    { id: 'A Prazo / Boleto', label: 'A Prazo' }
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setSalvando(true);
      await onConfirmarSaida(veiculo.id, {
        forma_pagamento: formaPagamento,
        status_pagamento: statusPagamento,
        observacoes_saida: observacoesSaida,
        data_saida: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao registrar saída do veículo');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="modal-sheet bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Barra de Arraste Mobile */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Cabeçalho */}
        <div className="bg-white border-b border-slate-100 px-5 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">Saída do Veículo</h3>
              <p className="text-[11px] text-slate-500">Confirme o pagamento para liberar do pátio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-press p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo do Veículo e Valor */}
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-white border border-slate-300 text-slate-900 px-2 py-0.5 rounded-md">
                {formatarPlaca(veiculo.placa)}
              </span>
              <span className="font-extrabold text-slate-900 text-sm">{veiculo.modelo}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {veiculo.cliente_nome} • {formatarTelefone(veiculo.cliente_telefone)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Total</span>
            <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
              {formatarMoeda(veiculo.valor_total || 0)}
            </div>
          </div>
        </div>

        {erro && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          
          {/* Forma de Pagamento */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {formas.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormaPagamento(f.id)}
                  className={`btn-press py-2.5 px-3 rounded-xl text-xs font-semibold border text-center cursor-pointer ${
                    formaPagamento === f.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status do Pagamento */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
              Status da Cobrança
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatusPagamento('pago')}
                className={`btn-press flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 cursor-pointer ${
                  statusPagamento === 'pago'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Pago na Entrega</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusPagamento('pendente')}
                className={`btn-press flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 cursor-pointer ${
                  statusPagamento === 'pendente'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Pendente / A Receber</span>
              </button>
            </div>
          </div>

          {/* Observações de Saída */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Garantia
            </label>
            <textarea
              rows={2}
              value={observacoesSaida}
              onChange={(e) => setObservacoesSaida(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900/10 focus:outline-none"
            />
          </div>

          {/* Botões */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="btn-press px-4 py-3 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="btn-press flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl shadow-xs text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{salvando ? 'Concluindo...' : 'Confirmar Saída'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
