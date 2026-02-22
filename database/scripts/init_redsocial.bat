@echo off
REM Script para inicializar la base de datos redsocial
REM Requiere: MySQL cliente (mysql) en el PATH
REM Uso: init_redsocial.bat [usuario] [host]
REM Ejemplo: init_redsocial.bat root localhost

set MYSQL_USER=%1
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set MYSQL_HOST=%2
if "%MYSQL_HOST%"=="" set MYSQL_HOST=localhost

echo Inicializando base de datos redsocial...
echo Usuario: %MYSQL_USER%
echo Host: %MYSQL_HOST%
echo.

cd /d "%~dp0.."
mysql -u %MYSQL_USER% -h %MYSQL_HOST% -p < schemas\redsocial_schema.sql
if %ERRORLEVEL% neq 0 (
  echo Error al ejecutar el esquema.
  exit /b 1
)

mysql -u %MYSQL_USER% -h %MYSQL_HOST% -p < seeds\redsocial_seed.sql
if %ERRORLEVEL% neq 0 (
  echo Error al ejecutar el seed.
  exit /b 1
)

echo.
echo Base de datos redsocial inicializada correctamente.
exit /b 0
