# 🧠 Inteligência Artificial - ProjetoSmartPlan

Este documento detalha as especificações do modelo de Processamento de Linguagem Natural (PLN) desenvolvido para o ProjetoSmartPlan, focando na extração automatizada de informações de planos de ensino universitários.

## 🛠️ Tecnologias Utilizadas
- **Linguagem:** Python 3.x
- **Framework NLP:** [spaCy](https://spacy.io/) (Reconhecimento de Entidades Nomeadas - NER)
- **API Web:** [FastAPI](https://fastapi.tiangolo.com/) + Uvicorn
- **Integração:** REST API (JSON) consumida de forma assíncrona pelo frontend em React.

## 🤖 Especificações do Modelo (NER)
O modelo foi treinado de forma customizada utilizando textos reais de planos de ensino para identificar entidades específicas do contexto acadêmico.
- **Diretório do Modelo Treinado:** `modelo_facom_v2/model-last`
- **Entidades Mapeadas:**
  - `ATIVIDADE` / `EVENTO`: Nome do trabalho, prova, seminário ou projeto.
  - `DATA` / `DATA_AVALIACAO`: Prazo de entrega ou dia da aplicação da avaliação.
  - `NOTA`: Valor em pontos ou peso correspondente à atividade.

## ⚙️ Arquitetura e Lógica de Extração
Para garantir que as datas e notas corretas sejam atribuídas às suas respectivas atividades, a API utiliza um algoritmo de associação contextual:
1. **Recebimento:** A API recebe o texto bruto colado pelo usuário.
2. **Processamento NLP:** O motor do spaCy analisa o texto, realiza a tokenização e tagueia as entidades aprendidas no treinamento.
3. **Limpeza (Filtros):** Remoção de pontuações isoladas, parênteses e *stopwords* indesejadas (artigos e preposições).
4. **Associação por Proximidade:** O algoritmo calcula a distância (janela de palavras/caracteres) entre as entidades de `ATIVIDADE`, `DATA` e `NOTA`. A data e a nota mais próximas de uma atividade são agrupadas no mesmo evento, montando o cronograma de forma lógica.

## 🚀 Como Executar o Servidor de IA Localmente

### 1. Instalação das Dependências
Certifique-se de ter o Python instalado. É recomendado o uso de um ambiente virtual (`venv`).
Execute o comando abaixo para instalar as bibliotecas necessárias:
```bash
pip install -r requirements.txt
