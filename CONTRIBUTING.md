# Contribuir

## Antes de cambiar código

1. Instalá dependencias con `npm install`.
2. Ejecutá `npm test`.
3. Revisá `npm run lint`.

## Reglas de código

- Mantener Node.js ESM.
- Registrar tools MCP con `server.registerTool` y schemas Zod.
- Si una tool falla, devolver `isError: true`.
- No imprimir secretos.
- No agregar dependencias pesadas sin motivo claro.
- Todo cambio de lógica debe tener test.

## Cobertura

```powershell
npm run coverage
```

El umbral configurado es 85% global. Si una mejora toca código sin cobertura, agregá tests.

## Documentación

La documentación principal debe mantenerse en español, directa y enlazada desde [docs/README.md](docs/README.md).
