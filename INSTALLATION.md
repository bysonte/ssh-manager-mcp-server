# Instalación

## Requisitos

- Node.js 18 o superior.
- npm.
- Acceso SSH al servidor remoto.
- Opcional: rsync, Docker, clientes de base de datos según las tools que uses.

## Instalar dependencias

```powershell
npm install
```

Esto genera `package-lock.json` y deja versiones reproducibles.

## Ejecutar localmente

```powershell
node D:/work/ssh-manager-mcp-server/src/index.js
```

Ese comando inicia el servidor por `stdio`. En uso normal no lo mantenés abierto manualmente: el cliente MCP lo lanza como proceso hijo.

## Configurar un cliente MCP

Configuración recomendada para clientes con formato `mcpServers`:

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

Reglas importantes:

- Usá ruta absoluta a `src/index.js`.
- Usá `command: "node"`; evitá `npm start` dentro del cliente MCP.
- El transporte es `stdio`; no hay puerto HTTP.
- Definí `SSH_ENV_PATH` o `SSH_CONFIG_PATH` si el cliente arranca desde otro directorio.

Guía por entorno CLI: [docs/MCP_CLIENT_INSTALLATION.md](docs/MCP_CLIENT_INSTALLATION.md).

## Verificar

```powershell
npm test
npm run lint
npm run coverage
npm run validate
```
