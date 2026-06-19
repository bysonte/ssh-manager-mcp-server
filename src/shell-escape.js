export function shellArg(value) {
  if (value === null || value === undefined) return '\'\'';
  return `'${String(value).replace(/'/g, '\'"\'"\'')}'`;
}

export function shellEnvAssignment(name, value) {
  if (!/^[A-Z_][A-Z0-9_]*$/i.test(name)) {
    throw new Error(`Invalid environment variable name: ${name}`);
  }
  return `${name}=${shellArg(value)}`;
}
