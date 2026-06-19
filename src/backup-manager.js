/**
 * Backup Manager for MCP SSH Manager
 * Handles creation, listing, restoration, and scheduling of backups
 * Supports databases (MySQL, PostgreSQL, MongoDB) and file backups
 */

import path from 'path';
import crypto from 'crypto';
import { logger } from './logger.js';
import { shellArg, shellEnvAssignment } from './shell-escape.js';

// Backup types
export const BACKUP_TYPES = {
  MYSQL: 'mysql',
  POSTGRESQL: 'postgresql',
  MONGODB: 'mongodb',
  FILES: 'files',
  FULL: 'full'
};

// Default backup directory
export const DEFAULT_BACKUP_DIR = '/var/backups/ssh-manager';

/**
 * Generate unique backup ID
 */
export function generateBackupId(type, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const random = crypto.randomBytes(4).toString('hex');
  return `${type}_${name}_${timestamp}_${random}`;
}

/**
 * Get backup metadata file path
 */
export function getBackupMetadataPath(backupId, backupDir = DEFAULT_BACKUP_DIR) {
  return path.join(backupDir, `${backupId}.meta.json`);
}

/**
 * Get backup file path
 */
export function getBackupFilePath(backupId, backupDir = DEFAULT_BACKUP_DIR, extension = '.gz') {
  return path.join(backupDir, `${backupId}${extension}`);
}

/**
 * Build MySQL dump command
 */
export function buildMySQLDumpCommand(options) {
  const {
    database,
    user,
    password,
    host = 'localhost',
    port = 3306,
    outputFile,
    singleTransaction = true,
    compress = true
  } = options;

  let command = 'mysqldump';

  // Connection parameters
  if (user) command += ` -u${shellArg(user)}`;
  if (password) command += ` -p${shellArg(password)}`;
  if (host) command += ` -h ${shellArg(host)}`;
  if (port) command += ` -P ${port}`;

  // Dump options
  if (singleTransaction) command += ' --single-transaction';
  command += ' --routines --triggers';

  // Database name
  command += ` ${shellArg(database)}`;

  // Output handling
  if (compress) {
    command += ` | gzip > ${shellArg(outputFile)}`;
  } else {
    command += ` > ${shellArg(outputFile)}`;
  }

  return command;
}

/**
 * Build PostgreSQL dump command
 */
export function buildPostgreSQLDumpCommand(options) {
  const {
    database,
    user,
    password,
    host = 'localhost',
    port = 5432,
    outputFile,
    compress = true
  } = options;

  // PostgreSQL uses PGPASSWORD environment variable
  let command = '';
  if (password) {
    command = `${shellEnvAssignment('PGPASSWORD', password)} `;
  }

  command += 'pg_dump';

  // Connection parameters
  if (user) command += ` -U ${shellArg(user)}`;
  if (host) command += ` -h ${shellArg(host)}`;
  if (port) command += ` -p ${port}`;

  // Dump options
  command += ' --format=custom --clean --if-exists';

  // Database name
  command += ` ${shellArg(database)}`;

  // Output handling
  if (compress) {
    command += ` | gzip > ${shellArg(outputFile)}`;
  } else {
    command += ` > ${shellArg(outputFile)}`;
  }

  return command;
}

/**
 * Build MongoDB dump command
 */
export function buildMongoDBDumpCommand(options) {
  const {
    database,
    user,
    password,
    host = 'localhost',
    port = 27017,
    outputDir,
    compress = true
  } = options;

  let command = 'mongodump';

  // Connection parameters
  if (host) command += ` --host ${shellArg(host)}`;
  if (port) command += ` --port ${port}`;
  if (user) command += ` --username ${shellArg(user)}`;
  if (password) command += ` --password ${shellArg(password)}`;

  // Database selection
  if (database) command += ` --db ${shellArg(database)}`;

  // Output directory
  command += ` --out ${shellArg(outputDir)}`;

  // Compress the output directory
  if (compress) {
    const archiveName = `${outputDir}.tar.gz`;
    command += ` && tar -czf ${shellArg(archiveName)} -C "$(dirname ${shellArg(outputDir)})" "$(basename ${shellArg(outputDir)})"`;
    command += ` && rm -rf ${shellArg(outputDir)}`;
  }

  return command;
}

/**
 * Build files backup command (tar + gzip)
 */
export function buildFilesBackupCommand(options) {
  const {
    paths,
    outputFile,
    exclude = [],
    compress = true
  } = options;

  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error('paths must be a non-empty array');
  }

  let command = 'tar';

  // Compression flag
  if (compress) {
    command += ' -czf';
  } else {
    command += ' -cf';
  }

  // Output file
  command += ` ${shellArg(outputFile)}`;

  // Exclude patterns
  for (const pattern of exclude) {
    command += ` --exclude=${shellArg(pattern)}`;
  }

  // Paths to backup
  command += ` ${paths.map(shellArg).join(' ')}`;

  return command;
}

/**
 * Build backup restore command based on type
 */
export function buildRestoreCommand(backupType, backupFile, options = {}) {
  switch (backupType) {
  case BACKUP_TYPES.MYSQL:
    return buildMySQLRestoreCommand(backupFile, options);
  case BACKUP_TYPES.POSTGRESQL:
    return buildPostgreSQLRestoreCommand(backupFile, options);
  case BACKUP_TYPES.MONGODB:
    return buildMongoDBRestoreCommand(backupFile, options);
  case BACKUP_TYPES.FILES:
    return buildFilesRestoreCommand(backupFile, options);
  default:
    throw new Error(`Unknown backup type: ${backupType}`);
  }
}

/**
 * Build MySQL restore command
 */
