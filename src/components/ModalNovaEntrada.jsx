import React, { useState, useRef, useEffect } from 'react';
import { X, Car, User, Wrench, AlertCircle, Save, Zap, Loader2, CheckCircle2 } from 'lucide-react';

export default function ModalNovaEntrada({ isOpen, onClose, onSalvar }) {
  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    marca: '',
    ano: '',
    cor: '',
    km_entrada: '',
    combustivel: '1/2',
    cliente_nome: '',
    cliente_telefone: '',
    cliente_documento: '',
    defeito_relatado: '',
    observacoes: '',
    pertences_avarias: '',
    status: 'aguardando_orcamento'
  });

  const [consultandoPlaca, setConsultandoPlaca] = useState(false);
  const [placaInfo, setPlacaInfo] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const placaInputRef = useRef(null);
  const defeitoInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    // Foca na placa imediatamente ao abrir o modal
    const t = setTimeout(() => {
      placaInputRef.current?.focus();
    }, 60);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const niveisCombustivel = [
    { id: 'Reserva', label: 'Reserva' },
    { id: '1/4', label: '1/4' },
    { id: '1/2', label: '1/2' },
    { id: '3/4', label: '3/4' },
    { id: 'Cheio', label: 'Cheio' },
  ];

  const marcasComuns = ['Chevrolet', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Jeep', 'Nissan', 'Renault', 'Toyota', 'Volkswagen'];

  async function buscarDadosPlaca(placaAlvo) {
    const p = (placaAlvo || formData.placa || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (p.length < 7) {
      setErro('Digite os 7 caracteres da placa para consultar.');
      return;
    }

    try {
      setConsultandoPlaca(true);
      setErro('');
      const res = await fetch(`/api/placa/${p}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Placa não localizada.');
      }

      setPlacaInfo(data);
      setFormData(prev => ({
        ...prev,
        placa: p,
        marca: data.marca || prev.marca,
        modelo: data.modelo || prev.modelo,
        ano: data.ano || prev.ano,
        cor: data.cor || prev.cor
      }));

      // Foca automaticamente no campo de defeito para o mecânico apenas descrever o problema
      setTimeout(() => {
        defeitoInputRef.current?.focus();
      }, 80);

    } catch (err) {
      setErro(err.message || 'Erro ao consultar dados da placa');
    } finally {
      setConsultandoPlaca(false);
    }
  }

  function handlePlacaChange(e) {
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7);
    setFormData(prev => ({ ...prev, placa: raw }));
    
    if (raw.length === 7) {
      buscarDadosPlaca(raw);
    } else {
      setPlacaInfo(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!formData.placa || formData.placa.length < 7) {
      setErro('Informe uma placa válida com 7 caracteres (ex: ABC1D23 ou ABC1234)');
      return;
    }
    if (!formData.modelo.trim()) {
      setErro('Informe o modelo do veículo');
      return;
    }

    const payload = {
      ...formData,
      cliente_nome: formData.cliente_nome.trim() || 'Cliente Balcão',
      cliente_telefone: formData.cliente_telefone.trim() || '(Pátio)'
    };

    try {
      setSalvando(true);
      await onSalvar(payload);
      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao registrar entrada do veículo');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="modal-sheet bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200/80 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Barra de Arraste Mobile (Handle) */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Cabeçalho */}
        <div className="bg-white border-b border-slate-100 px-5 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">Entrada no Pátio</h3>
              <p className="text-[11px] text-slate-500">Digite a placa para puxar os dados do veículo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-press p-2 text-slate-400 hover:text-slate-700 active:bg-slate-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{erro}</span>
          </div>
        )}

        {/* Formulário com Scroll Interno */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          
          {/* Seção 1: Identificação do Veículo com KePlacas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-slate-500" />
                Veículo
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Placa com Botão de Consulta */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Placa <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={placaInputRef}
                    type="text"
                    required
                    maxLength={7}
                    value={formData.placa}
                    onChange={handlePlacaChange}
                    placeholder="ABC1D23"
                    className="w-full uppercase font-mono font-black tracking-wider pl-3 pr-9 py-2.5 text-base rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none shadow-2xs transition-colors"
                  />
                  
                  <button
                    type="button"
                    onClick={() => buscarDadosPlaca()}
                    disabled={consultandoPlaca || formData.placa.length < 7}
                    title="Consultar placa"
                    className="btn-press absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-40"
                  >
                    {consultandoPlaca ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                    ) : (
                      <Zap className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Status da Busca / Info sutil */}
              <div className="sm:col-span-2 flex flex-col justify-end">
                {consultandoPlaca ? (
                  <div className="text-xs text-slate-500 flex items-center gap-2 py-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                    <span>Buscando dados da placa...</span>
                  </div>
                ) : placaInfo ? (
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 py-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">
                      {placaInfo.marca} {placaInfo.modelo} {placaInfo.ano ? `(${placaInfo.ano})` : ''} {placaInfo.cor ? `• ${placaInfo.cor}` : ''}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-2">
                    Ao digitar os 7 dígitos, o veículo é preenchido automaticamente.
                  </p>
                )}
              </div>

              {/* Modelo */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Modelo do Veículo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  placeholder="Ex: Civic 2.0, HB20, Onix..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none shadow-2xs font-medium"
                />
              </div>

              {/* Marca */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marca</label>
                <input
                  type="text"
                  list="listaMarcas"
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  placeholder="Ex: Honda, Toyota..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <datalist id="listaMarcas">
                  {marcasComuns.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>

              {/* Ano e Cor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ano / Cor</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                    placeholder="Ano"
                    className="w-1/2 px-2.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    placeholder="Cor"
                    className="w-1/2 px-2.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Km Atual */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Km Atual</label>
                <input
                  type="number"
                  value={formData.km_entrada}
                  onChange={(e) => setFormData({ ...formData, km_entrada: e.target.value })}
                  placeholder="Ex: 85000"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Nível de Combustível */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Combustível
                </label>
                <select
                  value={formData.combustivel}
                  onChange={(e) => setFormData({ ...formData, combustivel: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                >
                  {niveisCombustivel.map(lvl => (
                    <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Seção 2: Problemas e Defeito Relatado */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-slate-500" />
              Defeitos e Vistoria
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  O que precisa ser feito / Defeito relatado
                </label>
                <textarea
                  ref={defeitoInputRef}
                  rows={3}
                  value={formData.defeito_relatado}
                  onChange={(e) => setFormData({ ...formData, defeito_relatado: e.target.value })}
                  placeholder="Ex: Barulho na suspensão dianteira ao frear, revisão de óleo e filtros..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none shadow-2xs font-medium transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Observações Extras (opcional)
                </label>
                <input
                  type="text"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Ex: Risco na porta direita, estepe no porta-malas..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Proprietário / Cliente (Opcional) */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Cliente (Opcional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={formData.cliente_nome}
                  onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                  placeholder="Cliente Balcão (opcional)"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  WhatsApp / Celular
                </label>
                <input
                  type="tel"
                  value={formData.cliente_telefone}
                  onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                  placeholder="(11) 99999-9999 (opcional)"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Botão Fixo/Sticky no Rodapé */}
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
              disabled={salvando || consultandoPlaca}
              className="btn-press flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl shadow-xs text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{salvando ? 'Registrando...' : 'Colocar no Pátio'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
