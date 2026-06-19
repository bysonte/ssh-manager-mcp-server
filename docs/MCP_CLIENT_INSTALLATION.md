# Instalación en clientes MCP por stdio

MCP SSH Manager se ejecuta como un proceso local por `stdio`. El cliente MCP lo inicia como proceso hijo y se comunica por stdin/stdout usando JSON-RPC. No hay servidor HTTP ni puerto que exponer.

## Requisitos

- Node.js 18 o superior.
- Dependencias instaladas con `npm install`.
- Ruta absoluta al archivo `src/index.js` de este repositorio.
- Configuración SSH en `.env`, TOML o variables de entorno.

## Comando base

Usá este comando para validar que Node puede iniciar el servidor:

```powershell
node D:/work/ssh-manager-mcp-server/src/index.js
```

En clientes MCP no lo ejecutes manualmente como proceso persistente. El cliente debe lanzarlo con esta forma:

```json
{
  "command": "node",
  "args": ["D:/work/ssh-manager-mcp-server/src/index.js"]
}
```

En Windows también podés usar barras dobles:

```json
{
  "command": "node",
  "args": ["D:\\work\\ssh-manager-mcp-server\\src\\index.js"]
}
```

## Configuración genérica `mcpServers`

Muchos clientes compatibles con MCP aceptan una sección `mcpServers`:

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

`SSH_ENV_PATH` es opcional, pero recomendado si querés que el cliente encuentre siempre el mismo archivo `.env` aunque arranque desde otro directorio.

## Claude Code

Opción por CLI:

```bash
claude mcp add ssh-manager node D:/work/ssh-manager-mcp-server/src/index.js
```

Opción por JSON, si editás la configuración MCP manualmente:

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

## OpenAI Codex

Si tu instalación de Codex usa `config.toml`, registrá el MCP como servidor local:

```toml
[mcp_servers.ssh-manager]
command = "node"
args = ["D:/work/ssh-manager-mcp-server/src/index.js"]

[mcp_servers.ssh-manager.env]
SSH_CONFIG_PATH = "C:/Users/tu-usuario/.codex/ssh-config.toml"
```

Si tu cliente Codex usa configuración JSON estilo `mcpServers`, el equivalente es:

```json
{
  "mcpServers": {
    "ssh-manager": {
      "command": "node",
      "args": ["D:/work/ssh-manager-mcp-server/src/index.js"],
      "env": {
        "SSH_CONFIG_PATH": "C:/Users/tu-usuario/.codex/ssh-config.toml"
      }
    }
  }
}
```

El archivo TOML de servidores SSH puede seguir el formato de `examples/codex-ssh-config.example.toml`.

## OpenCode y otros clientes CLI

Para clientes que acepten servidores MCP locales, registrá una entrada equivalente. Algunos usan `command` como string y `args` separado:

```json
{
  "name": "ssh-manager",
  "type": "local",
  "command": "node",
  "args": ["D:/work/ssh-manager-mcp-server/src/index.js"],
  "env": {
    "SSH_ENV_PATH": "D:/work/ssh-manager-mcp-server/.env"
  }
}
```

Otros usan `command` como array completo:

```json
{
  "name": "ssh-manager",
  "type": "local",
  "command": ["node", "D:/work/ssh-manager-mcp-server/src/index.js"],
  "env": {
    "SSH_ENV_PATH": "D:/work/ssh-manager-mcp-server/.env"
  }
}
```

Si el cliente usa otra clave para servidores MCP, mantené los mismos valores importantes: ejecutable `node`, argumento `ruta absoluta a src/index.js`, entorno SSH opcional y transporte `stdio`.

## Configuración SSH mínima

Ejemplo `.env`:

```env
SSH_HOST=example.com
SSH_USER=root
SSH_PORT=22
SSH_PRIVATE_KEY_PATH=C:\Users\me\.ssh\id_rsa
```

Para múltiples servidores podés usar el formato `SSH_SERVER_<NOMBRE>_*` documentado en `CLAUDE.md` y `.env.example`.

## Verificación

Después de configurar el cliente MCP:

1. Reiniciá el cliente CLI.
2. Pedí listar tools MCP disponibles.
3. Ejecutá `ssh_list_servers`.
4. Ejecutá un comando seguro con `ssh_execute`, por ejemplo `pwd` o `whoami`.

## Problemas comunes

- Si el cliente no encuentra el servidor, usá una ruta absoluta a `src/index.js`.
- Si Node no está en `PATH`, usá la ruta absoluta a `node.exe` en `command`.
- Si no aparecen servidores SSH, definí `SSH_ENV_PATH` o `SSH_CONFIG_PATH` en `env`.
- No uses `npm start` dentro de la configuración MCP; el cliente debe ejecutar directamente `node src/index.js`.
- No agregues logs en stdout: el servidor usa stderr para logs y stdout queda reservado para MCP.
