@echo off
title Voto em Valor
cd /d "%~dp0"
set WRANGLER_LOG_PATH=.wrangler/wrangler.log
start "" "http://localhost:3000"
node node_modules/vinext/dist/cli.js start --hostname 127.0.0.1
pause
