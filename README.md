# MCP SSH Manager

Servidor MCP local para administrar servidores SSH desde clientes compatibles con Model Context Protocol.

## Funciones

- Ejecutar comandos remotos.
- Subir, bajar y sincronizar archivos.
- Abrir sesiones SSH persistentes y túneles.
- Revisar salud, procesos, servicios y logs.
- Crear backups y operar bases MySQL, PostgreSQL o MongoDB.
- Desplegar archivos con backup, permisos, owner y reinicio de servicio.
- Activar grupos de tools para reducir contexto.

## Requisitos

- Node.js 18 o superior.
- `npm install` ejecutado en este repositorio.
- Acceso SSH a los servidores configurados.
- Opcional: `rsync`, `sshpass`, clientes de base de datos o Docker según la tool usada.

## Inicio rápido

```powershell
npm install
npm test
```

Crear `.env`:

```env
SSH_SERVER_PROD_HOST=example.com
SSH_SERVER_PROD_USER=root
SSH_SERVER_PROD_PORT=22
SSH_SERVER_PROD_KEYPATH=C:\Users\me\.ssh\id_rsa
SSH_SERVER_PROD_DEFAULT_DIR=/var/www/app
```

Registrar el MCP en el cliente con `stdio`:

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

No uses `npm start` en el cliente MCP. El cliente debe lanzar `node src/index.js` como proceso local por `stdio`.

## Documentación

Leé en este orden:

1. [Inicio rápido](QUICKSTART.md)
2. [Instalación](INSTALLATION.md)
3. [Índice de documentación](docs/README.md)
4. [Instalación en clientes MCP](docs/MCP_CLIENT_INSTALLATION.md)
5. [Gestión de tools](docs/TOOL_MANAGEMENT.md)
6. [Catálogo de tools](TOOLS.md)
6. [Modos de seguridad](docs/SECURITY_MODES.md)
7. [Deploy](docs/DEPLOYMENT_GUIDE.md)
8. [Backups](docs/BACKUP_GUIDE.md)
9. [Alias y hooks](docs/ALIASES_AND_HOOKS.md)

## Configuración

El `.env` usa este formato:

```env
SSH_SERVER_<NOMBRE>_HOST=hostname
SSH_SERVER_<NOMBRE>_USER=username
SSH_SERVER_<NOMBRE>_PASSWORD=password
SSH_SERVER_<NOMBRE>_KEYPATH=~/.ssh/id_rsa
SSH_SERVER_<NOMBRE>_PORT=22
SSH_SERVER_<NOMBRE>_DEFAULT_DIR=/path
SSH_SERVER_<NOMBRE>_SUDO_PASSWORD=password
SSH_SERVER_<NOMBRE>_PLATFORM=linux
SSH_SERVER_<NOMBRE>_MODE=unrestricted
```

Campos útiles:

- `PASSWORD` o `KEYPATH`: autenticación SSH.
- `PASSPHRASE`: passphrase de la clave.
- `DEFAULT_DIR`: directorio usado cuando la tool no recibe `cwd`.
- `PLATFORM`: `linux` por defecto, `windows` para OpenSSH en Windows.
- `PROXYJUMP` o `PROXYCOMMAND`: salto SSH o comando proxy.
- `MODE`, `ALLOW_PATTERNS`, `DENY_PATTERNS`, `AUDIT_LOG`: política por servidor.

También se puede usar TOML con `SSH_CONFIG_PATH`. Ver [Instalación en clientes MCP](docs/MCP_CLIENT_INSTALLATION.md).

## Rutas de configuración

Orden para `.env`:

1. `SSH_ENV_PATH`
2. `%USERPROFILE%\.ssh-manager\.env`
3. `.env` del directorio actual
4. `%USERPROFILE%\.env`
5. `.env` junto al proyecto

TOML se carga desde `SSH_CONFIG_PATH` o `~/.codex/ssh-config.toml`.

## Desarrollo

```powershell
npm test
npm run lint
npm run coverage
npm run validate
npx knip
```

`npm run validate` ejecuta lint, tests y cobertura. La cobertura global exige 85% para el código incluido por `c8`.

## Seguridad

- No commitees `.env`, claves ni passwords.
- Preferí claves SSH antes que password.
- Usá `readonly` o `restricted` en servidores sensibles.
- Revisá [Modos de seguridad](docs/SECURITY_MODES.md) antes de habilitar tools destructivas.
