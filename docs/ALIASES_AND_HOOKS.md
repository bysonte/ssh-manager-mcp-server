# Alias y hooks

[Documentación](README.md) | Anterior: [Backups](BACKUP_GUIDE.md) | Siguiente: [Contribuir](../CONTRIBUTING.md)

## Alias de servidores

Tool: `ssh_alias`.

Usalos para mapear nombres cortos a servidores configurados.

Acciones:

- `list`: lista alias.
- `add`: crea alias.
- `remove`: elimina alias.

## Alias de comandos

Tool: `ssh_command_alias`.

Usalos para comandos frecuentes. Se expanden antes de evaluar la política de seguridad, por lo que no evitan `readonly`, `restricted` ni `DENY_PATTERNS`.

Acciones:

- `list`: lista alias.
- `add`: crea alias.
- `remove`: elimina alias.
- `suggest`: busca alias posibles.

## Hooks

Tool: `ssh_hooks`.

Los hooks automatizan acciones alrededor de eventos como deploy, conexión o errores.

Acciones:

- `list`: lista hooks.
- `status`: muestra estado.
- `enable`: activa un hook.
- `disable`: desactiva un hook.

## Reglas

- No guardes secretos en alias ni hooks.
- Revisá la salida de hooks antes de usarlos en producción.
- Si un hook toca deploy, revisá también [Deploy](DEPLOYMENT_GUIDE.md).

Fin del recorrido. Volver a [Documentación](README.md).
