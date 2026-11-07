#!/bin/bash
# Executado pelo entrypoint da imagem gvenzl na primeira subida.
# Roda como o usuario da aplicacao para que as tabelas ZL_* caiam no schema certo.
set -e
for f in 01_ddl.sql 02_dml.sql; do
  echo "Executando $f"
  # WHENEVER/EXIT sao comandos do sqlplus; ficam fora dos .sql para o mesmo arquivo rodar via JDBC.
  { echo "WHENEVER SQLERROR EXIT FAILURE;"; echo "SET DEFINE OFF;"; cat "/zelo-sql/$f"; echo "EXIT;"; } \
    | sqlplus -s "${APP_USER}/${APP_USER_PASSWORD}@//localhost:1521/FREEPDB1"
done
