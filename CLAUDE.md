# CLAUDE.md

Guía para Claude Code al trabajar en este repositorio.

## Resumen del proyecto

MCP SSH Manager es un servidor Model Context Protocol para administrar conexiones SSH desde Claude Code y OpenAI Codex. Permite ejecutar comandos, transferir archivos, gestionar backups, bases de datos, túneles, sesiones y despliegues.

## Arquitectura

El sistema tiene estos componentes principales:

1. **Servidor MCP** (`src/index.js`): servidor Node.js con el SDK MCP actual
   - Maneja conexiones SSH con `ssh2`
   - Mantiene un pool de conexiones para evitar reconexiones innecesarias
   - Expone herramientas MCP para Claude Code y OpenAI Codex

2. **CLI de configuración** (`cli/ssh-manager.js`): comandos para administrar configuración
   - Gestiona servidores en `.env` y TOML
   - Configura integraciones para Claude Code y Codex
   - Incluye comandos para perfiles, grupos, alias y herramientas

3. **Módulos de soporte** (`src/*.js`): funciones reutilizables
   - Estrategias de despliegue con permisos
   - Alias de servidores y comandos
   - Backups, bases de datos, salud, sesiones, túneles y políticas de seguridad

## Comandos

### Instalación
```bash
npm install                                    # Instala dependencias de Node.js
npm run validate                              # Verifica lint, tests y cobertura
```

### Servidor MCP por stdio
```json
{
  "mcpServers": {
    "ssh-manager": {
      "command": "node",
      "args": ["D:/work/ssh-manager-mcp-server/src/index.js"],
      "env": {
        "SSH_ENV_PATH": "D:/work/ssh-manager-mcp-server/.env"
      }
    }
  }
}
```

El cliente MCP debe lanzar `node src/index.js` como proceso local por `stdio`. No usar `npm start` en la configuración del cliente. Ver [docs/MCP_CLIENT_INSTALLATION.md](docs/MCP_CLIENT_INSTALLATION.md).

### Gestión de servidores
```bash
ssh-manager server add                        # Agrega un servidor
ssh-manager server list                       # Lista servidores configurados
ssh-manager server test SERVER                # Prueba conexión con un servidor
ssh-manager server remove SERVER              # Quita un servidor
ssh-manager server show SERVER                # Muestra detalles del servidor
```

### Integración con OpenAI Codex
```bash
ssh-manager codex setup                       # Configura Codex
ssh-manager codex migrate                     # Convierte servidores a TOML
ssh-manager codex test                        # Prueba integración con Codex
ssh-manager codex convert to-toml            # Convierte .env a TOML
ssh-manager codex convert to-env             # Convierte TOML a .env
```

### Gestión de herramientas
```bash
ssh-manager tools list                        # Muestra herramientas y estado
ssh-manager tools configure                   # Asistente interactivo de configuración
ssh-manager tools enable <group>              # Activa un grupo de herramientas
ssh-manager tools disable <group>             # Desactiva un grupo de herramientas
ssh-manager tools reset                       # Restablece valores por defecto
ssh-manager tools export-claude               # Exporta configuración de autoaprobación
```

**Grupos de herramientas**: core (5), sessions (4), monitoring (6), backup (4), database (4), advanced (14)

**Modos**: all (37 herramientas), minimal (5 herramientas), custom (variable)

Ver [docs/TOOL_MANAGEMENT.md](docs/TOOL_MANAGEMENT.md) para la guía completa.

### Desarrollo y pruebas
```bash
npm test                                      # Ejecuta pruebas unitarias
npm run lint                                  # Ejecuta ESLint
npm run coverage                              # Valida cobertura global 85%
npm run validate                              # Ejecuta lint, tests y coverage
npx knip                                      # Detecta código/dependencias sin uso
```

## Herramientas MCP disponibles

El servidor expone estas herramientas a Claude Code y OpenAI Codex:

### Herramientas centrales
- `ssh_list_servers`: lista todos los servidores SSH configurados.
- `ssh_execute`: ejecuta comandos en servidores remotos; soporta directorios por defecto.
- `ssh_upload`: sube archivos a servidores remotos.
- `ssh_download`: descarga archivos desde servidores remotos.

### Backup y restauración (v2.1+)
- `ssh_backup_create`: crea backups de bases de datos o archivos (MySQL, PostgreSQL, MongoDB, archivos).
- `ssh_backup_list`: lista backups disponibles con metadatos.
- `ssh_backup_restore`: restaura desde backups previos.
- `ssh_backup_schedule`: programa backups automáticos con cron.

### Salud y monitoreo (v2.2+)
- `ssh_health_check`: revisión completa del servidor (CPU, RAM, disco y red).
- `ssh_service_status`: revisa estado de servicios (nginx, mysql, docker, etc.).
- `ssh_process_manager`: lista, monitorea o finaliza procesos.
- `ssh_alert_setup`: configura alertas y umbrales de monitoreo.

### Gestión de bases de datos (v2.3+)
- `ssh_db_dump`: crea dumps de bases de datos (MySQL, PostgreSQL, MongoDB).
- `ssh_db_import`: importa dumps SQL o restaura bases de datos.
- `ssh_db_list`: lista bases de datos o tablas/colecciones.
- `ssh_db_query`: ejecuta consultas SELECT de solo lectura con validación de seguridad.

