#!/usr/bin/env node
/**
 * Libera los puertos usados por los microservicios antes de iniciar.
 * Uso: node scripts/liberar-puertos.js
 */

const { execSync } = require('child_process');
const path = require('path');
const puertos = [4300, 4200, 4201, 4202, 4203, 4204, 4205];

function liberarConKillPort() {
  try {
    const killPort = require('kill-port');
    return killPort;
  } catch {
    return null;
  }
}

function liberarConPowerShell() {
  const scriptPath = path.join(__dirname, '../../../scripts/liberar-puertos.ps1');
  try {
    execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  } catch (e) {
    console.warn('[predev] PowerShell falló, intentando con kill-port...');
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function liberar() {
  const killPort = liberarConKillPort();
  if (killPort) {
    console.log('[predev] Liberando puertos...');
    for (const puerto of puertos) {
      try {
        await killPort(puerto, 'tcp');
        console.log(`  Puerto ${puerto} liberado`);
      } catch {
        // Puerto no estaba en uso
      }
    }
    await sleep(500);
    console.log('[predev] Listo.\n');
  } else {
    liberarConPowerShell();
    await sleep(500);
  }
}

liberar().catch(() => process.exit(0));
