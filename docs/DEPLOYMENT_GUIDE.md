# Guía de deploy

`ssh_deploy` sube archivos y puede:

- Crear backup del archivo remoto.
- Copiar con sudo si el destino lo requiere.
- Cambiar owner y permisos.
- Reiniciar un servicio.

Validaciones actuales:

- `owner` solo acepta usuario o usuario:grupo.
- `permissions` solo acepta modo octal.
- Rutas y password sudo se escapan al construir comandos.
