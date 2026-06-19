# Gestión de tools

[Documentación](README.md) | Anterior: [Instalación en clientes MCP](MCP_CLIENT_INSTALLATION.md) | Siguiente: [Modos de seguridad](SECURITY_MODES.md)

El servidor registra 37 tools MCP. Podés dejarlas todas activas o reducirlas por grupo para bajar contexto.

## Modos

- `all`: activa todo. Es el default.
- `minimal`: activa solo `core`.
- `custom`: activa grupos elegidos.

La configuración vive en `~/.ssh-manager/tools-config.json`.

## Grupos

| Grupo | Tools | Uso |
| --- | ---: | --- |
| `core` | 5 | listar servidores, ejecutar comandos, subir, bajar y sincronizar archivos |
| `sessions` | 4 | sesiones SSH persistentes |
| `monitoring` | 6 | salud, servicios, procesos, logs y alertas |
| `backup` | 4 | crear, listar, restaurar y programar backups |
| `database` | 4 | dumps, imports, listados y queries SELECT |
| `advanced` | 14 | deploy, sudo, túneles, grupos, alias, hooks, perfiles e historial |

## Tools por grupo

`core`: `ssh_list_servers`, `ssh_execute`, `ssh_upload`, `ssh_download`, `ssh_sync`.

`sessions`: `ssh_session_start`, `ssh_session_send`, `ssh_session_list`, `ssh_session_close`.

`monitoring`: `ssh_health_check`, `ssh_service_status`, `ssh_process_manager`, `ssh_monitor`, `ssh_tail`, `ssh_alert_setup`.

`backup`: `ssh_backup_create`, `ssh_backup_list`, `ssh_backup_restore`, `ssh_backup_schedule`.

`database`: `ssh_db_dump`, `ssh_db_import`, `ssh_db_list`, `ssh_db_query`.

`advanced`: `ssh_deploy`, `ssh_execute_sudo`, `ssh_alias`, `ssh_command_alias`, `ssh_hooks`, `ssh_profile`, `ssh_connection_status`, `ssh_tunnel_create`, `ssh_tunnel_list`, `ssh_tunnel_close`, `ssh_key_manage`, `ssh_execute_group`, `ssh_group_manage`, `ssh_history`.

## CLI

```powershell
ssh-manager tools list
ssh-manager tools configure
ssh-manager tools enable monitoring
ssh-manager tools disable advanced
ssh-manager tools reset
```

En Windows, `ssh-manager` requiere Git Bash, WSL o un `bash` en `PATH`. El servidor MCP no requiere Bash.

## Verificación

```powershell
npm run test:tools
```

Cada tool debe tener schema Zod, descripción clara y devolver errores MCP con `isError: true`.

Siguiente: [Modos de seguridad](SECURITY_MODES.md).
