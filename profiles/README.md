# Perfiles

Los perfiles agrupan alias y hooks para distintos tipos de servidores.

Perfiles incluidos:

- `default`: operaciones básicas SSH.
- `docker`: comandos frecuentes para Docker.
- `frappe`: comandos para Frappe/ERPNext.
- `nodejs`: comandos para aplicaciones Node.js.

Los tests validan que todos los JSON sean válidos:

```powershell
npm run test:profiles
```
