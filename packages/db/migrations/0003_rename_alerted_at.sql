-- ADR-017: la alerta por umbral de reportes es un registro en la base, no un mail enviado.
-- El privilegio UPDATE de columna de nerdose_api sigue a la columna renombrada.
ALTER TABLE "challenges" RENAME COLUMN "alert_sent_at" TO "alerted_at";
