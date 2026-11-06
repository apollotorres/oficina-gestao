@echo off
title AutoGestao - Sistema da Oficina
echo ====================================================
echo       Iniciando AutoGestao - Oficina Mecanica
echo ====================================================
echo.
cd /d "%~dp0"
echo Abrindo o sistema no navegador...
start http://localhost:3001
echo Servidor em execucao. Nao feche esta janela enquanto estiver usando.
echo.
node server/index.mjs
pause

