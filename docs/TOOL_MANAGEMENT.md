# Gestión de tools

El proyecto agrupa 37 tools MCP por áreas: core, sesiones, monitoreo, backup, base de datos y avanzadas.

Usá la configuración de tools para activar solo lo necesario y reducir contexto.

Comandos útiles:

```powershell
npm run test:tools
```

Cada tool debe tener schema Zod y descripción clara. Si falla, debe devolver `isError: true`.
