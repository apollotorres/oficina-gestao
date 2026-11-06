import React from 'react';
import { CheckCircle2, RotateCcw, Printer, Trash2, Send } from 'lucide-react';
import { 
  formatarPlaca, formatarMoeda, formatarTelefone, 
  formatarDataHora, gerarLinkWhatsApp 
} from '../utils/formatters';

export default function HistoricoView({ 
  veiculos, 
  carregando, 
  onAbrirOS, 
  onAbrirImpressao, 
  onReabrirVeiculo, 
  onExcluirVeiculo 
}) {
  return (
    <div className="space-y-4">
      
      {carregando && (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-slate-500 text-xs font-medium">Carregando saídas...</p>
        </div>
      )}

      {!carregando && veiculos.length === 0 && (
        <div className="card-fluid bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-14 text-center shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">Nenhuma saída registrada</h4>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            Quando você der saída em um veículo no Pátio, o histórico e o recibo ficarão salvos aqui.
          </p>
        </div>
      )}

      {/* LISTA MOBILE (Cards Compactos no celular) */}
      {!carregando && veiculos.length > 0 && (
        <div className="block sm:hidden space-y-2.5">
          {veiculos.map((v, idx) => (
            <div
              key={v.id}
              style={{ animationDelay: `${Math.min(idx * 35, 210)}ms` }}
              className="card-fluid bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                      {formatarPlaca(v.placa)}
                    </span>
                    <strong className="text-sm font-extrabold text-slate-900">{v.modelo}</strong>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Cliente: {v.cliente_nome}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900 tabular-nums block">
                    {formatarMoeda(v.valor_total || 0)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${v.status_pagamento === 'pago' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {v.forma_pagamento || 'PIX'} • {v.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mb-3 pt-2 border-t border-slate-100 flex justify-between">
                <span>Saída: {formatarDataHora(v.data_saida)}</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onAbrirOS(v.id)}
                  className="btn-press px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl"
                >
                  Ver OS
                </button>
                <button
                  onClick={() => onAbrirImpressao(v)}
                  className="btn-press p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                  title="Recibo / PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onReabrirVeiculo(v.id)}
                  className="btn-press p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                  title="Voltar para o Pátio"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onExcluirVeiculo(v.id)}
                  className="btn-press p-1.5 text-slate-300 hover:text-red-600 rounded-xl"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABELA DESKTOP */}
      {!carregando && veiculos.length > 0 && (
        <div className="card-fluid hidden sm:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Placa</th>
                  <th className="py-3 px-4">Veículo</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Data Saída</th>
                  <th className="py-3 px-4">Pagamento</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {veiculos.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-md">
                        {formatarPlaca(v.placa)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {v.modelo}
                      <span className="block text-[11px] font-normal text-slate-500">{v.cor || ''} {v.ano ? `• ${v.ano}` : ''}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{v.cliente_nome}</div>
                      {v.cliente_telefone && v.cliente_telefone !== '(Pátio)' && (
                        <a
                          href={gerarLinkWhatsApp(v.cliente_telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Send className="w-2.5 h-2.5" />
                          {formatarTelefone(v.cliente_telefone)}
                        </a>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">{formatarDataHora(v.data_saida)}</span>
                      <span className="text-[11px] text-slate-400">Entrada: {formatarDataHora(v.data_entrada)}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800 block">{v.forma_pagamento || 'PIX'}</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className={`w-1.5 h-1.5 rounded-full ${v.status_pagamento === 'pago' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {v.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatarMoeda(v.valor_total || 0)}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onAbrirOS(v.id)}
                          className="btn-press px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold text-xs"
                          title="Visualizar OS Completa"
                        >
                          Ver OS
                        </button>

                        <button
                          onClick={() => onAbrirImpressao(v)}
                          className="btn-press p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          title="Recibo / PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onReabrirVeiculo(v.id)}
                          className="btn-press p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          title="Voltar para o Pátio"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onExcluirVeiculo(v.id)}
                          className="btn-press p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
