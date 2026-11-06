import React, { useState } from 'react';
import { Wrench, Plus, Search, Car, History, RefreshCw, X } from 'lucide-react';

export default function Header({ 
  abaAtiva, 
  setAbaAtiva, 
  busca, 
  setBusca, 
  onAbrirNovaEntrada, 
  onAtualizar, 
  carregando,
  oficinaNome,
  totalPatio
}) {
  const [buscaMobileAberta, setBuscaMobileAberta] = useState(false);

  return (
    <header className="bg-white/85 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          
          {/* Logo e Nome */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer select-none btn-press" 
            onClick={() => setAbaAtiva('patio')}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs shrink-0">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 leading-tight block">
                {oficinaNome || 'AutoGestão'}
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">Controle de Pátio e Saídas</p>
            </div>
          </div>

          {/* Busca Desktop */}
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar placa, veículo ou cliente..."
                className="w-full bg-slate-100/80 hover:bg-slate-100 text-sm text-slate-800 placeholder-slate-400 pl-9 pr-8 py-2 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-colors"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 btn-press"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Abas no Desktop */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setAbaAtiva('patio')}
              className={`btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                abaAtiva === 'patio'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Pátio</span>
              <span className={`tabular-nums text-[11px] ${abaAtiva === 'patio' ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                {totalPatio || 0}
              </span>
            </button>

            <button
              onClick={() => setAbaAtiva('historico')}
              className={`btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                abaAtiva === 'historico'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Saídas</span>
            </button>
          </div>

          {/* Ações à Direita */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Botão de Busca Mobile */}
            <button
              onClick={() => setBuscaMobileAberta(!buscaMobileAberta)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 active:bg-slate-100 rounded-xl btn-press"
              title="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Recarregar */}
            <button
              onClick={onAtualizar}
              title="Atualizar"
              className="p-2 text-slate-500 hover:text-slate-800 active:bg-slate-100 rounded-xl btn-press"
            >
              <RefreshCw className={`w-4 h-4 sm:w-4 sm:h-4 ${carregando ? 'animate-spin text-slate-900' : ''}`} />
            </button>

            {/* Botão Nova Entrada Desktop */}
            <button
              onClick={onAbrirNovaEntrada}
              className="btn-press hidden sm:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3.5 py-2 rounded-xl shadow-xs text-xs sm:text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Entrada no Pátio</span>
            </button>
          </div>

        </div>

        {/* Barra de Busca Expansível Mobile */}
        {buscaMobileAberta && (
          <div className="py-2.5 pb-3 border-t border-slate-100 md:hidden">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar placa, cliente ou veículo..."
                className="w-full bg-slate-100 text-sm text-slate-900 placeholder-slate-400 pl-9 pr-14 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white"
              />
              {busca ? (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 btn-press"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setBuscaMobileAberta(false)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800 btn-press"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
