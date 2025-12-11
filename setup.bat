@echo off
REM =============================================================
REM Script de Setup - ProjetoSmartPlan
REM =============================================================

echo.
echo ========================================
echo   SmartPlan - Setup Local
echo ========================================
echo.

REM 1. Criar arquivo .env se não existir
if not exist ".env" (
    echo [1/5] Criando arquivo .env...
    copy .env.example .env
    echo ✓ .env criado (configure o DATABASE_URL conforme necessario)
) else (
    echo [1/5] .env já existe
)

echo.

REM 2. Criar e ativar venv
echo [2/5] Criando ambiente virtual Python...
if not exist "venv" (
    python -m venv venv
    echo ✓ Ambiente virtual criado
) else (
    echo ✓ Ambiente virtual já existe
)

echo.

REM 3. Ativar venv e instalar dependências
echo [3/5] Ativando venv e instalando dependências...
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo ✓ Dependências Python instaladas

echo.

REM 4. Instalar dependências do frontend
echo [4/5] Instalando dependências do frontend...
call npm install
echo ✓ Dependências npm instaladas

echo.

REM 5. Resumo
echo [5/5] Setup concluído!
echo.
echo ========================================
echo   Proximos Passos
echo ========================================
echo.
echo 1. Configure o PostgreSQL:
echo    - Instale PostgreSQL em: https://www.postgresql.org/download/windows/
echo    - OU use Docker: 
echo      docker run -d --name postgres -e POSTGRES_PASSWORD=admin -e POSTGRES_DB=smart_plan -p 5432:5432 postgres:latest
echo.
echo 2. Atualize o arquivo .env com suas credenciais do banco
echo.
echo 3. Execute em 2 terminais diferentes:
echo    Terminal 1 (Backend):
echo    .\venv\Scripts\activate.ps1
echo    python backend/app.py
echo.
echo    Terminal 2 (Frontend):
echo    npm run dev
echo.
echo 4. Acesse no navegador:
echo    Frontend: http://localhost:5173/
echo    Backend Docs: http://localhost:8000/docs
echo.
echo ========================================
echo.

pause
