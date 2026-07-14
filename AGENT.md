# AGENT.md

Guia para agentes y contribuidores de MCP SSH Manager.

## Objetivo

El proyecto es un servidor MCP por `stdio` para operar servidores SSH configurados. Su valor es la configuracion centralizada, las politicas por servidor, la auditoria y las operaciones con estado; no debe duplicar comandos de shell sin una razon operativa clara.

## Fuentes de verdad

- `package.json`: version, scripts, Node soportado y umbral de cobertura.
- `src/index.js`: registro MCP, schemas Zod y handlers.
- `src/tool-registry.js`: nombres, grupos, perfiles y conteos de tools.
- `src/config-loader.js`: modelo normalizado de servidores.
- `TOOLS.md`: catalogo publico de tools. Actualizarlo con cada cambio de registro.

## Arquitectura

- `src/index.js` crea `McpServer`, carga configuracion y mantiene el pool SSH.
- `src/ssh-manager.js` encapsula `ssh2`, SFTP, ejecucion y forwarding.
- Los modulos `*-manager.js` contienen operaciones de dominio; los handlers MCP deben ser delgados.
- `cli/ssh-manager` administra configuracion local. No anunciar subcomandos que no implemente.

## Configuracion

El modelo interno usa siempre `keyPath`, `defaultDir`, `sudoPassword`, `proxyJump`, `proxyCommand`, `allowPatterns`, `denyPatterns` y `auditLog`.

Prioridad de servidores: TOML, `.env`, variables de proceso. El `.env` se resuelve mediante `SSH_ENV_PATH`, `~/.ssh-manager/.env`, directorio actual, `~/.env` y raiz del proyecto. `PREFER_TOML_CONFIG=true` omite el `.env`.

`SSH_ENV_PATH` corresponde al MCP; `SSH_MANAGER_ENV` es una variable propia de la CLI. No confundirlas.

## Tools y contexto

Sin `~/.ssh-manager/tools-config.json`, el servidor usa `agentic`: 17 tools de alto valor. Un archivo existente con `mode: "all"` se respeta. Los modos disponibles son `agentic`, `all`, `minimal` y `custom`.

Al agregar o retirar una tool se debe actualizar, en el mismo cambio:

1. `src/tool-registry.js` y sus conteos derivados.
2. El registro/handler de `src/index.js` y el schema Zod.
3. Tests del registro y del handler o modulo afectado.
4. `TOOLS.md`, `docs/TOOL_MANAGEMENT.md` y ayuda CLI si corresponde.

## Seguridad obligatoria

- Nunca interpolar entrada de usuario en shell. Usar `shellArg()` en Unix y escaping especifico para PowerShell.
- Validar limites, puertos, nombres de servicio, IDs y cron antes de construir comandos.
- Aplicar politica antes de operaciones remotas mutables. `readonly` y `restricted` no sustituyen permisos reales del servidor.
- La clave de host debe estar fijada en `known_hosts`; no autoaceptar claves nuevas.
- No escribir secretos en logs, historial, errores, ejemplos ni documentacion.
- Preferir credenciales SSH y DB de minimo privilegio.

## Calidad

Usar pruebas aisladas en directorios temporales. No modificar el repositorio, `known_hosts` del usuario ni configuracion global durante los tests.

Antes de entregar cambios ejecutar:

```powershell
npm run validate
npx knip
```
