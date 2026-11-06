import React from 'react';
import { Car, Plus, History } from 'lucide-react';

export default function BottomNav({ 
  abaAtiva, 
  setAbaAtiva, 
  onAbrirNovaEntrada, 
  totalPatio 
}) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-t border-slate-200/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(15,23,42,0.04)] no-print">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        
        {/* Aba Pátio */}
        <button
          onClick={() => setAbaAtiva('patio')}
          className={`btn-press flex flex-col items-center justify-center flex-1 py-1 relative ${
            abaAtiva === 'patio' ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <div className="relative">
            <Car className={`w-5 h-5 ${abaAtiva === 'patio' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
            {totalPatio > 0 && (
              <span className="absolute -top-1 -right-3 bg-slate-900 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[16px] text-center tabular-nums">
                {totalPatio}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1">Pátio</span>
        </button>

        {/* Botão Central: Nova Entrada (Check-in rápido) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            onClick={onAbrirNovaEntrada}
            aria-label="Registrar Nova Entrada de Veículo"
            className="btn-press w-13 h-13 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/25 border-4 border-slate-50"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Aba Saídas */}
        <button
          onClick={() => setAbaAtiva('historico')}
          className={`btn-press flex flex-col items-center justify-center flex-1 py-1 relative ${
            abaAtiva === 'historico' ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <div className="relative">
            <History className={`w-5 h-5 ${abaAtiva === 'historico' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          </div>
          <span className="text-[11px] mt-1">Saídas</span>
        </button>

      </div>
    </nav>
  );
}
