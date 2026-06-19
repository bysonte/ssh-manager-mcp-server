import path from 'path';
import crypto from 'crypto';
import { shellArg } from './shell-escape.js';

/**
 * Deploy helper functions for secure file deployment
 */

/**
 * Generate a unique temporary filename
 */
export function getTempFilename(originalName) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  return `/tmp/${base}_${timestamp}_${random}${ext}`;
}

/**
 * Build deployment strategy based on target path and permissions
 */
export function buildDeploymentStrategy(remotePath, options = {}) {
  const {
    sudoPassword = null,
    owner = null,
    permissions = null,
    backup = true,
    restart = null
  } = options;

  const strategy = {
    steps: [],
    requiresSudo: false
  };

  if (owner && !/^[a-zA-Z0-9_.-]+(?::[a-zA-Z0-9_.-]+)?$/.test(owner)) {
    throw new Error('owner contains invalid characters');
  }

  if (permissions && !/^[0-7]{3,4}$/.test(String(permissions))) {
    throw new Error('permissions must be an octal value like 644 or 0755');
  }

  // Step 1: Backup existing file if requested
  if (backup) {
    strategy.steps.push({
      type: 'backup',
      command: `if [ -f ${shellArg(remotePath)} ]; then backup_path=${shellArg(`${remotePath}.bak`)}.$(date +%Y%m%d_%H%M%S); cp ${shellArg(remotePath)} "$backup_path"; fi`
    });
  }

  // Step 2: Determine if we need sudo
  const needsSudo = remotePath.startsWith('/etc/') ||
                    remotePath.startsWith('/var/') ||
                    remotePath.startsWith('/usr/') ||
                    owner || permissions;

  if (needsSudo) {
    strategy.requiresSudo = true;
  }

  // Step 3: Copy from temp to final location
  const copyCmd = needsSudo && sudoPassword ?
    `printf '%s\n' ${shellArg(sudoPassword)} | sudo -S cp {{tempFile}} ${shellArg(remotePath)}` :
    needsSudo ?
      `sudo cp {{tempFile}} ${shellArg(remotePath)}` :
      `cp {{tempFile}} ${shellArg(remotePath)}`;

  strategy.steps.push({
    type: 'copy',
    command: copyCmd
  });

  // Step 4: Set ownership if specified
  if (owner) {
    const chownCmd = sudoPassword ?
      `printf '%s\n' ${shellArg(sudoPassword)} | sudo -S chown ${owner} ${shellArg(remotePath)}` :
      `sudo chown ${owner} ${shellArg(remotePath)}`;

    strategy.steps.push({
      type: 'chown',
      command: chownCmd
    });
  }

  // Step 5: Set permissions if specified
  if (permissions) {
    const chmodCmd = sudoPassword ?
      `printf '%s\n' ${shellArg(sudoPassword)} | sudo -S chmod ${permissions} ${shellArg(remotePath)}` :
      `sudo chmod ${permissions} ${shellArg(remotePath)}`;

    strategy.steps.push({
      type: 'chmod',
      command: chmodCmd
    });
  }

  // Step 6: Restart service if specified
  if (restart) {
    strategy.steps.push({
      type: 'restart',
      command: restart
    });
  }

  // Step 7: Cleanup temp file
  strategy.steps.push({
    type: 'cleanup',
    command: 'rm -f {{tempFile}}'
  });

  return strategy;
}

/**
 * Parse deployment configuration from file path patterns
 * Examples:
 *   /home/user/app/file.js -> normal deploy
 *   /etc/nginx/sites-available/site -> needs sudo
 *   /var/www/html/index.html -> needs sudo
 */
export function detectDeploymentNeeds(remotePath) {
  const needs = {
    sudo: false,
    suggestedOwner: null,
    suggestedPerms: null
  };

  // System directories that typically need sudo
  if (remotePath.startsWith('/etc/')) {
    needs.sudo = true;
    needs.suggestedOwner = 'root:root';
    needs.suggestedPerms = '644';
  } else if (remotePath.startsWith('/var/www/')) {
    needs.sudo = true;
    needs.suggestedOwner = 'www-data:www-data';
    needs.suggestedPerms = '644';
  } else if (remotePath.includes('/nginx/')) {
    needs.sudo = true;
    needs.suggestedOwner = 'root:root';
    needs.suggestedPerms = '644';
  } else if (remotePath.includes('/apache/') || remotePath.includes('/httpd/')) {
    needs.sudo = true;
    needs.suggestedOwner = 'www-data:www-data';
    needs.suggestedPerms = '644';
  } else if (remotePath.includes('/frappe-bench/')) {
    // For ERPNext/Frappe deployments
    needs.sudo = false;
    needs.suggestedOwner = null; // Will be handled by the app
    needs.suggestedPerms = '644';
  }

  return needs;
}