function buildMySQLRestoreCommand(backupFile, options) {
  const {
    database,
    user,
    password,
    host = 'localhost',
    port = 3306
  } = options;

  let command = '';

  // Decompress if needed
  if (backupFile.endsWith('.gz')) {
    command = `gunzip -c ${shellArg(backupFile)} | `;
  } else {
    command = `cat ${shellArg(backupFile)} | `;
  }

  command += 'mysql';

  // Connection parameters
  if (user) command += ` -u${shellArg(user)}`;
  if (password) command += ` -p${shellArg(password)}`;
  if (host) command += ` -h ${shellArg(host)}`;
  if (port) command += ` -P ${port}`;
  if (database) command += ` ${shellArg(database)}`;

  return command;
}

/**
 * Build PostgreSQL restore command
 */
function buildPostgreSQLRestoreCommand(backupFile, options) {
  const {
    database,
    user,
    password,
    host = 'localhost',
    port = 5432
  } = options;

  let command = '';
  if (password) {
    command = `${shellEnvAssignment('PGPASSWORD', password)} `;
  }

  command += 'pg_restore';

  // Connection parameters
  if (user) command += ` -U ${shellArg(user)}`;
  if (host) command += ` -h ${shellArg(host)}`;
  if (port) command += ` -p ${port}`;
  if (database) command += ` -d ${shellArg(database)}`;

  // Restore options
  command += ' --clean --if-exists';

  // Handle compressed files
  if (backupFile.endsWith('.gz')) {
    command = `gunzip -c ${shellArg(backupFile)} | ${command}`;
  } else {
    command += ` ${shellArg(backupFile)}`;
  }

  return command;
}

/**
 * Build MongoDB restore command
 */
function buildMongoDBRestoreCommand(backupFile, options) {
  const {
    user,
    password,
    host = 'localhost',
    port = 27017,
    drop = true
  } = options;

  let command = '';

  // Extract if compressed
  if (backupFile.endsWith('.tar.gz')) {
    const extractDir = backupFile.replace('.tar.gz', '');
    command = `tar -xzf ${shellArg(backupFile)} -C "$(dirname ${shellArg(backupFile)})" && `;
    command += 'mongorestore';

    if (drop) command += ' --drop';
    if (host) command += ` --host ${shellArg(host)}`;
    if (port) command += ` --port ${port}`;
    if (user) command += ` --username ${shellArg(user)}`;
    if (password) command += ` --password ${shellArg(password)}`;

    command += ` ${shellArg(extractDir)}`;
    command += ` && rm -rf ${shellArg(extractDir)}`;
  } else {
    command = 'mongorestore';
    if (drop) command += ' --drop';
    if (host) command += ` --host ${shellArg(host)}`;
    if (port) command += ` --port ${port}`;
    if (user) command += ` --username ${shellArg(user)}`;
    if (password) command += ` --password ${shellArg(password)}`;
    command += ` ${shellArg(backupFile)}`;
  }

  return command;
}

/**
 * Build files restore command
 */
function buildFilesRestoreCommand(backupFile, options) {
  const { targetPath = '/' } = options;

  let command = 'tar';

  // Auto-detect compression
  if (backupFile.endsWith('.gz') || backupFile.endsWith('.tgz')) {
    command += ' -xzf';
  } else {
    command += ' -xf';
  }

  command += ` ${shellArg(backupFile)}`;
  command += ` -C ${shellArg(targetPath)}`;

  return command;
}

/**
 * Create backup metadata object
 */
export function createBackupMetadata(backupId, type, options = {}) {
  return {
    id: backupId,
    type,
    created_at: new Date().toISOString(),
    server: options.server || 'unknown',
    database: options.database || null,
    paths: options.paths || [],
    size: null, // Will be filled after backup
    compressed: options.compress !== false,
    retention: options.retention || 7, // days
    status: 'pending',
    error: null
  };
}

/**
 * Build command to save metadata to remote server
 */
export function buildSaveMetadataCommand(metadata, metadataPath) {
  const jsonData = JSON.stringify(metadata, null, 2);
  // Escape single quotes in JSON for shell
  const escapedJson = jsonData.replace(/'/g, '\'\\\'\'');
  return `echo '${escapedJson}' > "${metadataPath}"`;
}

/**
 * Build command to list backups from remote server
 */
export function buildListBackupsCommand(backupDir = DEFAULT_BACKUP_DIR, type = null) {
  let command = `find "${backupDir}" -name "*.meta.json" -type f`;

  if (type) {
    command += ` | grep "${type}_"`;
  }

  // Read and parse each metadata file
  command += ' | while read -r file; do cat "$file"; echo "---"; done';

  return command;
}

/**
 * Parse list backups output
 */
export function parseBackupsList(output) {
  if (!output || !output.trim()) {
    return [];
  }

  const backups = [];
  const metadataBlocks = output.split('---').filter(b => b.trim());

  for (const block of metadataBlocks) {
    try {
      const metadata = JSON.parse(block.trim());
      backups.push(metadata);
    } catch (error) {
      logger.warn('Failed to parse backup metadata', { error: error.message, block });
    }
  }

  // Sort by created_at descending
  return backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Build cleanup old backups command (based on retention)
 */
export function buildCleanupCommand(backupDir = DEFAULT_BACKUP_DIR, retentionDays = 7) {
  // Find backup files older than retention period and delete them
  return `find "${backupDir}" -name "*_*_*" -type f -mtime +${retentionDays} -delete`;
}

/**
 * Build cron schedule command
 */
export function buildCronScheduleCommand(schedule, backupCommand, cronComment) {
  // Add cron job with comment
  const cronLine = `${schedule} ${backupCommand} # ${cronComment}`;
  return `(crontab -l 2>/dev/null; echo '${cronLine}') | crontab -`;
}
