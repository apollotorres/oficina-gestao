import React from 'react';
import { Car, Clock, Wrench, Package, CheckCircle2, TrendingUp } from 'lucide-react';
import { formatarMoeda } from '../utils/formatters';

export default function DashboardStats({ stats, filtroStatus, setFiltroStatus }) {
  if (!stats) return null;

  const cards = [
    {
      id: 'todos',
      titulo: 'No Pátio',
      valor: stats.totalPatio || 0,
      icone: Car,
      corIcone: 'bg-blue-600 text-white',
      ativo: filtroStatus === 'todos'
    },
    {
      id: 'aguardando_orcamento',
      titulo: 'Orçamentos',
      valor: stats.aguardandoOrcamento || 0,
      icone: Clock,
      corIcone: 'bg-amber-500 text-white',
      ativo: filtroStatus === 'aguardando_orcamento'
    },
    {
      id: 'em_manutencao',
      titulo: 'Manutenção',
      valor: stats.emManutencao || 0,
      icone: Wrench,
      corIcone: 'bg-indigo-600 text-white',
      ativo: filtroStatus === 'em_manutencao'
    },
    {
      id: 'aguardando_pecas',
      titulo: 'Peças',
      valor: stats.aguardandoPecas || 0,
      icone: Package,
      corIcone: 'bg-orange-500 text-white',
      ativo: filtroStatus === 'aguardando_pecas'
    },
    {
      id: 'pronto',
      titulo: 'Prontos',
      valor: stats.prontos || 0,
      icone: CheckCircle2,
      corIcone: 'bg-emerald-600 text-white',
      ativo: filtroStatus === 'pronto'
    },
    {
      id: 'faturamento',
      titulo: 'Saídas Mês',
      valor: `${stats.totalFinalizados || 0} (${formatarMoeda(stats.faturamentoMes || 0)})`,
      icone: TrendingUp,
      corIcone: 'bg-slate-800 text-white',
      desabilitarClick: true
    }
  ];

  return (
    <div className="mb-4 sm:mb-6 no-print">
      {/* Carrossel horizontal suave no mobile, grid no desktop */}
      <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2.5 overflow-x-auto no-scrollbar pb-1.5 px-0.5 -mx-1 sm:mx-0">
        {cards.map((card) => {
          const Icon = card.icone;
          return (
            <button
              key={card.id}
              type="button"
              disabled={card.desabilitarClick}
              onClick={() => !card.desabilitarClick && setFiltroStatus(card.id)}
              className={`shrink-0 w-32 sm:w-auto text-left p-3 rounded-2xl border transition-all duration-150 relative select-none ${
                card.ativo
                  ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-600'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
              } ${card.desabilitarClick ? 'cursor-default' : 'active:scale-95 cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight truncate">
                  {card.titulo}
                </span>
                <div className={`p-1 rounded-lg ${card.corIcone}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                {card.valor}
              </div>

              {card.ativo && (
                <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
