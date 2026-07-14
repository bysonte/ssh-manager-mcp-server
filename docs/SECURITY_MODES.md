# Modos de seguridad

[Documentación](README.md) | Anterior: [Gestión de tools](TOOL_MANAGEMENT.md) | Siguiente: [Deploy](DEPLOYMENT_GUIDE.md)

La política se define por servidor. El modo por defecto es `unrestricted`.

## `unrestricted`

Sin restricciones extra. Mantiene el comportamiento normal.

```env
SSH_SERVER_PROD_MODE=unrestricted
```

## `readonly`

Bloquea tools que mutan estado remoto y rechaza comandos destructivos conocidos en `ssh_execute`, `ssh_execute_group` y `ssh_session_send`.

```env
SSH_SERVER_PROD_MODE=readonly
```

Bloquea, entre otras: `ssh_upload`, `ssh_sync`, `ssh_deploy`, `ssh_execute_sudo`, backups que escriben, imports de DB, dumps remotos, cambios de host keys, alertas `set` y `process_manager kill`.

## `restricted`

Exige allowlist por regex para comandos. `DENY_PATTERNS` siempre gana.

```env
SSH_SERVER_PROD_MODE=restricted
SSH_SERVER_PROD_ALLOW_PATTERNS="^pwd$;^ls( |$);^systemctl status "
SSH_SERVER_PROD_DENY_PATTERNS="rm -rf;shutdown;reboot"
```

Si `ALLOW_PATTERNS` está vacío, todo comando queda rechazado.

## TOML

```toml
[ssh_servers.prod]
host = "example.com"
user = "root"
mode = "restricted"
allow_patterns = ["^pwd$", "^ls( |$)"]
deny_patterns = ["rm -rf", "shutdown"]
audit_log = "/var/log/ssh-manager-audit.jsonl"
```

## Auditoría

Configurá `SSH_SERVER_<NOMBRE>_AUDIT_LOG` o `audit_log`. Se escriben eventos JSONL con secretos redactados.

## Claves de host

El servidor valida estrictamente la clave presentada contra `~/.ssh/known_hosts`.
Antes de la primera conexión verificá la huella del servidor por un canal confiable y
aceptala explícitamente con `ssh_key_manage`. No se aceptan hosts nuevos de forma automática.

Siguiente: [Deploy](DEPLOYMENT_GUIDE.md).
