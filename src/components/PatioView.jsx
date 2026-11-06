import React from 'react';
import { 
  Car, Wrench, Clock, CheckCircle2, Send, 
  Fuel, Trash2, Plus 
} from 'lucide-react';
import { 
  formatarPlaca, formatarMoeda, formatarTelefone, 
  tempoPermanencia, gerarLinkWhatsApp, primeiroNome, nomeCurtoCarro, STATUS_MAP 
} from '../utils/formatters';

export default function PatioView({ 
  veiculos, 
  carregando, 
  onMudarStatusRapido,
  onAbrirOS, 
  onAbrirSaida,
  onExcluirVeiculo,
  onAbrirNovaEntrada
}) {
  return (
    <div className="space-y-4">
      
      {/* Carregamento */}
      {carregando && (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-xs font-medium">Atualizando pátio...</p>
        </div>
      )}

      {/* Pátio Vazio */}
      {!carregando && veiculos.length === 0 && (
        <div className="card-fluid bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-14 text-center shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-1">
            Pátio livre no momento
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
            Digite a placa do veículo para puxar o modelo automaticamente e registrar a entrada.
          </p>
          <button
            type="button"
            onClick={onAbrirNovaEntrada}
            className="btn-press inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Colocar Veículo no Pátio</span>
          </button>
        </div>
      )}

      {/* LISTA DE VEÍCULOS NO PÁTIO */}
      {!carregando && veiculos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {veiculos.map((v, idx) => {
            const statusInfo = STATUS_MAP[v.status] || STATUS_MAP.aguardando_orcamento;
            const temTelefoneValido = v.cliente_telefone && v.cliente_telefone !== '(Pátio)';

            return (
              <div
                key={v.id}
                style={{ animationDelay: `${Math.min(idx * 35, 210)}ms` }}
                className="card-fluid bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden"
              >
                {/* Parte Superior do Card */}
                <div className="p-4 sm:p-5 pb-3.5">
                  
                  {/* Linha 1: Placa Mercosul + Seletor Rápido de Status */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    
                    {/* Placa Mercosul estilizada */}
                    <div
                      onClick={() => onAbrirOS(v.id)}
                      className="border border-slate-800/80 rounded-md overflow-hidden shadow-2xs bg-white inline-block cursor-pointer select-none"
                    >
                      <div className="bg-blue-700 text-[8px] font-black text-white text-center tracking-widest px-2 py-0.5 uppercase leading-none">
                        BRASIL
                      </div>
                      <div className="font-mono font-black text-sm px-2 py-0.5 text-slate-900 tracking-wider text-center leading-tight">
                        {formatarPlaca(v.placa)}
                      </div>
                    </div>

                    {/* Status interativo sutil: ponto colorido + select limpo */}
                    <div
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors"
                      title="Mudar etapa do veículo"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${statusInfo.dot}`} />
                      <select
                        value={v.status}
                        onChange={(e) => onMudarStatusRapido && onMudarStatusRapido(v.id, e.target.value)}
                        className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="aguardando_orcamento">Aguardando Orçamento</option>
                        <option value="em_manutencao">Em Manutenção</option>
                        <option value="aguardando_pecas">Aguardando Peças</option>
                        <option value="pronto">Pronto para Retirada</option>
                      </select>
                    </div>
                  </div>

                  {/* Modelo do Veículo (clicável para abrir OS) */}
                  <div
                    onClick={() => onAbrirOS(v.id)}
                    className="mb-3 cursor-pointer group"
                  >
                    <h4 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                      {v.modelo}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[v.cor, v.ano ? `Ano ${v.ano}` : null, v.marca].filter(Boolean).join(' • ') || 'Veículo no pátio'}
                    </p>
                  </div>

                  {/* Defeito Relatado / Queixa */}
                  {v.defeito_relatado && (
                    <div
                      onClick={() => onAbrirOS(v.id)}
                      className="mb-3 p-2.5 bg-slate-50/90 hover:bg-slate-100/70 rounded-xl border border-slate-100 text-xs text-slate-700 cursor-pointer transition-colors"
                    >
                      <p className="line-clamp-2 text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-900">Defeito: </span>
                        {v.defeito_relatado}
                      </p>
                    </div>
                  )}

                  {/* Dados do Cliente & WhatsApp */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Cliente
                      </span>
                      <strong className="text-xs sm:text-sm text-slate-800 font-semibold block truncate">
                        {v.cliente_nome}
                      </strong>
                    </div>

                    {temTelefoneValido && (
                      <a
                        href={gerarLinkWhatsApp(
                          v.cliente_telefone, 
                          `${primeiroNome(v.cliente_nome) ? `Fala ${primeiroNome(v.cliente_nome)}, tudo certo?` : 'Opa, tudo certo?'} Tô falando aqui da oficina sobre o seu ${nomeCurtoCarro(v.modelo)}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-press flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-semibold px-2.5 py-1.5 rounded-xl text-xs shrink-0 shadow-2xs"
                        title="Conversar no WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden xs:inline">{formatarTelefone(v.cliente_telefone)}</span>
                        <span className="xs:hidden">WhatsApp</span>
                      </a>
                    )}
                  </div>

                  {/* Indicadores: Tempo, Combustível, Valor */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {tempoPermanencia(v.data_entrada)}
                    </span>

                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-slate-400" />
                      {v.combustivel || '1/2'}
                    </span>

                    <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                      {formatarMoeda(v.valor_total || 0)}
                    </span>
                  </div>

                </div>

                {/* Rodapé do Card com Ações */}
                <div className="bg-slate-50/70 p-2.5 sm:p-3 border-t border-slate-100 flex items-center gap-2">
                  
                  {/* Botão Principal: Ordem de Serviço */}
                  <button
                    onClick={() => onAbrirOS(v.id)}
                    className="btn-press flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold py-2.5 px-3 rounded-xl border border-slate-200/90 text-xs sm:text-sm shadow-2xs cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5 text-slate-600" />
                    <span>OS / Orçamento</span>
                  </button>

                  {/* Botão Secundário: Check-out / Saída */}
                  <button
                    onClick={() => onAbrirSaida(v)}
                    className="btn-press flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-3.5 rounded-xl text-xs sm:text-sm shadow-2xs shrink-0 cursor-pointer"
                    title="Dar Saída no Veículo"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dar Saída</span>
                  </button>

                  {/* Excluir (discreto) */}
                  <button
                    onClick={() => onExcluirVeiculo(v.id)}
                    title="Excluir Veículo"
                    className="btn-press p-2 text-slate-400 hover:text-red-600 active:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
