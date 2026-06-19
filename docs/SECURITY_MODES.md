# Modos de seguridad

## unrestricted

Permite ejecutar tools sin restricciones extra. Es el modo compatible con versiones anteriores.

## readonly

Bloquea acciones que cambian el servidor, como uploads, deploys, backups, imports y comandos destructivos.

## restricted

Solo permite comandos que coinciden con patrones permitidos. Los patrones de denegación tienen prioridad.

## Auditoría

Si `AUDIT_LOG` está configurado, se escriben eventos JSONL con secretos redactados.
