// Formatadores e utilitários para a oficina mecânica

export function formatarPlaca(placa) {
  if (!placa) return '';
  const limpa = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (limpa.length === 7) {
    // Padrão antigo ABC-1234 ou mercosul ABC1D23
    if (/^[A-Z]{3}[0-9]{4}$/.test(limpa)) {
      return `${limpa.slice(0, 3)}-${limpa.slice(3)}`;
    }
    return limpa;
  }
  return limpa;
}

export function formatarMoeda(valor) {
  const num = Number(valor) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatarTelefone(telefone) {
  if (!telefone) return '';
  const limpo = telefone.replace(/\D/g, '');
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  }
  if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }
  return telefone;
}

export function primeiroNome(nomeCompleto) {
  if (!nomeCompleto || nomeCompleto === 'Cliente Balcão') return '';
  return nomeCompleto.trim().split(/\s+/)[0];
}

export function nomeCurtoCarro(modelo) {
  if (!modelo) return 'carro';
  const partes = modelo.trim().split(/\s+/);
  // Se o segundo termo for parte do nome composto (ex: Hilux SW4, Gol G5), mantém os 2 primeiros, senão só o 1º
  if (partes.length >= 2 && /^(SW4|HR-V|CR-V|WR-V|RAV4|T-Cross|Up|Ka|Fit|City)$/i.test(partes[1])) {
    return `${partes[0]} ${partes[1]}`;
  }
  return partes[0];
}

export function gerarLinkWhatsApp(telefone, mensagem) {
  if (!telefone) return '#';
  const limpo = telefone.replace(/\D/g, '');
  const comDDI = limpo.startsWith('55') ? limpo : `55${limpo}`;
  return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem || '')}`;
}

export function formatarDataHora(dataString) {
  if (!dataString) return '-';
  const data = new Date(dataString);
  if (isNaN(data.getTime())) return dataString;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data);
}

export function tempoPermanencia(dataString) {
  if (!dataString) return '';
  const entrada = new Date(dataString);
  const agora = new Date();
  const diffMs = agora - entrada;
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDias = Math.floor(diffHoras / 24);

  if (diffHoras < 1) {
    const minutos = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    return `Há ${minutos} min`;
  }
  if (diffHoras < 24) {
    return `Há ${diffHoras}h`;
  }
  if (diffDias === 1) {
    return `Há 1 dia (${diffHoras % 24}h)`;
  }
  return `Há ${diffDias} dias`;
}

export const STATUS_MAP = {
  aguardando_orcamento: {
    label: 'Aguardando Orçamento',
    dot: 'bg-amber-500',
    step: 1
  },
  aguardando_aprovacao: {
    label: 'Aguardando Aprovação',
    dot: 'bg-purple-500',
    step: 2
  },
  em_manutencao: {
    label: 'Em Manutenção',
    dot: 'bg-blue-600',
    step: 3
  },
  aguardando_pecas: {
    label: 'Aguardando Peças',
    dot: 'bg-orange-500',
    step: 4
  },
  pronto: {
    label: 'Pronto para Retirada',
    dot: 'bg-emerald-500',
    step: 5
  },
  finalizado: {
    label: 'Entregue / Concluído',
    dot: 'bg-slate-400',
    step: 6
  }
};

