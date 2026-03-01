const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(os.homedir(), '.kabanchik');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');

// Встроенные оптимизированные пресеты сборок
const PRESET_PACKS = [
  {
    id: 'preset-performance-120',
    name: '🐷 Кабанчик Performance 1.20',
    description: 'Максимальная производительность. Fabric + Sodium + Lithium + Starlight + FerriteCore',
    version: '1.20.4',
    loader: 'fabric',
    ram: 4096,
    isPreset: true,
    icon: '⚡',
    mods: [
      { name: 'Sodium', modrinthId: 'AANobbMI' },
      { name: 'Lithium', modrinthId: 'gvQqBUqZ' },
      { name: 'Starlight', modrinthId: 'H8CaAYZC' },
      { name: 'FerriteCore', modrinthId: 'uXXizFIs' },
      { name: 'EntityCulling', modrinthId: 'NNAgCjsB' },
      { name: 'ImmediatelyFast', modrinthId: '5ZwThgaA' },
      { name: 'ModernFix', modrinthId: 'nmDcB462' },
    ],
    jvmArgs: 'optimized',
    windowWidth: 1280,
    windowHeight: 720,
  },
  {
    id: 'preset-performance-121',
    name: '🐷 Кабанчик Performance 1.21',
    description: 'Максимальная производительность для 1.21. Fabric + весь оптимизационный стек',
    version: '1.21.1',
    loader: 'fabric',
    ram: 4096,
    isPreset: true,
    icon: '⚡',
    mods: [
      { name: 'Sodium', modrinthId: 'AANobbMI' },
      { name: 'Lithium', modrinthId: 'gvQqBUqZ' },
      { name: 'FerriteCore', modrinthId: 'uXXizFIs' },
      { name: 'EntityCulling', modrinthId: 'NNAgCjsB' },
      { name: 'ImmediatelyFast', modrinthId: '5ZwThgaA' },
      { name: 'ModernFix', modrinthId: 'nmDcB462' },
      { name: 'Noisium', modrinthId: 'KuNKN7d2' },
    ],
    jvmArgs: 'optimized',
    windowWidth: 1280,
    windowHeight: 720,
  },
  {
    id: 'preset-vanilla-120',
    name: '🎮 Vanilla 1.20.4',
    description: 'Чистая игра без модов. Просто ванилла.',
    version: '1.20.4',
    loader: 'vanilla',
    ram: 2048,
    isPreset: true,
    icon: '🌿',
    mods: [],
    windowWidth: 1280,
    windowHeight: 720,
  },
  {
    id: 'preset-shaders-120',
    name: '✨ Кабанчик Shaders 1.20',
    description: 'Красивая картинка. Fabric + Sodium + Iris Shaders',
    version: '1.20.4',
    loader: 'fabric',
    ram: 6144,
    isPreset: true,
    icon: '🌈',
    mods: [
      { name: 'Sodium', modrinthId: 'AANobbMI' },
      { name: 'Iris Shaders', modrinthId: 'YL57xq9U' },
      { name: 'Lithium', modrinthId: 'gvQqBUqZ' },
    ],
    windowWidth: 1280,
    windowHeight: 720,
  },
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readProfiles() {
  ensureDataDir();
  if (!fs.existsSync(PROFILES_FILE)) {
    // Первый запуск — создаём файл с пресетами
    const data = { profiles: [...PRESET_PACKS] };
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
    return data.profiles;
  }
  try {
    const data = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'));
    return data.profiles || [];
  } catch {
    return [...PRESET_PACKS];
  }
}

function saveProfiles(profiles) {
  ensureDataDir();
  fs.writeFileSync(PROFILES_FILE, JSON.stringify({ profiles }, null, 2));
}

function list() {
  return readProfiles();
}

function get(id) {
  return readProfiles().find(p => p.id === id) || null;
}

function create(data) {
  const profiles = readProfiles();
  const newProfile = {
    id: uuidv4(),
    name: data.name || 'Новый профиль',
    version: data.version || '1.20.4',
    loader: data.loader || 'vanilla',
    ram: data.ram || 4096,
    javaPath: data.javaPath || 'java',
    windowWidth: data.windowWidth || 1280,
    windowHeight: data.windowHeight || 720,
    isPreset: false,
    icon: data.icon || '🎮',
    description: data.description || '',
    mods: [],
    createdAt: Date.now(),
    ...data,
    id: uuidv4(), // Перезаписываем id чтобы гарантировать уникальность
  };
  profiles.push(newProfile);
  saveProfiles(profiles);
  
  // Создаём директорию для профиля
  const profileDir = getPath(newProfile.id);
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(path.join(profileDir, 'mods'), { recursive: true });
    fs.mkdirSync(path.join(profileDir, 'resourcepacks'), { recursive: true });
    fs.mkdirSync(path.join(profileDir, 'saves'), { recursive: true });
    fs.mkdirSync(path.join(profileDir, 'screenshots'), { recursive: true });
  }
  
  return newProfile;
}

function update(id, data) {
  const profiles = readProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx === -1) throw new Error('Профиль не найден');
  profiles[idx] = { ...profiles[idx], ...data, id };
  saveProfiles(profiles);
  return profiles[idx];
}

function deleteProfile(id) {
  let profiles = readProfiles();
  const profile = profiles.find(p => p.id === id);
  if (!profile) throw new Error('Профиль не найден');
  if (profile.isPreset) throw new Error('Нельзя удалить встроенный пресет');
  
  profiles = profiles.filter(p => p.id !== id);
  saveProfiles(profiles);
  
  // Удаляем директорию профиля
  const profileDir = getPath(id);
  if (fs.existsSync(profileDir)) {
    fs.rmSync(profileDir, { recursive: true });
  }
  
  return { success: true };
}

function getPath(profileId) {
  return path.join(DATA_DIR, 'instances', profileId);
}

function getMods(profileId) {
  const modsDir = path.join(getPath(profileId), 'mods');
  if (!fs.existsSync(modsDir)) return [];
  
  return fs.readdirSync(modsDir)
    .filter(f => f.endsWith('.jar'))
    .map(f => ({
      filename: f,
      name: f.replace('.jar', '').replace(/-\d+.*$/, ''),
      size: fs.statSync(path.join(modsDir, f)).size,
      path: path.join(modsDir, f),
    }));
}

function deleteMod(profileId, modFile) {
  const modPath = path.join(getPath(profileId), 'mods', modFile);
  if (!fs.existsSync(modPath)) throw new Error('Мод не найден');
  fs.unlinkSync(modPath);
  return { success: true };
}

module.exports = { list, get, create, delete: deleteProfile, update, getPath, getMods, deleteMod, PRESET_PACKS };
