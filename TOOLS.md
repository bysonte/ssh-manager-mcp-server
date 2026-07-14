# Catalogo de Tools

Version 3.6.4. El registro contiene 38 tools en seis grupos. Por defecto, nuevas instalaciones usan el perfil `agentic` de 17 tools para reducir contexto. `all` conserva el catalogo completo y `custom` permite habilitar grupos o tools concretas.

## Perfiles

| Perfil | Tools | Uso |
| --- | ---: | --- |
| `agentic` | 17 | Operacion remota frecuente y de alto valor. Default sin configuracion previa. |
| `minimal` | 5 | Operaciones SSH centrales. |
| `all` | 38 | Compatibilidad y administracion completa. |
| `custom` | Variable | Seleccion explicita de grupos y tools. |

Una configuracion existente con `mode: "all"` no se migra automaticamente. Selecciona un perfil con `ssh-manager tools mode <agentic|all|minimal|custom>` y reinicia el cliente MCP.

## Core

| Tool | Parametros clave | Efecto | Perfil |
| --- | --- | --- | --- |
| `ssh_list_servers` | ninguno | Lee configuracion local sin secretos. | agentic |
| `ssh_execute` | `server`, `command`, `cwd`, `timeout` | Ejecuta shell remoto; politica y timeout aplican. | agentic |
| `ssh_upload` | `server`, `localPath`, `remotePath` | Sube un archivo por SFTP y sobrescribe destino. | agentic |
| `ssh_download` | `server`, `remotePath`, `localPath` | Descarga un archivo al equipo local. | agentic |
| `ssh_sync` | `server`, `source`, `destination`, `delete`, `dryRun` | Sincroniza arboles mediante rsync; `delete` es destructivo. | opt-in |

## Sessions

| Tool | Parametros clave | Efecto | Perfil |
| --- | --- | --- | --- |
| `ssh_session_start` | `server`, `name` | Abre shell SSH persistente. | opt-in |
| `ssh_session_send` | `session`, `command` | Ejecuta dentro de una sesion persistente. | opt-in |
| `ssh_session_list` | `server` | Lista sesiones en memoria. | opt-in |
| `ssh_session_close` | `session` | Cierra una sesion o todas con `all`. | opt-in |

## Monitoring

| Tool | Parametros clave | Efecto | Perfil |
| --- | --- | --- | --- |
| `ssh_health_check` | `server`, `detailed` | Devuelve salud estructurada de CPU, memoria y disco. | agentic |
| `ssh_service_status` | `server`, `services` | Consulta unidades del sistema sin modificarlas. | agentic |
| `ssh_process_manager` | `server`, `action`, `pid`, `signal` | Lista o inspecciona procesos; `kill` modifica remoto. | agentic |
| `ssh_monitor` | `server`, `type` | Snapshot Linux redundante con health/process. | deprecada, opt-in |
| `ssh_tail` | `server`, `file`, `lines`, `follow` | Lee logs; `follow` no es apto para MCP stdio y debe evitarse. | deprecada, opt-in |
| `ssh_alert_setup` | `server`, `action`, umbrales | Persiste o consulta alertas en remoto. | opt-in |

## Backup

| Tool | Parametros clave | Efecto | Perfil |
| --- | --- | --- | --- |
| `ssh_backup_create` | `server`, `type`, `name`, destino | Crea backup DB o archivos y poda retencion. | agentic |
| `ssh_backup_list` | `server`, `type`, `backupDir` | Lista metadata de backups. | agentic |
| `ssh_backup_restore` | `server`, `backupId`, destino | Restaura de forma destructiva. | agentic |
| `ssh_backup_schedule` | `server`, `schedule`, `type`, `name` | Crea script y cron remoto. | agentic |

## Database

| Tool | Parametros clave | Efecto | Perfil |
| --- | --- | --- | --- |
| `ssh_db_dump` | `server`, `type`, `database`, `outputFile` | Crea dump remoto. | opt-in |
| `ssh_db_import` | `server`, `type`, `database`, `inputFile` | Importa datos, potencialmente destructivo. | opt-in |
| `ssh_db_list` | `server`, `type`, `database` | Lista DB, tablas o colecciones. | opt-in |
| `ssh_db_query` | `server`, `type`, `database`, `query` | Ejecuta SELECT o filtro MongoDB JSON; usar credenciales de solo lectura. | opt-in |

## Advanced

| Tool | Parametros clave | Efecto | Perfil |
| --- | --- | --- | --- |
| `ssh_deploy` | `server`, `files`, `options` | Despliega con backup, permisos, owner y reinicio opcional. | agentic |
| `ssh_execute_sudo` | `server`, `command`, `password` | Ejecuta con privilegios; puede ser destructiva. | opt-in |
| `ssh_alias` | `action`, `alias`, `server` | Gestiona alias locales de servidores. | administracion |
| `ssh_add_server` | host, auth, `copy_key` | Escribe configuracion local; `copy_key` modifica `authorized_keys`. | administracion |
| `ssh_command_alias` | `action`, `alias`, `command` | Gestiona atajos locales de comandos. | administracion |
| `ssh_hooks` | `action`, `hook` | Habilita o deshabilita hooks locales. | administracion |
| `ssh_profile` | `action`, `profile` | Cambia perfiles locales; requiere reiniciar cliente. | administracion |
| `ssh_connection_status` | `action`, `server` | Inspecciona o limpia el pool en memoria. | opt-in |
| `ssh_tunnel_create` | `server`, `type`, puertos | Crea tunnel local, remoto o SOCKS persistente. | agentic |
| `ssh_tunnel_list` | `server` | Lista tunnels creados por este proceso. | agentic |
| `ssh_tunnel_close` | `tunnelId` o `server` | Cierra tunnel(es) y libera puertos locales. | agentic |
| `ssh_key_manage` | `action`, `server` | Verifica o modifica claves locales `known_hosts`. | agentic |
| `ssh_execute_group` | `group`, `command`, estrategia | Ejecuta en flota; politica se evalua por servidor. | agentic |
| `ssh_group_manage` | `action`, `name`, `servers` | Persiste grupos locales para ejecucion masiva. | administracion |
| `ssh_history` | `server`, `limit` | Lee historial local de comandos. Evitar comandos con secretos. | administracion |

## Politicas

`unrestricted` no agrega restricciones. `readonly` bloquea tools mutables y comandos destructivos conocidos. `restricted` requiere `ALLOW_PATTERNS` y aplica `DENY_PATTERNS` con prioridad. Las politicas son una defensa adicional: los permisos SSH y DB deben ser de minimo privilegio.

`ssh_download` modifica solo el filesystem local. `ssh_add_server`, alias, perfiles, grupos, hooks e historial administran estado local. Toda operacion remota que escriba datos debe revisarse antes de habilitarla en `custom`.
