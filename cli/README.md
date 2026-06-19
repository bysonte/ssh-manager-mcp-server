# CLI SSH Manager

CLI auxiliar para configurar y operar el proyecto desde terminal.

## Uso

```powershell
node cli/ssh-manager.js
```

## Notas para Windows

Algunos scripts dentro de `cli/` son `.sh` y están pensados para Linux/macOS o Git Bash. En Windows, preferí ejecutar el servidor MCP con npm:

```powershell
npm install
node D:/work/ssh-manager-mcp-server/src/index.js
```

## Relación con MCP

La CLI es auxiliar. El servidor MCP principal está en `src/index.js` y los clientes MCP deben lanzarlo por `stdio` con `command: "node"` y `args: ["ruta/absoluta/src/index.js"]`.
