# Guía de backups

Tools principales:

- `ssh_backup_create`: crea backups de archivos o bases de datos.
- `ssh_backup_list`: lista backups disponibles.
- `ssh_backup_restore`: restaura un backup.
- `ssh_backup_schedule`: programa backups con cron.

Los comandos generados escapan argumentos de shell para reducir riesgo de inyección.

Recomendación: probá restauraciones en staging antes de producción.
