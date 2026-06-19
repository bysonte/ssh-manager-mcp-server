# Deploy

[Documentación](README.md) | Anterior: [Modos de seguridad](SECURITY_MODES.md) | Siguiente: [Backups](BACKUP_GUIDE.md)

Usá `ssh_deploy` para publicar archivos locales en rutas remotas.

## Qué hace

- Sube cada archivo a una ruta temporal.
- Mueve el archivo al destino final.
- Crea backup previo si `backup` está activo.
- Usa `sudo` si hace falta y hay password disponible.
- Puede cambiar `owner` y `permissions`.
- Puede reiniciar un servicio.
- Ejecuta hooks pre/post deploy.

## Parámetros principales

- `server`: servidor configurado.
- `files`: pares `{ local, remote }`.
- `options.backup`: crea copia del archivo remoto antes de reemplazarlo.
- `options.owner`: `usuario` o `usuario:grupo`.
- `options.permissions`: modo octal, por ejemplo `644` o `755`.
- `options.restart`: servicio a reiniciar después del deploy.
- `options.sudoPassword`: password sudo opcional; también puede venir de `SSH_SERVER_<NOMBRE>_SUDO_PASSWORD`.

## Seguridad

- `ssh_deploy` está bloqueado en servidores `readonly` y `restricted`.
- Las rutas y passwords se escapan al construir comandos remotos.
- No uses deploy para directorios completos; para eso está `ssh_sync`.

## Relacionado

- Backups manuales: [Backups](BACKUP_GUIDE.md).
- Hooks de deploy: [Alias y hooks](ALIASES_AND_HOOKS.md).
- Políticas por servidor: [Modos de seguridad](SECURITY_MODES.md).

Siguiente: [Backups](BACKUP_GUIDE.md).
