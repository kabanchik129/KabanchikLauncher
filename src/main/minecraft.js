const { Client, Authenticator } = require('minecraft-launcher-core');
const path = require('path');
const os = require('os');
const fs = require('fs');
const axios = require('axios');
const java = require('./java');

const GAME_DIR = path.join(os.homedir(), '.kabanchik');

function getGameDir() {
  if (!fs.existsSync(GAME_DIR)) fs.mkdirSync(GAME_DIR, { recursive: true });
  return GAME_DIR;
}

async function getVersions() {
  const res = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
  // Возвращаем ВСЕ версии — релизы, снапшоты, старые беты и альфы
  return res.data.versions.map(v => ({
    id: v.id,
    type: v.type, // release | snapshot | old_beta | old_alpha
    releaseTime: v.releaseTime,
  }));
}

async function launch(profile, account, logCallback, progressCallback) {
  const launcher = new Client();
  const gameDir = path.join(getGameDir(), 'instances', profile.id);
  
  if (!fs.existsSync(gameDir)) fs.mkdirSync(gameDir, { recursive: true });

  // Аргументы JVM с оптимизацией
  const jvmArgs = java.getOptimalArgs(profile.ram || 4096);
  
  // Настройка авторизации
  let auth;
  if (account.type === 'offline') {
    auth = Authenticator.getAuth(account.username, null);
    auth.uuid = account.uuid;
    auth.meta = { online: false };
  } else {
    auth = {
      access_token: account.accessToken,
      client_token: account.uuid,
      uuid: account.uuid,
      name: account.username,
      meta: { online: true, type: 'msa' },
    };
  }

  // Определяем версию и загрузчик
  let version = profile.version;
  if (profile.loader === 'fabric') {
    version = `fabric-loader-${profile.fabricVersion || 'latest'}-${profile.version}`;
  } else if (profile.loader === 'forge') {
    version = `${profile.version}-forge-${profile.forgeVersion || 'latest'}`;
  } else if (profile.loader === 'quilt') {
    version = `quilt-loader-${profile.quiltVersion || 'latest'}-${profile.version}`;
  }

  const opts = {
    authorization: auth,
    root: getGameDir(),
    version: {
      number: profile.version,
      type: profile.loader && profile.loader !== 'vanilla' ? 'release' : 'release',
      custom: profile.loader && profile.loader !== 'vanilla' ? version : undefined,
    },
    memory: {
      max: `${profile.ram || 4096}M`,
      min: `${Math.floor((profile.ram || 4096) / 2)}M`,
    },
    javaPath: profile.javaPath || 'java',
    customArgs: jvmArgs,
    gameDirectory: gameDir,
    window: {
      width: profile.windowWidth || 1280,
      height: profile.windowHeight || 720,
    },
    overrides: {
      detached: true,
    },
  };

  launcher.on('debug', (e) => logCallback({ type: 'debug', message: e }));
  launcher.on('data', (e) => logCallback({ type: 'data', message: e }));
  launcher.on('progress', (e) => {
    progressCallback({
      type: e.type,
      task: e.task,
      total: e.total,
      percent: Math.round((e.task / e.total) * 100),
    });
  });

  await launcher.launch(opts);
}

async function installFabric(minecraftVersion, progressCallback) {
  progressCallback({ type: 'fabric', task: 0, total: 1, percent: 0, message: 'Получение Fabric версий...' });
  
  // Получаем последнюю версию Fabric loader
  const res = await axios.get(`https://meta.fabricmc.net/v2/versions/loader/${minecraftVersion}`);
  if (!res.data || !res.data[0]) throw new Error('Fabric не поддерживает эту версию Minecraft');
  
  const loaderVersion = res.data[0].loader.version;
  const installerRes = await axios.get('https://meta.fabricmc.net/v2/versions/installer');
  const installerVersion = installerRes.data[0].version;

  progressCallback({ type: 'fabric', task: 0, total: 1, percent: 30, message: 'Скачивание Fabric installer...' });

  // Скачиваем и запускаем installer
  const installerUrl = `https://maven.fabricmc.net/net/fabricmc/fabric-installer/${installerVersion}/fabric-installer-${installerVersion}.jar`;
  const installerPath = path.join(getGameDir(), `fabric-installer-${installerVersion}.jar`);
  
  const writer = fs.createWriteStream(installerPath);
  const response = await axios({ url: installerUrl, method: 'GET', responseType: 'stream' });
  response.data.pipe(writer);
  
  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  progressCallback({ type: 'fabric', task: 1, total: 1, percent: 60, message: 'Установка Fabric...' });

  // Запускаем installer
  const { execFile } = require('child_process');
  await new Promise((resolve, reject) => {
    execFile('java', [
      '-jar', installerPath,
      'client',
      '-dir', getGameDir(),
      '-mcversion', minecraftVersion,
      '-loader', loaderVersion,
      '-noprofile',
    ], (err) => {
      if (err) reject(new Error('Ошибка установки Fabric: ' + err.message));
      else resolve();
    });
  });

  progressCallback({ type: 'fabric', task: 1, total: 1, percent: 100, message: 'Fabric установлен!' });
  return { loaderVersion, installerVersion };
}

async function installForge(minecraftVersion, progressCallback) {
  progressCallback({ type: 'forge', task: 0, total: 1, percent: 0, message: 'Поиск Forge версии...' });

  // Получаем список версий Forge
  const res = await axios.get(`https://files.minecraftforge.net/net/minecraftforge/forge/index_${minecraftVersion}.html`, {
    headers: { 'User-Agent': 'KabanchikLauncher/1.0' },
  }).catch(() => null);

  if (!res) throw new Error('Forge не найден для этой версии');

  // Для простоты используем рекомендованный installer
  const forgeApiUrl = `https://files.minecraftforge.net/maven/net/minecraftforge/forge/promotions_slim.json`;
  const promoRes = await axios.get(forgeApiUrl);
  const promos = promoRes.data.promos;
  
  let forgeVersion = promos[`${minecraftVersion}-recommended`] || promos[`${minecraftVersion}-latest`];
  if (!forgeVersion) throw new Error('Нет рекомендованной версии Forge для ' + minecraftVersion);

  const installerUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${minecraftVersion}-${forgeVersion}/forge-${minecraftVersion}-${forgeVersion}-installer.jar`;
  const installerPath = path.join(getGameDir(), `forge-${minecraftVersion}-${forgeVersion}-installer.jar`);

  progressCallback({ type: 'forge', task: 0, total: 1, percent: 30, message: 'Скачивание Forge installer...' });

  const writer = fs.createWriteStream(installerPath);
  const response = await axios({ url: installerUrl, method: 'GET', responseType: 'stream' });
  
  let downloaded = 0;
  const total = parseInt(response.headers['content-length'] || 0);
  response.data.on('data', (chunk) => {
    downloaded += chunk.length;
    progressCallback({ type: 'forge', percent: 30 + Math.round((downloaded / total) * 40), message: 'Скачивание Forge...' });
  });
  response.data.pipe(writer);
  
  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  progressCallback({ type: 'forge', task: 1, total: 1, percent: 70, message: 'Установка Forge...' });

  const { execFile } = require('child_process');
  await new Promise((resolve, reject) => {
    execFile('java', ['-jar', installerPath, '--installClient', getGameDir()], (err) => {
      if (err) reject(new Error('Ошибка установки Forge: ' + err.message));
      else resolve();
    });
  });

  progressCallback({ type: 'forge', task: 1, total: 1, percent: 100, message: 'Forge установлен!' });
  return { forgeVersion };
}

module.exports = { launch, getVersions, installFabric, installForge, getGameDir };
