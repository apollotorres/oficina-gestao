import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, getDoc, getDocs, collection, 
  query, where, orderBy, updateDoc, deleteDoc, addDoc 
} from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "oficina-gestao-5412",
  appId: "1:548571870947:web:d34e765eb28920736bf7d6",
  storageBucket: "oficina-gestao-5412.firebasestorage.app",
  apiKey: "AIzaSyB5RA8YUSRxTIqcSJGWRpMT9Jj16NS6FbQ",
  authDomain: "oficina-gestao-5412.firebaseapp.com",
  messagingSenderId: "548571870947",
  projectNumber: "548571870947"
};

const app = initializeApp(firebaseConfig);
export const fdb = getFirestore(app);

// Sincronização inicial das configurações da oficina no Firebase Cloud
export async function syncInitialDataFromSQLite(sqliteDb) {
  try {
    const cfgSnap = await getDoc(doc(fdb, 'sistema', 'configuracoes'));
    if (!cfgSnap.exists()) {
      const configs = sqliteDb.prepare("SELECT chave, valor FROM configuracoes").all();
      const configObj = {};
      configs.forEach(c => { configObj[c.chave] = c.valor; });
      await setDoc(doc(fdb, 'sistema', 'configuracoes'), configObj);
    }
    console.log('☁️ Firebase Firestore conectado!');
  } catch (err) {
    console.error('Aviso ao sincronizar com Firestore:', err.message);
  }
}

// 1. Stats
export async function fsGetStats() {
  const snap = await getDocs(collection(fdb, 'veiculos'));
  let totalPatio = 0;
  let aguardandoOrcamento = 0;
  let emManutencao = 0;
  let aguardandoPecas = 0;
  let prontos = 0;
  let totalFinalizados = 0;
  let faturamentoMes = 0;

  snap.forEach(docSnap => {
    const v = docSnap.data();
    if (v.status !== 'finalizado') {
      totalPatio++;
      if (v.status === 'aguardando_orcamento') aguardandoOrcamento++;
      if (v.status === 'em_manutencao') emManutencao++;
      if (v.status === 'aguardando_pecas') aguardandoPecas++;
      if (v.status === 'pronto') prontos++;
    } else {
      totalFinalizados++;
      if (v.status_pagamento === 'pago') {
        faturamentoMes += Number(v.valor_total || 0);
      }
    }
  });

  return {
    totalPatio,
    aguardandoOrcamento,
    emManutencao,
    aguardandoPecas,
    prontos,
    totalFinalizados,
    faturamentoMes
  };
}

// 2. Configurações
export async function fsGetConfig() {
  const snap = await getDoc(doc(fdb, 'sistema', 'configuracoes'));
  return snap.exists() ? snap.data() : {};
}

export async function fsUpdateConfig(newConfig) {
  await setDoc(doc(fdb, 'sistema', 'configuracoes'), newConfig, { merge: true });
  return true;
}

// 3. Listar Veículos com Filtro e Busca
export async function fsGetVeiculos({ modo, status, search }) {
  const snap = await getDocs(collection(fdb, 'veiculos'));
  let list = [];

  snap.forEach(d => {
    list.push({ ...d.data(), id: d.id });
  });

  // Filtro de Modo
  if (modo === 'patio') {
    list = list.filter(v => v.status !== 'finalizado');
  } else if (modo === 'historico') {
    list = list.filter(v => v.status === 'finalizado');
  } else if (status && status !== 'todos') {
    list = list.filter(v => v.status === status);
  }

  // Filtro de Busca
  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    list = list.filter(v => 
      (v.placa && v.placa.toLowerCase().includes(s)) ||
      (v.modelo && v.modelo.toLowerCase().includes(s)) ||
      (v.cliente_nome && v.cliente_nome.toLowerCase().includes(s)) ||
      (v.cliente_telefone && v.cliente_telefone.toLowerCase().includes(s))
    );
  }

  // Ordenação
  if (modo === 'historico') {
    list.sort((a, b) => new Date(b.data_saida || 0) - new Date(a.data_saida || 0));
  } else {
    list.sort((a, b) => new Date(b.data_entrada || 0) - new Date(a.data_entrada || 0));
  }

  return list;
}

// 4. Detalhes de um Veículo com Itens
export async function fsGetVeiculo(id) {
  const snap = await getDoc(doc(fdb, 'veiculos', String(id)));
  if (!snap.exists()) return null;

  const veiculo = { ...snap.data(), id: snap.id };
  const itensSnap = await getDocs(collection(fdb, 'veiculos', String(id), 'itens'));
  const itens = [];
  itensSnap.forEach(d => itens.push({ ...d.data(), id: d.id }));
  itens.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

  return { ...veiculo, itens };
}

// 5. Criar Veículo
export async function fsCreateVeiculo(data) {
  const docRef = await addDoc(collection(fdb, 'veiculos'), {
    ...data,
    valor_total: 0,
    status_pagamento: 'pendente',
    created_at: new Date().toISOString()
  });
  return docRef.id;
}

// 6. Atualizar Veículo
export async function fsUpdateVeiculo(id, data) {
  await updateDoc(doc(fdb, 'veiculos', String(id)), data);
  return true;
}

// 7. Adicionar Item
export async function fsAddItem(veiculoId, itemData) {
  const vId = String(veiculoId);
  const qty = Number(itemData.quantidade) || 1;
  const unit = Number(itemData.valor_unitario) || 0;
  const total = qty * unit;

  await addDoc(collection(fdb, 'veiculos', vId, 'itens'), {
    ...itemData,
    quantidade: qty,
    valor_unitario: unit,
    valor_total: total,
    created_at: new Date().toISOString()
  });

  return await fsRecalculateTotal(vId);
}

// 8. Deletar Item
export async function fsDeleteItem(veiculoId, itemId) {
  const vId = String(veiculoId);
  await deleteDoc(doc(fdb, 'veiculos', vId, 'itens', String(itemId)));
  return await fsRecalculateTotal(vId);
}

// Recalcular Total no Firestore
export async function fsRecalculateTotal(veiculoId) {
  const vId = String(veiculoId);
  const itensSnap = await getDocs(collection(fdb, 'veiculos', vId, 'itens'));
  let total = 0;
  itensSnap.forEach(d => {
    total += Number(d.data().valor_total || 0);
  });
  await updateDoc(doc(fdb, 'veiculos', vId), { valor_total: total });
  return total;
}

// 9. Saída / Checkout
export async function fsSaidaVeiculo(id, data) {
  const vId = String(id);
  await updateDoc(doc(fdb, 'veiculos', vId), {
    status: 'finalizado',
    data_saida: data.data_saida || new Date().toISOString(),
    forma_pagamento: data.forma_pagamento || 'PIX',
    status_pagamento: data.status_pagamento || 'pago',
    observacoes_saida: data.observacoes_saida || ''
  });
  return true;
}

// 10. Reabrir Veículo
export async function fsReabrirVeiculo(id) {
  const vId = String(id);
  await updateDoc(doc(fdb, 'veiculos', vId), {
    status: 'em_manutencao',
    data_saida: null,
    status_pagamento: 'pendente'
  });
  return true;
}

// 11. Deletar Veículo
export async function fsDeleteVeiculo(id) {
  const vId = String(id);
  const itensSnap = await getDocs(collection(fdb, 'veiculos', vId, 'itens'));
  for (const d of itensSnap.docs) {
    await deleteDoc(doc(fdb, 'veiculos', vId, 'itens', d.id));
  }
  await deleteDoc(doc(fdb, 'veiculos', vId));
  return true;
}

