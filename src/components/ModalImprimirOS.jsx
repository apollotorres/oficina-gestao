import React, { useEffect, useState } from 'react';
import { X, Printer, Wrench } from 'lucide-react';
import { formatarPlaca, formatarMoeda, formatarTelefone, formatarDataHora } from '../utils/formatters';

export default function ModalImprimirOS({ veiculoId, isOpen, onClose, oficinaConfig }) {
  if (!isOpen || !veiculoId) return null;

  const [veiculo, setVeiculo] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setCarregando(true);
        const res = await fetch(`/api/veiculos/${veiculoId}`);
        const data = await res.json();
        setVeiculo(data);
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    load();
  }, [veiculoId]);

  if (carregando || !veiculo) return null;

  function acionarImpressao() {
    window.print();
  }

  const servicos = (veiculo.itens || []).filter(i => i.tipo === 'servico');
  const pecas = (veiculo.itens || []).filter(i => i.tipo === 'peca');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      {/* Botões de Ação na Tela (escondidos na impressão via no-print) */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6">
        
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-sm">Visualização de Impressão da OS</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={acionarImpressao}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Folha de Impressão */}
        <div className="p-8 bg-white text-slate-900 font-sans print-card">
          
          {/* Cabeçalho da Oficina */}
          <div className="border-b-2 border-slate-800 pb-4 mb-5 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {oficinaConfig?.nome_oficina || 'AUTO MECÂNICA EXCELÊNCIA'}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                {oficinaConfig?.endereco || 'Av. Automotiva, 1000 - Centro'}
              </p>
              <p className="text-xs text-slate-600">
                Tel/WhatsApp: {oficinaConfig?.telefone || '(11) 98765-4321'} • CNPJ: {oficinaConfig?.cnpj || '12.345.678/0001-90'}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white px-3 py-1 font-mono font-black text-base rounded">
                OS #{veiculo.id.toString().padStart(5, '0')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Data Emissão: {formatarDataHora(new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Dados do Veículo e Cliente em Duas Colunas */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-5 border border-slate-300 rounded-lg p-3 bg-slate-50/50">
            <div>
              <span className="font-bold text-slate-900 uppercase block mb-1">Dados do Veículo</span>
              <p><strong className="text-slate-700">Placa:</strong> <span className="font-mono font-bold bg-white px-1.5 py-0.5 border border-slate-300 rounded">{formatarPlaca(veiculo.placa)}</span></p>
              <p className="mt-1"><strong className="text-slate-700">Veículo:</strong> {veiculo.modelo} ({veiculo.marca || '-'})</p>
              <p><strong className="text-slate-700">Ano/Cor:</strong> {veiculo.ano || '-'} / {veiculo.cor || '-'}</p>
              <p><strong className="text-slate-700">Km Entrada:</strong> {veiculo.km_entrada ? `${veiculo.km_entrada.toLocaleString('pt-BR')} km` : '-'} | <strong>Tanque:</strong> {veiculo.combustivel || '-'}</p>
            </div>

            <div>
              <span className="font-bold text-slate-900 uppercase block mb-1">Dados do Cliente</span>
              <p><strong className="text-slate-700">Nome:</strong> {veiculo.cliente_nome}</p>
              <p><strong className="text-slate-700">Telefone:</strong> {formatarTelefone(veiculo.cliente_telefone)}</p>
              <p><strong className="text-slate-700">Documento:</strong> {veiculo.cliente_documento || 'Não informado'}</p>
              <p><strong className="text-slate-700">Entrada:</strong> {formatarDataHora(veiculo.data_entrada)}</p>
              {veiculo.data_saida && (
                <p><strong className="text-slate-700">Saída:</strong> {formatarDataHora(veiculo.data_saida)}</p>
              )}
            </div>
          </div>

          {/* Defeito Relatado */}
          <div className="text-xs mb-5 border-l-4 border-slate-400 pl-3 py-1">
            <span className="font-bold text-slate-800">Defeito Relatado / Solicitação do Cliente:</span>
            <p className="text-slate-600 mt-0.5">{veiculo.defeito_relatado || 'Revisão preventiva e diagnósticos gerais.'}</p>
            {veiculo.pertences_avarias && (
              <p className="text-slate-500 mt-1"><strong className="text-slate-700">Vistoria de entrada:</strong> {veiculo.pertences_avarias}</p>
            )}
          </div>

          {/* Tabela de Itens */}
          <div className="mb-5">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3">Item / Descrição</th>
                  <th className="py-2 px-2 text-center w-16">Tipo</th>
                  <th className="py-2 px-2 text-center w-14">Qtd</th>
                  <th className="py-2 px-3 text-right w-24">V. Unitário</th>
                  <th className="py-2 px-3 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(veiculo.itens || []).map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-1.5 px-3 font-medium text-slate-800">{item.descricao}</td>
                    <td className="py-1.5 px-2 text-center text-slate-600 uppercase text-[10px]">
                      {item.tipo === 'peca' ? 'Peça' : 'Serviço'}
                    </td>
                    <td className="py-1.5 px-2 text-center text-slate-700">{item.quantidade}</td>
                    <td className="py-1.5 px-3 text-right text-slate-600">{formatarMoeda(item.valor_unitario)}</td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-800">{formatarMoeda(item.valor_total)}</td>
                  </tr>
                ))}
                {(!veiculo.itens || veiculo.itens.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">Nenhum item lançado até o momento.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totais e Pagamento */}
          <div className="flex justify-end mb-8">
            <div className="w-64 border border-slate-300 rounded-lg p-3 bg-slate-50 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Serviços / Mão de Obra:</span>
                <span className="font-semibold">{formatarMoeda(servicos.reduce((a, b) => a + (b.valor_total || 0), 0))}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Peças e Insumos:</span>
                <span className="font-semibold">{formatarMoeda(pecas.reduce((a, b) => a + (b.valor_total || 0), 0))}</span>
              </div>
              <div className="border-t border-slate-300 pt-1 flex justify-between font-black text-sm text-slate-900">
                <span>VALOR TOTAL:</span>
                <span>{formatarMoeda(veiculo.valor_total || 0)}</span>
              </div>
              {veiculo.forma_pagamento && (
                <div className="pt-1 text-[11px] text-slate-600 flex justify-between">
                  <span>Forma Pgto: <strong>{veiculo.forma_pagamento}</strong></span>
                  <span className="uppercase font-bold text-emerald-700">({veiculo.status_pagamento})</span>
                </div>
              )}
            </div>
          </div>

          {/* Termos de Garantia */}
          <div className="text-[10px] text-slate-500 mb-8 border-t border-slate-200 pt-2 leading-relaxed">
            <p><strong>Garantia legal:</strong> Os serviços executados e as peças aplicadas possuem garantia de 90 dias a contar da data de retirada do veículo, cobrindo exclusivamente defeitos de fabricação ou montagem, conforme disposto no Código de Defesa do Consumidor (Lei nº 8.078/90).</p>
          </div>

          {/* Assinaturas */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-4 border-t border-slate-300 text-center">
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-800">{veiculo.cliente_nome}</p>
              <p className="text-[10px] text-slate-500">Cliente / Proprietário</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
              <p className="font-semibold text-slate-800">{oficinaConfig?.responsavel || 'Responsável Técnico'}</p>
              <p className="text-[10px] text-slate-500">{oficinaConfig?.nome_oficina || 'Oficina Mecânica'}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

