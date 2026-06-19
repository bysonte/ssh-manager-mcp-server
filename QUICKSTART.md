# Inicio rápido

## 1. Instalar

```powershell
npm install
```

## 2. Crear `.env`

```env
SSH_HOST=example.com
SSH_USER=root
SSH_PORT=22
SSH_PRIVATE_KEY_PATH=C:\Users\me\.ssh\id_rsa
```

## 3. Probar

```powershell
npm test
```

## 4. Configurar el cliente MCP

Usá `node` apuntando a `src/index.js` por `stdio`:

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

Más ejemplos para Claude Code, Codex y otros clientes CLI: [docs/MCP_CLIENT_INSTALLATION.md](docs/MCP_CLIENT_INSTALLATION.md).

## 5. Tools principales

- `ssh_list_servers`: lista servidores configurados.
- `ssh_execute`: ejecuta un comando remoto.
- `ssh_upload` y `ssh_download`: transfieren archivos.
- `ssh_sync`: sincroniza carpetas.
- `ssh_health_check`: revisa estado del servidor.
- `ssh_backup_create`: crea backups.

Los fallos de tools se devuelven como respuesta MCP con `isError: true`.
