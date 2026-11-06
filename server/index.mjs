import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { db, initDatabase } from './db.mjs';
import { 
  firebaseConfig,
  syncInitialDataFromSQLite, 
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
} from './firebaseDb.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. Inicia SQLite local e sincroniza com Firebase Cloud Firestore
initDatabase();
syncInitialDataFromSQLite(db).catch(err => {
  console.error('Erro na sincronização inicial do Firebase:', err);
});

// Cache em memória para consultas de placas
const plateCache = new Map();

// Formatador avançado de nomes de montadoras e modelos automotivos
function formatAutomotiveTitle(str) {
  if (!str) return '';
  let cleaned = str.trim();
  cleaned = cleaned.replace(/^(I\/|IMP\/|NAC\/)/i, '');
  if (cleaned.includes('/') && !cleaned.includes(' / ')) {
    const parts = cleaned.split('/');
    if (parts.length === 2 && parts[1].trim().length > 0) {
      cleaned = parts[1].trim();
    }
  }

  cleaned = cleaned.replace(/\b([1-9])([0-9])([0-9]{1,2}V)\b/gi, (_match, d1, d2, v) => `${d1}.${d2} ${v.toUpperCase()}`);
  cleaned = cleaned.replace(/\b([1-9])([0-9])(TSI|TFSI|TURBO|THP|MPI|VVT|GDI|FSI|T)\b/gi, (_match, d1, d2, sigla) => {
    const s = sigla.toUpperCase() === 'T' ? 'Turbo' : sigla.toUpperCase();
    return `${d1}.${d2} ${s}`;
  });
  cleaned = cleaned.replace(
    /\b(EXP|LT|LTZ|ATTRACTIVE|ATTRACTIV|DYNAMIC|ACTIVE|INTENSE|AUTHENTIQUE|TREND|CONFORT|COMFORTLINE|HIGHLINE|SPORTLINE|TITANIUM|SEL|SE|XR|XL|XLS|GL|GLS|GLX|LX|EX|EXL|LXR|PREMIUM|DRIVE|LIKE|TREKKING|WAY|PRECISION|ENDURANCE|FREEDOM|VOLCANO|XEI|ALTIS|GR|PLUS|SPECIAL)\s+(10|12|13|14|15|16|18|20|24|25|28|30|32|35|36|38|40)\b/gi,
    (_match, trim, disp) => `${trim} ${disp[0]}.${disp[1]}`
  );
  cleaned = cleaned.replace(/\b(10|12|13|14|15|16|18|20|24|25|28|30|35|40)\s+(FLEX|GASOLINA|DIESEL|ALCOOL|ÁLCOOL|AUT|MEC|MANUAL)\b/gi, (_match, disp, fuel) => `${disp[0]}.${disp[1]} ${fuel}`);

  const acronyms = new Set([
    'BMW', 'GTI', 'TSI', 'TFSI', 'AMG', 'RS3', 'RS4', 'RS5', 'RS6', 'RS', 
    'TS', 'HD', '4MATIC', 'PDK', 'DSG', 'V8', 'V6', 'V10', 'V12', 'GLI', 'M', 'VW', 
    'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'TTS', 'TT', 'STI', 'WRX', 'GT3', 'GT4', 'GTS', 'GT',
    '16V', '8V', '24V', '12V', '4X4', '4WD', 'AWD', 'FWD', 'RWD', 'CVT', 'THP', 'MPI', 'VVT', 'GDI', 'FSI',
    'EXP', 'LT', 'LTZ', 'SLX', 'GLX', 'GLS', 'EXL', 'LXR', 'XEI', 'SE', 'SEL', 'XR', 'GII', 'GIII', 'GIV', 'GV', 'GVI', 'GVII', 'GVIII',
    'HR-V', 'CR-V', 'WR-V', 'RAV4', 'SW4', 'SI', 'GT-R'
  ]);

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (acronyms.has(upper)) return upper;
      if (/^[0-9]+(\.[0-9]+)?$/.test(word)) return word;
      if (word.includes('-')) {
        return word.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// 0. Status do Firebase
app.get('/api/firebase-status', (req, res) => {
  res.json({
    connected: true,
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
    database: '(default)',
    region: 'nam5'
  });
});

// 0.1 Consulta de Placa via KePlacas
app.get('/api/placa/:placa', async (req, res) => {
  try {
    const rawPlate = (req.params.placa || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (rawPlate.length < 7) {
      return res.status(400).json({ error: 'Placa deve ter 7 caracteres válidos' });
    }

    if (plateCache.has(rawPlate)) {
      return res.json({ success: true, ...plateCache.get(rawPlate), cached: true });
    }

    const scriptPath = path.join(__dirname, 'keplaca_fetcher.py');
    const pyOutput = await new Promise((resolve, reject) => {
      execFile('python', [scriptPath, rawPlate], { timeout: 15000 }, (error, stdout, stderr) => {
        if (error) {
          console.error('Python error:', stderr || error);
          return reject(error);
        }
        resolve(stdout);
      });
    });

    const data = JSON.parse(pyOutput.trim() || '{}');
    if (data.error) {
      return res.status(404).json({ success: false, message: data.error });
    }

    const rawModel = String(data.model || '').replace(/SWDMDA4MD/i, 'SW4 2.8 Turbo 4x4 Diesel').trim();
    const formattedModel = formatAutomotiveTitle(rawModel) || rawModel;
    const formattedBrand = formatAutomotiveTitle(data.brand) || data.brand;

    const vehicleInfo = {
      placa: rawPlate,
      marca: formattedBrand,
      modelo: formattedModel,
      ano: data.year || '',
      cor: data.color || '',
      combustivel: data.fuel || '',
      municipio: data.city || '',
      uf: data.uf || '',
      fonte: data.source || 'keplaca'
    };

    plateCache.set(rawPlate, vehicleInfo);
    res.json({ success: true, ...vehicleInfo });
  } catch (error) {
    console.error('Erro na consulta de placa:', error);
    res.status(500).json({ success: false, error: 'Falha ao consultar dados da placa: ' + error.message });
  }
});

// 1. Get stats (Firebase Firestore com fallback SQLite)
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await fsGetStats();
    res.json(stats);
  } catch (error) {
    console.warn('Fallback para SQLite em /api/stats:', error.message);
    try {
      const totalPatio = db.prepare("SELECT COUNT(*) as count FROM veiculos WHERE status != 'finalizado'").get().count;
      const aguardandoOrcamento = db.prepare("SELECT COUNT(*) as count FROM veiculos WHERE status = 'aguardando_orcamento'").get().count;
      const emManutencao = db.prepare("SELECT COUNT(*) as count FROM veiculos WHERE status = 'em_manutencao'").get().count;
      const aguardandoPecas = db.prepare("SELECT COUNT(*) as count FROM veiculos WHERE status = 'aguardando_pecas'").get().count;
      const prontos = db.prepare("SELECT COUNT(*) as count FROM veiculos WHERE status = 'pronto'").get().count;
      const faturamentoMes = db.prepare("SELECT COALESCE(SUM(valor_total), 0) as total FROM veiculos WHERE status = 'finalizado' AND status_pagamento = 'pago'").get().total;
      const totalFinalizados = db.prepare("SELECT COUNT(*) as count FROM veiculos WHERE status = 'finalizado'").get().count;
      res.json({ totalPatio, aguardandoOrcamento, emManutencao, aguardandoPecas, prontos, totalFinalizados, faturamentoMes });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
});

// 2. Get configurations
app.get('/api/config', async (req, res) => {
  try {
    const config = await fsGetConfig();
    res.json(config);
  } catch (error) {
    const rows = db.prepare("SELECT chave, valor FROM configuracoes").all();
    const config = {};
    rows.forEach(r => { config[r.chave] = r.valor; });
    res.json(config);
  }
});

// 2.1 Update configuration
app.put('/api/config', async (req, res) => {
  try {
    await fsUpdateConfig(req.body);
    const upsert = db.prepare("INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor");
    for (const [key, value] of Object.entries(req.body)) {
      upsert.run(key, String(value));
    }
    res.json({ success: true, message: 'Configurações salvas no Firebase' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get vehicles (list with filters)
app.get('/api/veiculos', async (req, res) => {
  try {
    const { status, search, modo } = req.query;
    const veiculos = await fsGetVeiculos({ modo, status, search });
    res.json(veiculos);
  } catch (error) {
    console.warn('Fallback SQLite em /api/veiculos:', error.message);
    try {
      const { status, search, modo } = req.query;
      let query = "SELECT * FROM veiculos WHERE 1=1";
      const params = [];
      if (modo === 'patio') query += " AND status != 'finalizado'";
      else if (modo === 'historico') query += " AND status = 'finalizado'";
      else if (status && status !== 'todos') { query += " AND status = ?"; params.push(status); }

      if (search && search.trim() !== '') {
        const term = `%${search.trim()}%`;
        query += " AND (placa LIKE ? OR modelo LIKE ? OR cliente_nome LIKE ? OR cliente_telefone LIKE ?)";
        params.push(term, term, term, term);
      }
      query += modo === 'historico' ? " ORDER BY data_saida DESC, id DESC" : " ORDER BY data_entrada DESC, id DESC";
      res.json(db.prepare(query).all(...params));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
});

// 4. Get single vehicle with items
app.get('/api/veiculos/:id', async (req, res) => {
  try {
    const veiculo = await fsGetVeiculo(req.params.id);
    if (veiculo) return res.json(veiculo);
    
    // Tenta fallback local
    const vSql = db.prepare("SELECT * FROM veiculos WHERE id = ?").get(req.params.id);
    if (!vSql) return res.status(404).json({ error: 'Veículo não encontrado' });
    const itens = db.prepare("SELECT * FROM itens_servico WHERE veiculo_id = ? ORDER BY id ASC").all(req.params.id);
    res.json({ ...vSql, itens });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Create new vehicle check-in (Entrada)
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

    // Salva no Firestore
    const fsId = await fsCreateVeiculo(veiculoData);

    // Salva cópia local no SQLite
    try {
      db.prepare(`
        INSERT INTO veiculos (
          placa, modelo, marca, ano, cor, km_entrada, combustivel,
          cliente_nome, cliente_telefone, cliente_documento,
          defeito_relatado, observacoes, pertences_avarias,
          status, data_entrada, status_pagamento, valor_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', 0)
      `).run(
        cleanPlaca, veiculoData.modelo, veiculoData.marca, veiculoData.ano, veiculoData.cor,
        veiculoData.km_entrada, veiculoData.combustivel, nomeClienteFinal, telClienteFinal,
        veiculoData.cliente_documento, veiculoData.defeito_relatado, veiculoData.observacoes,
        veiculoData.pertences_avarias, veiculoData.status, entryDate
      );
    } catch (e) {
      // Ignora erro de espelhamento local
    }

    res.status(201).json({ id: fsId, message: 'Entrada registrada com sucesso no Firebase!' });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Update vehicle details or status
app.put('/api/veiculos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await fsUpdateVeiculo(id, req.body);
    res.json({ success: true, message: 'Dados atualizados no Firebase' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Add service or part item to vehicle
app.post('/api/veiculos/:id/itens', async (req, res) => {
  try {
    const veiculoId = req.params.id;
    const { tipo, descricao, quantidade, valor_unitario } = req.body;

    if (!descricao || !descricao.trim()) {
      return res.status(400).json({ error: 'Descrição do item é obrigatória' });
    }

    const novoTotal = await fsAddItem(veiculoId, {
      tipo: tipo || 'servico',
      descricao: descricao.trim(),
      quantidade: Number(quantidade) || 1,
      valor_unitario: Number(valor_unitario) || 0
    });

    res.status(201).json({ success: true, novoTotal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Delete service/part item
app.delete('/api/veiculos/:id/itens/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const novoTotal = await fsDeleteItem(id, itemId);
    res.json({ success: true, novoTotal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Register Vehicle Exit (Saída / Check-out)
app.post('/api/veiculos/:id/saida', async (req, res) => {
  try {
    const id = req.params.id;
    await fsSaidaVeiculo(id, req.body);
    res.json({ success: true, message: 'Saída registrada com sucesso no Firebase!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Reopen vehicle (bring back to yard)
app.post('/api/veiculos/:id/reabrir', async (req, res) => {
  try {
    const id = req.params.id;
    await fsReabrirVeiculo(id);
    res.json({ success: true, message: 'Veículo reaberto e retornado ao pátio!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Delete vehicle record
app.delete('/api/veiculos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await fsDeleteVeiculo(id);
    res.json({ success: true, message: 'Registro excluído do Firebase' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Static assets and SPA fallback
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚗 Sistema Oficina Gestão Ativo com Firebase!`);
  console.log(`☁️ Firebase Project: ${firebaseConfig.projectId}`);
  console.log(`🌐 Acesse no seu navegador: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