### Despliegue y administración
- `ssh_deploy`: despliega archivos con manejo automático de permisos y backups.
- `ssh_execute_sudo`: ejecuta comandos con privilegios sudo.
- `ssh_alias`: gestiona alias de servidores (agregar/quitar/listar).
- `ssh_sync`: sincroniza archivos en ambos sentidos con rsync.
- `ssh_monitor`: monitorea recursos del sistema.
- `ssh_tail`: monitorea logs en tiempo real.

### Funciones avanzadas
- `ssh_session_*`: sesiones SSH persistentes.
- `ssh_tunnel_*`: gestión de túneles SSH (local/remoto/SOCKS).
- `ssh_group_*`: operaciones sobre grupos de servidores.
- `ssh_command_alias`: gestión de alias de comandos.
- `ssh_hooks`: hooks de automatización.
- `ssh_profile`: gestión de perfiles.

## Configuración de servidores

### Formatos de configuración

MCP SSH Manager soporta dos formatos de configuración:

1. **Variables de entorno (.env)**: formato tradicional para Claude Code.
2. **TOML**: formato moderno para OpenAI Codex.

### Prioridad de carga de configuración

El sistema carga configuraciones en este orden, de mayor a menor prioridad:
1. Variables de entorno (`process.env`).
2. Archivo `.env` en la raíz del proyecto.
3. Archivo TOML indicado por `SSH_CONFIG_PATH` o `~/.codex/ssh-config.toml`.

### Formato .env
```
SSH_SERVER_[NAME]_HOST=hostname
SSH_SERVER_[NAME]_USER=username
SSH_SERVER_[NAME]_PASSWORD=password         # Autenticación por contraseña
SSH_SERVER_[NAME]_KEYPATH=~/.ssh/key       # Autenticación por clave SSH
SSH_SERVER_[NAME]_PASSPHRASE=passphrase    # Opcional, para claves con passphrase
SSH_SERVER_[NAME]_PORT=22                  # Opcional
SSH_SERVER_[NAME]_DEFAULT_DIR=/path        # Opcional, directorio de trabajo por defecto
SSH_SERVER_[NAME]_SUDO_PASSWORD=pass       # Opcional, para sudo automatizado
SSH_SERVER_[NAME]_PLATFORM=windows         # Opcional: "linux" por defecto o "windows"
SSH_SERVER_[NAME]_PROXYJUMP=bastion        # Opcional, servidor intermedio
SSH_SERVER_[NAME]_PROXYCOMMAND=command      # Opcional, comando proxy propio (ncat, ssh -W, etc.)
```

### Formato TOML
```toml
[ssh_servers.name]
host = "hostname"
user = "username"
password = "password"                      # Autenticación por contraseña
key_path = "~/.ssh/key"                    # Autenticación por clave SSH
passphrase = "key_passphrase"              # Opcional, para claves con passphrase
port = 22                                  # Opcional
default_dir = "/path"                      # Opcional, directorio de trabajo por defecto
sudo_password = "pass"                     # Opcional, para sudo automatizado
platform = "windows"                       # Opcional: "linux" por defecto o "windows"
proxy_jump = "bastion"                     # Opcional, servidor intermedio
proxy_command = "command"                   # Opcional, comando proxy propio (ncat, ssh -W, etc.)
```

## Detalles clave de implementación

1. **Pool de conexiones**: el servidor mantiene conexiones SSH persistentes en un `Map` para evitar reconexiones.

2. **Resolución de servidores**: los nombres se resuelven primero por alias y luego por nombre directo. Se normalizan a minúsculas.

3. **Directorios por defecto**: si un servidor tiene `default_dir`/`DEFAULT_DIR` y no se envía `cwd`, `ssh_execute` corre ahí.

4. **Despliegue**: `deploy-helper.js` detecta si hace falta `sudo`, backups, dueño, permisos o reinicio de servicio.

5. **Carga de entorno**: soporta `.env` y TOML mediante `ServerConfigManager`.

6. **Comando proxy**: los comandos proxy personalizados se ejecutan localmente para abrir la conexión SSH.

## Seguridad

- No commitear archivos `.env`.
- Preferir claves SSH antes que contraseñas.
- Guardar contraseñas de sudo separadas de las contraseñas SSH.
- Usar políticas `readonly` o `restricted` para servidores sensibles.
- Revisar logs antes de compartir salidas.

## Validación y calidad

Antes de publicar cambios ejecutar:
- `npm test`
- `npm run lint`
- `npm run coverage`
- `npm run validate`
- `npx knip`

GitHub Actions ejecuta instalación de dependencias, lint, tests, coverage y knip en cada `push` y `pull_request` con Node.js 20.x y 22.x. Usa `npm ci` cuando `package-lock.json` está presente. Ver `.github/workflows/ci.yml`.

## Integración con Claude Code

Instalación en Claude Code:
```bash
claude mcp add ssh-manager node D:/work/ssh-manager-mcp-server/src/index.js
```

La configuración queda en el archivo de configuración MCP de Claude Code. Si el cliente no encuentra servidores SSH, agregá `SSH_ENV_PATH` en la configuración MCP.
