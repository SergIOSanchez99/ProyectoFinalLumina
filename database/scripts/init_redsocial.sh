#!/bin/bash
# Script para inicializar la base de datos redsocial
# Requiere: MySQL cliente (mysql) instalado
# Uso: ./init_redsocial.sh [usuario] [host]
# Ejemplo: ./init_redsocial.sh root localhost

MYSQL_USER="${1:-root}"
MYSQL_HOST="${2:-localhost}"

echo "Inicializando base de datos redsocial..."
echo "Usuario: $MYSQL_USER"
echo "Host: $MYSQL_HOST"
echo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(dirname "$SCRIPT_DIR")"

mysql -u "$MYSQL_USER" -h "$MYSQL_HOST" -p < "$DB_DIR/schemas/redsocial_schema.sql" || exit 1
mysql -u "$MYSQL_USER" -h "$MYSQL_HOST" -p < "$DB_DIR/seeds/redsocial_seed.sql" || exit 1

echo
echo "Base de datos redsocial inicializada correctamente."
