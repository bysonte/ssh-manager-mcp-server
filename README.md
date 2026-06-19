# MCP SSH Manager

Servidor MCP para manejar servidores remotos por SSH desde clientes compatibles con Model Context Protocol.

## Qué permite hacer

- Ejecutar comandos SSH.
- Subir y bajar archivos.
- Sincronizar carpetas con rsync.
- Crear túneles y sesiones persistentes.
- Revisar salud del servidor, procesos y servicios.
- Crear backups y hacer operaciones de base de datos.
- Activar o desactivar grupos de tools para reducir contexto.

## Stack

- Node.js ESM.
- `@modelcontextprotocol/sdk` 1.29.0.
- `zod` para schemas MCP.
- `ssh2` para conexiones SSH.
- Transporte local: `StdioServerTransport`.

## Instalación rápida

```powershell
npm install
npm run validate
```

Para usarlo desde un cliente MCP, configurá transporte `stdio` con Node apuntando directamente a `src/index.js`:

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

Guía completa para Claude Code, Codex, OpenCode y otros clientes CLI: [docs/MCP_CLIENT_INSTALLATION.md](docs/MCP_CLIENT_INSTALLATION.md).

## Configuración

El servidor busca configuración en este orden:

1. `SSH_ENV_PATH` si está definido.
2. `%USERPROFILE%\.ssh-manager\.env`.
3. `.env` del directorio actual.
4. `%USERPROFILE%\.env`.
5. `.env` junto al proyecto.

Ejemplo mínimo:

```env
SSH_HOST=example.com
SSH_USER=root
SSH_PORT=22
SSH_PRIVATE_KEY_PATH=C:\Users\me\.ssh\id_rsa
```

## Scripts útiles

```powershell
npm test
npm run lint
npm run coverage
npm run validate
```

`npm run coverage` usa `c8` y exige 85% global. Hoy existe deuda previa de cobertura en módulos grandes; el script queda listo y falla si no se alcanza el umbral.

## Integración continua

GitHub Actions ejecuta instalación reproducible con `npm ci` cuando existe `package-lock.json`, además de `npm run lint`, `npm test`, `npm run coverage` y `npx knip` en cada `push` y `pull_request` con Node.js 20.x y 22.x. El workflow está en `.github/workflows/ci.yml`.

## Estado de documentación

La documentación principal está en español. `CHANGELOG.md` queda en inglés porque es histórico de versiones pasadas.

## Seguridad

- Los errores de tools MCP se devuelven con `isError: true`.
- Los comandos generados para backups, bases de datos y deploy escapan argumentos de shell.
- No guardes secretos en el repositorio. Usá `.env` local.
