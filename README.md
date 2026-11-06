# AutoGestão - Sistema de Gestão para Oficina Mecânica 🚗🔧

Sistema completo, moderno e prático para gerenciamento de entradas, ordens de serviço (OS) e saídas de veículos em oficinas mecânicas e centros automotivos.

---

## 🚀 Como Iniciar o Sistema

### Opção 1: Clique Duplo (Windows)
Basta dar um duplo clique no arquivo:
👉 `iniciar_sistema.bat`

O navegador abrirá automaticamente em: **http://localhost:3001**

### Opção 2: Pelo Terminal / Linha de Comando
```bash
cd C:\Users\ApolloHenriqueTorres\.gemini\antigravity\scratch\oficina-gestao
npm start
```
Ou para modo desenvolvedor com hot-reload (Vite):
```bash
npm run dev
```

---

## 📱 Acesso pelo Celular ou Tablet no Pátio (Wi-Fi)
Você pode usar o sistema no celular ou tablet enquanto faz a vistoria do veículo no pátio da oficina:
1. Conecte o celular na mesma rede Wi-Fi do computador da oficina.
2. Descubra o IP do seu computador (digite `ipconfig` no terminal, ex: `192.168.1.15`).
3. No navegador do celular/tablet, acesse:
   `http://192.168.1.15:3001`

---

## 🛠️ Principais Recursos

1. **Pátio Ativo (Entradas e Status)**:
   - Visualização por **Cards** ou **Tabela** rápida.
   - Filtros instantâneos por status:
     - ⏳ Aguardando Orçamento
     - 🟣 Aguardando Aprovação
     - 🔧 Em Manutenção
     - 📦 Aguardando Peças
     - ✅ Pronto para Retirada
   - Cálculo automático do **tempo de permanência** no pátio ("Há 2 horas", "Há 3 dias").
   - Busca em tempo real por **Placa** (Mercosul e antiga), **Modelo**, **Nome do Cliente** ou **Telefone**.

2. **Check-in Rápido de Veículos (+ Nova Entrada)**:
   - Placa com formatação automática estilo Mercosul.
   - Dados do veículo (Marca, Modelo, Ano, Cor, Km atual).
   - Nível de Combustível visual (Reserva, 1/4, 1/2, 3/4, Cheio).
   - Dados do proprietário (Nome, Telefone com máscara brasileira e link para WhatsApp, CPF/CNPJ).
   - Defeito relatado pelo cliente e vistoria prévia (avarias pré-existentes, pertences).

3. **Ordem de Serviço (OS) & Orçamentos**:
   - Adicione **Peças** e **Mão de Obra / Serviços** com quantidade e valor unitário.
   - Cálculo em tempo real do Total Geral e subtotais separados.
   - Atualização do status com 1 clique.
   - **Botão direto do WhatsApp**: Envie o orçamento pronto ou aviso de "Carro Pronto para Retirada" com texto profissional pré-formatado em 1 clique!

4. **Saída do Veículo (Check-out)**:
   - Registro de data/hora de saída.
   - Formas de pagamento: PIX, Cartão de Crédito, Cartão de Débito, Dinheiro, A Prazo.
   - Status de pagamento (Pago / Pendente).
   - Observações de saída e termo de garantia (90 dias legais).

5. **Impressão Profissional (A4 ou PDF)**:
   - Formato limpo e profissional pronto para imprimir ou salvar em PDF.
   - Cabeçalho personalizado com os dados da sua oficina (Nome, Endereço, Telefone, CNPJ).
   - Discriminação completa de peças, serviços, valores e termos.
   - Campo para assinatura do cliente e do mecânico responsável.

6. **Histórico & Relatórios**:
   - Consulta a todos os veículos já entregues.
   - Faturamento acumulado do mês.
   - Opção de **Reabrir Veículo** caso retorne para garantia.

7. **Banco de Dados Seguro (SQLite)**:
   - O arquivo do banco de dados fica salvo localmente em `server/oficina.db`.
   - Para fazer backup, basta copiar esse arquivo para um pen-drive ou nuvem.

