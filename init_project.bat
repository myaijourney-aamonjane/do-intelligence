@echo off
title D&O Intelligence MVP - Project Initialization

echo.
echo ============================================
echo   D&O Intelligence MVP - Initialization
echo ============================================
echo.

echo [1/5] Verificando arquivos de checkpoint...
if not exist "..\planos\CHK2600001.md" (
    echo   [ERRO] Arquivos de checkpoint nao encontrados.
    echo   Execute: copy prompts\CHK26*.md planos\  (se necessario)
    goto erro
) else (
    echo   [OK] Arquivos de checkpoint encontrados (CHK2600001 a CHK2600005).
)

echo.
echo [2/5] Configurando backend dependencias...
pip install -r requirements.txt >nul 2>&1
echo   [OK] Dependencias do backend instaladas.

echo.
echo [3/5] Configurando frontend dependencias...
npm install >nul 2>&1
echo   [OK] Dependencias do frontend instaladas.

echo.
echo [4/5] Verificando banco de dados...
if not exist "data\do_intelligence.db" (
    echo   [INICIANDO] Criando banco de dados...
    python create_db.py >nul 2>&1
    if %errorlevel% equ 0 (
        echo   [OK] Banco de dados criado.
    ) else (
        echo   [ERRO] Falha ao criar banco de dados.
        goto erro
    )
) else (
    echo   [OK] Banco de dados existente.
)

echo.
echo ============================================
echo   Initialization complete!
echo.
echo Próximos passos:
echo  1. Iniciar backend: python -m uvicorn app:app --host 0.0.0.0 --port 8000
echo  2. Iniciar frontend: npm run dev
echo  3. Acessar: http://localhost:5173
echo.
echo Para configurar LLM, copie .env.example e ajuste as variáveis LLM_PROVIDER e OCR_PROVIDER.
goto fim

:erro
echo.
echo Erro durante a inicializacao.
echo Verifique os caminhos e tente novamente.

:fim
pause