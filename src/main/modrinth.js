const axios = require('axios');
const fs = require('fs');
const path = require('path');
const profiles = require('./profiles');

const API_BASE = 'https://api.modrinth.com/v2';
const HEADERS = { 'User-Agent': 'KabanchikLauncher/1.0 (github.com/kabanchik129/KabanchikLauncher)' };

async function search(query, options = {}) {
  const {
    gameVersion,
    loader,
    category,
    limit = 20,
    offset = 0,
    projectType = 'mod',
  } = options;

  const facets = [];
  if (gameVersion) facets.push([`versions:${gameVersion}`]);
  if (loader) facets.push([`categories:${loader}`]);
  if (projectType) facets.push([`project_type:${projectType}`]);
  
  const params = {
    query,
    limit,
    offset,
    index: 'relevance',
  };
  if (facets.length > 0) params.facets = JSON.stringify(facets);

  const res = await axios.get(`${API_BASE}/search`, { params, headers: HEADERS });
  return res.data;
}

async function getProject(projectId) {
  const res = await axios.get(`${API_BASE}/project/${projectId}`, { headers: HEADERS });
  return res.data;
}

async function getVersions(projectId, gameVersion, loader) {
  const params = {};
  if (gameVersion) params.game_versions = JSON.stringify([gameVersion]);
  if (loader) params.loaders = JSON.stringify([loader]);
  
  const res = await axios.get(`${API_BASE}/project/${projectId}/version`, { params, headers: HEADERS });
  return res.data;
}

async function download(versionId, profileId, progressCallback) {
  // Получаем информацию о версии
  const res = await axios.get(`${API_BASE}/version/${versionId}`, { headers: HEADERS });
  const version = res.data;
  
  // Находим основной файл .jar
  const primaryFile = version.files.find(f => f.primary) || version.files[0];
  if (!primaryFile) throw new Error('Нет файла для скачивания');
  
  const profilePath = profiles.getPath(profileId);
  const modsDir = path.join(profilePath, 'mods');
  
  if (!fs.existsSync(modsDir)) fs.mkdirSync(modsDir, { recursive: true });
  
  const fileName = primaryFile.filename;
  const filePath = path.join(modsDir, fileName);
  
  // Проверяем не скачан ли уже
  if (fs.existsSync(filePath)) {
    return { success: true, alreadyExists: true, fileName };
  }
  
  progressCallback({ fileName, downloaded: 0, total: primaryFile.size || 0, percent: 0 });
  
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url: primaryFile.url,
    method: 'GET',
    responseType: 'stream',
    headers: HEADERS,
  });
  
  const total = parseInt(response.headers['content-length'] || primaryFile.size || 0);
  let downloaded = 0;
  
  response.data.on('data', (chunk) => {
    downloaded += chunk.length;
    progressCallback({
      fileName,
      downloaded,
      total,
      percent: total > 0 ? Math.round((downloaded / total) * 100) : 50,
    });
  });
  
  response.data.pipe(writer);
  
  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  
  // Скачиваем зависимости
  if (version.dependencies && version.dependencies.length > 0) {
    const required = version.dependencies.filter(d => d.dependency_type === 'required' && d.version_id);
    for (const dep of required) {
      try {
        await download(dep.version_id, profileId, progressCallback);
      } catch {}
    }
  }
  
  return { success: true, fileName };
}

// Поиск лучших оптимизационных модов для версии
async function getOptimizationMods(gameVersion, loader = 'fabric') {
  const optMods = [
    'AANobbMI', // Sodium
    'gvQqBUqZ', // Lithium
    'uXXizFIs', // FerriteCore
    'NNAgCjsB', // EntityCulling
    '5ZwThgaA', // ImmediatelyFast
    'nmDcB462', // ModernFix
  ];
  
  const results = [];
  for (const modId of optMods) {
    try {
      const versions = await getVersions(modId, gameVersion, loader);
      if (versions && versions.length > 0) {
        const project = await getProject(modId);
        results.push({ project, latestVersion: versions[0] });
      }
    } catch {}
  }
  return results;
}

module.exports = { search, getProject, getVersions, download, getOptimizationMods };
