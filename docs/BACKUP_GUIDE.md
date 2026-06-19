# Backups

[Documentación](README.md) | Anterior: [Deploy](DEPLOYMENT_GUIDE.md) | Siguiente: [Alias y hooks](ALIASES_AND_HOOKS.md)

Tools del grupo `backup`:

- `ssh_backup_create`: crea backups de archivos o bases de datos.
- `ssh_backup_list`: lista backups disponibles.
- `ssh_backup_restore`: restaura un backup.
- `ssh_backup_schedule`: programa backups con cron.

## Tipos soportados

- `files`: empaqueta rutas remotas.
- `mysql`: usa cliente MySQL remoto.
- `postgresql`: usa cliente PostgreSQL remoto.
- `mongodb`: usa herramientas MongoDB remotas.
- `full`: backup amplio según configuración de la tool.

## Campos frecuentes

- `server`: servidor configurado.
- `type`: tipo de backup.
- `name`: nombre lógico.
- `database`: base para backups DB.
- `paths`: rutas para backups de archivos.
- `backupDir`: destino remoto, por defecto `/var/backups/ssh-manager`.
- `retention`: días de retención.
- `compress`: comprime el resultado.

## Reglas

- Los comandos generados escapan argumentos de shell.
- `ssh_backup_create`, `ssh_backup_restore` y `ssh_backup_schedule` están bloqueados en `readonly` y `restricted`.
- Probá restauraciones en staging antes de producción.

## Relacionado

- Deploy con backup automático: [Deploy](DEPLOYMENT_GUIDE.md).
- Políticas por servidor: [Modos de seguridad](SECURITY_MODES.md).

Siguiente: [Alias y hooks](ALIASES_AND_HOOKS.md).
