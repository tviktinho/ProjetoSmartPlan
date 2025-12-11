# 🚀 SmartPlan - Guia de Setup Local

## 📋 Pré-requisitos

- **Node.js** 18+ (https://nodejs.org/)
- **Python** 3.11+ (https://www.python.org/)
- **PostgreSQL** ou **Docker**

---

## ⚡ Setup Rápido (Recomendado)

### Windows - PowerShell

```powershell
# 1. Navegue até a pasta do projeto
cd "c:\Users\Leonardo\Desktop\PDSI 1\ProjetoSmartPlan"

# 2. Execute o script de setup (REQUER PowerShell 7+)
.\setup.ps1
```

### Windows - Command Prompt (CMD)

```cmd
cd "c:\Users\Leonardo\Desktop\PDSI 1\ProjetoSmartPlan"
setup.bat
```

---

## 📝 Setup Manual Passo a Passo

### 1️⃣ Configurar Banco de Dados

#### Opção A: PostgreSQL Local
```bash
# Instale em: https://www.postgresql.org/download/windows/
# Após instalar, crie um banco:
psql -U postgres
CREATE DATABASE smart_plan;
```

#### Opção B: Docker
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=admin \
  -e POSTGRES_DB=smart_plan \
  -p 5432:5432 \
  postgres:latest
```

---

### 2️⃣ Criar arquivo `.env`

Copie o arquivo `.env.example` para `.env` e atualize:

```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/smart_plan
NODE_ENV=development
```

---

### 3️⃣ Configurar Backend

```powershell
# Criar ambiente virtual
python -m venv venv

# Ativar (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Ativar (Windows CMD)
venv\Scripts\activate.bat

# Instalar dependências
pip install -r requirements.txt
```

---

### 4️⃣ Configurar Frontend

```bash
npm install
```

---

### 5️⃣ Rodar Localmente

Abra **2 terminais** diferentes:

#### Terminal 1 - Backend
```powershell
# Ativar venv (se não estiver ativo)
.\venv\Scripts\Activate.ps1

# Rodar backend
python backend/app.py
```

**Saída esperada:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

#### Terminal 2 - Frontend
```bash
npm run dev
```

**Saída esperada:**
```
  VITE v... dev server running at:
  http://localhost:5173/
```

---

## 🌐 Acessar a Aplicação

- **Frontend**: http://localhost:5173/
- **Backend API Docs**: http://localhost:8000/docs
- **Backend ReDoc**: http://localhost:8000/redoc

---

## 🧪 Testar Novas Funcionalidades

1. Acesse http://localhost:5173/
2. Clique em "Signup"
3. Use um email com `@ufu.br` (ex: teste@ufu.br)
4. Crie uma senha (mín 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo)
5. Faça login
6. Clique em "Lembretes" no menu - **NOVA FUNCIONALIDADE!** 🎉
7. Clique em "Reuniões" no menu - **NOVA FUNCIONALIDADE!** 🎉

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'fastapi'"
```powershell
# Certifique-se que o venv está ativado
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### "Cannot find module 'react'"
- Normal no VS Code (intellisense issue)
- O código funciona normalmente no navegador

### Erro de conexão ao banco
```powershell
# Verificar se PostgreSQL está rodando
# Docker:
docker ps

# PostgreSQL local: abra Services e procure por PostgreSQL
```

### Porta já em uso
```powershell
# Verificar qual processo está usando a porta
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# Matar processo (substitua PID)
taskkill /PID <PID> /F
```

---

## 📦 Estrutura do Projeto

```
ProjetoSmartPlan/
├── backend/
│   └── app.py              # API FastAPI
├── client/src/
│   ├── pages/
│   │   ├── reminders.tsx   # 🆕 Página de Lembretes
│   │   ├── meetings.tsx    # 🆕 Página de Reuniões
│   │   └── ...
│   ├── components/
│   │   ├── reminder-dialog.tsx   # 🆕 Diálogo de Lembretes
│   │   ├── meeting-dialog.tsx    # 🆕 Diálogo de Reuniões
│   │   └── ...
│   └── ...
├── shared/
│   └── schema.ts           # Tipos e schemas (atualizado)
├── package.json
├── requirements.txt        # 🆕 Dependências Python
├── .env.example           # 🆕 Variáveis de ambiente
├── setup.ps1             # 🆕 Script setup (PowerShell)
├── setup.bat             # 🆕 Script setup (CMD)
└── ...
```

---

## ✨ Novas Funcionalidades

### 🔔 Lembretes
- Gerenciar provas, trabalhos, apresentações e prazos
- Agrupar por data (Atrasados, Hoje, Próximos)
- Filtrar por tipo e prioridade
- Marcar como concluído

### 👥 Reuniões
- Agendar reuniões de trabalho, disciplina e estudo
- Adicionar links de videoconferência
- Adicionar links de anotações
- Suporte a reuniões recorrentes

---

## 📚 Documentação Adicional

Veja [NOVAS_FUNCIONALIDADES.md](./NOVAS_FUNCIONALIDADES.md) para detalhes completos das funcionalidades adicionadas.

---

## 🤝 Suporte

Se encontrar problemas:
1. Verifique os logs no terminal
2. Confirme as versões: `node --version`, `python --version`
3. Certifique-se que o banco está rodando
4. Verifique o arquivo `.env`

---

**Desenvolvido com ❤️ para ProjetoSmartPlan**
