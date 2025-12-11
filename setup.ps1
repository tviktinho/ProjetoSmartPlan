#!/usr/bin/env pwsh

Write-Host ""
Write-Host "========================================"
Write-Host "   SmartPlan - Setup Local (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host ""

# 1. Criar arquivo .env se não existir
Write-Host "[1/5] Verificando arquivo .env..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Write-Host "      Criando arquivo .env..."
    Copy-Item ".env.example" ".env"
    Write-Host "      ✓ .env criado (configure o DATABASE_URL)" -ForegroundColor Green
} else {
    Write-Host "      ✓ .env já existe" -ForegroundColor Green
}

Write-Host ""

# 2. Criar e ativar venv
Write-Host "[2/5] Configurando ambiente virtual Python..." -ForegroundColor Yellow
if (-Not (Test-Path "venv")) {
    Write-Host "      Criando venv..."
    python -m venv venv
    Write-Host "      ✓ Ambiente virtual criado" -ForegroundColor Green
} else {
    Write-Host "      ✓ Ambiente virtual já existe" -ForegroundColor Green
}

Write-Host ""

# 3. Ativar venv e instalar dependências
Write-Host "[3/5] Instalando dependências Python..." -ForegroundColor Yellow
Write-Host "      Ativando venv..."
& ".\venv\Scripts\Activate.ps1"
Write-Host "      Instalando pacotes..."
pip install -r requirements.txt
Write-Host "      ✓ Dependências Python instaladas" -ForegroundColor Green

Write-Host ""

# 4. Instalar dependências do frontend
Write-Host "[4/5] Instalando dependências do frontend..." -ForegroundColor Yellow
npm install
Write-Host "      ✓ Dependências npm instaladas" -ForegroundColor Green

Write-Host ""

# 5. Resumo
Write-Host "[5/5] Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================"
Write-Host "   Próximos Passos" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host ""
Write-Host "1️⃣  Configure o PostgreSQL:" -ForegroundColor White
Write-Host "   - Instale: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
Write-Host "   - OU use Docker:" -ForegroundColor Gray
Write-Host "     docker run -d --name postgres \" -ForegroundColor Gray
Write-Host "       -e POSTGRES_PASSWORD=admin \" -ForegroundColor Gray
Write-Host "       -e POSTGRES_DB=smart_plan \" -ForegroundColor Gray
Write-Host "       -p 5432:5432 postgres:latest" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Atualize o .env com suas credenciais" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Execute em 2 terminais diferentes:" -ForegroundColor White
Write-Host ""
Write-Host "   Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Green
Write-Host "   python backend/app.py" -ForegroundColor Green
Write-Host ""
Write-Host "   Terminal 2 (Frontend):" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "4️⃣  Acesse no navegador:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173/" -ForegroundColor Green
Write-Host "   Backend Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "========================================"
Write-Host ""
Write-Host "Pressione Enter para fechar..." -ForegroundColor Yellow
Read-Host
