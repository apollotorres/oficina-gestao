import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'oficina.db');

export const db = new DatabaseSync(dbPath);

export function initDatabase() {
  // Config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT
    );
  `);

  // Veiculos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS veiculos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placa TEXT NOT NULL,
      modelo TEXT NOT NULL,
      marca TEXT,
      ano TEXT,
      cor TEXT,
      km_entrada INTEGER,
      combustivel TEXT DEFAULT '1/2',
      cliente_nome TEXT NOT NULL,
      cliente_telefone TEXT NOT NULL,
      cliente_documento TEXT,
      defeito_relatado TEXT,
      observacoes TEXT,
      pertences_avarias TEXT,
      status TEXT NOT NULL DEFAULT 'aguardando_orcamento',
      data_entrada TEXT NOT NULL,
      data_saida TEXT,
      forma_pagamento TEXT,
      status_pagamento TEXT DEFAULT 'pendente',
      valor_total REAL DEFAULT 0,
      desconto REAL DEFAULT 0,
      observacoes_saida TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Servicos e Peças table
  db.exec(`
    CREATE TABLE IF NOT EXISTS itens_servico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      veiculo_id INTEGER NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'servico', -- 'servico' ou 'peca'
      descricao TEXT NOT NULL,
      quantidade REAL DEFAULT 1,
      valor_unitario REAL DEFAULT 0,
      valor_total REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
    );
  `);

  // Default config if not exists
  const existingConfig = db.prepare("SELECT valor FROM configuracoes WHERE chave = 'nome_oficina'").get();
  if (!existingConfig) {
    const insertConfig = db.prepare("INSERT INTO configuracoes (chave, valor) VALUES (?, ?)");
    insertConfig.run('nome_oficina', 'Auto Mecânica Express');
    insertConfig.run('telefone', '(11) 98765-4321');
    insertConfig.run('cnpj', '12.345.678/0001-90');
    insertConfig.run('endereco', 'Av. das Oficinas, 1000 - Centro Automotivo');
    insertConfig.run('responsavel', 'Carlos Silva');
    insertConfig.run('mensagem_orcamento', 'Olá {cliente}! Segue o orçamento para seu veículo {veiculo} (Placa {placa}): Total de R$ {total}. Podemos aprovar o serviço?');
    insertConfig.run('mensagem_pronto', 'Olá {cliente}! Boas notícias: seu veículo {veiculo} (Placa {placa}) já está pronto para retirada na {oficina}!');
  }
}

