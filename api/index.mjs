import express from 'express';
import cors from 'cors';
import {
  firebaseConfig,
  fsGetStats,
  fsGetConfig,
  fsUpdateConfig,
  fsGetVeiculos,
  fsGetVeiculo,
  fsCreateVeiculo,
  fsUpdateVeiculo,
  fsAddItem,
  fsDeleteItem,
  fsSaidaVeiculo,
  fsReabrirVeiculo,
  fsDeleteVeiculo
} from '../server/firebaseDb.mjs';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/firebase-status', (req, res) => {
  res.json({
    connected: true,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
    database: '(default)',
    region: 'nam5'
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await fsGetStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/config', async (req, res) => {
  try {
    const config = await fsGetConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/config', async (req, res) => {
  try {
    await fsUpdateConfig(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/veiculos', async (req, res) => {
  try {
    const { status, search, modo } = req.query;
    const veiculos = await fsGetVeiculos({ modo, status, search });
    res.json(veiculos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/veiculos/:id', async (req, res) => {
  try {
    const veiculo = await fsGetVeiculo(req.params.id);
    if (!veiculo) return res.status(404).json({ error: 'Veículo não encontrado' });
    res.json(veiculo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/veiculos', async (req, res) => {
  try {
    const {
      placa, modelo, marca, ano, cor, km_entrada, combustivel,
      cliente_nome, cliente_telefone, cliente_documento,
      defeito_relatado, observacoes, pertences_avarias,
      data_entrada, status
    } = req.body;

    if (!placa || !modelo) {
      return res.status(400).json({ error: 'Placa e modelo do veículo são obrigatórios' });
    }

    const cleanPlaca = placa.toUpperCase().trim();
    const entryDate = data_entrada || new Date().toISOString();
    const nomeClienteFinal = (cliente_nome && cliente_nome.trim()) ? cliente_nome.trim() : 'Cliente Balcão';
    const telClienteFinal = (cliente_telefone && cliente_telefone.trim()) ? cliente_telefone.trim() : '(Pátio)';

    const veiculoData = {
      placa: cleanPlaca,
      modelo: modelo.trim(),
      marca: marca ? marca.trim() : '',
      ano: ano ? String(ano).trim() : '',
      cor: cor ? cor.trim() : '',
      km_entrada: km_entrada ? Number(km_entrada) : 0,
      combustivel: combustivel || '1/2',
      cliente_nome: nomeClienteFinal,
      cliente_telefone: telClienteFinal,
      cliente_documento: cliente_documento ? cliente_documento.trim() : '',
      defeito_relatado: defeito_relatado ? defeito_relatado.trim() : '',
      observacoes: observacoes ? observacoes.trim() : '',
      pertences_avarias: pertences_avarias ? pertences_avarias.trim() : '',
      status: status || 'aguardando_orcamento',
      data_entrada: entryDate
    };

    const fsId = await fsCreateVeiculo(veiculoData);
    res.status(201).json({ id: fsId, message: 'Entrada registrada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/veiculos/:id', async (req, res) => {
  try {
    await fsUpdateVeiculo(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/veiculos/:id/itens', async (req, res) => {
  try {
    const { tipo, descricao, quantidade, valor_unitario } = req.body;
    if (!descricao) return res.status(400).json({ error: 'Descrição é obrigatória' });
    const novoTotal = await fsAddItem(req.params.id, {
      tipo: tipo || 'servico',
      descricao,
      quantidade: Number(quantidade) || 1,
      valor_unitario: Number(valor_unitario) || 0
    });
    res.status(201).json({ success: true, valor_total: novoTotal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/veiculos/:id/itens/:itemId', async (req, res) => {
  try {
    const novoTotal = await fsDeleteItem(req.params.id, req.params.itemId);
    res.json({ success: true, valor_total: novoTotal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/veiculos/:id/saida', async (req, res) => {
  try {
    await fsSaidaVeiculo(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/veiculos/:id/reabrir', async (req, res) => {
  try {
    await fsReabrirVeiculo(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/veiculos/:id', async (req, res) => {
  try {
    await fsDeleteVeiculo(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
