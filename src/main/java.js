const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Поиск Java на системе
function detect() {
  const results = [];

  // Стандартные пути для Windows
  const searchPaths = [
    'C:\\Program Files\\Java',
    'C:\\Program Files\\Eclipse Adoptium',
    'C:\\Program Files\\Microsoft',
    'C:\\Program Files\\Zulu',
    'C:\\Program Files\\BellSoft',
    'C:\\Program Files (x86)\\Java',
    process.env.JAVA_HOME,
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Eclipse Adoptium'),
  ].filter(Boolean);

  // Проверяем java в PATH
  try {
    const versionOutput = execSync('java -version 2>&1', { encoding: 'utf8' });
    const match = versionOutput.match(/version "?(\d+(?:\.\d+)*)/);
    if (match) {
      results.push({
        path: 'java',
        version: match[1],
        major: parseInt(match[1].split('.')[0]) >= 9 ? parseInt(match[1].split('.')[0]) : parseInt(match[1].split('.')[1] || '8'),
      });
    }
  } catch {}

  // Сканируем директории
  for (const searchPath of searchPaths) {
    if (!fs.existsSync(searchPath)) continue;
    try {
      const dirs = fs.readdirSync(searchPath);
      for (const dir of dirs) {
        const javaExe = path.join(searchPath, dir, 'bin', 'java.exe');
        if (fs.existsSync(javaExe)) {
          try {
            const out = execSync(`"${javaExe}" -version 2>&1`, { encoding: 'utf8' });
            const match = out.match(/version "?(\d+(?:\.\d+)*)/);
            if (match && !results.find(r => r.path === javaExe)) {
              const parts = match[1].split('.');
              const major = parseInt(parts[0]) >= 9 ? parseInt(parts[0]) : parseInt(parts[1] || '8');
              results.push({ path: javaExe, version: match[1], major });
            }
          } catch {}
        }
      }
    } catch {}
  }

  return results.sort((a, b) => b.major - a.major);
}

// Оптимальные JVM аргументы для Minecraft
function getOptimalArgs(ramMB) {
  const ram = parseInt(ramMB) || 4096;
  
  // G1GC оптимизированные флаги (такие же использует Aikar в своих флагах)
  const args = [
    // Сборщик мусора G1GC
    '-XX:+UseG1GC',
    '-XX:+ParallelRefProcEnabled',
    '-XX:MaxGCPauseMillis=200',
    '-XX:+UnlockExperimentalVMOptions',
    '-XX:+DisableExplicitGC',
    '-XX:+AlwaysPreTouch',
    
    // G1GC параметры
    `-XX:G1NewSizePercent=${ram >= 8192 ? 30 : 20}`,
    `-XX:G1MaxNewSizePercent=${ram >= 8192 ? 40 : 50}`,
    `-XX:G1HeapRegionSize=${ram >= 8192 ? '16M' : '8M'}`,
    `-XX:G1ReservePercent=${ram >= 8192 ? 15 : 20}`,
    `-XX:G1HeapWastePercent=5`,
    `-XX:G1MixedGCCountTarget=${ram >= 8192 ? 4 : 8}`,
    '-XX:InitiatingHeapOccupancyPercent=15',
    '-XX:G1MixedGCLiveThresholdPercent=90',
    '-XX:G1RSetUpdatingPauseTimePercent=5',
    '-XX:SurvivorRatio=32',
    '-XX:+PerfDisableSharedMem',
    '-XX:MaxTenuringThreshold=1',
    
    // Производительность
    '-XX:+OptimizeStringConcat',
    '-XX:+UseStringDeduplication',
    '-XX:+UseCompressedOops',
    
    // JIT компилятор
    '-XX:+TieredCompilation',
    '-XX:ReservedCodeCacheSize=512m',
    '-XX:+UseCodeCacheFlushing',
    
    // Логирование GC (убрать если не нужно)
    // '-verbose:gc',
    
    // Кодировка
    '-Dfile.encoding=UTF-8',
    '-Dstdout.encoding=UTF-8',
  ];

  return args;
}

// Рекомендованный объём RAM для версии
function getRecommendedRam(version, hasShaders = false, modCount = 0) {
  let baseRam = 2048;
  
  const versionNum = parseFloat(version.replace(/1\.(\d+).*/, '$1'));
  if (versionNum >= 18) baseRam = 3072;
  if (versionNum >= 20) baseRam = 4096;
  
  if (modCount > 50) baseRam += 1024;
  if (modCount > 100) baseRam += 2048;
  if (hasShaders) baseRam += 2048;
  
  // Не больше 75% системной RAM
  const os = require('os');
  const systemRam = Math.floor(os.totalmem() / 1024 / 1024);
  return Math.min(baseRam, Math.floor(systemRam * 0.75));
}

module.exports = { detect, getOptimalArgs, getRecommendedRam };
