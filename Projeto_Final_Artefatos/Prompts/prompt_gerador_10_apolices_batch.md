# PROMPT: Geração em Lote de 10 Apólices de Seguro D&O (Directors & Officers)

> **Finalidade:** Utilize este prompt em uma LLM (ChatGPT, Claude, Gemini, DeepSeek, etc.) para gerar **10 Apólices de Seguro D&O completas, realistas e detalhadas** em português (moeda **Real / BRL**). Cada apólice gerada pode ser salva como arquivo PDF ou texto e carregada diretamente na tela de **Nova Análise** do D&O Intelligence.

---

## 📄 COPIE O TEXTO ABAIXO E ENVIE PARA A LLM:

```text
Você é um especialista sênior em subscrição (Underwriting) e direito securitário especializado em Seguros de Responsabilidade Civil para Administradores e Diretores (D&O - Directors & Officers).

Sua tarefa é gerar em lote um conjunto de 10 (dez) Apólices de Seguro D&O fictícias, porém extremamente realistas, completas e detalhadas, prontas para serem exportadas em documento para testes de extração OCR/RAG e análise de IA.

---

### 📋 REQUISITOS OBRIGATÓRIOS PARA CADA UMA DAS 10 APÓLICES:

1. **Moeda e Valores:** Todos os valores financeiros (limites, franquias, sublimites, prêmios) devem estar obrigatoriamente padronizados em Reais (BRL / R$).
2. **Identificação e Cabeçalho:**
   - Número da Apólice (ex: POL-DO-2025-001 a POL-DO-2025-010)
   - Seguradora (ex: Alpha Re S.A., Beta Seguros, Itaú BBA Seguros, Chubb Brasil, Zurich Seguros, Tokio Marine, Mapfre, Bradesco Auto/RE, Allianz Brasil, Generali)
   - Tomador / Estipulante (Nome da empresa segurada)
   - Ramo: 09E - D&O Directors and Officers Liability
   - Vigência: Período de 12 meses (ex: 01/01/2025 a 31/12/2025)
3. **Quadro de Condições Financeiras:**
   - Limite Máximo de Responsabilidade (LMR) por reclamação e em agregado (ex: entre R$ 5.000.000 e R$ 250.000.000)
   - Franquia / Retenção Própria (ex: entre R$ 50.000 e R$ 7.500.000)
   - Prêmio Anual Total (ex: entre R$ 120.000 e R$ 2.500.000)
   - Data Retroativa / Atos Anteriores (ex: Ilimitada ou Data Específica)
   - Período Complementar / Suplementar de Reporte (ex: 60 dias, 12 meses, 36 meses)
   - Jurisdição / Foro Competente (ex: Foro da Comarca de São Paulo/SP, Rio de Janeiro/RJ, etc.)
4. **Capítulo I — Coberturas Principais:**
   - Cobertura A (Side A): Responsabilidade Direta dos Administradores (sem reembolso da sociedade)
   - Cobertura B (Side B): Reembolso Corporativo à Sociedade
   - Cobertura C (Side C): Entidade Cotada em Bolsa / Valores Mobiliários (quando aplicável)
5. **Capítulo II — Sublimites e Coberturas Adicionais:**
   - Custos de Gestão de Crise e Reputação
   - Custos de Defesa Legal e Honorários de Advogados
   - Despesas com Investigações Regulatórias e Internas
   - Cobertura para Cônjuges, Herdeiros e Legatários
6. **Capítulo III — Cláusulas de Exclusão Expressas:**
   - Exclusão de Atos Dolosos, Fraude e Vantagem Indevida (condicionada a trânsito em julgado)
   - Exclusão de Danos Ambientais e Poluição
   - Exclusão de Atos Anteriores à Data Retroativa
   - Exclusão de Reclamações entre Segurados (Insured vs Insured)

---

### 🌐 DIVERSIFICAÇÃO DAS 10 APÓLICES:

Gere cada uma das 10 apólices com perfis operacionais e níveis de risco distintos:

- **Apólice #1 (POL-DO-2025-001):** Conglomerado Industrial de Grande Porte (LMR: R$ 150M, Franquia: R$ 2.5M, Retroatividade Ilimitada).
- **Apólice #2 (POL-DO-2025-002):** Startup de Tecnologia / Fintech em Rápida Expansão (LMR: R$ 20M, Franquia: R$ 200k, Sublimite de Crise Robusto).
- **Apólice #3 (POL-DO-2025-003):** Empresa do Setor Energético e Infraestrutura (LMR: R$ 250M, Cláusula Ambiental com sublimite específico).
- **Apólice #4 (POL-DO-2025-004):** Varejista com Ações em Bolsa - B3 (LMR: R$ 100M, Cobertura Side C ativa, Franquia R$ 1.5M).
- **Apólice #5 (POL-DO-2025-005):** Instituição Financeira / Banco de Investimento (LMR: R$ 300M, Foco em investigações regulatórias CVM/BACEN).
- **Apólice #6 (POL-DO-2025-006):** Empresa Familiar de Médio Porte (LMR: R$ 10M, Franquia reduzida R$ 50k, Foco Side A).
- **Apólice #7 (POL-DO-2025-007):** Empresa Logística e Transporte Internacional (LMR: R$ 50M, Jurisdição Internacional e Nacional).
- **Apólice #8 (POL-DO-2025-008):** Rede de Hospitais e Saúde Privada (LMR: R$ 80M, Sublimite para defesa sanitária/ANVISA).
- **Apólice #9 (POL-DO-2025-009):** Concessionária de Rodovias (LMR: R$ 120M, Exclusão de atos dolosos com severidade estrita).
- **Apólice #10 (POL-DO-2025-010):** Agrotech / Cooperativa Agroindustrial (LMR: R$ 35M, Franquia R$ 150k, Vigência plurianual).

---

### 📤 FORMATO DE SAÍDA:

Apresente o texto de cada uma das 10 apólices separado claramente por delimitadores markdown (`--- APÓLICE X DE 10 ---`), prontas para serem salvas como PDF ou texto individual para upload.
```

---

## 💡 Como Usar no D&O Intelligence:

1. **Geração:** Copie o bloco de texto acima e cole na LLM de sua preferência.
2. **Download / Salvar:** Salve a resposta (ou cada apólice individual) como ficheiro `.pdf` ou `.txt`.
3. **Upload:** Na plataforma D&O Intelligence, aceda a **Nova Análise**, e arraste o arquivo gerado para a janela de dropzone.
4. **Extração:** O pipeline de IA processará automaticamente o texto, vetorizará no ChromaDB e extrairá todos os limites em **Reais (R$)**.
